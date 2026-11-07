/**
 * File: src/pages/AnalogyJargonVault.tsx
 * Mục đích: [Trang 9] Kho Ẩn Dụ & Thuật Ngữ (Analogy & Jargon Vault) tích hợp thuật toán Lặp Lại Ngắt Quãng SM-2 (SuperMemo-2 Spaced Repetition) thuần toán học.
 * Thành phần chính:
 *   - AnalogyJargonVault: Quản lý danh mục thuật ngữ đã bình dân hóa, lọc theo hạn ôn tập (Due Today, Mastered).
 *   - QuickDrillFlashcard: Modal lật thẻ tương tác 3D chấm điểm và tự động dời lịch ôn tập tiếp theo.
 *   - AddCardModal: Thêm thuật ngữ và lời giải thích thủ công không cần AI.
 * Props/Inputs: Không có.
 */

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { SupabaseService } from "@/lib/services/supabase-service";
import type { VaultRecord } from "@/types/session.types";
import { QuickDrillFlashcard } from "@/components/vault/QuickDrillFlashcard";
import {
  isCardDue,
  formatNextReviewLabel,
  type SM2EvaluationResult,
} from "@/lib/algorithms/sm2";
import {
  Search,
  Copy,
  Check,
  Quote,
  Database,
  Zap,
  Calendar,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";

// Dữ liệu ban đầu mặc định kèm thông số SM-2
const INITIAL_VAULT_CARDS: VaultRecord[] = [
  {
    id: "v-1",
    term: "Container (Docker)",
    plainExplanation:
      "Một chiếc hộp chứa đầy đủ ứng dụng và mọi đồ đạc cần thiết để chạy ở bất kỳ máy tính nào mà không bị lỗi thiếu file.",
    analogyUsed: "Căn hộ chung cư xây sẵn đầy đủ tiện nghi, chỉ việc xách vali vào ở.",
    topic: "Cơ chế Docker",
    createdAt: new Date().toISOString(),
    masteryLevel: 3,
    repetitions: 2,
    intervalDays: 6,
    easeFactor: 2.5,
    nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(), // Đã đến hạn ôn hôm nay!
  },
  {
    id: "v-2",
    term: "Lạm phát (Inflation)",
    plainExplanation:
      "Hiện tượng đồng tiền bị giảm sức mua, khiến cùng một số tiền nhưng mua được ít hàng hóa hơn trước.",
    analogyUsed: "Cuộc đấu giá chỉ có 5 ổ bánh mì nhưng ai tham gia cũng được phát thêm gấp đôi tiền xu.",
    topic: "Kinh tế học",
    createdAt: new Date().toISOString(),
    masteryLevel: 4,
    repetitions: 3,
    intervalDays: 14,
    easeFactor: 2.6,
    nextReviewAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), // Sau 3 ngày
  },
  {
    id: "v-3",
    term: "Deadlock (Kẹt chết)",
    plainExplanation:
      "Trạng thái hai chương trình cùng giữ tài nguyên đối phương cần và không bên nào chịu nhả ra trước, làm máy tính bị đơ.",
    analogyUsed: "Hai chiếc xe hơi đối đầu nhau trên cây cầu hẹp độc đạo và không bên nào chịu lùi.",
    topic: "Hệ điều hành",
    createdAt: new Date().toISOString(),
    masteryLevel: 1,
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.4,
    nextReviewAt: new Date(Date.now() - 7200 * 1000).toISOString(), // Đã đến hạn ôn!
  },
  {
    id: "v-4",
    term: "Context Switch",
    plainExplanation:
      "Quá trình vi xử lý lưu lại tiến độ công việc đang làm dở để quay sang phục vụ công việc khẩn cấp khác.",
    analogyUsed: "Đang nấu canh thì chuông cửa reo, phải vặn nhỏ bếp chạy ra mở cửa rồi quay lại nấu tiếp.",
    topic: "Hệ điều hành",
    createdAt: new Date().toISOString(),
    masteryLevel: 2,
    repetitions: 1,
    intervalDays: 3,
    easeFactor: 2.5,
    nextReviewAt: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), // Ngày mai
  },
  {
    id: "v-5",
    term: "Gradient Descent",
    plainExplanation:
      "Thuật toán lặp từng bước nhỏ ngược chiều độ dốc của hàm sai số để tìm điểm đáy cực tiểu thấp nhất.",
    analogyUsed: "Người leo núi bịt mắt dò gậy tìm hướng dốc xuống để đi về thung lũng an toàn.",
    topic: "Toán Cao Cấp",
    createdAt: new Date().toISOString(),
    masteryLevel: 3,
    repetitions: 2,
    intervalDays: 6,
    easeFactor: 2.5,
    nextReviewAt: new Date(Date.now() - 1000).toISOString(), // Cần ôn hôm nay!
  },
  {
    id: "v-6",
    term: "Tích chập (Convolution Kernel)",
    plainExplanation:
      "Thao tác trượt ma trận nhỏ trên ảnh để nhân cộng các điểm ảnh xung quanh, giúp máy tính nhận ra góc cạnh và đường viền.",
    analogyUsed: "Chiếc kính râm có kính lọc đặc biệt chỉ làm sáng rực lên sợi râu và đôi tai của con mèo.",
    topic: "Thị Giác Máy Tính",
    createdAt: new Date().toISOString(),
    masteryLevel: 4,
    repetitions: 3,
    intervalDays: 12,
    easeFactor: 2.6,
    nextReviewAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "v-7",
    term: "Đồ thị & Dijkstra",
    plainExplanation:
      "Mô hình mạng lưới gồm các điểm giao lộ và đoạn đường. Thuật toán luôn chọn rẽ vào ngõ có khoảng cách ngắn nhất trước mặt.",
    analogyUsed: "Đợt sóng nước loang tròn từ tâm hồ: điểm nào gần nhất sẽ đón nhận nước trước tiên.",
    topic: "Toán Rời Rạc",
    createdAt: new Date().toISOString(),
    masteryLevel: 2,
    repetitions: 1,
    intervalDays: 2,
    easeFactor: 2.4,
    nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "v-8",
    term: "Con trỏ (Pointer trong C/C++)",
    plainExplanation:
      "Biến không chứa giá trị thực mà chỉ chứa địa chỉ chỉ đường đến đúng ô nhớ nơi dữ liệu đang được cất giữ.",
    analogyUsed: "Mảnh giấy ghi số phòng 304: bạn cầm giấy để đến mở đúng phòng chứ mảnh giấy không phải căn phòng.",
    topic: "KHMT & Hệ Thống",
    createdAt: new Date().toISOString(),
    masteryLevel: 5,
    repetitions: 4,
    intervalDays: 21,
    easeFactor: 2.7,
    nextReviewAt: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
  },
];

