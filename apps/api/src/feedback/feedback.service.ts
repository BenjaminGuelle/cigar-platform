import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Prisma } from '../../../../generated/prisma';
import {
  CreateFeedbackDto,
  UpdateFeedbackStatusDto,
  FeedbackResponseDto,
  FeedbackFilterDto,
  PaginatedFeedbackResponseDto,
} from './dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new feedback
   */
  async create(
    createFeedbackDto: CreateFeedbackDto,
    userId: string
  ): Promise<FeedbackResponseDto> {
    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        type: createFeedbackDto.type,
        message: createFeedbackDto.message,
        page: createFeedbackDto.page,
        metadata: createFeedbackDto.metadata as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Feedback created: ${feedback.id} by user ${userId}`);

    return this.mapToResponse(feedback);
  }

  /**
   * Get all feedbacks with pagination and filtering (admin only)
   */
  async findAll(filter: FeedbackFilterDto): Promise<PaginatedFeedbackResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sortBy = 'createdAt',
      order = 'desc',
    } = filter;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FeedbackWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Build orderBy clause
    const orderBy: Prisma.FeedbackOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: feedbacks.map((feedback) => this.mapToResponse(feedback, feedback.user)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Update feedback status (admin only)
   */
  async updateStatus(
    id: string,
    updateDto: UpdateFeedbackStatusDto
  ): Promise<FeedbackResponseDto> {
    // Check if feedback exists
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const feedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        status: updateDto.status,
        adminNote: updateDto.adminNote,
      },
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
    });

    this.logger.log(`Feedback ${id} status updated to ${updateDto.status}`);

    return this.mapToResponse(feedback, feedback.user);
  }

  private mapToResponse(
    feedback: {
      id: string;
      userId: string;
      type: string;
      message: string;
      page: string;
      metadata: Prisma.JsonValue;
      status: string;
      adminNote: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    user?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    }
  ): FeedbackResponseDto {
    return {
      id: feedback.id,
      userId: feedback.userId,
      type: feedback.type as FeedbackResponseDto['type'],
      message: feedback.message,
      page: feedback.page,
      metadata: feedback.metadata as FeedbackResponseDto['metadata'],
      status: feedback.status as FeedbackResponseDto['status'],
      adminNote: feedback.adminNote,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          }
        : undefined,
    };
  }
}
