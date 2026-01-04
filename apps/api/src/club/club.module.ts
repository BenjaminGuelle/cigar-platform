import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubMemberService } from './club-member.service';
import { ClubJoinRequestService } from './club-join-request.service';
import { ClubController } from './club.controller';
import { AuthModule } from '../auth/auth.module';
import { PlanModule } from '../plan/plan.module';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [AuthModule, PlanModule],
  controllers: [ClubController],
  providers: [ClubService, ClubMemberService, ClubJoinRequestService, StorageService],
  exports: [ClubService, ClubMemberService, ClubJoinRequestService],
})
export class ClubModule {}