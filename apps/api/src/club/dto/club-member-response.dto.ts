import { ApiProperty } from '@nestjs/swagger';
import { ClubRole } from '@cigar-platform/prisma-client';

/**
 * Club Member Response DTO
 */
export class ClubMemberResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  clubId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ enum: ClubRole, example: ClubRole.member })
  role: ClubRole;

  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  joinedAt: Date;
}
