import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResultDto } from './dto';

/**
 * Omnisearch Controller
 *
 * Provides universal search endpoint with prefix-based filtering
 *
 * Examples:
 * - GET /search?q=cohiba → Global search
 * - GET /search?q=@username → Search users only
 * - GET /search?q=#slug → Search clubs only
 */
@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Universal search (Omnisearch)',
    description: `
Search across all entities with optional prefix filtering:
- No prefix: Global search (brands, cigars, PUBLIC clubs, users)
- @username: Search users only
- #slug: Search clubs only

Features:
- Case-insensitive contains search
- Max 8 results per category
- PRIVATE clubs excluded from global search
- PRIVATE users show only @username (displayName hidden)
- VERIFIED cigars only
- Performance optimized (<100ms target)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResultDto,
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(query.q);
  }
}
