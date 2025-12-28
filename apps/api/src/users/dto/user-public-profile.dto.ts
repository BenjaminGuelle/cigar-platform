import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User Stats DTO
 * Statistics about user's cigar evaluations and clubs
 */
export class UserStatsDto {
  @Expose()
  @ApiProperty({
    example: 42,
    description: 'Total number of cigar evaluations by this user'
  })
  evaluationCount: number;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: 'Cohiba',
    description: 'User\'s favorite cigar brand (most evaluated brand)'
  })
  favoriteBrand: string | null;

  @Expose()
  @ApiProperty({
    example: 5,
    description: 'Total number of clubs the user is member of'
  })
  clubCount: number;
}

/**
 * User Public Profile DTO
 * Public information about a user and their statistics
 * Used by GET /users/:id/profile endpoint
 */
export class UserPublicProfileDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Johnny Cigars 🔥' })
  displayName: string;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/avatar.jpg'
  })
  avatarUrl: string | null;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: 'Passionate cigar enthusiast from Paris'
  })
  bio: string | null;

  @Expose()
  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @Type(() => UserStatsDto)
  @ApiProperty({
    type: UserStatsDto,
    description: 'User statistics (evaluations, clubs, favorite brand)'
  })
  stats: UserStatsDto;
}