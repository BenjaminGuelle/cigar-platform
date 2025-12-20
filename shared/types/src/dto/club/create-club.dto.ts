import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @ApiProperty({
    description: 'Club name',
    example: 'Cigar Lovers Paris',
    minLength: 3,
    maxLength: 100,
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Club description',
    example: 'A club for cigar enthusiasts in Paris, meeting every month',
    maxLength: 1000,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'Club image URL',
    example: 'https://example.com/club-image.jpg',
  })
  imageUrl?: string;
}