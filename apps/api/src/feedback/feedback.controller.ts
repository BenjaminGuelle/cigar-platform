import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
  FeedbackResponseDto,
  FeedbackFilterDto,
  PaginatedFeedbackResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../common/decorators';
import { Role } from '@cigar-platform/prisma-client';

@ApiTags('feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req/min - Anti spam
  @ApiOperation({ summary: 'Submit feedback' })
  @ApiResponse({
    status: 201,
    description: 'Feedback submitted successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @CurrentUser('id') userId: string
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.create(createFeedbackDto, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all feedbacks (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Feedbacks retrieved successfully',
    type: PaginatedFeedbackResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() filter: FeedbackFilterDto): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findAll(filter);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update feedback status (admin only)' })
  @ApiParam({ name: 'id', description: 'Feedback UUID' })
  @ApiResponse({
    status: 200,
    description: 'Feedback status updated successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeedbackStatusDto
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.updateStatus(id, updateDto);
  }
}
