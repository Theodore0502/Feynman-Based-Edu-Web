/**
 * File: src/pages/AuthAndOnboarding.tsx
 * Mục đích: Cổng Đăng Nhập, Đăng Ký, Xác Nhận Email (OTP/Link) & Quên Mật Khẩu qua Supabase Auth.
 * Đặc điểm:
 *   - Bố cục chuẩn 1:1 Motion Sliding đồng thời:
 *     + LOGIN & CONFIRM_EMAIL: Giàn hoa 1 bên trái, Bàn thao tác bên phải.
 *     + REGISTER & FORGOT_PASSWORD: Bàn thao tác bên trái, Giàn hoa 2 bên phải.
 *   - Đăng ký tài khoản gửi Email Xác Nhận kèm mã OTP 6 số.
 *   - Hỗ trợ nhập mã OTP kích hoạt trực tiếp hoặc bấm vào link trong email.
 *   - Quên mật khẩu gửi mã OTP khôi phục để đặt lại mật khẩu mới an toàn.
 *   - Giữ nguyên các tài khoản kiểm thử nhanh (learn123, curator123, admin123).
 *   - Zero Scrollbar: Thiết kế tối ưu hiển thị vừa vặn trong 100vh.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { FallingLeavesEffect } from "@/components/shared/FallingLeavesEffect";
import { toast } from "sonner";
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Lock,
  User,
  Mail,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Send,
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserRole } from "@/types/auth.types";
import { supabase } from "@/lib/supabase";

export const AuthAndOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const {
    login,
    signUp,
    verifySignupOtp,
    resendSignupEmail,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
    loginError,
    clearError,
  } = useAuthStore();

  type TabMode = "LOGIN" | "REGISTER" | "CONFIRM_EMAIL" | "FORGOT_PASSWORD";
  const [activeTab, setActiveTab] = useState<TabMode>("LOGIN");

  // Form states - Login
  const [username, setUsername] = useState("learn123");
  const [password, setPassword] = useState("123123");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Register
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("learner");

  // Form states - Confirm Email OTP
  const [confirmEmail, setConfirmEmail] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Form states - Forgot Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Nhập email gửi OTP, 2: Nhập OTP & mật khẩu mới
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Form states - Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái tài khoản không tồn tại khi đăng nhập
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Countdown timer cho nút Gửi lại mã
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Lắng nghe sự kiện Auth từ Supabase (khi người dùng nhấp vào link trong email)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setActiveTab("FORGOT_PASSWORD");
        setForgotStep(2);
        toast.info("Vui lòng nhập mật khẩu mới để hoàn tất khôi phục.");
      } else if (event === "SIGNED_IN" && session) {
        toast.success("Tài khoản đã được xác thực thành công!");
        navigate("/dashboard");
      }
    });

    // Bắt query parameters nếu redirect về từ email hoặc từ landing page
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "true") {
      toast.success("Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay.");
      setActiveTab("LOGIN");
    }
    if (params.get("mode") === "recovery") {
      setActiveTab("FORGOT_PASSWORD");
      setForgotStep(2);
    }
    if (params.get("mode") === "register" || params.get("tab") === "register") {
      setActiveTab("REGISTER");
    } else if (params.get("mode") === "login" || params.get("tab") === "login") {
      setActiveTab("LOGIN");
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleSwitchToRegister = () => {
    setActiveTab("REGISTER");
    const cleanUser = username.trim();
    if (cleanUser.includes("@")) {
      setRegEmail(cleanUser);
      setRegUsername(cleanUser.split("@")[0]);
    } else if (cleanUser && !["learn123", "curator123", "admin123"].includes(cleanUser)) {
      setRegUsername(cleanUser);
    }
    setLocalError(null);
    clearError();
    setIsAccountNotFound(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsAccountNotFound(false);
    setIsSubmitting(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng bạn trở lại, ${username}!`,
        });
        const cleanUser = username.trim().toLowerCase();
        if (cleanUser === "admin123") {
          navigate("/admin/rubrics");
        } else if (cleanUser === "curator123") {
          navigate("/curator/validation");
        } else {
          navigate("/dashboard");
        }
      } else if (res.needConfirmation) {
        setConfirmEmail(res.email || username);
        setActiveTab("CONFIRM_EMAIL");
        toast.info("Email chưa được kích hoạt. Vui lòng nhập mã OTP hoặc kiểm tra hòm thư.");
      } else {
        setLocalError(res.error || "Thông tin đăng nhập không hợp lệ.");
        if (res.isAccountNotFound) {
          setIsAccountNotFound(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!regEmail.trim() || !regPassword.trim()) {
      setLocalError("Vui lòng điền địa chỉ email và mật khẩu.");
      return;
    }

    if (regPassword.length < 6) {
      setLocalError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUp({
        username: regUsername.trim() || regEmail.split("@")[0],
        email: regEmail.trim(),
        fullName: regFullName.trim() || regUsername.trim() || regEmail.split("@")[0],
        role: regRole,
        password: regPassword,
      });

      if (res.success) {
        if (res.needConfirmation) {
          setConfirmEmail(regEmail.trim());
          setResendCountdown(60);
          setActiveTab("CONFIRM_EMAIL");
          toast.success("Đăng ký thành công!", {
            description: `Mã OTP và liên kết kích hoạt đã được gửi về email ${regEmail.trim()}.`,
          });
        } else {
          toast.success("Đăng ký tài khoản thành công!");
          navigate("/dashboard");
        }
      } else {
        setLocalError(res.error || "Không thể tạo tài khoản.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!signupOtp.trim() || signupOtp.trim().length < 6) {
      setLocalError("Vui lòng nhập đúng mã OTP 6 số từ email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifySignupOtp(confirmEmail, signupOtp.trim());
      if (res.success) {
        toast.success("Xác thực email thành công! Chào mừng bạn gia nhập Elis.");
        navigate("/dashboard");
      } else {
        setLocalError(res.error || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await resendSignupEmail(confirmEmail);
      if (res.success) {
        setResendCountdown(60);
        toast.success("Đã gửi lại mã xác nhận và liên kết về email!");
      } else {
        toast.error("Không thể gửi lại email: " + (res.error || "Vui lòng thử lại sau."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!forgotEmail.trim()) {
      setLocalError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPasswordResetOtp(forgotEmail.trim());
      if (res.success) {
        setForgotStep(2);
        toast.success("Đã gửi mã OTP đặt lại mật khẩu về email của bạn!");
      } else {
        setLocalError(res.error || "Không thể gửi mã khôi phục. Vui lòng kiểm tra lại email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!resetOtp.trim()) {
      setLocalError("Vui lòng nhập mã OTP 6 số nhận được qua email.");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const verifyRes = await verifyPasswordResetOtp(forgotEmail.trim(), resetOtp.trim());
      if (!verifyRes.success) {
        setLocalError(verifyRes.error || "Mã OTP không chính xác hoặc đã hết hạn.");
        return;
      }

      const updateRes = await updatePassword(newPassword);
      if (updateRes.success) {
        toast.success("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.");
        setUsername(forgotEmail);
        setPassword(newPassword);
        setActiveTab("LOGIN");
        setForgotStep(1);
        setResetOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setLocalError(updateRes.error || "Không thể cập nhật mật khẩu mới.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (userKey: string, customPass?: string) => {
    setUsername(userKey);
    setPassword(customPass || "123123");
    setLocalError(null);
    clearError();
    setIsAccountNotFound(false);
    toast.info(`Đã điền tài khoản: ${userKey}`);
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#F1F6FD] relative select-none">
      {/* Hiệu ứng cánh hoa & chiếc lá rơi nhẹ nhàng ở tầng nền sau cùng (z-0) */}
      <FallingLeavesEffect count={26} className="z-0" />

      {/* =========================================================================
          KHỐI 1: GIÀN HOA TRÁI (Image 1)
          ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-44 sm:h-56 lg:h-full absolute inset-y-0 left-0 overflow-hidden bg-slate-900 transition-transform duration-1000 ease-in-out z-10 ${
          activeTab === "LOGIN" || activeTab === "CONFIRM_EMAIL"
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        <img
          src="/images/auth-flower-garden.png"
          alt="Giàn Hoa Tri Thức Trái"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* =========================================================================
          KHỐI 2: GIÀN HOA PHẢI (Image 2)
          ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-44 sm:h-56 lg:h-full absolute inset-y-0 right-0 overflow-hidden bg-slate-900 transition-transform duration-1000 ease-in-out z-10 ${
          activeTab === "REGISTER" || activeTab === "FORGOT_PASSWORD"
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none"
        }`}
      >
        <img
          src="/images/auth-flower-garden-right.png"
          alt="Giàn Hoa Tri Thức Phải"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* =========================================================================
          KHỐI 3: BÀN LÀM VIỆC ĐĂNG NHẬP / ĐĂNG KÝ / OTP (AUTH CARD DESK)
          ========================================================================= */}
      <div
        className={`w-full lg:w-[450px] h-full absolute inset-y-0 left-1/2 flex items-center justify-center p-3 sm:p-5 z-20 transition-transform duration-1000 ease-in-out ${
          activeTab === "LOGIN" || activeTab === "CONFIRM_EMAIL"
            ? "translate-x-[-50%] lg:translate-x-[calc(-50%+19vw)]"
            : "translate-x-[-50%] lg:translate-x-[calc(-50%-19vw)]"
        }`}
      >
        <div className="bg-white w-full max-w-[430px] rounded-3xl p-5 sm:p-6 border border-[#E2EAFD] shadow-card space-y-3 my-auto transition-all duration-500">
          {/* Logo & Headline */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto flex items-center justify-center transition-transform duration-300 hover:scale-105">
              <EliseCatMascot size={44} className="drop-shadow-xs" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight transition-all duration-200">
              {activeTab === "LOGIN" && "Đăng Nhập Elis"}
              {activeTab === "REGISTER" && "Đăng Ký Tài Khoản"}
              {activeTab === "CONFIRM_EMAIL" && "Xác Nhận Email Kích Hoạt"}
              {activeTab === "FORGOT_PASSWORD" && "Đặt Lại Mật Khẩu"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {activeTab === "CONFIRM_EMAIL"
                ? "Kiểm tra hòm thư để nhận mã OTP kích hoạt tài khoản"
                : activeTab === "FORGOT_PASSWORD"
                ? "Khôi phục mật khẩu bảo mật qua mã OTP gửi về email"
                : "Học sâu phương pháp Feynman qua phản biện AI cùng các Persona"}
            </p>
          </div>

          {/* Toggle Tabs: [Đăng Nhập] | [Đăng Ký] (Ẩn khi đang ở Confirm Email hoặc Forgot Password) */}
          {(activeTab === "LOGIN" || activeTab === "REGISTER") && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("LOGIN");
                  setLocalError(null);
                  clearError();
                }}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "LOGIN"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("REGISTER");
                  setLocalError(null);
                  clearError();
                }}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "REGISTER"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đăng Ký
              </button>
            </div>
          )}

          {/* Error notification if any */}
          {(localError || loginError) && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium text-[11px] leading-relaxed">{localError || loginError}</span>
              </div>
              {isAccountNotFound && activeTab === "LOGIN" && (
                <div className="pt-1.5 border-t border-rose-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Chưa có tài khoản?</span>
                  <button
                    type="button"
                    onClick={handleSwitchToRegister}
                    className="font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Đăng ký ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              VIEW 1: FORM ĐĂNG NHẬP (LOGIN)
              ===================================================================== */}
          {activeTab === "LOGIN" && (
            <div className="space-y-3 animate-fade-in">
              {/* Quick Fill Pills for Demo & 5 Fresh Accounts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Tài Khoản Kiểm Thử Nhanh</span>
                  <span className="text-slate-400 font-normal">MK: 123123 hoặc Password@123</span>
                </div>

                {/* 5 Tài khoản mới tinh (0 XP) */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                    Mới tinh:
                  </span>
                  {[
                    { key: "minhanh_it", name: "Minh Anh", role: "IT", icon: "💻" },
                    { key: "hoangnam_ecom", name: "Hoàng Nam", role: "Ecom", icon: "🛒" },
                    { key: "thuha_med", name: "Thu Hà", role: "Y Dược", icon: "🩺" },
                    { key: "quocbao_curator", name: "Quốc Bảo", role: "Curator", icon: "📜" },
                    { key: "phuonglinh_admin", name: "Phương Linh", role: "Admin", icon: "🛡️" },
                  ].map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => fillQuickAccount(u.key, "Password@123")}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        username === u.key
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300/40"
                          : "bg-white text-slate-600 border-[#E2EAFD] hover:bg-slate-50"
                      }`}
                      title={`${u.name} (${u.role}) - Tài khoản mới tinh 0 điểm`}
                    >
                      <span>{u.icon}</span>
                      <span>{u.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount("learn123")}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                      username === "learn123"
                        ? "bg-blue-50/80 border-[#7286D3] ring-1 ring-[#7286D3]/30"
                        : "bg-[#F8FAFD] hover:bg-blue-50/40 border-[#E2EAFD]"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-700 truncate">
                      <GraduationCap className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>learn123</span>
                    </div>
                    <p className="text-[8.5px] text-slate-500 truncate">🎓 Học viên</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickAccount("curator123")}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                      username === "curator123"
                        ? "bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/30"
                        : "bg-[#F8FAFD] hover:bg-indigo-50/40 border-[#E2EAFD]"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black text-indigo-700 truncate">
                      <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>curator123</span>
                    </div>
                    <p className="text-[8.5px] text-slate-500 truncate">📜 Thẩm định</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickAccount("admin123")}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                      username === "admin123"
                        ? "bg-purple-50/80 border-purple-500 ring-1 ring-purple-500/30"
                        : "bg-[#F8FAFD] hover:bg-purple-50/40 border-[#E2EAFD]"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black text-purple-700 truncate">
                      <ShieldCheck className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>admin123</span>
                    </div>
                    <p className="text-[8.5px] text-slate-500 truncate">🛡️ Quản trị</p>
                  </button>
                </div>
              </div>

              {/* Login Form Inputs */}
              <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tên đăng nhập hoặc Email
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="learn123 hoặc email@domain.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(username.includes("@") ? username : "");
                        setForgotStep(1);
                        setLocalError(null);
                        clearError();
                        setActiveTab("FORGOT_PASSWORD");
                      }}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="123123 hoặc mật khẩu tài khoản"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      title={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Xác Thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Vào Hệ Thống</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <p className="text-[11px] text-slate-500">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={handleSwitchToRegister}
                      className="font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* =====================================================================
              VIEW 2: FORM ĐĂNG KÝ (REGISTER)
              ===================================================================== */}
          {activeTab === "REGISTER" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tên tài khoản
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="learner_feynman"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ban@gmail.com (nhận OTP xác nhận)"
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-9 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    title={showRegPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Vai trò mục tiêu
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRegRole("learner")}
                    className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      regRole === "learner"
                        ? "bg-purple-50 text-purple-700 border-purple-400 ring-1 ring-purple-400/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>Người Học</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole("curator")}
                    className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      regRole === "curator"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-400 ring-1 ring-indigo-400/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Thẩm Định</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole("admin")}
                    className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      regRole === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-400 ring-1 ring-purple-400/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Quản Trị</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Đăng Ký & Gửi Mail...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo Tài Khoản & Gửi Email Xác Nhận</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-500">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("LOGIN");
                      setLocalError(null);
                      clearError();
                      setIsAccountNotFound(false);
                    }}
                    className="font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer hover:underline"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* =====================================================================
              VIEW 3: XÁC NHẬN EMAIL (CONFIRM EMAIL VIA OTP OR LINK)
              ===================================================================== */}
          {activeTab === "CONFIRM_EMAIL" && (
            <div className="space-y-3.5 animate-fade-in text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-inner">
                <Mail className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  Email xác nhận đã được gửi đến:
                </p>
                <p className="text-xs font-black text-indigo-700 bg-indigo-50/80 py-1 px-3 rounded-lg border border-indigo-200/60 inline-block font-mono">
                  {confirmEmail}
                </p>
              </div>

              <form onSubmit={handleVerifySignupOtp} className="space-y-2.5 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 text-center">
                    Nhập mã OTP 6 số từ hòm thư của bạn:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full py-2 text-center text-lg font-black tracking-[0.3em] font-mono rounded-xl bg-[#F8FAFD] border-2 border-indigo-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || signupOtp.length < 6}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Kích Hoạt...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác Thực Kích Hoạt & Vào Học</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP button with countdown */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("LOGIN");
                    setLocalError(null);
                    clearError();
                  }}
                  className="hover:text-purple-600 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Về Đăng nhập</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendSignupOtp}
                  disabled={resendCountdown > 0 || isSubmitting}
                  className={`font-bold transition-colors cursor-pointer ${
                    resendCountdown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-indigo-600 hover:text-indigo-800"
                  }`}
                >
                  {resendCountdown > 0 ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Gửi lại sau ({resendCountdown}s)</span>
                    </span>
                  ) : (
                    <span>Gửi lại mã OTP</span>
                  )}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed text-left">
                💡 <strong>Mẹo:</strong> Bạn cũng có thể nhấp trực tiếp vào nút <em>"Confirm your mail"</em> trong hòm thư để kích hoạt tức thì mà không cần nhập OTP.
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 4: QUÊN MẬT KHẨU & ĐẶT LẠI MẬT KHẨU QUA OTP EMAIL
              ===================================================================== */}
          {activeTab === "FORGOT_PASSWORD" && (
            <div className="space-y-3 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-inner">
                <KeyRound className="w-5 h-5" />
              </div>

              {forgotStep === 1 ? (
                /* Bước 1: Nhập email gửi OTP */
                <form onSubmit={handleSendForgotOtp} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nhập địa chỉ Email tài khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="email_da_dang_ky@domain.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Gửi Mã OTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Mã OTP Đặt Lại Mật Khẩu</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Bước 2: Nhập OTP & Mật khẩu mới */
                <form onSubmit={handleResetPasswordWithOtp} className="space-y-2.5">
                  <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200 text-[10px] text-purple-700 text-center font-medium">
                    Mã OTP khôi phục đã gửi tới: <strong>{forgotEmail}</strong>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mã OTP 6 số từ Email
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full py-1.5 text-center text-sm font-black tracking-[0.25em] font-mono rounded-xl bg-[#F8FAFD] border border-purple-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="≥ 6 ký tự"
                          className="w-full pl-2.5 pr-7 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Nhập lại mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Trùng khớp"
                          className="w-full pl-2.5 pr-7 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || resetOtp.length < 6}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Cập Nhật Mật Khẩu...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Xác Nhận & Đặt Lại Mật Khẩu</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("LOGIN");
                    setForgotStep(1);
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-purple-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Quay lại Đăng nhập</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="pt-1.5 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="text-[11px] font-semibold text-slate-400 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CÂU DANH NGÔN FEYNMAN NẰM Ở DƯỚI VÀ CHÍNH GIỮA 2 PHẦN (VISUAL ANCHOR)
          ========================================================================= */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-center text-center px-4 w-full max-w-4xl">
        <p className="font-['Times_New_Roman',Times,serif] italic font-normal text-xs sm:text-sm md:text-base text-[#F7A8B8] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] tracking-wide leading-relaxed">
          "Nếu bạn không thể giải thích đơn giản cho một đứa trẻ 10 tuổi hiểu, thì chính bạn vẫn chưa thực sự hiểu nó."
        </p>
        <span className="font-['Times_New_Roman',Times,serif] not-italic font-normal text-xs sm:text-sm text-[#F49BB2] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] tracking-wide mt-0.5">
          - Richard Feynman -
        </span>
      </div>
    </div>
  );
};

export default AuthAndOnboarding;
