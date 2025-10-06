import { api } from "@/lib/http";
import { Book } from "@/app/types/Book";
import type { UserBookWithDetails } from "@/app/types/UserBookWithDetails";

export type InvitationCreateResponse = {
  id: string;
};

export type FriendProfileResponse = {
  profile: {
    id: string;
    full_name: string;
    age: number | null;
    avatar_url: string | null;
    member_since?: string;
  };
  books: UserBookWithDetails[];
};

export type AcceptInvitationResponse = {
  accepted: true;
  alreadyAccepted?: boolean;
};

export type InvitationDetailsResponse = {
  invite: {
    inviter_name: string;
    inviter_email: string;
    expires_at: string;
    accepted_at: string | null;
  };
  expired: boolean;
};

export async function createFriendInvitation(email: string) {
  return api.post<InvitationCreateResponse>("/friends/invitations", { email });
}

export async function getFriendProfile(friendId: string) {
  return api.get<FriendProfileResponse>(`/friends/${friendId}`);
}

// Email-only flow helpers
export type IncomingInvite = {
  id: string;
  inviter_id: string;
  inviter_name: string;
  inviter_email: string;
  expires_at: string;
  accepted_at: string | null;
  expired: boolean;
};

export async function listIncomingInvitations() {
  return api.get<{ invites: IncomingInvite[] }>(`/friends/invitations`);
}

export async function acceptInvitationById(id: string) {
  return api.post<AcceptInvitationResponse>(`/friends/invitations/${id}/accept`);
}

export type FriendListItem = { id: string; full_name: string; avatar_url: string | null };

export async function listFriends() {
  return api.get<{ friends: FriendListItem[] }>(`/friends`);
}
