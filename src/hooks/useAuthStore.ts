/**
 * File: src/hooks/useAuthStore.ts
 * Purpose: Authentication & Two-Role State Management for the Feynman Technique Stage.
 * Supports:
 *   1. Supabase Real Auth: Email Registration with Confirmation Link & 6-digit OTP,
 *      Password Reset with Email OTP & Recovery, and Session Persistence.
 *   2. Instant Preconfigured Accounts for Dev/Demo:
 *      - learn123 / 123123 (Role: learner)
 *      - curator123 / 123123 (Role: curator)
 *      - admin123 / 123123 (Role: admin)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserRole } from "../types/auth.types";

export interface AuthResponse {
  success: boolean;
  needConfirmation?: boolean;
  email?: string;
  error?: string;
  isAccountNotFound?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;

  // Actions
  login: (usernameOrEmail: string, password: string) => Promise<AuthResponse>;
  signUp: (data: {
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    password: string;
  }) => Promise<AuthResponse>;
  register: (data: {
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    password: string;
  }) => Promise<AuthResponse>;

  verifySignupOtp: (email: string, token: string) => Promise<AuthResponse>;
  resendSignupEmail: (email: string) => Promise<AuthResponse>;

  sendPasswordResetOtp: (email: string) => Promise<AuthResponse>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<AuthResponse>;
  updatePassword: (newPassword: string) => Promise<AuthResponse>;

  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  clearError: () => void;
}

export const PRECONFIGURED_USERS: Record<string, { password: string; profile: UserProfile }> = {
  // 3 Tài khoản kiểm thử kinh nghiệm sẵn có
  learn123: {
    password: "123123",
    profile: {
      id: "9d99b36f-148f-441b-a272-25faaae6e076",
      username: "learn123",
      email: "learn123@elis.edu.vn",
      fullName: "Nguyễn Giảng Viên (Learner)",
      displayName: "Nguyễn Giảng Viên (Learner)",
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
      id: "5f998525-0951-4988-af1d-036f3cc61ad5",
      username: "curator123",
      email: "curator123@elis.edu.vn",
      fullName: "Lê Thẩm Định (Knowledge Curator)",
      displayName: "Lê Thẩm Định (Knowledge Curator)",
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
      id: "bdbfaae1-c1e0-4ec0-bec5-f132345a71f6",
      username: "admin123",
      email: "admin123@elis.edu.vn",
      fullName: "Trần Kiểm Chuẩn (Moderator Admin)",
      displayName: "Trần Kiểm Chuẩn (Moderator Admin)",
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

  // 5 Tài khoản Mới Tinh (Fresh Accounts - 0 Điểm, Bắt Đầu Từ Đầu)
  minhanh_it: {
    password: "Password@123",
    profile: {
      id: "126b06d4-d9b6-4832-adf5-23183fc36b48",
      username: "minhanh_it",
      email: "minhanh.it@elis.edu.vn",
      fullName: "Trần Minh Anh",
      displayName: "Trần Minh Anh",
      role: "learner",
      fieldOfStudy: "Khoa Học Máy Tính & Lập Trình Web",
      masteryPoints: 0,
      clarityAverage: 0,
      createdAt: "2026-11-13T00:00:00Z",
    },
  },
  hoangnam_ecom: {
    password: "Password@123",
    profile: {
      id: "babb1001-d5a0-4cb1-b0c5-5032f3c974d7",
      username: "hoangnam_ecom",
      email: "hoangnam.ecom@elis.edu.vn",
      fullName: "Nguyễn Hoàng Nam",
      displayName: "Nguyễn Hoàng Nam",
      role: "learner",
      fieldOfStudy: "Thương Mại Điện Tử & Marketing Số",
      masteryPoints: 0,
      clarityAverage: 0,
      createdAt: "2026-11-13T00:00:00Z",
    },
  },
  thuha_med: {
    password: "Password@123",
    profile: {
      id: "9977e224-7beb-4db4-b49b-64f7b63afb7c",
      username: "thuha_med",
      email: "thuha.med@elis.edu.vn",
      fullName: "Phạm Thu Hà",
      displayName: "Phạm Thu Hà",
      role: "learner",
      fieldOfStudy: "Y Khoa & Dược Học Cơ Bản",
      masteryPoints: 0,
      clarityAverage: 0,
      createdAt: "2026-11-13T00:00:00Z",
    },
  },
  quocbao_curator: {
    password: "Password@123",
    profile: {
      id: "fa9bae41-b01a-417b-ae15-a46629f62a52",
      username: "quocbao_curator",
      email: "quocbao.curator@elis.edu.vn",
      fullName: "Đặng Quốc Bảo",
      displayName: "Đặng Quốc Bảo",
      role: "curator",
      fieldOfStudy: "Kiểm Định Tri Thức & Sư Phạm",
      assignedDomains: ["dom-it", "dom-cs", "dom-se", "dom-ecom", "dom-med"],
      masteryPoints: 0,
      clarityAverage: 0,
      createdAt: "2026-11-13T00:00:00Z",
    },
  },
  phuonglinh_admin: {
    password: "Password@123",
    profile: {
      id: "1eac20a1-477d-4a44-a2c9-3173dd5dc721",
      username: "phuonglinh_admin",
      email: "phuonglinh.admin@elis.edu.vn",
      fullName: "Vũ Phương Linh",
      displayName: "Vũ Phương Linh",
      role: "admin",
      fieldOfStudy: "Quản Trị Hệ Thống & Kiểm Chuẩn AI",
      assignedDomains: [
        "dom-it",
        "dom-cs",
        "dom-se",
        "dom-ecom",
        "dom-acc",
        "dom-biz",
        "dom-tour",
        "dom-med",
        "dom-edu",
      ],
      masteryPoints: 0,
      clarityAverage: 0,
      createdAt: "2026-11-13T00:00:00Z",
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Default to learn123 on first launch
      user: PRECONFIGURED_USERS.learn123.profile,
      isAuthenticated: true,
      isLoading: false,
      loginError: null,

      clearError: () => set({ loginError: null }),

      /**
       * Đăng nhập: Ưu tiên tài khoản mẫu demo, nếu không thì gọi Supabase Auth
       */
      login: async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
        const cleanInput = usernameOrEmail.trim().toLowerCase();
        set({ isLoading: true, loginError: null });

        // 1. Kiểm tra tài khoản nhanh (Quick Demo Accounts)
        const targetEntry = Object.values(PRECONFIGURED_USERS).find(
          (u) =>
            u.profile.username.toLowerCase() === cleanInput ||
            u.profile.email.toLowerCase() === cleanInput
        );

        if (targetEntry) {
          const isPasswordValid =
            targetEntry.password === password ||
            password === "123123" ||
            password === "Password@123";

          if (!isPasswordValid) {
            set({
              isLoading: false,
              loginError: "Mật khẩu không chính xác.",
            });
            return {
              success: false,
              error: "Mật khẩu không chính xác.",
              isAccountNotFound: false,
            };
          }

          set({
            user: targetEntry.profile,
            isAuthenticated: true,
            isLoading: false,
            loginError: null,
          });
          return { success: true };
        }

        // 1.1 Nếu nhập tên tài khoản không phải email và không thuộc danh sách demo -> Chưa tồn tại tài khoản
        if (!usernameOrEmail.includes("@")) {
          const msg = "Tài khoản không tồn tại trong hệ thống.";
          set({ isLoading: false, loginError: msg });
          return { success: false, error: msg, isAccountNotFound: true };
        }

        // 2. Đăng nhập qua Supabase Auth
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: usernameOrEmail.trim(),
            password,
          });

          if (error) {
            // Trường hợp tài khoản chưa xác nhận email
            if (
              error.message.toLowerCase().includes("email not confirmed") ||
              error.message.toLowerCase().includes("not confirmed")
            ) {
              const msg = "Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư hoặc nhập mã OTP để kích hoạt tài khoản.";
              set({ isLoading: false, loginError: msg });
              return {
                success: false,
                needConfirmation: true,
                email: usernameOrEmail.trim(),
                error: msg,
              };
            }

            const isNotFoundOrInvalid =
              error.message === "Invalid login credentials" ||
              error.message.toLowerCase().includes("invalid login credentials") ||
              error.message.toLowerCase().includes("user not found");

            const msg = isNotFoundOrInvalid
              ? "Tài khoản không tồn tại hoặc mật khẩu không chính xác."
              : error.message;

            set({ isLoading: false, loginError: msg });
            return {
              success: false,
              error: msg,
              isAccountNotFound: isNotFoundOrInvalid,
            };
          }

          if (data.user) {
            const userMeta = data.user.user_metadata || {};
            const profile: UserProfile = {
              id: data.user.id,
              username: userMeta.username || data.user.email?.split("@")[0] || "user",
              email: data.user.email || "",
              fullName: userMeta.full_name || data.user.email?.split("@")[0] || "Học viên Elis",
              displayName: userMeta.full_name || data.user.email?.split("@")[0] || "Học viên Elis",
              role: (userMeta.role as UserRole) || "learner",
              fieldOfStudy: userMeta.field_of_study || "Phương pháp Feynman",
              masteryPoints: 0,
              clarityAverage: 0,
              createdAt: data.user.created_at,
            };

            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
              loginError: null,
            });
            return { success: true };
          }

          set({ isLoading: false, loginError: "Không tìm thấy thông tin người dùng." });
          return { success: false, error: "Không tìm thấy thông tin người dùng." };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Lỗi kết nối máy chủ Supabase." });
          return { success: false, error: err.message || "Lỗi kết nối máy chủ Supabase." };
        }
      },

      /**
       * Đăng ký tài khoản mới kèm gửi Email Xác Nhận & Mã OTP
       */
      signUp: async (data): Promise<AuthResponse> => {
        set({ isLoading: true, loginError: null });
        const cleanEmail = data.email.trim().toLowerCase();
        const cleanUsername = data.username.trim().toLowerCase();

        // Kiểm tra trùng tài khoản demo
        if (PRECONFIGURED_USERS[cleanUsername]) {
          const msg = "Tên đăng nhập này đã được sử dụng cho tài khoản demo hệ thống.";
          set({ isLoading: false, loginError: msg });
          return { success: false, error: msg };
        }

        try {
          const redirectUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth?confirmed=true`
              : undefined;

          const { data: authData, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: data.password,
            options: {
              data: {
                full_name: data.fullName.trim() || data.username.trim(),
                username: data.username.trim(),
                role: data.role || "learner",
              },
              emailRedirectTo: redirectUrl,
            },
          });

          if (error) {
            set({ isLoading: false, loginError: error.message });
            return { success: false, error: error.message };
          }

          // Trường hợp Supabase yêu cầu xác nhận email (session == null)
          if (authData.user && !authData.session) {
            set({ isLoading: false, loginError: null });
            return {
              success: true,
              needConfirmation: true,
              email: cleanEmail,
            };
          }

          // Trường hợp tự động kích hoạt (nếu Supabase tắt verify email)
          if (authData.user && authData.session) {
            const userMeta = authData.user.user_metadata || {};
            const profile: UserProfile = {
              id: authData.user.id,
              username: data.username.trim(),
              email: cleanEmail,
              fullName: data.fullName.trim() || data.username.trim(),
              displayName: data.fullName.trim() || data.username.trim(),
              role: data.role || "learner",
              fieldOfStudy: data.role === "admin" ? "Quản Trị Học Thuật" : "Khoa Học & Công Nghệ",
              masteryPoints: 0,
              clarityAverage: 0,
              createdAt: authData.user.created_at,
            };

            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
              loginError: null,
            });
            return { success: true, needConfirmation: false };
          }

          set({ isLoading: false, loginError: null });
          return { success: true, needConfirmation: true, email: cleanEmail };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Lỗi khi đăng ký tài khoản." });
          return { success: false, error: err.message || "Lỗi khi đăng ký tài khoản." };
        }
      },

      register: async (data) => {
        return get().signUp(data);
      },

      /**
       * Xác thực mã OTP 6 số để kích hoạt tài khoản đăng ký
       */
      verifySignupOtp: async (email: string, token: string): Promise<AuthResponse> => {
        set({ isLoading: true, loginError: null });
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: token.trim(),
            type: "signup",
          });

          if (error) {
            set({ isLoading: false, loginError: error.message });
            return { success: false, error: error.message };
          }

          if (data.user) {
            const userMeta = data.user.user_metadata || {};
            const profile: UserProfile = {
              id: data.user.id,
              username: userMeta.username || data.user.email?.split("@")[0] || "user",
              email: data.user.email || email,
              fullName: userMeta.full_name || "Học viên Elis",
              displayName: userMeta.full_name || "Học viên Elis",
              role: (userMeta.role as UserRole) || "learner",
              fieldOfStudy: userMeta.field_of_study || "Phương pháp Feynman",
              masteryPoints: 0,
              clarityAverage: 0,
              createdAt: data.user.created_at,
            };

            set({
              user: profile,
              isAuthenticated: true,
              isLoading: false,
              loginError: null,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: true };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Lỗi xác thực mã OTP." });
          return { success: false, error: err.message || "Lỗi xác thực mã OTP." };
        }
      },

      /**
       * Gửi lại email xác thực kích hoạt tài khoản
       */
      resendSignupEmail: async (email: string): Promise<AuthResponse> => {
        try {
          const redirectUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth?confirmed=true`
              : undefined;

          const { error } = await supabase.auth.resend({
            type: "signup",
            email: email.trim().toLowerCase(),
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || "Không thể gửi lại email." };
        }
      },

      /**
       * Quên mật khẩu: Gửi mã OTP khôi phục mật khẩu về email
       */
      sendPasswordResetOtp: async (email: string): Promise<AuthResponse> => {
        set({ isLoading: true, loginError: null });
        try {
          const redirectUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth?mode=recovery`
              : undefined;

          const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim().toLowerCase(),
            {
              redirectTo: redirectUrl,
            }
          );

          if (error) {
            set({ isLoading: false, loginError: error.message });
            return { success: false, error: error.message };
          }

          set({ isLoading: false, loginError: null });
          return { success: true, email: email.trim() };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Lỗi gửi yêu cầu khôi phục mật khẩu." });
          return { success: false, error: err.message || "Lỗi gửi yêu cầu khôi phục mật khẩu." };
        }
      },

      /**
       * Xác thực mã OTP khôi phục mật khẩu
       */
      verifyPasswordResetOtp: async (email: string, token: string): Promise<AuthResponse> => {
        set({ isLoading: true, loginError: null });
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: token.trim(),
            type: "recovery",
          });

          if (error) {
            set({ isLoading: false, loginError: error.message });
            return { success: false, error: error.message };
          }

          set({ isLoading: false, loginError: null });
          return { success: true };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Mã OTP khôi phục không hợp lệ." });
          return { success: false, error: err.message || "Mã OTP khôi phục không hợp lệ." };
        }
      },

      /**
       * Cập nhật mật khẩu mới sau khi xác thực OTP thành công
       */
      updatePassword: async (newPassword: string): Promise<AuthResponse> => {
        set({ isLoading: true, loginError: null });
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            set({ isLoading: false, loginError: error.message });
            return { success: false, error: error.message };
          }

          set({ isLoading: false, loginError: null });
          return { success: true };
        } catch (err: any) {
          set({ isLoading: false, loginError: err.message || "Không thể cập nhật mật khẩu mới." });
          return { success: false, error: err.message || "Không thể cập nhật mật khẩu mới." };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // Ignore
        }
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
