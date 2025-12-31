import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { BrandResponseDto, BrandFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'Get all brands with optional search' })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    type: [BrandResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(@Query() filter: BrandFilterDto): Promise<BrandResponseDto[]> {
    return this.brandService.findAll(filter);
  }
}
