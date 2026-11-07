/**
 * File: scripts/seed-supabase-curriculum.cjs
 * Purpose: Direct API seed script to Supabase using @supabase/supabase-js.
 * Reads environment variables from .env or process.env.
 * Usage: node scripts/seed-supabase-curriculum.cjs
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 1. Đọc cấu hình từ file .env
const envPath = path.resolve(__dirname, "../.env");
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        env[k] = v;
      }
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://gvhxqjoggnoyijtguvxb.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

console.log("==============================================================================");
console.log("THEODORE CURRICULUM SEED SCRIPT (8 NHÓM NGÀNH & HỆ THỐNG MÔN HỌC)");
console.log("==============================================================================");
console.log("URL Supabase Target:", supabaseUrl);

if (!supabaseKey || supabaseKey.includes("placeholder")) {
  console.log("");
  console.log("⚠️  LƯU Ý: Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY hoặc VITE_SUPABASE_ANON_KEY trong .env.");
  console.log("Để đẩy trực tiếp vào cơ sở dữ liệu Supabase trên mây, bạn có 2 cách:");
  console.log("");
  console.log("Cách 1 (Khuyên dùng - Nhanh & Chuẩn DDL):");
  console.log("  Mở Supabase Studio -> SQL Editor -> Mở file sau và bấm Run:");
  console.log("  📂 supabase/migrations/20261108_seed_8_domains_curriculum.sql");
  console.log("");
  console.log("Cách 2 (Qua Node API):");
  console.log("  Thêm SUPABASE_SERVICE_ROLE_KEY=<khóa_bí_mật> vào file .env rồi chạy lại lệnh:");
  console.log("  node scripts/seed-supabase-curriculum.cjs");
  console.log("");
  console.log("✨ Lưu ý: Giao diện web Frontend (/lectures) đã tích hợp sẵn cơ chế fallback");
  console.log("   chuẩn 100% dữ liệu từ src/data/three-tier-curriculum.data.ts nên đã hoạt động ngay lập tức!");
  console.log("==============================================================================");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runSeed() {
  const seedDataPath = path.resolve(__dirname, "../supabase/seed_data.json");
  if (!fs.existsSync(seedDataPath)) {
    console.error("❌ Không tìm thấy file supabase/seed_data.json! Hãy chạy `python scripts/generate_curriculum_seed.py` trước.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(seedDataPath, "utf8");
  const data = JSON.parse(rawData);

  console.log(`Đang chuẩn bị chèn:`);
  console.log(`- ${data.domains.length} Ngành học`);
  console.log(`- ${data.subjects.length} Môn học`);
  console.log(`- ${data.domain_subjects.length} Liên kết Môn - Ngành`);
  console.log(`- ${data.topics.length} Bài học chi tiết`);
  console.log("------------------------------------------------------------------------------");

  try {
    // 1. Chèn academic_domains
    console.log("⏳ [1/4] Đang cập nhật 8 Nhóm Ngành học (academic_domains)...");
    const domainRows = data.domains.map(d => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description,
      icon_name: d.iconName,
      color: d.color,
      color_hex: d.colorHex,
      accent_bg: d.accentBg,
      order_index: d.orderIndex
    }));
    const { error: domErr } = await supabase.from("academic_domains").upsert(domainRows, { onConflict: "id" });
    if (domErr) throw domErr;
    console.log("✅ [1/4] Hoàn tất 8 Nhóm Ngành học!");

    // 2. Chèn academic_subjects
    console.log("⏳ [2/4] Đang cập nhật Danh sách Môn học (academic_subjects)...");
    const subjectRows = data.subjects.map(s => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      difficulty_level: s.difficultyLevel,
      order_index: s.orderIndex
    }));
    const { error: subErr } = await supabase.from("academic_subjects").upsert(subjectRows, { onConflict: "id" });
    if (subErr) throw subErr;
    console.log("✅ [2/4] Hoàn tất Danh sách Môn học!");

    // 3. Chèn domain_subjects
    console.log("⏳ [3/4] Đang cập nhật Liên kết Môn - Ngành (domain_subjects)...");
    const domainSubjectRows = data.domain_subjects.map(ds => ({
      domain_id: ds.domain_id,
      subject_id: ds.subject_id,
      is_core: ds.is_core,
      order_index: ds.order_index
    }));
    const { error: dsErr } = await supabase.from("domain_subjects").upsert(domainSubjectRows, { onConflict: "domain_id,subject_id" });
    if (dsErr) throw dsErr;
    console.log("✅ [3/4] Hoàn tất Liên kết Môn - Ngành!");

    // 4. Chèn academic_topics theo batch
    console.log(`⏳ [4/4] Đang chèn ${data.topics.length} Bài học (academic_topics) theo từng đợt...`);
    const topicRows = data.topics.map(t => ({
      id: t.id,
      subject_id: t.subjectId,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      difficulty_level: t.difficultyLevel,
      order_index: t.orderIndex,
      estimated_reading_minutes: t.estimatedReadingMinutes,
      required_concepts: t.requiredConcepts,
      status: t.status,
      highest_clarity_score: t.highestClarityScore,
      active_session_id: t.activeSessionId
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < topicRows.length; i += BATCH_SIZE) {
      const batch = topicRows.slice(i, i + BATCH_SIZE);
      const { error: topErr } = await supabase.from("academic_topics").upsert(batch, { onConflict: "id" });
      if (topErr) throw topErr;
      process.stdout.write(`  -> Đã chèn ${Math.min(i + BATCH_SIZE, topicRows.length)} / ${topicRows.length} bài học...\r`);
    }
    console.log(`\n✅ [4/4] Hoàn tất ${data.topics.length} Bài học chi tiết!`);
    console.log("==============================================================================");
    console.log("🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG VÀO SUPABASE!");
    console.log("==============================================================================");
  } catch (error) {
    console.error("❌ Lỗi trong quá trình seed vào Supabase:", error);
    console.log("💡 Gợi ý: Hãy kiểm tra quyền (RLS / Service Role Key) hoặc chạy trực tiếp file SQL trong Supabase SQL Editor:");
    console.log("   supabase/migrations/20261108_seed_8_domains_curriculum.sql");
    process.exit(1);
  }
}

runSeed();
