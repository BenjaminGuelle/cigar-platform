import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ClubModule } from '../club/club.module';
import { UsersModule } from '../users/users.module';
import { SearchModule } from '../search/search.module';
import { BrandModule } from '../brand/brand.module';
import { CigarModule } from '../cigar/cigar.module';
import { TastingModule } from '../tasting/tasting.module';
import { PlanModule } from '../plan/plan.module';
import { HealthModule } from '../health/health.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DiscoverModule } from '../discover/discover.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 200, // 200 requests per minute per IP (global safety net)
      },
    ]),
    AuthModule,
    ClubModule,
    UsersModule,
    SearchModule,
    BrandModule,
    CigarModule,
    TastingModule,
    PlanModule,
    HealthModule,
    FeedbackModule,
    AnalyticsModule,
    DiscoverModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
