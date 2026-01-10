import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiParam,
} from '@nestjs/swagger';
import { TastingService } from './tasting.service';
import {
  CreateTastingDto,
  UpdateTastingDto,
  CompleteTastingDto,
  TastingResponseDto,
  FilterTastingDto,
  PaginatedTastingResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tastings')
@Controller('tastings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TastingController {
  constructor(private readonly tastingService: TastingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tasting (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Tasting created successfully (DRAFT)',
    type: TastingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createTastingDto: CreateTastingDto,
    @CurrentUser('id') userId: string
  ): Promise<TastingResponseDto> {
    return this.tastingService.create(createTastingDto, userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my tastings (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'User tastings retrieved successfully',
    type: PaginatedTastingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findMine(
    @Query() filter: FilterTastingDto,
    @CurrentUser('id') userId: string
  ): Promise<PaginatedTastingResponseDto> {
    return this.tastingService.findMine(userId, filter);
  }

  @Get('cigar/:cigarId')
  @ApiOperation({ summary: 'Get tastings for a cigar (paginated)' })
  @ApiParam({
    name: 'cigarId',
    description: 'Cigar UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cigar tastings retrieved successfully',
    type: PaginatedTastingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findByCigar(
    @Param('cigarId') cigarId: string,
    @Query() filter: FilterTastingDto,
    @CurrentUser('id') currentUserId?: string
  ): Promise<PaginatedTastingResponseDto> {
    return this.tastingService.findByCigar(cigarId, filter, currentUserId);
  }

  @Get('club/:clubId')
  @ApiOperation({ summary: 'Get tastings shared with a club (paginated)' })
  @ApiParam({
    name: 'clubId',
    description: 'Club UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Club tastings retrieved successfully',
    type: PaginatedTastingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a club member',
  })
  async findByClub(
    @Param('clubId') clubId: string,
    @Query() filter: FilterTastingDto,
    @CurrentUser('id') currentUserId: string
  ): Promise<PaginatedTastingResponseDto> {
    return this.tastingService.findByClub(clubId, filter, currentUserId);
  }

  @Get('user/:identifier')
  @ApiOperation({
    summary: 'Get tastings for a user (paginated)',
    description:
      'Returns all tastings if owner, public tastings if shareEvaluationsPublicly is enabled, empty otherwise',
  })
  @ApiParam({
    name: 'identifier',
    description: 'User UUID or username (with optional @ prefix)',
    example: 'john_doe or @john_doe',
  })
  @ApiResponse({
    status: 200,
    description: 'User tastings retrieved successfully',
    type: PaginatedTastingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findByUser(
    @Param('identifier') identifier: string,
    @Query() filter: FilterTastingDto,
    @CurrentUser('id') currentUserId: string
  ): Promise<PaginatedTastingResponseDto> {
    return this.tastingService.findByUser(identifier, filter, currentUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tasting by ID' })
  @ApiParam({
    name: 'id',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasting found',
    type: TastingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (visibility restriction)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId?: string
  ): Promise<TastingResponseDto> {
    return this.tastingService.findOne(id, currentUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tasting (auto-save, DRAFT only)' })
  @ApiParam({
    name: 'id',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasting updated successfully',
    type: TastingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (not the author)',
  })
  @ApiResponse({
    status: 400,
    description: 'Tasting already completed (immutable)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTastingDto: UpdateTastingDto,
    @CurrentUser('id') userId: string
  ): Promise<TastingResponseDto> {
    return this.tastingService.update(id, updateTastingDto, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete tasting (DRAFT → COMPLETED, immutable after)' })
  @ApiParam({
    name: 'id',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasting completed successfully (now immutable)',
    type: TastingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (not the author)',
  })
  @ApiResponse({
    status: 400,
    description: 'Tasting already completed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async complete(
    @Param('id') id: string,
    @Body() completeTastingDto: CompleteTastingDto,
    @CurrentUser('id') userId: string
  ): Promise<TastingResponseDto> {
    return this.tastingService.complete(id, completeTastingDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tasting (author only)' })
  @ApiParam({
    name: 'id',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Tasting deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (not the author)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    return this.tastingService.remove(id, userId);
  }
}
