import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../app/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { AuthModule } from '../auth/auth.module';
import { PlanModule } from '../plan/plan.module';

/**
 * Users Module
 * Handles user profile management and avatar uploads
 */
@Module({
  imports: [AuthModule, PlanModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, StorageService],
  exports: [UsersService],
})
export class UsersModule {}