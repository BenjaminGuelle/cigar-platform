import { IsString, IsOptional, MaxLength, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRole } from '@cigar-platform/prisma-client';

export class BanMemberDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'Reason for banning the member',
    example: 'Inappropriate behavior',
    maxLength: 500,
  })
  reason?: string;
}

export class UpdateMemberRoleDto {
  @IsEnum(ClubRole)
  @ApiProperty({
    description: 'New role for the member',
    enum: ClubRole,
    example: ClubRole.admin,
  })
  role: ClubRole;
}

export class TransferOwnershipDto {
  @IsUUID()
  @ApiProperty({
    description: 'User ID of the new owner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  newOwnerId: string;
}
