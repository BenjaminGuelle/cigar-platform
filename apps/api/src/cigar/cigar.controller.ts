import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CigarService } from './cigar.service';
import { CreateCigarDto, CigarResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('cigars')
@Controller('cigars')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CigarController {
  constructor(private readonly cigarService: CigarService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get cigar by slug (public)' })
  @ApiResponse({
    status: 200,
    description: 'Cigar found',
    type: CigarResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cigar not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<CigarResponseDto> {
    return this.cigarService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new cigar (with inline brand creation)' })
  @ApiResponse({
    status: 201,
    description: 'Cigar created successfully',
    type: CigarResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Cigar already exists for this brand',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() dto: CreateCigarDto,
    @CurrentUser('id') userId: string,
  ): Promise<CigarResponseDto> {
    return this.cigarService.create(dto, userId);
  }
}
