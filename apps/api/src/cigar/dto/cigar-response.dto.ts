import { ApiProperty } from '@nestjs/swagger';
import { BrandResponseDto } from '../../brand/dto';

export class CigarResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Behike 52' })
  name: string;

  @ApiProperty({ example: 'cohiba-behike-52' })
  slug: string;

  @ApiProperty({ example: 'Robusto' })
  vitola: string;

  @ApiProperty({ example: 3 })
  strength: number;

  @ApiProperty({ type: BrandResponseDto })
  brand: BrandResponseDto;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;
}
