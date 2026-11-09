/**
 * File: src/pages/AboutPage.tsx
 * Mục đích: Trang Giới Thiệu (About) giải thích nguồn gốc, triết lý tên gọi ELI5 (Explain Like I'm 5),
 * phương pháp học sâu Feynman và sứ mệnh bình dân hóa tri thức.
 */

import React from "react";
import { Link } from "react-router-dom";
import { PageHeroBanner } from "@/components/shared/PageHeroBanner";
import {
  Sparkles,
  BookOpen,
  Mic,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Quote,
  Layers,
  Heart,
  Bot,
  Flame,
  ShieldCheck,
} from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 w-full pb-16">
      {/* 1. Hero Banner Tinh Giản */}
      <PageHeroBanner
        badge={
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Triết Lý Học Tập Feynman &amp; ELI5</span>
          </div>
        }
        title="Nền Tảng Giáo Dục Tương Tác Theodore"
        description="Học tập đỉnh cao không phải là cố gắng nhồi nhét những thuật ngữ đao to búa lớn, mà là năng lực diễn giải những điều phức tạp nhất bằng ngôn từ giản dị nhất cho bất kỳ ai cũng có thể thấu hiểu."
        actions={
          <div className="p-3 rounded-xl bg-white border border-[#E2EAFD] shadow-2xs flex items-center gap-2.5 text-xs text-slate-700 italic">
            <Quote className="w-4 h-4 text-[#7286D3] shrink-0" />
            <span>"Nếu bạn không thể giải thích đơn giản cho một đứa trẻ hiểu, chính bạn vẫn chưa thực sự hiểu nó." — Richard Feynman</span>
          </div>
        }
        mascotSrc="/images/theodore-mascot.png"
      />

      {/* 2. Nguồn gốc & Ý nghĩa tên gọi "ELI5" */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EEF8] shadow-subtle space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF2FC] text-[#5066A1] flex items-center justify-center font-black text-base">
            5
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Nguồn Gốc & Ý Nghĩa Tên Gọi "Elise" (Từ Thuật Ngữ ELI5)
            </h2>
            <p className="text-xs text-slate-500">
              Tên gọi lấy cảm hứng từ thuật ngữ kinh điển trên Internet "ELI5" (Explain Like I'm 5)
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Tên gọi <strong className="text-slate-800">Elise</strong> được lấy cảm hứng trực tiếp từ thuật ngữ kinh điển trên Internet:{" "}
            <span className="text-[#5066A1] font-extrabold bg-[#EEF2FC] px-2 py-0.5 rounded-md">
              "ELI5" (Explain Like I'm 5)
            </span>{" "}
            (nghĩa là: <em>"Hãy giải thích như thể tôi là một đứa trẻ lên 5 tuổi"</em>). Khái niệm này nổi tiếng toàn cầu thông qua cộng đồng học thuật Reddit <code>r/explainlikeimfive</code> với hơn 22 triệu thành viên.
          </p>

          <p>
            Trong đời sống học tập và công việc, con người thường mắc phải một chiếc bẫy tâm lý: <strong>Dùng các thuật ngữ chuyên môn phức tạp (Jargon) để che giấu sự mơ hồ của chính mình</strong>. Khi ai đó hỏi bạn: <em>"Docker Container là gì?"</em>, câu trả lời đầy rẫy từ chuyên môn như: <em>"Đó là cơ chế ảo hóa tầng OS dựa trên namespace và cgroup"</em> nghe có vẻ rất uyên bác, nhưng bản chất người nghe vẫn không hình dung được cơ chế hoạt động thực tế.
          </p>

          <p>
            Tại <strong>Elise</strong>, chúng tôi tạo ra không gian mô phỏng chân thực: Bạn sẽ đóng vai người đi dạy và giảng giải bài học cho một cậu bé 10 tuổi tò mò – <strong>Bé Bắp</strong>. Bé Bắp không hề biết các thuật ngữ kỹ thuật, chỉ biết que kem, viên bi, hộp bánh và bộ xếp hình Lego. Khi bạn có thể ví von cơ chế phức tạp thành câu chuyện đời sống mà Bé Bắp gật đầu thấu hiểu, bạn đã đạt đến đẳng cấp cao nhất của sự tinh thông!
          </p>
        </div>

        {/* 3 Callout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-1.5">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
              01
            </div>
            <h4 className="text-xs font-black text-slate-800">Không Dùng Jargon</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tạm gác lại các thuật ngữ trừu tượng, chỉ dùng ngôn từ tự nhiên và ẩn dụ sinh động.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#FDECD2] space-y-1.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
              02
            </div>
            <h4 className="text-xs font-black text-slate-800">Bắt Bẻ Socrates</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Khán giả AI sẽ liên tục hỏi xoáy tại sao để bóc tách triệt để các lỗ hổng nhận thức.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#E8F8F5] border border-[#C2EBE3] space-y-1.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
              03
            </div>
            <h4 className="text-xs font-black text-slate-800">Khắc Sâu Trí Nhớ</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Khoa học chứng minh việc chủ động giảng dạy (Active Teaching) giúp lưu giữ 90% kiến thức.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bốn Bước Cốt Lõi Của Phương Pháp Feynman */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EEF8] shadow-subtle space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Quy Trình 4 Bước Thấu Suốt (Feynman Framework)
          </h2>
          <p className="text-xs text-slate-500">
            Hành trình chuyển hóa kiến thức khô khan thành trực giác tự nhiên
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#5066A1]">BƯỚC 1</span>
              <BookOpen className="w-4 h-4 text-[#7286D3]" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Nạp Kiến Thức Chuẩn (Ground Truth)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đọc tóm tắt định nghĩa học thuật chính xác, ghi nhận danh sách các bẫy thuật ngữ (Jargon Traps) cấm nói trực tiếp và chuẩn bị dàn ý bài giảng.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#E68A00]">BƯỚC 2</span>
              <Mic className="w-4 h-4 text-[#FFA929]" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Giảng Giải Như ELI5 Cho AI</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bước lên bục giảng, sử dụng giọng nói hoặc gõ văn bản để giảng lại cho Bé Bắp 10 tuổi hoặc các nhân vật AI có lăng kính đời sống độc đáo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFEAEA] border border-[#FFD2D2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-700">BƯỚC 3</span>
              <Lightbulb className="w-4 h-4 text-rose-500" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Truy Vết Lỗ Hổng Kiến Thức</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi khi bạn ngập ngừng, lúng túng hoặc bị AI hỏi dồn mà không trả lời được bằng ví dụ đời thường, hệ thống sẽ đánh dấu chính xác lỗ hổng đó.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#E8F8F5] border border-[#C2EBE3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-700">BƯỚC 4</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">Tinh Gọn & Ẩn Dụ Hóa</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đúc kết phép so sánh tương đồng đắt giá nhất, nhận thẻ chứng nhận Feynman Mastery Card và lưu thuật ngữ vào Sổ tay để ôn tập ngắt quãng (SM-2).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Khán Giả AI Tiêu Biểu */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EEF8] shadow-subtle space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Dàn Khán Giả AI Tiêu Biểu Trong ELI5
          </h2>
          <p className="text-xs text-slate-500">
            Những góc nhìn đời sống đa dạng giúp thử thách khả năng bình dân hóa của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2 text-center">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80"
              alt="Bé Bắp"
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#F79D9D]"
            />
            <h4 className="text-sm font-extrabold text-slate-800">Bé Bắp (10 tuổi)</h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Chuẩn ELI5 Tuyệt Đối
            </span>
            <p className="text-xs text-slate-500 line-clamp-3">
              Thích truyện tranh, đồ chơi Lego. Bắt bẻ ngay khi nghe thấy bất kỳ từ đao to búa lớn nào!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2 text-center">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
              alt="Chị Mai"
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#8EA7E9]"
            />
            <h4 className="text-sm font-extrabold text-slate-800">Chị Mai (29 tuổi)</h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Người Học Trái Ngành
            </span>
            <p className="text-xs text-slate-500 line-clamp-3">
              Chuyên viên nhân sự thông minh nhưng mù tịt kỹ thuật, chỉ hiểu qua ví dụ công sở và đời sống.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2 text-center">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
              alt="Bác Năm"
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#76D7C4]"
            />
            <h4 className="text-sm font-extrabold text-slate-800">Bác Năm (58 tuổi)</h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Thực Nghiệm Dân Dã
            </span>
            <p className="text-xs text-slate-500 line-clamp-3">
              Nông dân miền Tây mộc mạc, chỉ tiếp thu nếu bạn ví von với cây lúa, sông nước, chăm gà.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2 text-center">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
              alt="Shark Tuấn"
              className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#F8C471]"
            />
            <h4 className="text-sm font-extrabold text-slate-800">Shark Tuấn (42 tuổi)</h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Phản Biện Sắc Bén
            </span>
            <p className="text-xs text-slate-500 line-clamp-3">
              Nhà đầu tư thực tế, ghét nghe thuật ngữ tung hỏa mù, vặn vẹo thẳng vào lỗ hổng logic.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Call To Action Footer */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#B5B2E8] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-card">
        <div className="space-y-1 max-w-lg">
          <h3 className="text-xl sm:text-2xl font-black">
            Bạn Đã Sẵn Sàng Thử Thách Cùng Elise?
          </h3>
          <p className="text-xs sm:text-sm text-white/90">
            Chọn ngay một bài giảng trong kho tri thức và bắt đầu giảng giải cho Bé Bắp 10 tuổi!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/lectures"
            className="px-5 py-3 rounded-2xl bg-white text-[#5066A1] text-xs font-black shadow-xs hover:bg-slate-50 transition-colors"
          >
            Kho Bài Giảng 3 Tầng
          </Link>
          <Link
            to="/stage"
            className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-xs hover:bg-black transition-colors flex items-center gap-1.5"
          >
            <span>Lên Bục Giảng Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

