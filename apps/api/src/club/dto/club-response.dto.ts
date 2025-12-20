import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClubResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Cigar Lovers Paris' })
  name: string;

  @Expose()
  @ApiPropertyOptional({ example: 'A club for cigar enthusiasts in Paris' })
  description: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/club-image.jpg' })
  imageUrl: string | null;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @Expose()
  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  createdAt: Date;
}