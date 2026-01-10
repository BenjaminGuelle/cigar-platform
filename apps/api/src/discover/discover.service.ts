import { Injectable } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { DiscoverResponseDto, DiscoverCigarDto } from './dto';
import { TastingService } from '../tasting/tasting.service';
import {
  PaginatedTastingResponseDto,
  TastingResponseDto,
} from '../tasting/dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

/**
 * Discover Service
 *
 * Provides discovery content for the explore page:
 * - Recent cigars (newest additions)
 * - Recent public tastings (community activity)
 */
@Injectable()
export class DiscoverService {
  private readonly RECENT_CIGARS_LIMIT = 3;
  private readonly RECENT_TASTINGS_LIMIT = 6;
  private readonly DEFAULT_TASTINGS_PER_PAGE = 9;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tastingService: TastingService,
  ) {}

  /**
   * Get discovery content
   * Returns recent cigars and public tastings
   */
  async getDiscoveryContent(): Promise<DiscoverResponseDto> {
    const [recentCigars, recentTastings] = await Promise.all([
      this.getRecentCigars(),
      this.getRecentTastings(),
    ]);

    return {
      recentCigars,
      recentTastings,
    };
  }

  /**
   * Get recently added cigars
   * Includes brand name for display
   */
  private async getRecentCigars(): Promise<DiscoverCigarDto[]> {
    const cigars = await this.prisma.cigar.findMany({
      take: this.RECENT_CIGARS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: {
          select: { name: true },
        },
      },
    });

    return cigars.map((cigar) => ({
      id: cigar.id,
      name: cigar.name,
      slug: cigar.slug,
      brandName: cigar.brand.name,
      createdAt: cigar.createdAt,
    }));
  }

  /**
   * Get recent public tastings
   * Delegates to TastingService for consistent response format
   */
  private getRecentTastings() {
    return this.tastingService.findRecentPublic(this.RECENT_TASTINGS_LIMIT);
  }

  /**
   * Get public tastings with pagination
   * Returns PUBLIC, COMPLETED tastings ordered by date (newest first)
   * Includes user info for global discovery context
   * @param query - Pagination parameters
   * @returns Paginated public tastings
   */
  async findPublicTastingsPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedTastingResponseDto> {
    const { page = 1, limit = this.DEFAULT_TASTINGS_PER_PAGE } = query;
    const skip = (page - 1) * limit;

    const where = {
      visibility: 'PUBLIC' as const,
      status: 'COMPLETED' as const,
    };

    const [tastings, total] = await Promise.all([
      this.prisma.tasting.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          cigar: {
            include: {
              brand: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.tasting.count({ where }),
    ]);

    return {
      data: tastings.map((tasting) => this.mapToTastingResponse(tasting)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Map tasting entity to response DTO
   * Includes user info for display
   */
  private mapToTastingResponse(tasting: any): TastingResponseDto {
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
      observations: [],
      clubs: [],
      // Include user info for global discovery
      user: tasting.user
        ? {
            id: tasting.user.id,
            username: tasting.user.username,
            displayName: tasting.user.displayName,
            avatarUrl: tasting.user.avatarUrl,
          }
        : undefined,
    };
  }
}