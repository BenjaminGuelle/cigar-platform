import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';

/**
 * Plan Module
 *
 * Provides plan management services for user subscriptions.
 * Plan data is served via UserDto through AuthService.
 */
@Module({
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}