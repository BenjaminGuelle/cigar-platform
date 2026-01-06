import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Prisma } from '../../../../generated/prisma';
import {
  TrackEventDto,
  AnalyticsSummaryDto,
  AnalyticsEventFilterDto,
  PaginatedAnalyticsEventsDto,
  PlatformStatsDto,
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track an analytics event
   */
  async track(trackEventDto: TrackEventDto, userId: string): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        event: trackEventDto.event,
        data: trackEventDto.data as Prisma.InputJsonValue,
        page: trackEventDto.page,
        platform: trackEventDto.platform,
        screenWidth: trackEventDto.screenWidth,
        screenHeight: trackEventDto.screenHeight,
      },
    });

    this.logger.debug(`Event tracked: ${trackEventDto.event} by user ${userId}`);
  }

  /**
   * Get all analytics events with pagination (admin only)
   */
  async findAll(filterDto: AnalyticsEventFilterDto): Promise<PaginatedAnalyticsEventsDto> {
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 50;
    const skip = (page - 1) * limit;
    const sortBy = filterDto.sortBy ?? 'createdAt';
    const order = filterDto.order ?? 'desc';

    const where: Prisma.AnalyticsEventWhereInput = {};

    if (filterDto.event) {
      where.event = filterDto.event;
    }

    if (filterDto.userId) {
      where.userId = filterDto.userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
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
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return {
      data: data.map((event) => ({
        id: event.id,
        userId: event.userId,
        event: event.event,
        data: event.data as Record<string, unknown> | null,
        page: event.page,
        platform: event.platform,
        screenWidth: event.screenWidth,
        screenHeight: event.screenHeight,
        createdAt: event.createdAt,
        user: event.user,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get analytics summary (admin only)
   * Returns aggregate stats for the last 30 days
   */
  async getSummary(): Promise<AnalyticsSummaryDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel
    const [totalEvents, uniqueUsersResult, eventCounts, platformCounts, dailyCountsRaw] =
      await Promise.all([
        // Total events count
        this.prisma.analyticsEvent.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
        }),

        // Unique users count
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: thirtyDaysAgo },
            userId: { not: null },
          },
        }),

        // Event counts by type
        this.prisma.analyticsEvent.groupBy({
          by: ['event'],
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          _count: { event: true },
          orderBy: {
            _count: { event: 'desc' },
          },
          take: 10,
        }),

        // Platform counts
        this.prisma.analyticsEvent.groupBy({
          by: ['platform'],
          where: {
            createdAt: { gte: thirtyDaysAgo },
            platform: { not: null },
          },
          _count: { platform: true },
          orderBy: {
            _count: { platform: 'desc' },
          },
        }),

        // Daily counts for the last 30 days
        this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE("createdAt") as date, COUNT(*) as count
          FROM analytics_events
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
          LIMIT 30
        `,
      ]);

    return {
      totalEvents,
      uniqueUsers: uniqueUsersResult.length,
      eventCounts: eventCounts.map((e) => ({
        event: e.event,
        count: e._count.event,
      })),
      platformCounts: platformCounts
        .filter((p) => p.platform !== null)
        .map((p) => ({
          platform: p.platform!,
          count: p._count.platform!,
        })),
      dailyCounts: dailyCountsRaw.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        count: Number(d.count),
      })),
    };
  }

  /**
   * Get platform stats (admin only)
   * Returns total counts for users, clubs, tastings, events
   */
  async getPlatformStats(): Promise<PlatformStatsDto> {
    const [totalUsers, totalClubs, totalTastings, totalEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.club.count(),
      this.prisma.tasting.count(),
      this.prisma.analyticsEvent.count(),
    ]);

    return {
      totalUsers,
      totalClubs,
      totalTastings,
      totalEvents,
    };
  }
}
