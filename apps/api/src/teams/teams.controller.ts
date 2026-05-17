import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileInterceptor } from '../common/config/file-upload.config';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TeamsInvitationRequestDto } from './dto/teams-invitation-request.dto';
import { TeamsJoinRequestResponseDto } from './dto/teams-join-request-response.dto';
import { TeamsJoinRequestUpdateDto } from './dto/teams-join-request-update.dto';
import { TeamsMemberResponseDto } from './dto/teams-member-response.dto';
import { TeamsRequestDto } from './dto/teams-request.dto';
import { TeamsResponseDto } from './dto/teams-response.dto';
import { TeamsUpdateRequestDto } from './dto/teams-update-request.dto';
import { TeamsInvitationService } from './teams-invitation.service';
import { TeamsJoinRequestService } from './teams-join-request.service';
import { TeamsService } from './teams.service';
import { TransferOwnershipsService } from './transfer-ownerships.service';
import { TeamTransferOwnershipsRequestDto } from './dto/team-transfer-ownerships-request.dto';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly joinRequestService: TeamsJoinRequestService,
    private readonly invitationService: TeamsInvitationService,
    private readonly transferOwnershipsService: TransferOwnershipsService,
  ) {}

  @Post()
  async createTeam(
    @Body() dto: TeamsRequestDto,
    @User('userId') userId: number,
  ) {
    const team = await this.teamsService.createTeam(dto, userId);
    return new TeamsResponseDto(team);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  async getAll(
    @Query('myTeam') myTeam?: string,
    @Query('searchQuery') searchQuery?: string,
    @User('userId') userId?: number,
  ) {
    const teams = await this.teamsService.getAll(myTeam, searchQuery, userId);
    return teams.map((team) => new TeamsResponseDto(team));
  }

  @Get('invitations')
  async getInvitations(
    @User('userId') userId: number,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
  ) {
    return this.invitationService.getInvitations(userId, teamId, status);
  }

  @Get('transfer-ownership/requests')
  async getOwnershipTransferRequests(
    @User('userId') userId: number,
    @Query('status') status?: string,
  ) {
    return this.transferOwnershipsService.getTransferRequests(userId, status);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':id')
  async getTeam(@Param('id', ParseIntPipe) id: number) {
    const team = await this.teamsService.get(id);
    return new TeamsResponseDto(team);
  }

  @Patch(':id')
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TeamsUpdateRequestDto,
    @User('userId') userId: number,
  ) {
    const updated = await this.teamsService.updateTeam(id, dto, userId);
    return new TeamsResponseDto(updated);
  }

  @Post(':id/upload-logo')
  @UseInterceptors(ImageFileInterceptor)
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.teamsService.uploadTeamLogo(id, userId, file);
    return {
      url: result.url,
      team: new TeamsResponseDto(result.team),
    };
  }

  @Delete(':id')
  async removeTeam(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.teamsService.removeTeam(id, userId);
  }

  @Post(':id/join-requests')
  async createJoinRequest(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ) {
    const joinRequest = await this.joinRequestService.createJoinRequest(
      id,
      userId,
    );
    return new TeamsJoinRequestResponseDto(joinRequest);
  }

  @Get(':id/join-requests')
  async getJoinRequests(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @Query('status') status?: string,
  ) {
    const joinRequests = await this.joinRequestService.getJoinRequests(
      id,
      userId,
      status,
    );
    return joinRequests.map((join) => new TeamsJoinRequestResponseDto(join));
  }

  @Patch(':id/join-requests/:joinRequestId')
  async updateJoinRequest(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('joinRequestId', ParseIntPipe) joinRequestId: number,
    @Body() dto: TeamsJoinRequestUpdateDto,
    @User('userId') userId: number,
  ) {
    const result = await this.joinRequestService.updateJoinRequest(
      teamId,
      joinRequestId,
      userId,
      dto.status,
    );
    return new TeamsJoinRequestResponseDto(result);
  }

  @Delete(':id/leave')
  async leaveTeam(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.teamsService.leaveTeam(id, userId);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ) {
    const members = await this.teamsService.getMembers(id, userId);
    return members.map((member) => new TeamsMemberResponseDto(member));
  }

  @Get(':id/members/left')
  async getLeftMembers(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ) {
    const leftMembers = await this.teamsService.getLeftMembers(id, userId);
    return leftMembers.map((member) => new TeamsMemberResponseDto(member));
  }

  @Get(':id/my-role')
  async getMyRole(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ) {
    const role = await this.teamsService.getMemberRole(id, userId);
    return { role };
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.teamsService.removeMember(teamId, memberId, userId);
  }

  @Post(':id/invitations')
  async createInvitation(
    @Param('id', ParseIntPipe) teamId: number,
    @Body() dto: TeamsInvitationRequestDto,
    @User('userId') userId: number,
  ) {
    const invitation = await this.invitationService.createInvitation(
      teamId,
      userId,
      dto.inviteeId,
      dto.expiresInDays,
    );
    return invitation;
  }

  @Patch('invitations/:invitationId/accept')
  async acceptInvitation(
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @User('userId') userId: number,
  ) {
    const invitation = await this.invitationService.acceptInvitation(
      invitationId,
      userId,
    );
    return invitation;
  }

  @Patch('invitations/:invitationId/reject')
  async rejectInvitation(
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @User('userId') userId: number,
  ) {
    const invitation = await this.invitationService.rejectInvitation(
      invitationId,
      userId,
    );
    return invitation;
  }

  @Post('transfer-ownership/:teamId')
  async createOwnershipTransferRequest(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: TeamTransferOwnershipsRequestDto,
    @User('userId') userId: number,
  ) {
    return await this.transferOwnershipsService.createTransferRequest(
      teamId,
      dto.newOwnerId,
      userId,
      dto.expiresInMinutes,
    );
  }

  @Patch('transfer-ownership/:teamId/reject')
  async rejectOwnershipTransferRequest(
    @Param('teamId', ParseIntPipe) teamId: number,
    @User('userId') wishfulNewOwnerId: number,
  ) {
    const transferRequest =
      await this.transferOwnershipsService.transferOwnershipReject(
        teamId,
        wishfulNewOwnerId,
      );

    return transferRequest;
  }

  @Patch('transfer-ownership/:teamId/accept')
  async acceptOwnershipTransferRequest(
    @Param('teamId', ParseIntPipe) teamId: number,
    @User('userId') newOwnerId: number,
  ) {
    const transferRequest =
      await this.transferOwnershipsService.transferOwnershipAccept(
        teamId,
        newOwnerId,
      );

    return transferRequest;
  }

  @Patch(':id/reassign-owner')
  async reassignOwnerByAdmin(
    @Param('id', ParseIntPipe) teamId: number,
    @Body('newOwnerId', ParseIntPipe) newOwnerId: number,
    @User('userId') adminUserId: number,
  ) {
    return await this.transferOwnershipsService.adminReassignOwnership(
      teamId,
      newOwnerId,
      adminUserId,
    );
  }
}
