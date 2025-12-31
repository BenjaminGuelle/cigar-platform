import { Module } from '@nestjs/common';
import { CigarController } from './cigar.controller';
import { CigarService } from './cigar.service';
import { BrandModule } from '../brand/brand.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../app/prisma.service';

@Module({
  imports: [AuthModule, BrandModule],
  controllers: [CigarController],
  providers: [CigarService, PrismaService],
})
export class CigarModule {}
