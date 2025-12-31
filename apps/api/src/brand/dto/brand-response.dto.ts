import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Cohiba' })
  name: string;

  @ApiProperty({ example: 'cohiba' })
  slug: string;

  @ApiProperty({ example: 'Cuba', nullable: true })
  country: string | null;

  @ApiProperty({ example: 'Premium Cuban cigar brand', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'https://example.com/logo.svg', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;
}
