import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubMemberService } from './club-member.service';
import { ClubJoinRequestService } from './club-join-request.service';
import { ClubController } from './club.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ClubController],
  providers: [ClubService, ClubMemberService, ClubJoinRequestService],
  exports: [ClubService, ClubMemberService, ClubJoinRequestService],
})
export class ClubModule {}