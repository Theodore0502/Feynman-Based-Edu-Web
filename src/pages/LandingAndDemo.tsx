/**
 * File: src/pages/LandingAndDemo.tsx
 * Mục đích: [Trang 1] Landing Page - "Khu Vườn Tri Thức & Nghệ Thuật Nở Hoa Feynman".
 * Thiết kế mới:
 *   - Lấy cảm hứng từ giàn hoa tri thức và hiệu ứng lá rơi: Tri thức như một đóa hoa sống tự nhiên (Living Flower)
 *     đối lập với cành hoa nhựa học vẹt (Plastic Flower).
 *   - Kích thích tò mò cao độ qua các tình huống tương tác thực tế, so sánh bóc trần ảo tưởng thông thạo.
 *   - Giữ nguyên vẹn 100% Module Live Trial giảng giải cho Bé Bắp (FeynmanLiveTrialModule).
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { FeynmanLiveTrialModule } from "@/components/landing/FeynmanLiveTrialModule";
import { FallingLeavesDecor } from "@/components/landing/FallingLeavesDecor";
import {
  ArrowRight,
  Sparkles,
  Sprout,
  Flower2,
  Leaf,
  Sun,
  Droplets,
  Eye,
  Quote,
  CheckCircle2,
  HelpCircle,
  Zap,
  BookOpen,
  Compass,
} from "lucide-react";

// Dữ liệu 4 tình huống tò mò: So sánh "Hoa Nhựa (Học vẹt)" vs "Đóa Hoa Sống (Thấu suốt Feynman)"
interface CuriosityTopic {
  id: string;
  badge: string;
  title: string;
  question: string;
  plasticFlower: {
    text: string;
    reaction: string;
    verdict: string;
  };
  livingFlower: {
    text: string;
    reaction: string;
    verdict: string;
  };
}

const CURIOSITY_TOPICS: CuriosityTopic[] = [
  {
    id: "ai",
    badge: "Công Nghệ & AI",
    title: "Mạng Nơ-ron Nhân Tạo (Deep Learning)",
    question: "Bạn giải thích thế nào khi một đứa trẻ hỏi: 'Tại sao máy tính nhận diện được mặt người?'",
    plasticFlower: {
      text: "Đó là thuật toán lan truyền ngược (Backpropagation) điều chỉnh các trọng số trong ma trận nơ-ron đa tầng để giảm thiểu hàm mất mát (Loss Function) theo gradient descent.",
      reaction: "🥱 Bé Bắp ngơ ngác gãi đầu: 'Chú ơi, ma trận với gra-đi-en là đồ ăn hay đồ chơi vậy chú?'",
      verdict: "Cành Hoa Nhựa: Nhồi nhét từ chuyên môn để che đậy sự lúng túng.",
    },
    livingFlower: {
      text: "Giống như khi con chơi trò xếp hình Lego: lần đầu con lắp sai thì mẹ bảo 'chỗ này lệch nè'. Cứ mỗi lần lắp sai một miếng, con lại chỉnh lại một xíu. Máy tính cũng thử hàng triệu lần sai như vậy cho đến khi nhìn bức ảnh nào cũng nhận ra ngay!",
      reaction: "🤩 Bé Bắp mắt sáng rỡ: 'A con hiểu rồi! Giống như con tập đi xe đạp ngã mấy lần là tự giữ thăng bằng được nè!'",
      verdict: "Đóa Hoa Sống: Cắm rễ vào trực giác đời sống, tỏa hương thấu hiểu bền lâu.",
    },
  },
  {
    id: "economy",
    badge: "Kinh Tế Học",
    title: "Lạm Phát Tiền Tệ (Inflation)",
    question: "Tại sao nhà nước không in thật nhiều tiền rồi chia cho mỗi người 1 tỷ để ai cũng giàu?",
    plasticFlower: {
      text: "In tiền quá mức sẽ dẫn tới hiện tượng lạm phát phi mã, cung tiền M2 vượt quá tổng sản phẩm quốc nội GDP, gây mất cân đối cung cầu và làm suy giảm sức mua danh nghĩa.",
      reaction: "😵 Bé Bắp xua tay: 'Nghe như môn học thuộc lòng trên lớp ấy chú, con chịu hổng hiểu gì cả!'",
      verdict: "Cành Hoa Nhựa: Khái niệm vĩ mô khô cứng, xa rời thực tế.",
    },
    livingFlower: {
      text: "Hãy tưởng tượng cả lớp con có 30 bạn nhưng chỉ có đúng 10 que kem dâu. Nếu bỗng dưng cô giáo phát cho mỗi bạn 100 viên kẹo để đổi kem, que kem vẫn chỉ có 10 que. Thế là các bạn bắt đầu trả giá: từ 1 viên lên 10 viên, 50 viên mới mua được 1 que kem! Nhiều tiền hơn không làm ra nhiều kem hơn con nhé.",
      reaction: "💡 Bé Bắp reo lên: 'Dạ đúng rồi! Tiền nhiều mà kem ít thì giá que kem tự nhiên đắt lên gấp mấy lần!'",
      verdict: "Đóa Hoa Sống: Bài học kinh tế đắt giá được thu nhỏ bằng một que kem dâu.",
    },
  },
  {
    id: "physics",
    badge: "Vật Lý Vũ Trụ",
    title: "Lỗ Đen Không Gian (Black Hole)",
    question: "Lỗ đen có phải là một cái hố thủng trên trời hông chú?",
    plasticFlower: {
      text: "Lỗ đen là một vùng không-thời gian có trường hấp dẫn vô hạn đến mức vận tốc thoát vượt qua cả vận tốc ánh sáng c, hình thành nên chân trời sự kiện (Event Horizon).",
      reaction: "🤔 Bé Bắp nhăn trán: 'Trường hấp dẫn là trường học hả chú? Rồi chân trời sự kiện là ở đâu ạ?'",
      verdict: "Cành Hoa Nhựa: Ghi nhớ định nghĩa sách giáo khoa mà không có hình ảnh trực quan.",
    },
    livingFlower: {
      text: "Con hãy tưởng tượng con lấy một tấm đệm cao su thật căng, rồi đặt vào giữa một quả cầu sắt siêu siêu nặng. Tấm đệm sẽ bị lún sâu xuống thành một cái phễu khổng lồ. Mọi viên bi lăn gần đó đều bị trượt tuột xuống đáy mà không leo lên nổi. Lỗ đen chính là ngôi sao nặng như thế làm lún cả không gian xung quanh nó!",
      reaction: "🚀 Bé Bắp hào hứng: 'Uầy! Con tưởng tượng ra rồi! Trái đất giống như viên bi nhỏ lăn quanh cái phễu đó đúng hông chú?'",
      verdict: "Đóa Hoa Sống: Biến lý thuyết tương đối phức tạp thành trò lăn bi trên đệm cao su.",
    },
  },
  {
    id: "biology",
    badge: "Sinh Học & Y Khoa",
    title: "Hệ Miễn Dịch & Kháng Thể",
    question: "Thuốc vắc-xin làm gì trong người con mà bảo vệ con khỏi vi-rút?",
    plasticFlower: {
      text: "Vắc-xin đưa kháng nguyên bất hoạt vào cơ thể nhằm kích hoạt phản ứng miễn dịch thích ứng của tế bào lympho B sinh ra kháng thể đặc hiệu và tế bào nhớ miễn dịch.",
      reaction: "😖 Bé Bắp lắc đầu: 'Mấy từ 'kháng nguyên' với 'lympho' nghe sợ như tên quái vật trong game vậy chú!'",
      verdict: "Cành Hoa Nhựa: Từ ngữ hàn lâm khiến kiến thức y học trở nên đáng sợ.",
    },
    livingFlower: {
      text: "Vắc-xin giống như việc chú đưa cho đội lính gác lâu đài một bức ảnh chụp khuôn mặt tên trộm nhưng đã rút hết vũ khí của hắn. Đội lính gác nhìn ngắm bức ảnh thật kỹ để nhớ mặt. Lần sau nếu tên trộm thật dám lẻn vào, đội lính sẽ nhận diện được ngay và tóm gọn hắn trong một nốt nhạc!",
      reaction: "🛡️ Bé Bắp vỗ tay: 'Haha! Hay quá, vậy là các chú lính gác trong bụng con đã thuộc làu mặt tên vi-rút rồi!'",
      verdict: "Đóa Hoa Sống: Hệ miễn dịch sống dậy như một câu chuyện cổ tích về đội lính gác.",
    },
  },
];

export const LandingAndDemo: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ai");

  const currentTopic =
    CURIOSITY_TOPICS.find((t) => t.id === selectedTopicId) || CURIOSITY_TOPICS[0];

  return (
    <div className="relative min-h-screen bg-[#F3F6FA] text-slate-800 overflow-x-hidden selection:bg-[#B5B2E8] selection:text-slate-900 font-sans">
      {/* 1. HIỆU ỨNG CÁNH HOA VÀ LÁ RƠI THƠ MỘNG */}
      <FallingLeavesDecor />

      {/* 2. TRANH GIÀN HOA VƯỜN THƯ TỊCH CỐ ĐỊNH 2 BÊN CÁNH MÀN HÌNH */}
      {/* Cánh Trái (Left Floral Garden Archway) */}
      <div
        className="fixed top-0 bottom-0 left-0 w-48 lg:w-64 xl:w-76 2xl:w-92 pointer-events-none select-none z-0 hidden lg:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/images/auth-flower-garden.png"
          alt="Giàn Hoa Tri Thức Cánh Trái"
          className="w-full h-full object-cover object-left opacity-75 xl:opacity-90 drop-shadow-md"
        />
        {/* Lớp chuyển màu mượt mà sang nền sáng trung tâm */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F3F6FA]/25 to-[#F3F6FA]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F3F6FA]/30 via-transparent to-[#F3F6FA]/50" />
      </div>

      {/* Cánh Phải (Right Floral Garden Archway) */}
      <div
        className="fixed top-0 bottom-0 right-0 w-48 lg:w-64 xl:w-76 2xl:w-92 pointer-events-none select-none z-0 hidden lg:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/images/auth-flower-garden-right.png"
          alt="Giàn Hoa Tri Thức Cánh Phải"
          className="w-full h-full object-cover object-right opacity-75 xl:opacity-90 drop-shadow-md"
        />
        {/* Lớp chuyển màu mượt mà sang nền sáng trung tâm */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#F3F6FA]/25 to-[#F3F6FA]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F3F6FA]/30 via-transparent to-[#F3F6FA]/50" />
      </div>

      {/* 3. NỘI DUNG CHÍNH (Z-INDEX NỔI BẬT HOÀN TOÀN TRÊN NỀN) */}
      <div className="relative z-10">
        {/* Top Navbar */}
        <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
              <EliseCatMascot className="w-10 h-10 object-contain drop-shadow-xs" />
            </div>
            <div>
              <span
                className="font-black text-2xl tracking-tight text-slate-800 leading-none block"
                style={{ fontFamily: "'Nahla Script', cursive, sans-serif" }}
              >
                Elis
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase block mt-0.5">
                Khu Vườn Feynman
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#bi-mat-tri-thuc"
              className="text-xs font-semibold text-slate-600 hover:text-[#5066A1] transition-colors hidden md:inline-block px-2 py-1"
            >
              Bí Mật 2 Loại Tri Thức
            </a>
            <a
              href="#4-mua-no-hoa"
              className="text-xs font-semibold text-slate-600 hover:text-[#5066A1] transition-colors hidden md:inline-block px-2 py-1"
            >
              4 Mùa Nở Hoa
            </a>
            <Link
              to="/about"
              className="text-xs font-semibold text-slate-600 hover:text-[#5066A1] transition-colors px-2 py-1"
            >
              Về Elis
            </Link>
            <Link
              to="/auth"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2.5 py-1.5"
            >
              Đăng Nhập
            </Link>
            <a
              href="#feynman-live-trial"
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Thử Giảng Live</span>
            </a>
          </nav>
        </header>

        {/* =========================================================================
            HERO SECTION: CÂU HỎI KÍCH HOẠT TRÍ TÒ MÒ CỰC ĐỘ
            ========================================================================= */}
        <section className="max-w-4xl mx-auto px-6 pt-8 pb-14 text-center space-y-7">
          {/* Tiêu đề tò mò đầy chiều sâu */}
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.25]">
            Trí tuệ trong đầu bạn là một <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#7286D3] bg-clip-text text-transparent underline decoration-[#A7F3D0] decoration-wavy decoration-2">
              Đóa Hoa Sống
            </span>{" "}
            đang tỏa hương, <br />
            hay chỉ là một{" "}
            <span className="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">
              Cành Hoa Nhựa
            </span>{" "}
            dán nhãn từ ngữ?
          </h1>

          {/* Dẫn nhập khơi gợi thắc mắc & Trích dẫn Feynman */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#E2EAFD] shadow-2xs space-y-1.5">
              <p className="text-sm sm:text-base text-slate-800 italic font-semibold leading-relaxed">
                "Đừng nhầm lẫn giữa việc biết tên gọi của một thứ với việc thực sự thấu hiểu nó."
              </p>
              <span className="block text-xs font-black text-[#5066A1] uppercase tracking-wider">
                — Richard Feynman —
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Học vẹt thuật ngữ chỉ giúp bạn cắm một cành hoa nhựa giả tạo. Chỉ khi bạn giảng giải được cho một cậu bé 10 tuổi hiểu say mê, hạt mầm tri thức mới thực sự bám rễ sâu vào tiềm thức và trổ bông vĩnh cửu.
            </p>
          </div>

          {/* Thẻ Thống Kê Tò Mò (Curiosity Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/90 shadow-2xs space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-500 font-black text-xl sm:text-2xl">
                <span>94.2%</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug font-medium">
                Người học giật mình nhận ra mình chỉ "nhớ mặt chữ" chứ chưa hề thấu hiểu bản chất
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/90 shadow-2xs space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-black text-xl sm:text-2xl">
                <Sprout className="w-5 h-5 text-emerald-500" />
                <span>18,500+</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug font-medium">
                Hạt mầm tri thức đã nở hoa thành công qua các phép ẩn dụ đời thường gần gũi
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/90 shadow-2xs space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#5066A1] font-black text-xl sm:text-2xl">
                <Eye className="w-5 h-5 text-[#7286D3]" />
                <span>0%</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug font-medium">
                Thuật ngữ đao to búa lớn có thể "qua mặt" được sự tò mò trong trẻo của Bé Bắp
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <a
              href="#feynman-live-trial"
              className="px-7 py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-sm font-bold flex items-center gap-2.5 shadow-card hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sprout className="w-4 h-4 text-emerald-200" />
              <span>Vào Vườn Thử Thách Cùng Bé Bắp ↓</span>
            </a>

            <a
              href="#bi-mat-tri-thuc"
              className="px-6 py-3.5 rounded-2xl bg-white/90 backdrop-blur-xs hover:bg-white text-slate-700 text-sm font-bold border border-slate-200/90 shadow-xs hover:border-[#8EA7E9] transition-all flex items-center gap-2"
            >
              <span>Xem Thử Thách Bóc Trần Thuật Ngữ</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </section>

        {/* =========================================================================
            MỤC 2: BẢNG SO SÁNH TÒ MÒ: HOA NHỰA (JARGON TRAP) VS ĐÓA HOA SỐNG (FEYNMAN)
            ========================================================================= */}
        <section id="bi-mat-tri-thuc" className="max-w-5xl mx-auto px-6 py-12 space-y-8 scroll-mt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bí Mật Của Chiếc Kính Lúp Feynman</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Hãy Thử Soi Vào Một Kiến Thức Bất Kỳ...
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Bấm chọn một chủ đề bên dưới để khám phá sự khác biệt gây sốc giữa cách người học vẹt trả lời và cách bậc thầy Feynman gieo mầm tri thức:
            </p>
          </div>

          {/* Danh sách 4 Tab Chủ Đề Tò Mò */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CURIOSITY_TOPICS.map((topic) => {
              const isSelected = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-[#7286D3] text-white border-[#7286D3] shadow-md shadow-indigo-100 scale-105"
                      : "bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80"
                  }`}
                >
                  <span>{topic.badge}</span>
                  <span className="opacity-70 hidden sm:inline">• {topic.title}</span>
                </button>
              );
            })}
          </div>

          {/* Thẻ Trực Quan So Sánh 1:1 Giữa 2 Cách Giảng Giải */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#E2EAFD] p-6 sm:p-8 shadow-card space-y-6">
            {/* Câu hỏi gợi mở */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EEF2FC] to-white border border-[#D5E1FA] flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-[#7286D3] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#5066A1] block">
                  Câu hỏi ngây ngô nhưng chí mạng của Bé Bắp:
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                  "{currentTopic.question}"
                </p>
              </div>
            </div>

            {/* 2 Cột So Sánh: Hoa Nhựa vs Đóa Hoa Sống */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* CỘT A: BÔNG HOA NHỰA (CÁCH NÓI ĐẦY BIỆT NGỮ) */}
              <div className="p-5 rounded-2xl bg-[#FFF8F8] border border-rose-200/80 space-y-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
                  Cành Hoa Nhựa
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                    <span>🥀 Cách giải thích dán nhãn từ vựng (Jargon Trap)</span>
                  </span>
                  <div className="p-3.5 rounded-xl bg-white text-xs sm:text-[13px] text-slate-700 italic border border-rose-100 leading-relaxed font-mono">
                    "{currentTopic.plasticFlower.text}"
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-rose-100">
                  <div className="text-xs text-rose-800 font-medium">
                    {currentTopic.plasticFlower.reaction}
                  </div>
                  <div className="text-[11px] font-bold text-rose-600 bg-rose-100/60 px-2.5 py-1 rounded-lg">
                    ⚠️ {currentTopic.plasticFlower.verdict}
                  </div>
                </div>
              </div>

              {/* CỘT B: ĐÓA HOA SỐNG (CÁCH THẤU SUỐT FEYNMAN) */}
              <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-3 flex flex-col justify-between relative overflow-hidden shadow-2xs">
                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
                  Đóa Hoa Nở Tự Nhiên
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>🌸 Cách thấu suốt Feynman (ELI5 & Ẩn dụ)</span>
                  </span>
                  <div className="p-3.5 rounded-xl bg-white text-xs sm:text-[13px] text-slate-800 border border-emerald-100 leading-relaxed font-medium shadow-2xs">
                    "{currentTopic.livingFlower.text}"
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <div className="text-xs text-emerald-900 font-semibold">
                    {currentTopic.livingFlower.reaction}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                    ✨ {currentTopic.livingFlower.verdict}
                  </div>
                </div>
              </div>
            </div>

            {/* Lời Mời Gọi Xuống Thử Nghiệm Trực Tiếp */}
            <div className="pt-2 text-center">
              <a
                href="#feynman-live-trial"
                className="inline-flex items-center gap-2 text-xs font-black text-[#5066A1] hover:text-[#7286D3] transition-colors"
              >
                <span>Bé Bắp đang đợi bạn ở phòng thí nghiệm bên dưới. Liệu lời giảng của bạn có làm bé thấu hiểu?</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            MỤC 3: 4 MÙA NỞ HOA CỦA NGƯỜI HỌC THẤU SUỐT (FEYNMAN 4 SEASONS)
            ========================================================================= */}
        <section id="4-mua-no-hoa" className="max-w-5xl mx-auto px-6 py-12 space-y-8 scroll-mt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#5066A1] border border-[#D5E1FA] text-xs font-bold">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Quy Luật Tự Nhiên Của Sự Thấu Suốt</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              4 Mùa Nở Hoa Của Tâm Trí
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Học tập không phải là một nhà kho chứa chữ, mà là một khu vườn cần qua đủ 4 mùa chăm sóc:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MÙA 1: GIEO HẠT */}
            <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#E2EAFD] space-y-3 shadow-xs hover:shadow-card transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm border border-amber-200 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Mùa Gieo Hạt</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chọn một chủ đề bất kỳ mà bạn nghĩ mình đã hiểu. Ghi lại mọi thứ bạn biết mà không nhìn sách vở hay tra Google.
              </p>
              <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                🌱 Mục tiêu: Chấm dứt ảo tưởng thông thạo.
              </div>
            </div>

            {/* MÙA 2: NẢY MẦM */}
            <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#E2EAFD] space-y-3 shadow-xs hover:shadow-card transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-200 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Mùa Nảy Mầm</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tập giảng giải trực tiếp cho Bé Bắp 10 tuổi. Nghiêm cấm dùng từ ngữ hàn lâm; mọi khái niệm phải quy về đời sống thường nhật.
              </p>
              <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                💧 Thử thách: Thử lòng kiên nhẫn và từ ngữ giản dị.
              </div>
            </div>

            {/* MÙA 3: BẮT SÂU & TỈA CÀNH */}
            <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#E2EAFD] space-y-3 shadow-xs hover:shadow-card transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm border border-rose-200 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-rose-500" />
                <span>Mùa Bắt Sâu & Tỉa Cành</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chỗ nào bạn bị ấp úng, né tránh hoặc phải dùng thuật ngữ che lấp, AI sẽ bóc trần đó chính là lỗ hổng tri thức cần bù đắp.
              </p>
              <div className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                ✂️ Giá trị: Nhổ sạch cỏ dại của sự hiểu nửa vời.
              </div>
            </div>

            {/* MÙA 4: TRỔ BÔNG RỰC RỠ */}
            <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#E2EAFD] space-y-3 shadow-xs hover:shadow-card transition-all group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-emerald-200 group-hover:scale-110 transition-transform">
                04
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Flower2 className="w-4 h-4 text-pink-500" />
                <span>Mùa Trổ Bông Rực Rỡ</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kiến tạo một phép ẩn dụ độc bản (Lego, que kem, dòng nước...). Khi bạn neo giữ tri thức bằng hình ảnh sống động, bạn sẽ nhớ nó trọn đời.
              </p>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                🌸 Đỉnh cao: Tri thức nở hoa thành trực giác.
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            MỤC 4: LỜI MỜI BƯỚC VÀO PHÒNG THÍ NGHIỆM LIVE
            ========================================================================= */}
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-2 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
            <Compass className="w-4 h-4 text-[#7286D3]" />
            <span>Phòng Thử Nghiệm Trực Tiếp • Không Cần Đăng Nhập</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">
            Giờ Đến Lượt Bạn: Hãy Gieo Mầm Tri Thức Cho Bé Bắp
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Đọc tài liệu bên trái, rồi gõ hoặc bấm mic để thử giảng giải cho Bé Bắp 10 tuổi ở bên phải. Xem thử độ sáng rõ của bạn đạt bao nhiêu điểm!
          </p>
        </div>

        {/* =========================================================================
            LIVE 1:1 FEYNMAN INTERACTIVE PLAYGROUND (GIỮ NGUYÊN VẸN 100%)
            ========================================================================= */}
        <div id="feynman-live-trial" className="scroll-mt-6">
          <FeynmanLiveTrialModule />
        </div>

        {/* =========================================================================
            BOTANICAL FOOTER & BẢN TUYÊN NGÔN FEYNMAN
            ========================================================================= */}
        <footer className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200/80 mt-12 space-y-8">
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#B5B2E8] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 flex items-center justify-center md:justify-start gap-1.5">
                <Quote className="w-4 h-4 text-amber-300" />
                Triết Lý Richard Feynman
              </span>
              <h4 className="text-xl sm:text-2xl font-black">
                "Mỗi khái niệm bạn thấu suốt là một đóa hoa nở rộ trong khu vườn tâm trí."
              </h4>
              <p className="text-xs text-white/90 max-w-lg">
                Đừng để sự phức tạp giả tạo giam cầm tiềm năng học tập của bạn. Hãy cùng Elis bình dân hóa mọi đỉnh cao tri thức!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <Link
                to="/lectures"
                className="px-5 py-3 rounded-2xl bg-white text-[#5066A1] hover:bg-slate-50 text-xs font-black shadow-xs transition-colors"
              >
                Khám Phá 8 Miền Tri Thức
              </Link>
              <Link
                to="/auth"
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Tạo Tài Khoản Miễn Phí</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-4">
            <div className="flex items-center gap-2">
              <EliseCatMascot size={22} />
              <span className="font-extrabold text-slate-700">Elis</span>
              <span>— Nền tảng học sâu theo phương pháp Feynman & Chuẩn ELI5</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <Link to="/about" className="hover:text-slate-900 transition-colors">
                Về Elis
              </Link>
              <Link to="/lectures" className="hover:text-slate-900 transition-colors">
                Kho Bài Giảng
              </Link>
              <Link to="/vault" className="hover:text-slate-900 transition-colors">
                Kho Ẩn Dụ & Thuật Ngữ
              </Link>
              <Link to="/auth" className="hover:text-slate-900 transition-colors">
                Đăng Nhập
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingAndDemo;
