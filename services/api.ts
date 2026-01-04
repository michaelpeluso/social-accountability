/**
 * API Service - handles all backend communication
 * Device-first: API calls sync to cloud replica, not primary
 */

import { logger } from "../src/lib/logger";
import type {
  User,
  SignInWithAppleRequest,
  SignInResponse,
  UpdateProfileRequest,
  UpdatePrivacyRequest,
  FriendRequestPayload,
  Friendship,
  FriendRequest,
  ExportData,
} from "../src/types/user";

// API configuration - uses mock mode when ENABLE_APPLE_AUTH=false
const API_URL = process.env.API_URL || "http://localhost:3000";
const USE_MOCK = process.env.ENABLE_APPLE_AUTH !== "true";

type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

/**
 * Base fetch wrapper with auth and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("API error", { endpoint, status: response.status, error: data });
      return { error: data.error || { code: "UNKNOWN", message: "Request failed" } };
    }

    return { data };
  } catch (error) {
    logger.error("API fetch error", { endpoint, error });
    return { error: { code: "NETWORK_ERROR", message: "Network request failed" } };
  }
}

/**
 * Mock API responses for development
 */
const mockApi = {
  signInWithApple: async (
    request: SignInWithAppleRequest
  ): Promise<ApiResponse<SignInResponse>> => {
    logger.info("Mock API: signInWithApple", { appleUserId: request.appleUserId });

    const mockUser: User = {
      id: `user-${request.appleUserId.slice(0, 8)}`,
      appleId: request.appleUserId,
      displayName: request.fullName || "New User",
      email: request.email,
      defaultPrivacy: "SELF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      data: {
        user: mockUser,
        token: `mock-jwt-${Date.now()}`,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
    };
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return {
      data: {
        id: "mock-user-123",
        displayName: "Test User",
        email: "test@example.com",
        defaultPrivacy: "SELF",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    return {
      data: {
        id: "mock-user-123",
        displayName: request.displayName || "Test User",
        bio: request.bio,
        photoUrl: request.photoUrl,
        defaultPrivacy: "SELF",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  updatePrivacy: async (request: UpdatePrivacyRequest): Promise<ApiResponse<User>> => {
    return {
      data: {
        id: "mock-user-123",
        displayName: "Test User",
        defaultPrivacy: request.defaultPrivacy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  getFriends: async (): Promise<ApiResponse<User[]>> => {
    return { data: [] };
  },

  getFriendRequests: async (): Promise<
    ApiResponse<{ sent: FriendRequest[]; received: FriendRequest[] }>
  > => {
    return { data: { sent: [], received: [] } };
  },

  sendFriendRequest: async (
    _payload: FriendRequestPayload
  ): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "Friend request sent" } };
  },

  acceptFriendRequest: async (_requestId: string): Promise<ApiResponse<Friendship>> => {
    return {
      data: {
        id: `friendship-${Date.now()}`,
        userId: "mock-user-123",
        friendId: "friend-456",
        status: "ACCEPTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  declineFriendRequest: async (_requestId: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "Request declined" } };
  },

  unfriend: async (_friendshipId: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "Unfriended" } };
  },

  blockUser: async (_userId: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "User blocked" } };
  },

  unblockUser: async (_userId: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "User unblocked" } };
  },

  getBlockedUsers: async (): Promise<ApiResponse<User[]>> => {
    return { data: [] };
  },

  searchUsers: async (_query: string): Promise<ApiResponse<User[]>> => {
    // Mock empty results for now - real search happens on backend
    return { data: [] };
  },

  exportData: async (): Promise<ApiResponse<ExportData>> => {
    return {
      data: {
        user: {
          id: "mock-user-123",
          displayName: "Test User",
          defaultPrivacy: "SELF",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        friendships: [],
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  },

  deleteAccount: async (_confirmation: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "Account deleted" } };
  },

  requestRecovery: async (_email: string): Promise<ApiResponse<{ message: string }>> => {
    return { data: { message: "Recovery email sent" } };
  },
};

/**
 * API client with mock fallback
 * Auto-retrieves token from auth service
 */

// Import auth dynamically to avoid circular dependency
async function getToken(): Promise<string | null> {
  const { auth } = await import("./auth");
  return auth.getToken();
}

export const api = {
  auth: {
    signInWithApple: async (
      request: SignInWithAppleRequest
    ): Promise<ApiResponse<SignInResponse>> => {
      if (USE_MOCK) return mockApi.signInWithApple(request);
      return apiFetch<SignInResponse>("/auth/apple", {
        method: "POST",
        body: JSON.stringify(request),
      });
    },

    requestRecovery: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.requestRecovery(email);
      return apiFetch("/auth/recovery/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  },

  user: {
    getMe: async (): Promise<ApiResponse<User>> => {
      if (USE_MOCK) return mockApi.getMe();
      const token = await getToken();
      return apiFetch<User>("/me", {}, token || undefined);
    },

    updateProfile: async (request: UpdateProfileRequest): Promise<ApiResponse<User>> => {
      if (USE_MOCK) return mockApi.updateProfile(request);
      const token = await getToken();
      return apiFetch<User>(
        "/me",
        {
          method: "PATCH",
          body: JSON.stringify(request),
        },
        token || undefined
      );
    },

    updatePrivacy: async (request: UpdatePrivacyRequest): Promise<ApiResponse<User>> => {
      if (USE_MOCK) return mockApi.updatePrivacy(request);
      const token = await getToken();
      return apiFetch<User>(
        "/me/privacy",
        {
          method: "PATCH",
          body: JSON.stringify(request),
        },
        token || undefined
      );
    },

    exportData: async (): Promise<ApiResponse<ExportData>> => {
      if (USE_MOCK) return mockApi.exportData();
      const token = await getToken();
      return apiFetch<ExportData>("/me/export", {}, token || undefined);
    },

    deleteAccount: async (confirmation: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.deleteAccount(confirmation);
      const token = await getToken();
      return apiFetch(
        "/me",
        {
          method: "DELETE",
          body: JSON.stringify({ confirmation }),
        },
        token || undefined
      );
    },
  },

  friends: {
    getAll: async (): Promise<ApiResponse<User[]>> => {
      if (USE_MOCK) return mockApi.getFriends();
      const token = await getToken();
      return apiFetch<User[]>("/friends", {}, token || undefined);
    },

    getRequests: async (): Promise<
      ApiResponse<{ sent: FriendRequest[]; received: FriendRequest[] }>
    > => {
      if (USE_MOCK) return mockApi.getFriendRequests();
      const token = await getToken();
      return apiFetch("/friends/requests", {}, token || undefined);
    },

    sendRequest: async (recipientId: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.sendFriendRequest({ recipientId });
      const token = await getToken();
      return apiFetch(
        "/friends/requests",
        {
          method: "POST",
          body: JSON.stringify({ recipientId }),
        },
        token || undefined
      );
    },

    acceptRequest: async (requestId: string): Promise<ApiResponse<Friendship>> => {
      if (USE_MOCK) return mockApi.acceptFriendRequest(requestId);
      const token = await getToken();
      return apiFetch<Friendship>(
        `/friends/requests/${requestId}/accept`,
        {
          method: "POST",
        },
        token || undefined
      );
    },

    declineRequest: async (requestId: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.declineFriendRequest(requestId);
      const token = await getToken();
      return apiFetch(
        `/friends/requests/${requestId}`,
        {
          method: "DELETE",
        },
        token || undefined
      );
    },

    unfriend: async (friendshipId: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.unfriend(friendshipId);
      const token = await getToken();
      return apiFetch(
        `/friends/${friendshipId}`,
        {
          method: "DELETE",
        },
        token || undefined
      );
    },

    blockUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.blockUser(userId);
      const token = await getToken();
      return apiFetch(
        `/users/${userId}/block`,
        {
          method: "POST",
        },
        token || undefined
      );
    },

    unblockUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
      if (USE_MOCK) return mockApi.unblockUser(userId);
      const token = await getToken();
      return apiFetch(
        `/users/${userId}/unblock`,
        {
          method: "POST",
        },
        token || undefined
      );
    },

    getBlockedUsers: async (): Promise<ApiResponse<User[]>> => {
      if (USE_MOCK) return mockApi.getBlockedUsers();
      const token = await getToken();
      return apiFetch<User[]>("/users/blocked", {}, token || undefined);
    },

    searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
      if (USE_MOCK) return mockApi.searchUsers(query);
      const token = await getToken();
      return apiFetch<User[]>(
        `/users/search?q=${encodeURIComponent(query)}`,
        {},
        token || undefined
      );
    },
  },
};