export const AnalogyJargonVault: React.FC = () => {
  const [items, setItems] = useState<VaultRecord[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "due" | "mastered">("all");

  // Modal State
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [drillCards, setDrillCards] = useState<VaultRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State cho Add Card
  const [newTerm, setNewTerm] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newAnalogy, setNewAnalogy] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Nạp dữ liệu từ LocalStorage hoặc Supabase
  useEffect(() => {
    const saved = localStorage.getItem("feynman_sm2_vault");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed to parse saved vault cards:", e);
      }
    }

    // Nếu chưa có local, nạp default
    setItems(INITIAL_VAULT_CARDS);
    localStorage.setItem("feynman_sm2_vault", JSON.stringify(INITIAL_VAULT_CARDS));
  }, []);

  // Lưu lại vào LocalStorage khi items thay đổi
  const saveItems = (updated: VaultRecord[]) => {
    setItems(updated);
    localStorage.setItem("feynman_sm2_vault", JSON.stringify(updated));
  };

  // Tính số thẻ đến hạn hôm nay
  const dueCards = items.filter((item) => isCardDue(item.nextReviewAt));
  const masteredCards = items.filter((item) => (item.masteryLevel || 1) >= 4);

  // Bộ lọc danh sách hiển thị
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.plainExplanation.toLowerCase().includes(search.toLowerCase()) ||
      item.topic.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "due") return isCardDue(item.nextReviewAt);
    if (filterTab === "mastered") return (item.masteryLevel || 1) >= 4;
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép ẩn dụ vào bộ nhớ tạm!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Bắt đầu Quick Drill cho toàn bộ các thẻ đến hạn (hoặc tất cả nếu không có thẻ nào đến hạn)
  const handleStartDrill = (customCards?: VaultRecord[]) => {
    const toDrill = customCards || (dueCards.length > 0 ? dueCards : items);
    setDrillCards(toDrill);
    setIsDrillOpen(true);
  };

  // Callback khi một thẻ được đánh giá điểm SM-2
  const handleCardGraded = (cardId: string, result: SM2EvaluationResult) => {
    const updated = items.map((card) => {
      if (card.id === cardId) {
        return {
          ...card,
          masteryLevel: result.masteryLevel,
          repetitions: result.repetitions,
          intervalDays: result.intervalDays,
          easeFactor: result.easeFactor,
          nextReviewAt: result.nextReviewAt,
          lastReviewedAt: new Date().toISOString(),
        };
      }
      return card;
    });

    saveItems(updated);

    // Đồng bộ với Supabase
    SupabaseService.updateVaultCardSM2(cardId, result);

    toast.success("Tiến độ ôn tập đã được lưu!", {
      description: `Lịch ôn tập tiếp theo: ${result.intervalDays} ngày tới.`,
    });
  };

  // Thêm thẻ thủ công
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newExplanation.trim()) return;

    const newCard: VaultRecord = {
      id: `v-${Date.now()}`,
      term: newTerm.trim(),
      plainExplanation: newExplanation.trim(),
      analogyUsed: newAnalogy.trim() || null,
      topic: newTopic.trim() || "Chủ đề chung",
      createdAt: new Date().toISOString(),
      masteryLevel: 1,
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewAt: new Date().toISOString(), // Cần ôn ngay
    };

    const updated = [newCard, ...items];
    saveItems(updated);

    // Reset Form
    setNewTerm("");
    setNewExplanation("");
    setNewAnalogy("");
    setNewTopic("");
    setIsAddModalOpen(false);

    // Lưu vào Supabase
    SupabaseService.addVaultItem(newCard.term, newCard.plainExplanation, newCard.analogyUsed || undefined, newCard.topic);

    // Thông báo Toast tức thời (Tầng 1)
    toast.success("Đã lưu thuật ngữ vào Sổ tay!", {
      description: `"${newCard.term}" đã được đưa vào lịch ôn tập SM-2.`,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header & Quick Drill Action Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#8EA7E9]/20 via-[#B5B2E8]/20 to-[#FFD1D1]/30 border border-[#E8EEF8] rounded-3xl p-4 sm:p-6 shadow-xs">
        {/* Dreamy Hero Background Image (mờ nhẹ) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src="/images/hero-banner-bg.png"
            alt="Hero background"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* Lớp blur trắng ở dưới các chữ để nhìn rõ chữ */}
          <div className="space-y-2 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#7286D3] text-xs font-bold shadow-2xs border border-[#8EA7E9]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thuật Toán Lặp Lại Ngắt Quãng SM-2 (Spaced Repetition)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Sổ Tay Thuật Ngữ & Ẩn Dụ Feynman
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tổng hợp những thuật ngữ chuyên môn bạn đã giảng giải thành công. Thuật toán **SM-2** sẽ tự động dời lịch ôn tập theo đường cong quên lãng để bạn ghi nhớ vĩnh viễn và phản xạ tự nhiên khi giảng bài.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 p-3 sm:p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
            <button
              onClick={() => handleStartDrill()}
              className="px-5 py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5E72C4] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Ôn Tập Nhanh Flashcard</span>
              {dueCards.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-[#7286D3] text-[11px] font-black animate-pulse">
                  {dueCards.length} cần ôn
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-[#E8EEF8] text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#7286D3]" />
              <span>Thêm Thuật Ngữ Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EEF8] pb-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === "all"
                ? "bg-[#7286D3] text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            Tất cả ({items.length})
          </button>

          <button
            onClick={() => setFilterTab("due")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === "due"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <span>Đến hạn ôn tập</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                filterTab === "due" ? "bg-white text-rose-600" : "bg-rose-100 text-rose-700"
              }`}
            >
              {dueCards.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("mastered")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === "mastered"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <span>Đã nắm vững</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                filterTab === "mastered" ? "bg-white text-emerald-600" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {masteredCards.length}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm từ vựng, phép ẩn dụ..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2EAFD] rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
          />
        </div>
      </div>

      {/* 3. Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EEF8] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">Không tìm thấy thẻ nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Thêm thẻ mới" để lưu trữ các thuật ngữ riêng của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const reviewStatus = formatNextReviewLabel(item.nextReviewAt);
            const stars = item.masteryLevel || 1;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-xs space-y-4 hover:border-[#8EA7E9] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Topic, Mastery Stars, Due Tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#EEF2FC] text-[#5066A1]">
                          {item.topic}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${reviewStatus.colorClass}`}>
                          {reviewStatus.text}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800">{item.term}</h4>
                    </div>

                    {/* Mastery Level Stars */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-0.5 text-amber-400 text-xs" title={`Cấp độ tinh thông: ${stars}/5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < stars ? "opacity-100" : "opacity-20 text-slate-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">Cấp {stars}</span>
                    </div>
                  </div>

                  {/* Plain Explanation */}
                  <div className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFD] p-3.5 rounded-2xl border border-[#E8EEF8]">
                    <span className="font-bold text-slate-800 block mb-1 text-[11px] uppercase tracking-wider text-[#7286D3]">
                      Lời giải thích bình dân:
                    </span>
                    <p>{item.plainExplanation}</p>
                  </div>

                  {/* Analogy Used */}
                  {item.analogyUsed && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-800 text-[11px]">
                        <Quote className="w-3 h-3 text-amber-600" />
                        <span>Phép ẩn dụ trực quan:</span>
                      </div>
                      <p className="text-slate-700 italic">"{item.analogyUsed}"</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#E8EEF8] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Lặp lại: {item.repetitions || 0} lần</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.plainExplanation, item.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#7286D3] text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title="Sao chép lời giải thích"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleStartDrill([item])}
                      className="px-3 py-1.5 rounded-xl bg-[#EEF2FC] hover:bg-[#D5E1FA] text-[#5066A1] text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Ôn thẻ này</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Quick Drill Flashcard Modal */}
      <QuickDrillFlashcard
        cards={drillCards}
        isOpen={isDrillOpen}
        onClose={() => setIsDrillOpen(false)}
        onCardGraded={handleCardGraded}
      />

      {/* 5. Add New Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E8EEF8] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EEF8]">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7286D3]" />
                Thêm Thẻ Thuật Ngữ Mới Vào Kho
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thuật ngữ chuyên ngành *
                </label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Ví dụ: Race Condition, Lạm phát, Cgroup..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chủ đề / Ngành
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ví dụ: Hệ điều hành, Kinh tế, Y khoa..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lời giải thích bình dân của bạn *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Giải thích thật dễ hiểu như nói cho một đứa trẻ 10 tuổi..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[#E8EEF8] bg-slate-50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phép ẩn dụ đời thường (nếu có)
                </label>
                <input
                  type="text"
                  value={newAnalogy}
                  onChange={(e) => setNewAnalogy(e.target.value)}
                  placeholder="Ví dụ: Giống như hai chiếc xe đi ngược chiều trên cầu hẹp..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EEF8] text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7286D3] text-white text-xs font-bold hover:bg-[#5E72C4] shadow-xs"
                >
                  Lưu vào Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalogyJargonVault;
