/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức (Đang thiết kế lại từ đầu theo yêu cầu người dùng)
 */

import React from "react";

export const TopicKnowledgeGraph: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 min-h-[600px] flex flex-col items-center justify-center">
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs max-w-lg text-center space-y-3">
        <h2 className="text-xl font-black text-slate-800">
          Bản Đồ Tri Thức
        </h2>
        <p className="text-sm text-slate-500">
          Đã xóa toàn bộ UI cũ. Sẵn sàng thiết kế lại giao diện mới từ đầu theo ý tưởng của bạn.
        </p>
      </div>
    </div>
  );
};

export default TopicKnowledgeGraph;
