import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Tasting, Prisma, TastingStatus } from '../../../../generated/prisma';
import {
  CreateTastingDto,
  UpdateTastingDto,
  CompleteTastingDto,
  TastingResponseDto,
  FilterTastingDto,
  PaginatedTastingResponseDto,
} from './dto';
import { PaginationMetaDto } from '../common/dto/paginated-response.dto';
import {
  TastingNotFoundException,
  TastingAlreadyCompletedException,
  TastingForbiddenException,
} from './exceptions';

/**
 * Common include for tasting queries
 * Includes cigar with brand, observations, and associated clubs
 */
const TASTING_INCLUDE = {
  cigar: {
    include: {
      brand: true,
    },
  },
  observations: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  sharedClubs: {
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
};

@Injectable()
export class TastingService {
  private readonly logger = new Logger(TastingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tasting (DRAFT status)
   * If clubId is provided, also creates TastingOnClub to associate with club
   * @param createTastingDto - Tasting data
   * @param userId - Current user ID (will be set as tasting owner)
   * @returns Created tasting
   */
  async create(
    createTastingDto: CreateTastingDto,
    userId: string
  ): Promise<TastingResponseDto> {
    // Use transaction to create tasting and club association atomically
    const result = await this.prisma.$transaction(async (tx) => {
      const tasting = await tx.tasting.create({
        data: {
          userId,
          cigarId: createTastingDto.cigarId,
          eventId: createTastingDto.eventId ?? null,
          status: TastingStatus.DRAFT,
          // Phase 1 - Quick (all optional)
          moment: createTastingDto.moment ?? null,
          situation: createTastingDto.situation ?? null,
          pairing: createTastingDto.pairing ?? null,
          pairingNote: createTastingDto.pairingNote ?? null,
          location: createTastingDto.location ?? null,
          photoUrl: createTastingDto.photoUrl ?? null,
          duration: createTastingDto.duration ?? null,
          // Phase Finale (will be filled on complete)
          rating: 0, // Temporary value, will be set on complete
          visibility: 'PUBLIC', // Default, will be set on complete
        },
        include: {
          cigar: true,
        },
      });

      // If clubId provided, create TastingOnClub association
      if (createTastingDto.clubId) {
        await tx.tastingOnClub.create({
          data: {
            tastingId: tasting.id,
            clubId: createTastingDto.clubId,
          },
        });
        this.logger.log(
          `Tasting ${tasting.id} associated with club ${createTastingDto.clubId}`
        );
      }

      return tasting;
    });

    this.logger.log(`Tasting created: ${result.id} by user ${userId} (DRAFT)`);
    return this.mapToResponse(result);
  }

  /**
   * Get tasting by ID
   * Checks visibility permissions
   * @param id - Tasting ID
   * @param currentUserId - Current user ID (optional for public tastings)
   * @returns Tasting
   */
  async findOne(
    id: string,
    currentUserId?: string
  ): Promise<TastingResponseDto> {
    const tasting = await this.prisma.tasting.findUnique({
      where: { id },
      include: TASTING_INCLUDE,
    });

    if (!tasting) {
      throw new TastingNotFoundException(id);
    }

    // Check visibility permissions
    await this.checkReadPermission(tasting, currentUserId);

    return this.mapToResponse(tasting);
  }

  /**
   * Update tasting (auto-save)
   * Only works on DRAFT tastings
   * Only the author can update
   * @param id - Tasting ID
   * @param updateTastingDto - Updated fields
   * @param userId - Current user ID
   * @returns Updated tasting
   */
  async update(
    id: string,
    updateTastingDto: UpdateTastingDto,
    userId: string
  ): Promise<TastingResponseDto> {
    // Get existing tasting
    const existingTasting = await this.prisma.tasting.findUnique({
      where: { id },
    });

    if (!existingTasting) {
      throw new TastingNotFoundException(id);
    }

    // Check ownership
    if (existingTasting.userId !== userId) {
      throw new TastingForbiddenException('update');
    }

    // Check if already completed (IMMUTABLE)
    if (existingTasting.status === TastingStatus.COMPLETED) {
      throw new TastingAlreadyCompletedException(id);
    }

    // Update tasting
    try {
      const tasting = await this.prisma.tasting.update({
        where: { id },
        data: {
          cigarId: updateTastingDto.cigarId,
          eventId: updateTastingDto.eventId,
          moment: updateTastingDto.moment,
          situation: updateTastingDto.situation,
          pairing: updateTastingDto.pairing,
          pairingNote: updateTastingDto.pairingNote,
          location: updateTastingDto.location,
          photoUrl: updateTastingDto.photoUrl,
          duration: updateTastingDto.duration,
        },
        include: {
          cigar: true,
        },
      });

      this.logger.log(`Tasting updated: ${tasting.id} (auto-save)`);
      return this.mapToResponse(tasting);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TastingNotFoundException(id);
      }
      throw error;
    }
  }

  /**
   * Complete tasting (DRAFT → COMPLETED)
   * Sets rating, comment, and visibility
   * Tasting becomes IMMUTABLE after this
   * @param id - Tasting ID
   * @param completeTastingDto - Final data (rating, comment, visibility)
   * @param userId - Current user ID
   * @returns Completed tasting
   */
  async complete(
    id: string,
    completeTastingDto: CompleteTastingDto,
    userId: string
  ): Promise<TastingResponseDto> {
    // Get existing tasting
    const existingTasting = await this.prisma.tasting.findUnique({
      where: { id },
    });

    if (!existingTasting) {
      throw new TastingNotFoundException(id);
    }

    // Check ownership
    if (existingTasting.userId !== userId) {
      throw new TastingForbiddenException('complete');
    }

    // Check if already completed
    if (existingTasting.status === TastingStatus.COMPLETED) {
      throw new TastingAlreadyCompletedException(id);
    }

    // Calculate duration if not set (createdAt → now)
    const duration =
      existingTasting.duration ??
      Math.floor(
        (Date.now() - existingTasting.createdAt.getTime()) / (1000 * 60)
      );

    // Complete tasting
    try {
      const tasting = await this.prisma.tasting.update({
        where: { id },
        data: {
          status: TastingStatus.COMPLETED,
          rating: completeTastingDto.rating,
          comment: completeTastingDto.comment ?? null,
          visibility: completeTastingDto.visibility ?? 'PUBLIC',
          duration,
        },
        include: {
          cigar: true,
        },
      });

      this.logger.log(
        `Tasting completed: ${tasting.id} with rating ${tasting.rating}/5 (IMMUTABLE)`
      );
      return this.mapToResponse(tasting);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TastingNotFoundException(id);
      }
      throw error;
    }
  }

  /**
   * Get current user's tastings (paginated)
   * @param userId - User ID
   * @param filter - Pagination and filters
   * @returns Paginated tastings
   */
  async findMine(
    userId: string,
    filter: FilterTastingDto
  ): Promise<PaginatedTastingResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
      status,
      cigarId,
      eventId,
    } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TastingWhereInput = {
      userId,
      ...(status && { status }),
      ...(cigarId && { cigarId }),
      ...(eventId && { eventId }),
    };

    // Build orderBy clause
    const orderBy: Prisma.TastingOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [tastings, total] = await Promise.all([
      this.prisma.tasting.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cigar: true,
        },
      }),
      this.prisma.tasting.count({ where }),
    ]);

    return {
      data: tastings.map((tasting) => this.mapToResponse(tasting)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get tastings for a cigar (paginated)
   * Only returns PUBLIC tastings or user's own tastings
   * @param cigarId - Cigar ID
   * @param filter - Pagination and filters
   * @param currentUserId - Current user ID (optional)
   * @returns Paginated tastings
   */
  async findByCigar(
    cigarId: string,
    filter: FilterTastingDto,
    currentUserId?: string
  ): Promise<PaginatedTastingResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
      status,
    } = filter;
    const skip = (page - 1) * limit;

    // Build where clause (PUBLIC tastings OR user's own tastings)
    const where: Prisma.TastingWhereInput = {
      cigarId,
      ...(status && { status }),
      OR: [
        { visibility: 'PUBLIC' },
        ...(currentUserId ? [{ userId: currentUserId }] : []),
      ],
    };

    // Build orderBy clause
    const orderBy: Prisma.TastingOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [tastings, total] = await Promise.all([
      this.prisma.tasting.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cigar: true,
        },
      }),
      this.prisma.tasting.count({ where }),
    ]);

    return {
      data: tastings.map((tasting) => this.mapToResponse(tasting)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get tastings shared with a club (paginated)
   * Only accessible to club members
   * @param clubId - Club ID
   * @param filter - Pagination and filters
   * @param currentUserId - Current user ID
   * @returns Paginated tastings
   */
  async findByClub(
    clubId: string,
    filter: FilterTastingDto,
    currentUserId: string
  ): Promise<PaginatedTastingResponseDto> {
    // Check if user is a club member
    const membership = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: currentUserId,
        },
      },
    });

    if (!membership) {
      throw new TastingForbiddenException('view club tastings');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
      status,
      userId,
    } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TastingWhereInput = {
      ...(status && { status }),
      ...(userId && { userId }),
      sharedClubs: {
        some: {
          clubId,
        },
      },
    };

    // Build orderBy clause
    const orderBy: Prisma.TastingOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [tastings, total] = await Promise.all([
      this.prisma.tasting.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cigar: true,
        },
      }),
      this.prisma.tasting.count({ where }),
    ]);

    return {
      data: tastings.map((tasting) => this.mapToResponse(tasting)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Delete tasting
   * Only the author can delete
   * @param id - Tasting ID
   * @param userId - Current user ID
   */
  async remove(id: string, userId: string): Promise<void> {
    // Get existing tasting
    const existingTasting = await this.prisma.tasting.findUnique({
      where: { id },
    });

    if (!existingTasting) {
      throw new TastingNotFoundException(id);
    }

    // Check ownership
    if (existingTasting.userId !== userId) {
      throw new TastingForbiddenException('delete');
    }

    // Delete tasting
    try {
      await this.prisma.tasting.delete({
        where: { id },
      });

      this.logger.log(`Tasting deleted: ${id}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new TastingNotFoundException(id);
      }
      throw error;
    }
  }

  /**
   * Check read permission based on visibility
   * @param tasting - Tasting entity
   * @param currentUserId - Current user ID (optional)
   * @throws TastingForbiddenException if user doesn't have permission
   */
  private async checkReadPermission(
    tasting: Tasting,
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
      throw new TastingForbiddenException('view');
    }

    // CLUB_ONLY tastings are readable by club members
    if (tasting.visibility === 'CLUB_ONLY') {
      if (!currentUserId) {
        throw new TastingForbiddenException('view');
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
        throw new TastingForbiddenException('view');
      }
    }
  }

  /**
   * Map Prisma entity to Response DTO
   * @param tasting - Prisma tasting entity (with relations)
   * @returns TastingResponseDto
   */
  private mapToResponse(tasting: any): TastingResponseDto {
    // Map observations if present
    const observations = (tasting.observations ?? []).map((obs: any) => ({
      id: obs.id,
      phase: obs.phase,
      intensity: obs.intensity,
      combustion: obs.combustion,
      aromas: obs.aromas ?? [],
      notes: obs.notes,
    }));

    // Map clubs from sharedClubs if present
    const clubs = (tasting.sharedClubs ?? []).map((sc: any) => ({
      id: sc.club.id,
      name: sc.club.name,
      slug: sc.club.slug,
    }));

    return {
      id: tasting.id,
      userId: tasting.userId,
      cigarId: tasting.cigarId,
      cigar: tasting.cigar,
      eventId: tasting.eventId,
      status: tasting.status,
      date: tasting.date,
      moment: tasting.moment,
      situation: tasting.situation,
      pairing: tasting.pairing,
      pairingNote: tasting.pairingNote,
      location: tasting.location,
      photoUrl: tasting.photoUrl,
      duration: tasting.duration,
      rating: tasting.rating,
      comment: tasting.comment,
      visibility: tasting.visibility,
      createdAt: tasting.createdAt,
      updatedAt: tasting.updatedAt,
      observations,
      clubs,
    };
  }
}
