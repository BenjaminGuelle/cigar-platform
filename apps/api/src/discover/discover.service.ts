import { Injectable } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import {
  DiscoverResponseDto,
  DiscoverCigarDto,
  DiscoverTastingDto,
} from './dto';
import { TastingVisibility, TastingStatus } from '@cigar-platform/prisma-client';

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

  constructor(private readonly prisma: PrismaService) {}

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
   * Only returns completed, public tastings with user info
   */
  private async getRecentTastings(): Promise<DiscoverTastingDto[]> {
    const tastings = await this.prisma.tasting.findMany({
      where: {
        visibility: TastingVisibility.PUBLIC,
        status: TastingStatus.COMPLETED,
      },
      take: this.RECENT_TASTINGS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: {
        cigar: {
          select: { name: true, slug: true },
        },
        user: {
          select: { username: true },
        },
      },
    });

    return tastings.map((tasting) => ({
      id: tasting.id,
      cigarName: tasting.cigar.name,
      cigarSlug: tasting.cigar.slug,
      rating: tasting.rating,
      username: tasting.user.username,
      createdAt: tasting.createdAt,
    }));
  }
}