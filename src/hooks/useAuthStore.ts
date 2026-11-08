/**
 * File: src/hooks/useAuthStore.ts
 * Purpose: Authentication & Two-Role State Management for the Feynman Technique Stage.
 * Supports credentials for:
 *   - learn123 / 123123 (Role: learner)
 *   - admin123 / 123123 (Role: admin)
 * Includes persistent session in localStorage and quick dev role switcher.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "../types/auth.types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (usernameOrEmail: string, password: string) => boolean;
  register: (data: {
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    password: string;
  }) => boolean;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  setProfile: (profile: Partial<UserProfile>) => void;
}

export const PRECONFIGURED_USERS: Record<string, { password: string; profile: UserProfile }> = {
  learn123: {
    password: "123123",
    profile: {
      id: "usr-learner-001",
      username: "learn123",
      email: "learn123@theodore.edu",
      fullName: "Nguyễn Giảng Viên (Learner)",
      role: "learner",
      fieldOfStudy: "Công Nghệ Thông Tin & Toán",
      masteryPoints: 480,
      clarityAverage: 82,
      createdAt: "2026-11-01T08:00:00Z",
    },
  },
  curator123: {
    password: "123123",
    profile: {
      id: "usr-curator-777",
      username: "curator123",
      email: "curator123@theodore.edu",
      fullName: "Lê Thẩm Định (Knowledge Curator)",
      role: "curator",
      fieldOfStudy: "Kiểm Định & Gán Nhãn Tri Thức",
      assignedDomains: ["dom-it", "dom-cs", "dom-se"],
      masteryPoints: 1600,
      clarityAverage: 94,
      createdAt: "2026-11-05T08:00:00Z",
    },
  },
  admin123: {
    password: "123123",
    profile: {
      id: "usr-admin-999",
      username: "admin123",
      email: "admin123@theodore.edu",
      fullName: "Trần Kiểm Chuẩn (Moderator Admin)",
      role: "admin",
      fieldOfStudy: "Quản Trị Học Thuật & Đánh Giá AI",
      assignedDomains: [
        "dom-it",
        "dom-cs",
        "dom-se",
        "dom-ecom",
        "dom-acc",
        "dom-biz",
        "dom-tour",
        "dom-med",
      ],
      masteryPoints: 2500,
      clarityAverage: 98,
      createdAt: "2026-10-15T00:00:00Z",
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Default to learn123 on first launch
      user: PRECONFIGURED_USERS.learn123.profile,
      isAuthenticated: true,
      loginError: null,

      login: (usernameOrEmail: string, password: string): boolean => {
        const cleanInput = usernameOrEmail.trim().toLowerCase();
        
        // Find matching preconfigured user by username or email
        const targetEntry = Object.values(PRECONFIGURED_USERS).find(
          (u) =>
            u.profile.username.toLowerCase() === cleanInput ||
            u.profile.email.toLowerCase() === cleanInput
        );

        if (!targetEntry) {
          set({ loginError: "Tài khoản không tồn tại. Dùng learn123, curator123 hoặc admin123." });
          return false;
        }

        if (targetEntry.password !== password) {
          set({ loginError: "Mật khẩu không chính xác (Mật khẩu mặc định: 123123)." });
          return false;
        }

        set({
          user: targetEntry.profile,
          isAuthenticated: true,
          loginError: null,
        });
        return true;
      },

      register: (data) => {
        const cleanUsername = data.username.trim().toLowerCase();
        if (PRECONFIGURED_USERS[cleanUsername]) {
          set({ loginError: "Tên đăng nhập này đã tồn tại." });
          return false;
        }

        const newProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          username: data.username.trim(),
          email: data.email.trim(),
          fullName: data.fullName.trim() || data.username.trim(),
          role: data.role,
          fieldOfStudy: data.role === "admin" ? "Quản Trị Học Thuật" : "Khoa Học & Công Nghệ",
          masteryPoints: 0,
          clarityAverage: 0,
          createdAt: new Date().toISOString(),
        };

        PRECONFIGURED_USERS[cleanUsername] = {
          password: data.password,
          profile: newProfile,
        };

        set({
          user: newProfile,
          isAuthenticated: true,
          loginError: null,
        });
        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          loginError: null,
        });
      },

      switchRole: (newRole: UserRole) => {
        if (newRole === "admin") {
          set({
            user: PRECONFIGURED_USERS.admin123.profile,
            isAuthenticated: true,
            loginError: null,
          });
        } else if (newRole === "curator") {
          set({
            user: PRECONFIGURED_USERS.curator123.profile,
            isAuthenticated: true,
            loginError: null,
          });
        } else {
          set({
            user: PRECONFIGURED_USERS.learn123.profile,
            isAuthenticated: true,
            loginError: null,
          });
        }
      },

      setProfile: (updates: Partial<UserProfile>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: "theodore_auth_session",
    }
  )
);

