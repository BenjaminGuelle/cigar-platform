import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Club, Prisma } from '../../../../generated/prisma';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  FilterClubDto,
} from './dto';
import { ClubRole } from '@cigar-platform/types';
import {
  ClubNotFoundException,
  ClubAlreadyExistsException,
} from './exceptions';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createClubDto: CreateClubDto,
    userId: string
  ): Promise<ClubResponseDto> {
    // Check if club with same name already exists
    const existingClub = await this.prisma.club.findFirst({
      where: {
        name: {
          equals: createClubDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingClub) {
      throw new ClubAlreadyExistsException(createClubDto.name);
    }

    try {
      // Use transaction to create club and club member atomically
      const club = await this.prisma.$transaction(async (tx) => {
        // Create the club
        const newClub = await tx.club.create({
          data: {
            name: createClubDto.name,
            description: createClubDto.description ?? null,
            imageUrl: createClubDto.imageUrl ?? null,
            createdBy: userId,
          },
        });

        // Automatically add creator as club admin
        await tx.clubMember.create({
          data: {
            clubId: newClub.id,
            userId: userId,
            role: ClubRole.Admin,
          },
        });

        return newClub;
      });

      this.logger.log(`Club created: ${club.id} by user ${userId} (auto-assigned as admin)`);
      return this.mapToResponse(club);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ClubAlreadyExistsException(createClubDto.name);
      }
      throw error;
    }
  }

  async findAll(
    filter: FilterClubDto
  ): Promise<PaginatedResponse<ClubResponseDto>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClubWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    // Build orderBy clause
    const orderBy: Prisma.ClubOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          createdBy: true,
          createdAt: true,
        },
      }),
      this.prisma.club.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: clubs.map((club) => this.mapToResponse(club)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<ClubResponseDto> {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        createdBy: true,
        createdAt: true,
      },
    });

    if (!club) {
      throw new ClubNotFoundException(id);
    }

    return this.mapToResponse(club);
  }

  async update(
    id: string,
    updateClubDto: UpdateClubDto
  ): Promise<ClubResponseDto> {
    // Check if club exists
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!existingClub) {
      throw new ClubNotFoundException(id);
    }

    // Check if new name conflicts with another club
    if (updateClubDto.name) {
      const clubWithSameName = await this.prisma.club.findFirst({
        where: {
          name: {
            equals: updateClubDto.name,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (clubWithSameName) {
        throw new ClubAlreadyExistsException(updateClubDto.name);
      }
    }

    try {
      const club = await this.prisma.club.update({
        where: { id },
        data: {
          name: updateClubDto.name,
          description: updateClubDto.description,
          imageUrl: updateClubDto.imageUrl,
        },
      });

      this.logger.log(`Club updated: ${club.id}`);
      return this.mapToResponse(club);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ClubNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.club.delete({
        where: { id },
      });

      this.logger.log(`Club deleted: ${id}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ClubNotFoundException(id);
      }
      throw error;
    }
  }

  private mapToResponse(club: Club): ClubResponseDto {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      imageUrl: club.imageUrl,
      createdBy: club.createdBy,
      createdAt: club.createdAt,
    };
  }
}