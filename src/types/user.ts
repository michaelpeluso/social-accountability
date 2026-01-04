// User-related types for M1

export type Privacy = "SELF" | "FRIENDS" | "PUBLIC";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "BLOCKED";

export type User = {
  id: string;
  appleId?: string;
  displayName: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  defaultPrivacy: Privacy;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Friendship = {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  sender: User;
  recipient: User;
};

export type BlockedUser = {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
};

export type RecoveryToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
};

// API Request/Response types
export type SignInWithAppleRequest = {
  appleToken: string;
  appleUserId: string;
  email?: string;
  fullName?: string;
};

export type SignInResponse = {
  user: User;
  token: string;
  expiresAt: number;
};

export type UpdateProfileRequest = {
  displayName?: string;
  photoUrl?: string;
  bio?: string;
};

export type UpdatePrivacyRequest = {
  defaultPrivacy: Privacy;
};

export type FriendRequestPayload = {
  recipientId: string;
};

export type ExportData = {
  user: User;
  friendships: Friendship[];
  exportedAt: string;
  version: string;
};
