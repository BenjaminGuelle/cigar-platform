import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { PrismaService } from '../app/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BrandController],
  providers: [BrandService, PrismaService],
  exports: [BrandService],
})
export class BrandModule {}
