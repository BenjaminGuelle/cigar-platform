import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClubService } from './club.service';
import { ClubMemberService } from './club-member.service';
import { ClubJoinRequestService } from './club-join-request.service';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  FilterClubDto,
  CreateJoinRequestDto,
  UpdateJoinRequestDto,
  JoinByCodeDto,
  UpdateMemberRoleDto,
  TransferOwnershipDto,
  BanMemberDto,
  PaginatedClubResponseDto,
  PaginatedMemberResponseDto,
  PaginatedJoinRequestResponseDto,
  PaginatedBanResponseDto,
  JoinByCodeResponseDto,
} from './dto';
import { ClubRole } from '@cigar-platform/prisma-client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClubRolesGuard } from '../common/guards/club-roles.guard';
import { ClubRoles } from '../common/decorators';

@ApiTags('clubs')
@Controller('clubs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly clubMemberService: ClubMemberService,
    private readonly clubJoinRequestService: ClubJoinRequestService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({
    status: 201,
    description: 'Club created successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Club with this name already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createClubDto: CreateClubDto,
    @CurrentUser('id') userId: string
  ): Promise<ClubResponseDto> {
    return this.clubService.create(createClubDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Clubs retrieved successfully',
    type: PaginatedClubResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(@Query() filter: FilterClubDto): Promise<PaginatedClubResponseDto> {
    return this.clubService.findAll(filter);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my clubs (with my role in each club)' })
  @ApiResponse({
    status: 200,
    description: 'User clubs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findMyClubs(@CurrentUser('id') userId: string) {
    return this.clubService.findMyClubs(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by ID' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Club found',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId?: string,
  ): Promise<ClubResponseDto> {
    return this.clubService.findOne(id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(ClubRolesGuard)
  @ApiOperation({ summary: 'Update a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Club updated successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only club admins or project admins/moderators can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Club with this name already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async update(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto
  ): Promise<ClubResponseDto> {
    return this.clubService.update(id, updateClubDto);
  }

  @Delete(':id')
  @UseGuards(ClubRolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Club deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only club admins or project admins/moderators can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Club not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clubService.remove(id);
  }

  // ==================== MEMBER MANAGEMENT ====================

  @Get(':id/members')
  @UseGuards(ClubRolesGuard)
  @ApiOperation({ summary: 'Get club members' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiResponse({
    status: 200,
    description: 'Members retrieved successfully',
    type: PaginatedMemberResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Must be a club member' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async getMembers(
    @Param('id') clubId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: ClubRole
  ): Promise<PaginatedMemberResponseDto> {
    return this.clubMemberService.getMembers(clubId, { page, limit, role });
  }

  @Get(':id/members/me')
  @ApiOperation({ summary: 'Get current user membership in club (returns role)' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiResponse({ status: 200, description: 'Membership retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not a member of this club' })
  async getMyMembership(
    @Param('id') clubId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.clubMemberService.findMyMembership(clubId, userId);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateMemberRole(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateMemberRoleDto
  ) {
    return this.clubMemberService.updateMemberRole(clubId, userId, updateDto);
  }

  @Post(':id/transfer-ownership')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Transfer club ownership' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiResponse({ status: 204, description: 'Ownership transferred successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owner' })
  @ApiResponse({ status: 404, description: 'New owner not found' })
  async transferOwnership(
    @Param('id') clubId: string,
    @CurrentUser('id') currentOwnerId: string,
    @Body() transferDto: TransferOwnershipDto
  ) {
    return this.clubMemberService.transferOwnership(clubId, currentOwnerId, transferDto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from club' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @Param('id') clubId: string,
    @Param('userId') userId: string
  ) {
    return this.clubMemberService.removeMember(clubId, userId);
  }

  @Post(':id/members/:userId/ban')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ban a member from club' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Member banned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async banMember(
    @Param('id') clubId: string,
    @Param('userId') userId: string,
    @CurrentUser('id') bannedBy: string,
    @Body() banDto: BanMemberDto
  ) {
    return this.clubMemberService.banMember(clubId, userId, bannedBy, banDto);
  }

  @Delete(':id/members/:userId/ban')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unban a member from club' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Member unbanned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  @ApiResponse({ status: 404, description: 'Ban not found' })
  async unbanMember(
    @Param('id') clubId: string,
    @Param('userId') userId: string
  ) {
    return this.clubMemberService.unbanMember(clubId, userId);
  }

  @Get(':id/bans')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @ApiOperation({ summary: 'Get banned members from club' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Banned members retrieved successfully',
    type: PaginatedBanResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  async getBannedMembers(
    @Param('id') clubId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.clubMemberService.getBannedMembers(clubId, { page, limit });
  }

  // ==================== JOIN REQUESTS ====================

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a club or create join request' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiResponse({ status: 201, description: 'Joined or request created' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is banned or already member' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async joinClub(
    @Param('id') clubId: string,
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateJoinRequestDto
  ) {
    return this.clubJoinRequestService.createJoinRequest(clubId, userId, createDto);
  }

  @Post('join-by-code')
  @ApiOperation({ summary: 'Join a club using invite code' })
  @ApiResponse({
    status: 201,
    description: 'Joined successfully',
    type: JoinByCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid invite code' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is banned or already member' })
  async joinByCode(
    @CurrentUser('id') userId: string,
    @Body() joinDto: JoinByCodeDto
  ): Promise<JoinByCodeResponseDto> {
    return this.clubJoinRequestService.joinByCode(joinDto, userId);
  }

  @Get(':id/join-requests')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @ApiOperation({ summary: 'Get club join requests' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiResponse({
    status: 200,
    description: 'Join requests retrieved successfully',
    type: PaginatedJoinRequestResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  async getJoinRequests(
    @Param('id') clubId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ): Promise<PaginatedJoinRequestResponseDto> {
    return this.clubJoinRequestService.getJoinRequests(clubId, { page, limit, status: status as any });
  }

  @Patch(':id/join-requests/:requestId')
  @UseGuards(ClubRolesGuard)
  @ClubRoles(ClubRole.owner, ClubRole.admin)
  @ApiOperation({ summary: 'Approve or reject join request' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'requestId', description: 'Join Request UUID' })
  @ApiResponse({ status: 200, description: 'Join request processed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owners and admins' })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  async updateJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser('id') reviewedBy: string,
    @Body() updateDto: UpdateJoinRequestDto
  ) {
    return this.clubJoinRequestService.updateJoinRequest(requestId, reviewedBy, updateDto);
  }

  @Delete(':id/join-requests/:requestId')
  @ApiOperation({ summary: 'Cancel join request' })
  @ApiParam({ name: 'id', description: 'Club UUID' })
  @ApiParam({ name: 'requestId', description: 'Join Request UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Join request cancelled' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only cancel own requests' })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  async cancelJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.clubJoinRequestService.cancelJoinRequest(requestId, userId);
  }
}