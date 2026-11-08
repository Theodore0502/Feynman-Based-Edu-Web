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
  console.log("⚠️  LƯU Ý: Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY trong .env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runSeed() {
  const seedDataPath = path.resolve(__dirname, "../supabase/seed_data.json");
  if (!fs.existsSync(seedDataPath)) {
    console.error("❌ Không tìm thấy file supabase/seed_data.json!");
    process.exit(1);
  }

  const rawData = fs.readFileSync(seedDataPath, "utf8");
  const data = JSON.parse(rawData);

  console.log(`Đang chuẩn bị xử lý:`);
  console.log(`- ${data.domains.length} Ngành học`);
  console.log(`- ${data.subjects.length} Môn học`);
  console.log(`- ${data.topics.length} Bài học chi tiết`);
  console.log("------------------------------------------------------------------------------");

  try {
    // 1. Xóa dữ liệu cũ trong academic_topics và academic_domains
    console.log("⏳ [1/4] Đang dọn sạch dữ liệu cũ trên Supabase...");
    await supabase.from("academic_topics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("academic_domains").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("✅ [1/4] Đã xóa sạch dữ liệu cũ!");

    // 2. Chèn 8 nhóm ngành học mới
    console.log("⏳ [2/4] Đang chèn 8 Nhóm Ngành học mới...");
    const domainRows = data.domains.map((d) => ({
      slug: d.slug,
      name: d.name,
      description: d.description,
      icon_name: d.iconName,
    }));
    const { data: insertedDomains, error: domErr } = await supabase
      .from("academic_domains")
      .insert(domainRows)
      .select();

    if (domErr) throw domErr;
    console.log(`✅ [2/4] Đã nạp thành công ${insertedDomains.length} Nhóm Ngành học vào Supabase!`);

    // Tạo bảng tra cứu slug -> id
    const domainSlugToId = {};
    insertedDomains.forEach((d) => {
      domainSlugToId[d.slug] = d.id;
    });

    // 3. Kiểm tra xem Supabase đã có bảng academic_subjects (từ migration SQL) chưa
    const { data: testSub, error: subCheckErr } = await supabase
      .from("academic_subjects")
      .select("id")
      .limit(1);

    const hasAcademicSubjectsTable = !subCheckErr;

    if (hasAcademicSubjectsTable) {
      console.log("⏳ [3/4] Đang cập nhật 37 Môn học và bảng liên kết đa chiều...");
      const subjectRows = data.subjects.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        difficulty_level: s.difficultyLevel,
        order_index: s.orderIndex,
      }));
      await supabase.from("academic_subjects").upsert(subjectRows, { onConflict: "id" });

      const domainSubjectRows = data.domain_subjects.map((ds) => ({
        domain_id: ds.domain_id,
        subject_id: ds.subject_id,
        is_core: ds.is_core,
        order_index: ds.order_index,
      }));
      await supabase.from("domain_subjects").upsert(domainSubjectRows, { onConflict: "domain_id,subject_id" });
      console.log("✅ [3/4] Đã nạp danh sách Môn học và liên kết đa chiều!");
    } else {
      console.log("ℹ️  [3/4] Bảng academic_subjects chưa tạo bằng DDL. Đang nạp trực tiếp bài học theo 8 Ngành...");
    }

    // 4. Chèn bài học
    console.log(`⏳ [4/4] Đang nạp danh sách bài giảng vào academic_topics...`);
    const subjectIdToDomains = {};
    data.domain_subjects.forEach((ds) => {
      const domainObj = data.domains.find((d) => d.id === ds.domain_id);
      if (!subjectIdToDomains[ds.subject_id]) subjectIdToDomains[ds.subject_id] = [];
      if (domainObj) subjectIdToDomains[ds.subject_id].push(domainObj);
    });

    const topicRows = [];
    data.topics.forEach((t) => {
      const targetDomains = subjectIdToDomains[t.subjectId] || [data.domains[0]];
      targetDomains.forEach((dom) => {
        topicRows.push({
          domain_id: domainSlugToId[dom.slug],
          title: t.title,
          slug: `${dom.slug}-${t.slug}`,
          summary: t.summary,
          required_concepts: t.requiredConcepts,
          common_jargons: t.requiredConcepts.slice(0, 3),
          difficulty_level: t.difficultyLevel,
        });
      });
    });

    const BATCH = 50;
    for (let i = 0; i < topicRows.length; i += BATCH) {
      const chunk = topicRows.slice(i, i + BATCH);
      const { error: tErr } = await supabase.from("academic_topics").insert(chunk);
      if (tErr) throw tErr;
      process.stdout.write(`  -> Đã nạp ${Math.min(i + BATCH, topicRows.length)} / ${topicRows.length} bài học...\r`);
    }

    console.log(`\n✅ [4/4] Hoàn tất nạp ${topicRows.length} bài học thành công vào Supabase!`);
    console.log("==============================================================================");
    console.log("🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC LƯU VĨNH VIỄN TRÊN CLOUD SUPABASE!");
    console.log("==============================================================================");
  } catch (error) {
    console.error("❌ Lỗi trong quá trình seed vào Supabase:", error);
    process.exit(1);
  }
}

runSeed();
