import { Module } from '@nestjs/common';
import { DiscoverController } from './discover.controller';
import { DiscoverService } from './discover.service';
import { PrismaService } from '../app/prisma.service';
import { TastingModule } from '../tasting/tasting.module';

@Module({
  imports: [TastingModule],
  controllers: [DiscoverController],
  providers: [DiscoverService, PrismaService],
  exports: [DiscoverService],
})
export class DiscoverModule {}