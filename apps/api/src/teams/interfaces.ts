import {
  TeamOwnershipTransferStatus,
  TeamInvitationStatus,
  TeamMemberStatus,
  TeamsJoinRequestStatus,
} from '../generated/prisma-client';

export {
  TeamOwnershipTransferStatus,
  TeamInvitationStatus,
  TeamMemberStatus,
  TeamsJoinRequestStatus,
};

export interface TeamsRequest {
  name: string;
  logoUrl?: string;
  description?: string;
  assistants?: number[];
  members?: number[];
  staff?: Array<{ userId: number; role: string }>;
}

export interface TeamsResponse {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: TeamsMemberResponse[];
  invitations?: TeamInvitationResponse[];
}

export interface TeamsMemberResponse {
  id: number;
  teamId: number;
  userId: number;
  memberStatus: TeamMemberStatus;
  joinedAt: Date | null;
  leftAt: Date | null;
  teamContribution: number;
  role?: string;
  user: {
    id: number;
    nickName: string;
    logoUrl: string | null;
  };
  playerStats?: {
    gamesPlayed: number;
    wins: number;
    points: number;
    accuracy: number | null;
    kdRatio: number | null;
    rank: number | null;
  };
}

export interface TeamsJoinRequestResponse {
  id: number;
  teamId: number;
  userId: number;
  status: TeamsJoinRequestStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  user: {
    id: number;
    nickName: string;
    logoUrl: string | null;
  };
  playerStats?: {
    gamesPlayed: number;
    wins: number;
    points: number;
    accuracy: number | null;
    kdRatio: number | null;
    rank: number | null;
  };
}

export interface TeamsFilters {
  id?: number;
  userId?: number;
  searchQuery?: string;
  ownerId?: number;
  onlyActiveMembers?: boolean;
}

export interface TeamWithActiveMembers {
  id: number;
  members: Array<{ userId: number }>;
}

export interface TeamsInvitationRequest {
  teamId: number;
  inviterId: number;
  inviteeId: number;
  expiresInDays?: number;
}

export interface TeamsInvitationFilters {
  teamId?: number;
  status?: TeamInvitationStatus;
}

export interface TeamInvitationResponse {
  id: number;
  teamId: number;
  inviterId: number;
  inviteeId: number;
  status: TeamInvitationStatus;
  createdAt: Date;
  respondedAt: Date | null;
  expiresAt: Date | null;
  team: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  inviter: {
    id: number;
    nickName: string;
    fullName: string | null;
  };
  invitee: {
    id: number;
    nickName: string;
    fullName: string | null;
  };
}

export interface TeamOwnershipTransferRequest {
  id: number;
  teamId: number;
  currentOwnerId: number;
  newOwnerId: number;
  status: TeamOwnershipTransferStatus;
  createdAt: Date;
  respondedAt: Date | null;
  expiresAt: Date | null;
  team: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  currentOwner: {
    id: number;
    nickName: string;
    fullName: string | null;
    email: string;
  };
  newOwner: {
    id: number;
    nickName: string;
    fullName: string | null;
    email: string;
  };
}
