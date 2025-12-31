import { Module } from '@nestjs/common';
import { TastingService } from './tasting.service';
import { TastingController } from './tasting.controller';
import { ObservationService } from '../observation/observation.service';
import { ObservationController } from '../observation/observation.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TastingController, ObservationController],
  providers: [TastingService, ObservationService],
  exports: [TastingService, ObservationService],
})
export class TastingModule {}
