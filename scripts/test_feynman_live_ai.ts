/**
 * Script: scripts/test_feynman_live_ai.ts
 * Purpose: Kiểm thử toàn diện Tác nhân Gemini AI trên Giảng Đài Feynman (Live Stage)
 * Kiểm tra:
 *   1. Phân tích lượt giảng giải thời gian thực (Realtime Jargon & Clarity Score)
 *   2. Đối thoại Socratic phản biện thật theo tính cách Persona (Bé Bo 10 tuổi)
 *   3. Chấm điểm kết thúc buổi học và xuất thẻ Feynman Mastery Card
 *   4. Lưu dữ liệu trực tiếp vào Supabase (sessions, messages, evaluation_reports)
 */

import { GeminiCurriculumService } from "../src/lib/services/gemini-service";
import { DEFAULT_PERSONAS } from "../src/config/personas.config";
import { SupabaseService } from "../src/lib/services/supabase-service";

async function testFeynmanLiveAI() {
  console.log("================================================================================");
  console.log("🚀 KIỂM THỬ TÁC NHÂN AI TRÊN GIẢNG ĐÀI FEYNMAN (FEYNMAN LIVE STAGE)");
  console.log("================================================================================\n");

  const topic = "Phương Pháp Học Tập & Kỹ Thuật Feynman";
  const persona = DEFAULT_PERSONAS[0]; // Bé Bo (10 tuổi)

  console.log(`📚 Chủ đề: "${topic}"`);
  console.log(`👤 Persona người nghe: ${persona.name} (${persona.title})\n`);

  // 1. Tạo session trên Supabase
  console.log("1. Tạo phiên học Feynman trên Supabase...");
  const session = await SupabaseService.createSession(topic, persona.id, "MEDIUM");
  console.log(`   ✅ Đã tạo Session thành công: ID = ${session.id}\n`);

  // 2. Lượt giảng 1 của người học
  const userTurn1 = "Chào Bo, phương pháp Feynman giống như việc con xếp hình Lego: thay vì học vẹt những từ đao to búa lớn, con hãy thử giải thích bài học cho một người bạn bằng những món đồ chơi quen thuộc nhất.";
  console.log("2. Người học giảng giải Lượt 1:");
  console.log(`   "${userTurn1}"\n`);

  console.log("⏳ Tác nhân Gemini đang phân tích độ sáng rõ (Clarity) & Biệt ngữ...");
  const analysis1 = await GeminiCurriculumService.analyzeTurnRealtime(topic, userTurn1);
  console.log(`   • Điểm Clarity: ${analysis1.currentClarityScore}/100`);
  console.log(`   • Ẩn dụ phát hiện: "${analysis1.detectedAnalogy || 'Không có'}"`);
  console.log(`   • Biệt ngữ phát hiện: ${analysis1.jargonDetected.length > 0 ? analysis1.jargonDetected.map(j => j.term).join(", ") : "Không có (Rất bình dân)"}`);

  await SupabaseService.addMessage(session.id, "user", userTurn1, analysis1);

  console.log("\n⏳ Persona Bé Bo đang phản hồi Socratic...");
  const assistantReply1 = await GeminiCurriculumService.generatePersonaChatResponse({
    topic,
    persona,
    chatHistory: [{ role: "user", content: userTurn1 }],
    userMessage: userTurn1,
  });
  console.log(`   💬 ${persona.name}: "${assistantReply1}"\n`);
  await SupabaseService.addMessage(session.id, "assistant", assistantReply1);

  // 3. Kết thúc buổi học và Chấm điểm Mastery
  console.log("3. Kết thúc buổi học & Chấm điểm Feynman Mastery Card bằng Gemini AI...");
  const evaluation = await GeminiCurriculumService.generateSessionMasteryEvaluation({
    topic,
    persona,
    chatHistory: [
      { role: "user", content: userTurn1 },
      { role: "assistant", content: assistantReply1 },
    ],
  });

  console.log(`   • Điểm Sáng Rõ (Clarity Score): ${evaluation.clarityScore}/100`);
  console.log(`   • Điểm Logic (Logic Completeness): ${evaluation.logicCompleteness}/100`);
  console.log(`   • Ẩn dụ xuất sắc nhất: "${evaluation.bestAnalogy}"`);
  console.log(`   • Lỗ hổng cần lưu ý: ${evaluation.knowledgeGaps.join("; ")}`);
  console.log(`   • Nhận xét sư phạm:\n     "${evaluation.summaryFeedback}"\n`);

  console.log("4. Lưu trữ báo cáo đánh giá vào Supabase...");
  await SupabaseService.saveEvaluationReport(
    session.id,
    evaluation.clarityScore,
    evaluation.logicCompleteness,
    evaluation.bestAnalogy,
    evaluation.knowledgeGaps,
    evaluation.summaryFeedback
  );
  console.log("   ✅ Đã lưu thành công evaluation_reports vào Supabase!");

  console.log("\n================================================================================");
  console.log("🎉 KIỂM THỬ GIẢNG ĐÀI FEYNMAN LIVE VỚI AI THỰC TẾ THÀNH CÔNG VƯỢT TRỘI!");
  console.log("================================================================================");
}

testFeynmanLiveAI().catch((err) => {
  console.error("❌ Lỗi kiểm thử:", err);
  process.exit(1);
});

