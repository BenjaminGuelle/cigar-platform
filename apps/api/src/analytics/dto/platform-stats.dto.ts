import { ApiProperty } from '@nestjs/swagger';

export class PlatformStatsDto {
  @ApiProperty({ example: 150 })
  totalUsers: number;

  @ApiProperty({ example: 25 })
  totalClubs: number;

  @ApiProperty({ example: 500 })
  totalTastings: number;

  @ApiProperty({ example: 1200 })
  totalEvents: number;
}
