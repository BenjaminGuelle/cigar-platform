import { Module } from '@nestjs/common';
import { TastingService } from './tasting.service';
import { TastingController } from './tasting.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TastingController],
  providers: [TastingService],
  exports: [TastingService],
})
export class TastingModule {}
