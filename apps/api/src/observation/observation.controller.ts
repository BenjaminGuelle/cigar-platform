import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ObservationService } from './observation.service';
import { UpsertObservationDto, ObservationResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('observations')
@Controller('tastings/:tastingId/observations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  @Put(':phase')
  @ApiOperation({ summary: 'Upsert observation for a phase (create or update)' })
  @ApiParam({
    name: 'tastingId',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'phase',
    description: 'Phase: presentation | fumage_cru | foin | divin | purin | conclusion',
    example: 'presentation',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation upserted successfully',
    type: ObservationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (not the tasting author)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async upsert(
    @Param('tastingId') tastingId: string,
    @Param('phase') phase: string,
    @Body() upsertObservationDto: UpsertObservationDto,
    @CurrentUser('id') userId: string
  ): Promise<ObservationResponseDto> {
    return this.observationService.upsert(
      tastingId,
      phase,
      upsertObservationDto,
      userId
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all observations for a tasting' })
  @ApiParam({
    name: 'tastingId',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Observations retrieved successfully',
    type: [ObservationResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Tasting not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (visibility restriction)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Param('tastingId') tastingId: string,
    @CurrentUser('id') currentUserId?: string
  ): Promise<ObservationResponseDto[]> {
    return this.observationService.findAll(tastingId, currentUserId);
  }

  @Delete(':phase')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete observation for a phase' })
  @ApiParam({
    name: 'tastingId',
    description: 'Tasting UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'phase',
    description: 'Phase: presentation | fumage_cru | foin | divin | purin | conclusion',
    example: 'presentation',
  })
  @ApiResponse({
    status: 204,
    description: 'Observation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Observation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (not the tasting author)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(
    @Param('tastingId') tastingId: string,
    @Param('phase') phase: string,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    return this.observationService.remove(tastingId, phase, userId);
  }
}
