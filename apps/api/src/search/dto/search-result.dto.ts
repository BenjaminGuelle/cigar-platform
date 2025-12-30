import { ApiProperty } from '@nestjs/swagger';

/**
 * Search Item Types
 */
export type SearchItemType = 'brand' | 'cigar' | 'club' | 'user';

/**
 * Base Search Item (common fields)
 */
export class BaseSearchItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'brand' })
  type: SearchItemType;

  @ApiProperty({ example: 'Cohiba' })
  name: string;

  @ApiProperty({ example: 'cohiba', nullable: true })
  slug?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  imageUrl?: string;

  @ApiProperty({ example: 'Premium Cuban cigar brand', nullable: true })
  description?: string;

  @ApiProperty({ example: 'Cuba', nullable: true })
  metadata?: string;
}

/**
 * Brand Search Item
 */
export class BrandSearchItemDto extends BaseSearchItemDto {
  @ApiProperty({ example: 'brand' })
  type: 'brand';

  @ApiProperty({ example: 'Cuba' })
  country: string;
}

/**
 * Cigar Search Item
 */
export class CigarSearchItemDto extends BaseSearchItemDto {
  @ApiProperty({ example: 'cigar' })
  type: 'cigar';

  @ApiProperty({ example: 'Cohiba' })
  brandName: string;

  @ApiProperty({ example: 'Robusto' })
  vitola: string;

  @ApiProperty({ example: '124mm × 50' })
  size: string;
}

/**
 * Club Search Item
 */
export class ClubSearchItemDto extends BaseSearchItemDto {
  @ApiProperty({ example: 'club' })
  type: 'club';

  @ApiProperty({ example: 42 })
  memberCount: number;

  @ApiProperty({ example: 'PUBLIC' })
  visibility: string;
}

/**
 * User Search Item
 */
export class UserSearchItemDto extends BaseSearchItemDto {
  @ApiProperty({ example: 'user' })
  type: 'user';

  @ApiProperty({ example: '@username' })
  username: string;

  @ApiProperty({ example: 'Benjamin Guelle', nullable: true })
  displayName?: string;

  @ApiProperty({ example: 'PUBLIC' })
  visibility: string;
}

/**
 * Search Result Response
 */
export class SearchResultDto {
  @ApiProperty({
    description: 'Search query used',
    example: 'cohiba',
  })
  query: string;

  @ApiProperty({
    description: 'Search type (prefix-based)',
    example: 'global',
    enum: ['global', 'user', 'club'],
  })
  searchType: 'global' | 'user' | 'club';

  @ApiProperty({
    description: 'Brands found (global search only)',
    type: [BrandSearchItemDto],
    required: false,
  })
  brands?: BrandSearchItemDto[];

  @ApiProperty({
    description: 'Cigars found (global search only)',
    type: [CigarSearchItemDto],
    required: false,
  })
  cigars?: CigarSearchItemDto[];

  @ApiProperty({
    description: 'Clubs found',
    type: [ClubSearchItemDto],
    required: false,
  })
  clubs?: ClubSearchItemDto[];

  @ApiProperty({
    description: 'Users found',
    type: [UserSearchItemDto],
    required: false,
  })
  users?: UserSearchItemDto[];

  @ApiProperty({
    description: 'Total results count',
    example: 12,
  })
  total: number;

  @ApiProperty({
    description: 'Search duration in milliseconds',
    example: 45,
  })
  duration: number;
}
