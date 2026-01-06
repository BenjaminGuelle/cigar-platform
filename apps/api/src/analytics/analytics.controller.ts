import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import {
  TrackEventDto,
  AnalyticsSummaryDto,
  AnalyticsEventFilterDto,
  PaginatedAnalyticsEventsDto,
  PlatformStatsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../common/decorators';
import { Role } from '@cigar-platform/prisma-client';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @Throttle({ default: { limit: 120, ttl: 60000 } }) // 120 req/min - Frequent events
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async track(
    @Body() trackEventDto: TrackEventDto,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    await this.analyticsService.track(trackEventDto, userId);
  }

  @Get('events')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all analytics events with pagination (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'event', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Analytics events retrieved successfully',
    type: PaginatedAnalyticsEventsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() filterDto: AnalyticsEventFilterDto): Promise<PaginatedAnalyticsEventsDto> {
    return this.analyticsService.findAll(filterDto);
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get analytics summary (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics summary retrieved successfully',
    type: AnalyticsSummaryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getSummary(): Promise<AnalyticsSummaryDto> {
    return this.analyticsService.getSummary();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform stats (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Platform stats retrieved successfully',
    type: PlatformStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getPlatformStats(): Promise<PlatformStatsDto> {
    return this.analyticsService.getPlatformStats();
  }
}
