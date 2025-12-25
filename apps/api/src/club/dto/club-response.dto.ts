import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubVisibility } from '@cigar-platform/prisma-client';

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
  @ApiPropertyOptional({ example: 'https://example.com/club-cover.jpg' })
  coverUrl: string | null;

  @Expose()
  @ApiProperty({ enum: ClubVisibility, example: ClubVisibility.PUBLIC })
  visibility: ClubVisibility;

  @Expose()
  @ApiPropertyOptional({ example: 'A7X9K2M5', description: 'Only returned for club owners/admins' })
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
  @ApiPropertyOptional({ example: 100 })
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
}