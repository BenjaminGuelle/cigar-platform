import { ApiProperty } from '@nestjs/swagger';
import { JoinRequestStatus } from '@cigar-platform/prisma-client';
import { MemberUserDto } from './club-member-response.dto';

/**
 * Club Join Request Response DTO
 */
export class ClubJoinRequestResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  clubId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ enum: JoinRequestStatus, example: JoinRequestStatus.PENDING })
  status: JoinRequestStatus;

  @ApiProperty({ type: String, example: 'I would like to join this club', nullable: true })
  message: string | null;

  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: MemberUserDto, description: 'User who requested to join' })
  user: MemberUserDto;
}
