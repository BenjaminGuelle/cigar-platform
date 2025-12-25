import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JoinRequestStatus } from '@prisma/client';

export class CreateJoinRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'Optional message to club owner/admin',
    example: 'I love cigars and would like to join your club',
    maxLength: 500,
  })
  message?: string;
}

export class UpdateJoinRequestDto {
  @IsEnum(JoinRequestStatus)
  @ApiPropertyOptional({
    description: 'Join request status',
    enum: JoinRequestStatus,
    example: JoinRequestStatus.APPROVED,
  })
  status: JoinRequestStatus;
}

export class JoinByCodeDto {
  @IsString()
  @ApiPropertyOptional({
    description: 'Club invitation code',
    example: 'COHIBA-LOVERS-A7X9',
  })
  code: string;
}
