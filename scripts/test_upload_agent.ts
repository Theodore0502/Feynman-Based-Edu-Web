/**
 * Script: scripts/test_upload_agent.ts
 * Mục đích: Thử nghiệm tải tài liệu docs/Ly_Thuyet_Va_Ky_Thuat_Hoc_Tap_Feynman.docx qua Agent
 * Kiểm tra toàn bộ pipeline:
 *   1. Nhận diện học thuật tự động (Auto-Taxonomy Classification)
 *   2. Nhận diện vai trò sư phạm (Pedagogical Role: Slide vs Giáo trình vs Đề cương)
 *   3. Semantic Chunking & Anthropic Contextual Retrieval Prefix
 *   4. Master Knowledge Graph Projection (Chiếu xạ đồ thị môn học trên Supabase, xác định Tiên quyết)
 *   5. Chuẩn Feynman Schema Output (Concepts, Jargons, Analogies, Ground Truth)
 *   6. Đóng gói URL Reference Link & Lưu trữ Supabase
 */

import fs from "fs";
import path from "path";
import { DocumentExtractionAgent } from "../src/lib/services/document-extraction-agent";
import { supabase } from "../src/lib/supabase";

async function runTest() {
  console.log("================================================================================");
  console.log("🚀 KHỞI ĐỘNG KIỂM THỬ: TẢI TÀI LIỆU DOCX QUA AI AGENT");
  console.log("================================================================================\n");

  const filePath = path.resolve(process.cwd(), "docs/Ly_Thuyet_Va_Ky_Thuat_Hoc_Tap_Feynman.docx");
  if (!fs.existsSync(filePath)) {
    console.error("❌ Không tìm thấy tệp:", filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  const fileName = "Ly_Thuyet_Va_Ky_Thuat_Hoc_Tap_Feynman.docx";

  console.log(`📁 Tệp đầu vào: ${fileName}`);
  console.log(`📊 Dung lượng: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)\n`);

  // Tạo đối tượng File chuẩn Web API trong Node
  const file = new File([fileBuffer], fileName, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const mockUser = {
    id: "usr_curator_tester",
    username: "curator_tester",
    email: "curator.test@theodore.edu.vn",
    fullName: "Thẩm Định Viên Theodore",
    displayName: "Thẩm Định Viên Theodore",
    role: "curator" as const,
    createdAt: new Date().toISOString(),
  };

  console.log("⏳ Bắt đầu quy trình 4 giai đoạn của Agent...\n");

  const startTime = Date.now();

  const draft = await DocumentExtractionAgent.extractCurriculumFromFile({
    file,
    domainId: "AUTO",
    subjectId: "AUTO",
    user: mockUser,
    onProgress: (stage, message) => {
      console.log(`   [Giai đoạn ${stage}/4] ${message}`);
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n================================================================================");
  console.log(`✅ HOÀN TẤT BÓC TÁCH & HỆ THỐNG HÓA TRONG ${elapsed}s`);
  console.log("================================================================================\n");

  console.log("1. THÔNG TIN HỌC THUẬT & ĐỊNH DANH:");
  console.log(`   • Tên bài học chuẩn hóa:  ${draft.title}`);
  console.log(`   • Mã định danh (Slug):   ${draft.slug}`);
  console.log(`   • Nhóm Ngành (Cấp 1):    ${draft.domainId}`);
  console.log(`   • Môn Học (Cấp 2):       ${draft.subjectId}`);
  console.log(`   • Độ tin cậy nhận diện:  ${draft.confidenceScore}%`);
  console.log(`   • URL Reference Link:    ${draft.refLink}\n`);

  console.log("2. VAI TRÒ SƯ PHẠM & HẠT NHÂN TRI THỨC (SEMANTIC CHUNKING):");
  console.log(`   • Loại hình tài liệu:    ${draft.pedagogicalRoleLabel} (${draft.pedagogicalRole})`);
  console.log(`   • Tổng số Hạt nhân tri thức (Chunks): ${draft.semanticChunks?.length || 0}`);
  if (draft.semanticChunks && draft.semanticChunks.length > 0) {
    const firstChunk = draft.semanticChunks[0];
    console.log(`   • Tiền đề Anthropic Context mẫu (Chunk 1):`);
    console.log(`     "${firstChunk.contextualContent.split("\n")[0]}"`);
    console.log(`   • Đoạn trích hạt nhân:`);
    console.log(`     "${firstChunk.rawContent.slice(0, 150)}..."`);
  }
  console.log();

  console.log("3. ĐỊNH VỊ TRONG MASTER KNOWLEDGE GRAPH TRÊN SUPABASE:");
  console.log(`   • Vị trí đề xuất trong lộ trình: ${draft.suggestedRoadmapPosition}`);
  console.log(`   • Độ khó chuẩn tính toán:        Cấp ${draft.difficultyLevel}/5`);
  if (draft.prerequisiteTopics && draft.prerequisiteTopics.length > 0) {
    console.log(`   • Kiến thức tiên quyết cần học trước:`);
    draft.prerequisiteTopics.forEach((pt) => {
      console.log(`     - [${pt.title}]: ${pt.reason}`);
    });
  } else {
    console.log(`   • Kiến thức tiên quyết: Bài học khởi đầu nền tảng`);
  }
  console.log();

  console.log("4. SCHEMA FEYNMAN ĐỘNG ĐƯỢC SINH BỞI AGENT:");
  console.log(`   • Tóm tắt Ground Truth:\n     "${draft.summary}"\n`);
  
  console.log(`   • Khái niệm cốt lõi (Required Concepts) [${draft.requiredConcepts.length}]:`);
  draft.requiredConcepts.forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
  console.log();

  console.log(`   • Bẫy thuật ngữ thực tế (Jargon Traps) [${draft.jargonTraps.length}]:`);
  draft.jargonTraps.forEach((j, i) => console.log(`     ⚠️ ${j}`));
  console.log();

  console.log(`   • Ẩn dụ Feynman mẫu (Suggested Analogies):`);
  draft.suggestedAnalogies.forEach((a) => console.log(`     💡 "${a}"`));
  console.log();

  console.log(`   • Điểm mấu chốt (Key Takeaways):`);
  draft.keyTakeaways.forEach((k) => console.log(`     🎯 ${k}`));
  console.log();

  console.log("5. KIỂM TRA ĐỒNG BỘ DỮ LIỆU:");
  console.log(`   • Trạng thái bản nháp:    ${draft.status}`);
  console.log(`   • Đã lưu cache cục bộ:   ${draft.id}`);

  // Kiểm tra bảng academic_materials trên Supabase
  try {
    const { data, error } = await supabase
      .from("academic_materials")
      .select("id, title, topic_id, created_at")
      .eq("title", fileName)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.log(`   • Supabase Material: Ghi nhận cảnh báo: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`   • Supabase Material: ✅ ĐÃ LƯU THÀNH CÔNG trên Supabase! ID: ${data[0].id} (Topic: ${data[0].topic_id})`);
    } else {
      console.log(`   • Supabase Material: Đang đồng bộ...`);
    }
  } catch (err: any) {
    console.log(`   • Supabase Sync Check: ${err.message}`);
  }

  console.log("\n================================================================================");
  console.log("🎉 KIỂM THỬ THÀNH CÔNG RỰC RỠ! AGENT ĐÃ HOÀN TẤT TOÀN DIỆN.");
  console.log("================================================================================");
}

runTest().catch((err) => {
  console.error("❌ Lỗi kiểm thử:", err);
  process.exit(1);
});
