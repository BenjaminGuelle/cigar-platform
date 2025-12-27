import { ApiProperty } from '@nestjs/swagger';
import { ClubResponseDto } from './club-response.dto';
import { ClubRole } from '@cigar-platform/prisma-client';

/**
 * Join By Code Response DTO
 * Returned when a user successfully joins a club via invitation code
 */
export class JoinByCodeResponseDto {
  @ApiProperty({
    type: ClubResponseDto,
    description: 'The club that was joined',
  })
  club: ClubResponseDto;

  @ApiProperty({
    enum: ClubRole,
    example: ClubRole.member,
    description: 'The role assigned to the user in the club',
  })
  role: ClubRole;
}
