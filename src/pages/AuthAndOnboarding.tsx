/**
 * File: src/pages/AuthAndOnboarding.tsx
 * Mục đích: Cổng Đăng Nhập & Đăng Ký Elise Feynman Stage:
 *   - Bố cục màn hình chuẩn 1:1 với hiệu ứng Motion Sliding đồng thời:
 *     + Ở trạng thái Đăng Nhập: Nửa trái là Giàn Hoa 1 (efrt57), Nửa phải là Bàn Đăng Nhập.
 *     + Khi chuyển sang Đăng Ký: Giàn hoa 1 trượt sang trái biến mất, Bàn Đăng Nhập trượt sang nửa trái biến thành Đăng Ký, Giàn hoa 2 (k753ta) từ rìa phải trượt vào chiếm trọn nửa phải.
 *     + Đổi ngược lại thì chuyển động đảo chiều đồng thời mượt mà 100%.
 *   - Câu danh ngôn Feynman đứng yên ở đáy màn hình làm điểm tựa thị giác (Visual Anchor).
 *   - Zero Scrollbar: Toàn bộ nội dung hiển thị trọn vẹn trong khung nhìn 100vh.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { toast } from "sonner";
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Lock,
  User,
  Mail,
  AlertCircle,
} from "lucide-react";
import { UserRole } from "@/types/auth.types";

export const AuthAndOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, loginError } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Form states - Login
  const [username, setUsername] = useState("learn123");
  const [password, setPassword] = useState("123123");
  const [localError, setLocalError] = useState<string | null>(null);

  // Form states - Register
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("learner");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const success = login(username, password);
    if (success) {
      toast.success("Đăng nhập thành công!", {
        description: `Chào mừng bạn trở lại, ${username}!`,
      });
      if (username.trim().toLowerCase() === "admin123") {
        navigate("/admin/rubrics");
      } else {
        navigate("/dashboard");
      }
    } else {
      setLocalError(loginError || "Thông tin đăng nhập không hợp lệ.");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!regUsername.trim() || !regPassword.trim()) {
      setLocalError("Vui lòng điền tên tài khoản và mật khẩu.");
      return;
    }

    const success = register({
      username: regUsername.trim(),
      email: regEmail.trim() || `${regUsername.trim()}@elise.edu`,
      fullName: regFullName.trim() || regUsername.trim(),
      role: regRole,
      password: regPassword,
    });

    if (success) {
      toast.success("Đăng ký tài khoản thành công!", {
        description: `Chào mừng bạn gia nhập Elise với vai trò ${
          regRole === "admin" ? "Quản trị viên" : "Học viên"
        }.`,
      });
      if (regRole === "admin") {
        navigate("/admin/rubrics");
      } else {
        navigate("/dashboard");
      }
    } else {
      setLocalError(loginError || "Không thể tạo tài khoản.");
    }
  };

  const fillQuickAccount = (userKey: "learn123" | "admin123") => {
    setUsername(userKey);
    setPassword("123123");
    setLocalError(null);
    toast.info(`Đã điền tài khoản mẫu: ${userKey}`);
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#F1F6FD] relative select-none">
      {/* =========================================================================
          KHỐI 1: GIÀN HOA TRÁI (Image 1 - efrt57efrt57efrt)
          - Ở tab LOGIN: Nằm ở nửa trái (translate-x-0)
          - Ở tab REGISTER: Trượt hoàn toàn sang bên trái ra khỏi màn hình (-translate-x-full)
          - Không dùng mờ ảo (opacity), chuyển động trượt cơ học thực thụ
          ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-44 sm:h-56 lg:h-full absolute inset-y-0 left-0 overflow-hidden bg-slate-900 transition-transform duration-1000 ease-in-out z-0 ${
          activeTab === "LOGIN"
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
          KHỐI 2: GIÀN HOA PHẢI (Image 2 - k753tak753tak753)
          - Ở tab LOGIN: Nằm ngoài rìa phải (+translate-x-full)
          - Ở tab REGISTER: Trượt từ rìa phải vào chiếm trọn nửa phải (translate-x-0)
          - Không dùng mờ ảo (opacity), chuyển động trượt cơ học thực thụ
          ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-44 sm:h-56 lg:h-full absolute inset-y-0 right-0 overflow-hidden bg-slate-900 transition-transform duration-1000 ease-in-out z-0 ${
          activeTab === "REGISTER"
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
          KHỐI 3: BÀN LÀM VIỆC ĐĂNG NHẬP / ĐĂNG KÝ (AUTH CARD DESK)
          - Trượt êm ái nhẹ nhàng trong 1000ms:
            + Ở tab LOGIN: Nằm ở nửa phải nhưng xích nhẹ sang trái sát trục giữa
            + Ở tab REGISTER: Nằm ở nửa trái nhưng xích nhẹ sang phải sát trục giữa
          ========================================================================= */}
      <div
        className={`w-full lg:w-[450px] h-full absolute inset-y-0 left-1/2 flex items-center justify-center p-3 sm:p-5 z-10 transition-transform duration-1000 ease-in-out ${
          activeTab === "LOGIN"
            ? "translate-x-[-50%] lg:translate-x-[calc(-50%+19vw)]"
            : "translate-x-[-50%] lg:translate-x-[calc(-50%-19vw)]"
        }`}
      >
        <div className="bg-white w-full max-w-[420px] rounded-3xl p-5 sm:p-6 border border-[#E2EAFD] shadow-card space-y-3.5 my-auto transition-all duration-500">
          {/* Logo & Headline */}
          <div className="text-center space-y-1">
            <div className="w-11 h-11 mx-auto flex items-center justify-center p-1 rounded-2xl bg-gradient-to-tr from-[#8EA7E9]/30 to-[#FFB4B4]/30 border border-purple-200 shadow-xs">
              <EliseCatMascot size={36} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight transition-all duration-200">
              {activeTab === "LOGIN" ? "Đăng Nhập Elise" : "Đăng Ký Tài Khoản"}
            </h2>
            <p className="text-[11px] text-slate-500">
              Học sâu phương pháp Feynman qua phản biện AI cùng các Persona
            </p>
          </div>

          {/* Toggle Tabs: [Đăng Nhập] | [Đăng Ký] */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("LOGIN");
                setLocalError(null);
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

          {/* Error notification if any */}
          {(localError || loginError) && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{localError || loginError}</span>
            </div>
          )}

          {/* =====================================================================
              TAB 1: FORM ĐĂNG NHẬP (LOGIN)
              ===================================================================== */}
          {activeTab === "LOGIN" ? (
            <div className="space-y-3 animate-fade-in">
              {/* Quick Fill Pills for Demo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center">
                  Tài Khoản Kiểm Thử Nhanh (Mật khẩu: 123123)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount("learn123")}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                      username === "learn123"
                        ? "bg-blue-50/80 border-[#7286D3] ring-1 ring-[#7286D3]/30"
                        : "bg-[#F8FAFD] hover:bg-blue-50/40 border-[#E2EAFD]"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-blue-700">
                      <GraduationCap className="w-3 h-3 text-blue-600" />
                      <span>learn123</span>
                    </div>
                    <p className="text-[9px] text-slate-500">🎓 Người học</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickAccount("admin123")}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                      username === "admin123"
                        ? "bg-purple-50/80 border-purple-500 ring-1 ring-purple-500/30"
                        : "bg-[#F8FAFD] hover:bg-purple-50/40 border-[#E2EAFD]"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-purple-700">
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                      <span>admin123</span>
                    </div>
                    <p className="text-[9px] text-slate-500">🛡️ Quản trị viên</p>
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
                      placeholder="learn123 hoặc admin123"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="123123"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
                >
                  <span>Đăng Nhập Vào Hệ Thống</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* =====================================================================
                TAB 2: FORM ĐĂNG KÝ (REGISTER) - Gọn Gàng Không Cuộn Trang
                ===================================================================== */
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
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="learner_feynman"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="feynman@elise.edu"
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Vai trò mục tiêu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole("learner")}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
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
                    onClick={() => setRegRole("admin")}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      regRole === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-400 ring-1 ring-purple-400/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Quản Trị Viên</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
              >
                <span>Tạo Tài Khoản & Bắt Đầu Học</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
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
