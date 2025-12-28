import { ApiProperty } from '@nestjs/swagger';
import { MemberUserDto } from './club-member-response.dto';

/**
 * Club Ban Response DTO
 */
export class ClubBanResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  clubId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  bannedBy: string;

  @ApiProperty({
    type: String,
    example: 'Inappropriate behavior',
    nullable: true,
  })
  reason: string | null;

  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: MemberUserDto, description: 'Banned user details' })
  user: MemberUserDto;

  @ApiProperty({
    type: MemberUserDto,
    description: 'User who performed the ban',
  })
  bannedByUser: MemberUserDto;
}
