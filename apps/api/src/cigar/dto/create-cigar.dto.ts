import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { IsSecureText } from '../../common/validators/safe-text.validator';

export class CreateCigarDto {
  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Brand name (will be created if not exists)',
    example: 'Cohiba',
  })
  brandName: string;

  @IsSecureText()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: 'Brand country (only for new brands)',
    example: 'Cuba',
  })
  brandCountry?: string;

  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({
    description: 'Cigar name',
    example: 'Behike 52',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Cigar vitola (format)',
    example: 'Robusto',
  })
  vitola: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Cigar strength (1-5)',
    example: 3,
  })
  strength: number;
}
