import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { IsSecureText } from '../../common/validators/safe-text.validator';

export class CreateBrandDto {
  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Brand name',
    example: 'Cohiba',
    minLength: 2,
    maxLength: 50,
  })
  name: string;

  @IsSecureText()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: 'Country of origin',
    example: 'Cuba',
    maxLength: 50,
  })
  country?: string;
}
