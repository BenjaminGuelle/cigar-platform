import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { DiscoverService } from './discover.service';
import { DiscoverResponseDto } from './dto';

/**
 * Discover Controller
 *
 * Provides discovery content for the explore page
 *
 * Public endpoint (no auth required):
 * - GET /discover → Recent cigars + public tastings
 */
@ApiTags('discover')
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get()
  @ApiOperation({
    summary: 'Get discovery content for explore page',
    description: `
Returns discovery content for the explore page:
- Recent cigars: 3 most recently added cigars with brand info
- Recent tastings: 6 most recent PUBLIC, COMPLETED tastings with user info

Features:
- No authentication required
- Optimized for fast loading
- Only shows public content
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Discovery content',
    type: DiscoverResponseDto,
  })
  async getDiscoveryContent(): Promise<DiscoverResponseDto> {
    return this.discoverService.getDiscoveryContent();
  }
}