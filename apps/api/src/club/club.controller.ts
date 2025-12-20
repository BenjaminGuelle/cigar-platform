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
import { ClubService } from './club.service';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  FilterClubDto,
} from '../../../../shared/types/src/dto/club';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('clubs')
@Controller('clubs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({
    status: 201,
    description: 'Club created successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Club with this name already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createClubDto: CreateClubDto,
    @CurrentUser('id') userId: string
  ): Promise<ClubResponseDto> {
    return this.clubService.create(createClubDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Clubs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(@Query() filter: FilterClubDto) {
    return this.clubService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by ID' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Club found',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string): Promise<ClubResponseDto> {
    return this.clubService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Club updated successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Club with this name already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto
  ): Promise<ClubResponseDto> {
    return this.clubService.update(id, updateClubDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Club deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clubService.remove(id);
  }
}