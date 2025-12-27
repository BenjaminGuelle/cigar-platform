import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubVisibility, ClubRole } from '@cigar-platform/prisma-client';

export class ClubResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Cigar Lovers Paris' })
  name: string;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'A club for cigar enthusiasts in Paris' })
  description: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'https://example.com/club-image.jpg' })
  imageUrl: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'https://example.com/club-cover.jpg' })
  coverUrl: string | null;

  @Expose()
  @ApiProperty({ enum: ClubVisibility, example: ClubVisibility.PUBLIC })
  visibility: ClubVisibility;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'A7X9K2M5', description: 'Only returned for club owners/admins' })
  inviteCode: string | null;

  @Expose()
  @ApiProperty({ example: true })
  isPublicDirectory: boolean;

  @Expose()
  @ApiProperty({ example: true })
  autoApproveMembers: boolean;

  @Expose()
  @ApiProperty({ example: false })
  allowMemberInvites: boolean;

  @Expose()
  @ApiPropertyOptional({ type: Number, example: 100 })
  maxMembers: number | null;

  @Expose()
  @ApiProperty({ example: false })
  isArchived: boolean;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @Expose()
  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ example: 42, description: 'Total number of members in the club' })
  memberCount: number;
}

/**
 * My Club Response DTO
 * Extends ClubResponseDto with user's role in the club
 * Used by GET /clubs/me endpoint
 */
export class MyClubResponseDto extends ClubResponseDto {
  @Expose()
  @ApiProperty({
    enum: ClubRole,
    example: ClubRole.owner,
    description: 'Current user\'s role in this club'
  })
  myRole: ClubRole;
}