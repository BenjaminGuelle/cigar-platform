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

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    AuthModule,
    ClubModule,
    UsersModule,
    SearchModule,
    BrandModule,
    CigarModule,
    TastingModule,
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
