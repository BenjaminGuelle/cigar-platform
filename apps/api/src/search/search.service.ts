import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import {
  SearchResultDto,
  BrandSearchItemDto,
  CigarSearchItemDto,
  ClubSearchItemDto,
  UserSearchItemDto,
} from './dto';
import { ClubVisibility, UserVisibility } from '@cigar-platform/prisma-client';

/**
 * Omnisearch Service - "Machine de Guerre"
 *
 * Features:
 * - Prefix-based search (@ for users, # for clubs, default global)
 * - Visibility filtering (PRIVATE users show only @username, PRIVATE clubs excluded)
 * - Performance optimized (<100ms target with Promise.all)
 * - Max 8 results per category
 * - Case-insensitive contains search
 * - Sorting: Cigars/Users alphabetical, Clubs by member count DESC
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly MAX_RESULTS = 8;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Universal search with prefix detection
   */
  async search(query: string): Promise<SearchResultDto> {
    const startTime = Date.now();

    // Detect search type based on prefix
    const searchType = this.detectSearchType(query);
    const cleanQuery = this.cleanQuery(query);

    this.logger.log(`[SEARCH] type=${searchType}, query="${cleanQuery}"`);

    let result: SearchResultDto;

    switch (searchType) {
      case 'user':
        result = await this.searchUsers(cleanQuery);
        break;
      case 'club':
        result = await this.searchClubs(cleanQuery);
        break;
      case 'global':
      default:
        result = await this.searchGlobal(cleanQuery);
        break;
    }

    const duration = Date.now() - startTime;
    result.duration = duration;
    result.query = query;
    result.searchType = searchType;

    this.logger.log(`[SEARCH] Completed in ${duration}ms, total=${result.total} results`);

    return result;
  }

  /**
   * Detect search type based on prefix
   */
  private detectSearchType(query: string): 'global' | 'user' | 'club' {
    if (query.startsWith('@')) return 'user';
    if (query.startsWith('#')) return 'club';
    return 'global';
  }

  /**
   * Clean query by removing prefix and trimming
   */
  private cleanQuery(query: string): string {
    return query.replace(/^[@#]/, '').trim();
  }

  /**
   * Search users only (@username)
   */
  private async searchUsers(query: string): Promise<SearchResultDto> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        visibility: true,
      },
      orderBy: { username: 'asc' },
      take: this.MAX_RESULTS,
    });

    const userItems: UserSearchItemDto[] = users.map((user) => ({
      id: user.id,
      type: 'user' as const,
      name: user.visibility === UserVisibility.PRIVATE ? user.username : user.displayName,
      username: user.username,
      displayName: user.visibility === UserVisibility.PUBLIC ? user.displayName : undefined,
      imageUrl: user.avatarUrl ?? undefined,
      visibility: user.visibility,
      slug: user.username,
    }));

    return {
      query: '',
      searchType: 'user',
      users: userItems,
      total: userItems.length,
      duration: 0,
    };
  }

  /**
   * Search clubs only (#slug)
   */
  private async searchClubs(query: string): Promise<SearchResultDto> {
    const clubs = await this.prisma.club.findMany({
      where: {
        OR: [
          { slug: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        visibility: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        members: { _count: 'desc' },
      },
      take: this.MAX_RESULTS,
    });

    const clubItems: ClubSearchItemDto[] = clubs.map((club) => ({
      id: club.id,
      type: 'club' as const,
      name: club.name,
      slug: club.slug,
      description: club.description ?? undefined,
      imageUrl: club.imageUrl ?? undefined,
      memberCount: club._count.members,
      visibility: club.visibility,
      metadata: `${club._count.members} membres`,
    }));

    return {
      query: '',
      searchType: 'club',
      clubs: clubItems,
      total: clubItems.length,
      duration: 0,
    };
  }

  /**
   * Global search (brands, cigars, clubs, users)
   */
  private async searchGlobal(query: string): Promise<SearchResultDto> {
    // Execute all queries in parallel for performance
    const [brands, cigars, clubs, users] = await Promise.all([
      this.searchBrands(query),
      this.searchCigars(query),
      this.searchClubsGlobal(query),
      this.searchUsersGlobal(query),
    ]);

    return {
      query: '',
      searchType: 'global',
      brands,
      cigars,
      clubs,
      users,
      total: brands.length + cigars.length + clubs.length + users.length,
      duration: 0,
    };
  }

  /**
   * Search brands (global only)
   */
  private async searchBrands(query: string): Promise<BrandSearchItemDto[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        description: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
      take: this.MAX_RESULTS,
    });

    return brands.map((brand) => ({
      id: brand.id,
      type: 'brand' as const,
      name: brand.name,
      slug: brand.slug,
      country: brand.country ?? 'Unknown',
      description: brand.description ?? undefined,
      imageUrl: brand.logoUrl ?? undefined,
      metadata: brand.country ?? undefined,
    }));
  }

  /**
   * Search cigars (global - all cigars with verification badge)
   */
  private async searchCigars(query: string): Promise<CigarSearchItemDto[]> {
    const cigars = await this.prisma.cigar.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        vitola: true,
        length: true,
        ringGauge: true,
        isVerified: true,
        brand: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' }, // Verified cigars first
        { name: 'asc' },
      ],
      take: this.MAX_RESULTS,
    });

    return cigars.map((cigar) => ({
      id: cigar.id,
      type: 'cigar' as const,
      name: cigar.name,
      slug: cigar.slug,
      brandName: cigar.brand.name,
      vitola: cigar.vitola ?? 'Unknown',
      size: `${cigar.length ?? '?'}mm × ${cigar.ringGauge ?? '?'}`,
      imageUrl: cigar.brand.logoUrl ?? undefined,
      metadata: `${cigar.brand.name} - ${cigar.vitola ?? 'Unknown'}`,
      isVerified: cigar.isVerified,
    }));
  }

  /**
   * Search clubs (global - PUBLIC only)
   */
  private async searchClubsGlobal(query: string): Promise<ClubSearchItemDto[]> {
    const clubs = await this.prisma.club.findMany({
      where: {
        AND: [
          { visibility: ClubVisibility.PUBLIC }, // Only PUBLIC clubs in global search
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        visibility: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        members: { _count: 'desc' },
      },
      take: this.MAX_RESULTS,
    });

    return clubs.map((club) => ({
      id: club.id,
      type: 'club' as const,
      name: club.name,
      slug: club.slug,
      description: club.description ?? undefined,
      imageUrl: club.imageUrl ?? undefined,
      memberCount: club._count.members,
      visibility: club.visibility,
      metadata: `${club._count.members} membres`,
    }));
  }

  /**
   * Search users (global - all users)
   */
  private async searchUsersGlobal(query: string): Promise<UserSearchItemDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        visibility: true,
      },
      orderBy: { username: 'asc' },
      take: this.MAX_RESULTS,
    });

    return users.map((user) => ({
      id: user.id,
      type: 'user' as const,
      name: user.visibility === UserVisibility.PRIVATE ? user.username : user.displayName,
      username: user.username,
      displayName: user.visibility === UserVisibility.PUBLIC ? user.displayName : undefined,
      imageUrl: user.avatarUrl ?? undefined,
      visibility: user.visibility,
      slug: user.username,
    }));
  }
}
