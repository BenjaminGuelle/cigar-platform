import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Observation, Prisma } from '../../../../generated/prisma';
import { UpsertObservationDto, ObservationResponseDto } from './dto';
import { ObservationNotFoundException } from './exceptions';
import {
  TastingNotFoundException,
  TastingForbiddenException,
} from '../tasting/exceptions';

@Injectable()
export class ObservationService {
  private readonly logger = new Logger(ObservationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert observation for a phase
   * Creates new observation if none exists, updates existing one
   * @param tastingId - Tasting ID
   * @param phase - Phase (presentation | fumage_cru | foin | divin | purin | conclusion)
   * @param upsertObservationDto - Observation data
   * @param userId - Current user ID (must be tasting author)
   * @returns Observation
   */
  async upsert(
    tastingId: string,
    phase: string,
    upsertObservationDto: UpsertObservationDto,
    userId: string
  ): Promise<ObservationResponseDto> {
    // Check if tasting exists and user is the author
    const tasting = await this.prisma.tasting.findUnique({
      where: { id: tastingId },
    });

    if (!tasting) {
      throw new TastingNotFoundException(tastingId);
    }

    if (tasting.userId !== userId) {
      throw new TastingForbiddenException('modify observations for');
    }

    // Check if observation already exists for this phase
    const existingObservation = await this.prisma.observation.findFirst({
      where: {
        tastingId,
        phase,
      },
    });

    // Determine aromas: use explicit aromas if provided, otherwise extract from organoleptic
    let aromas: string[] = upsertObservationDto.aromas ?? [];
    if (aromas.length === 0 && upsertObservationDto.organoleptic) {
      aromas = this.extractAromasFromOrganoleptic(upsertObservationDto.organoleptic);
      if (aromas.length > 0) {
        this.logger.debug(
          `Extracted ${aromas.length} aromas from organoleptic: ${aromas.join(', ')}`
        );
      }
    }

    let observation: Observation;

    if (existingObservation) {
      // Update existing observation
      observation = await this.prisma.observation.update({
        where: { id: existingObservation.id },
        data: {
          intensity: upsertObservationDto.intensity ?? null,
          combustion: upsertObservationDto.combustion ?? null,
          aromas,
          notes: upsertObservationDto.notes ?? null,
          organoleptic: upsertObservationDto.organoleptic
            ? (upsertObservationDto.organoleptic as Prisma.JsonObject)
            : Prisma.DbNull,
        },
      });

      this.logger.log(
        `Observation updated: ${observation.id} (tasting: ${tastingId}, phase: ${phase})`
      );
    } else {
      // Create new observation
      observation = await this.prisma.observation.create({
        data: {
          tastingId,
          phase,
          intensity: upsertObservationDto.intensity ?? null,
          combustion: upsertObservationDto.combustion ?? null,
          aromas,
          notes: upsertObservationDto.notes ?? null,
          organoleptic: upsertObservationDto.organoleptic
            ? (upsertObservationDto.organoleptic as Prisma.JsonObject)
            : Prisma.DbNull,
        },
      });

      this.logger.log(
        `Observation created: ${observation.id} (tasting: ${tastingId}, phase: ${phase})`
      );
    }

    return this.mapToResponse(observation);
  }

  /**
   * Get all observations for a tasting
   * @param tastingId - Tasting ID
   * @param userId - Current user ID (for permission check)
   * @returns Array of observations
   */
  async findAll(
    tastingId: string,
    userId?: string
  ): Promise<ObservationResponseDto[]> {
    // Check if tasting exists and user has read permission
    const tasting = await this.prisma.tasting.findUnique({
      where: { id: tastingId },
    });

    if (!tasting) {
      throw new TastingNotFoundException(tastingId);
    }

    // Check read permission (same logic as TastingService)
    await this.checkReadPermission(tasting, userId);

    // Get all observations
    const observations = await this.prisma.observation.findMany({
      where: { tastingId },
      orderBy: { createdAt: 'asc' },
    });

    return observations.map((obs) => this.mapToResponse(obs));
  }

  /**
   * Delete observation for a phase
   * @param tastingId - Tasting ID
   * @param phase - Phase
   * @param userId - Current user ID (must be tasting author)
   */
  async remove(
    tastingId: string,
    phase: string,
    userId: string
  ): Promise<void> {
    // Check if tasting exists and user is the author
    const tasting = await this.prisma.tasting.findUnique({
      where: { id: tastingId },
    });

    if (!tasting) {
      throw new TastingNotFoundException(tastingId);
    }

    if (tasting.userId !== userId) {
      throw new TastingForbiddenException('delete observations for');
    }

    // Find observation
    const observation = await this.prisma.observation.findFirst({
      where: {
        tastingId,
        phase,
      },
    });

    if (!observation) {
      throw new ObservationNotFoundException(tastingId, phase);
    }

    // Delete observation
    await this.prisma.observation.delete({
      where: { id: observation.id },
    });

    this.logger.log(
      `Observation deleted: ${observation.id} (tasting: ${tastingId}, phase: ${phase})`
    );
  }

  /**
   * Check read permission based on tasting visibility
   * Duplicated from TastingService for now (could be extracted to a shared service)
   * @param tasting - Tasting entity
   * @param currentUserId - Current user ID (optional)
   * @throws TastingForbiddenException if user doesn't have permission
   */
  private async checkReadPermission(
    tasting: { userId: string; visibility: string; id: string },
    currentUserId?: string
  ): Promise<void> {
    // Author can always read
    if (currentUserId && tasting.userId === currentUserId) {
      return;
    }

    // PUBLIC tastings are readable by everyone
    if (tasting.visibility === 'PUBLIC') {
      return;
    }

    // PRIVATE tastings are only readable by author
    if (tasting.visibility === 'PRIVATE') {
      throw new TastingForbiddenException('view observations for');
    }

    // CLUB_ONLY tastings are readable by club members
    if (tasting.visibility === 'CLUB_ONLY') {
      if (!currentUserId) {
        throw new TastingForbiddenException('view observations for');
      }

      // Check if user is a member of any club this tasting is shared with
      const sharedClub = await this.prisma.tastingOnClub.findFirst({
        where: {
          tastingId: tasting.id,
          club: {
            members: {
              some: {
                userId: currentUserId,
              },
            },
          },
        },
      });

      if (!sharedClub) {
        throw new TastingForbiddenException('view observations for');
      }
    }
  }

  /**
   * Extract aromas from organoleptic JSON structure
   * Handles nested structures like { coldDraw: { aromas: [{id: 'boise'}] } }
   * FlavorTag format: { id: string, intensity: number }
   *
   * @param organoleptic - The organoleptic JSON object
   * @returns Array of unique aroma ids (strings)
   */
  private extractAromasFromOrganoleptic(
    organoleptic: Record<string, unknown> | null | undefined
  ): string[] {
    if (!organoleptic) return [];

    const aromas: string[] = [];

    const extractFromObject = (obj: unknown): void => {
      if (!obj || typeof obj !== 'object') return;

      const record = obj as Record<string, unknown>;

      // Check if this object has an aromas array
      if (Array.isArray(record['aromas'])) {
        for (const aroma of record['aromas']) {
          // FlavorTag format: { id: string, intensity: number }
          if (aroma && typeof aroma === 'object' && 'id' in aroma) {
            const aromaId = (aroma as { id: string }).id;
            if (aromaId && !aromas.includes(aromaId)) {
              aromas.push(aromaId);
            }
          }
        }
      }

      // Recursively check nested objects (but not arrays)
      for (const value of Object.values(record)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          extractFromObject(value);
        }
      }
    };

    extractFromObject(organoleptic);
    return aromas;
  }

  /**
   * Map Prisma entity to Response DTO
   * @param observation - Prisma observation entity
   * @returns ObservationResponseDto
   */
  private mapToResponse(observation: Observation): ObservationResponseDto {
    return {
      id: observation.id,
      tastingId: observation.tastingId,
      phase: observation.phase,
      intensity: observation.intensity,
      combustion: observation.combustion,
      aromas: observation.aromas,
      notes: observation.notes,
      organoleptic: observation.organoleptic as Record<string, unknown> | null,
      createdAt: observation.createdAt,
      updatedAt: observation.updatedAt,
    };
  }
}
