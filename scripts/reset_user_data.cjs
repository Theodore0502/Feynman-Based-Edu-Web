const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetUserData() {
  console.log("=== Đang tìm tài khoản minhanh_it / minhanhit ===");

  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("Lỗi listUsers:", usersErr);
    return;
  }

  const user = usersData.users.find(
    (u) =>
      u.email === "minhanh.it@elis.edu.vn" ||
      u.email === "minhanh.it@theodore.edu" ||
      u.user_metadata?.username === "minhanh_it" ||
      u.user_metadata?.username === "minhanhit"
  );

  if (!user) {
    console.error("Không tìm thấy user minhanh_it!");
    return;
  }

  const userId = user.id;
  console.log(`Tìm thấy user: ID = ${userId}, Email = ${user.email}`);

  // 1. Reset Profile trong Supabase về 0 XP, 0 Streak
  console.log("1. Đang reset bảng profiles...");
  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      streak_count: 0,
      total_xp: 0,
      last_active_at: null,
    })
    .eq("id", userId);

  if (profErr) {
    console.error("- Lỗi update profiles:", profErr.message);
  } else {
    console.log("- Đã reset profiles thành công: streak_count = 0, total_xp = 0, last_active_at = null");
  }

  // 2. Kiểm tra và xóa các phiên học của user này (learning_sessions & sessions)
  console.log("2. Đang kiểm tra và xóa các phiên học của user...");
  try {
    const { data: lsData } = await supabase
      .from("learning_sessions")
      .select("id")
      .eq("user_id", userId);

    if (lsData && lsData.length > 0) {
      const sessionIds = lsData.map((s) => s.id);
      console.log(`- Tìm thấy ${sessionIds.length} learning_sessions, đang xóa...`);
      await supabase.from("session_messages").delete().in("session_id", sessionIds);
      await supabase.from("evaluation_reports").delete().in("session_id", sessionIds);
      await supabase.from("learning_sessions").delete().eq("user_id", userId);
      console.log("- Đã xóa toàn bộ learning_sessions liên quan!");
    } else {
      console.log("- Không có learning_sessions nào của user này.");
    }
  } catch (e) {
    console.log("- Bỏ qua learning_sessions:", e.message);
  }

  // 3. Xóa thẻ jargon vault của user
  console.log("3. Đang kiểm tra và xóa thẻ Jargon Vault...");
  try {
    const { error: jvErr } = await supabase
      .from("jargon_vault_cards")
      .delete()
      .eq("user_id", userId);
    if (!jvErr) console.log("- Đã dọn dẹp jargon_vault_cards.");
  } catch (e) {}

  // 4. Reset bảng users legacy nếu có
  try {
    await supabase
      .from("users")
      .update({ streak_count: 0 })
      .eq("email", user.email);
    console.log("- Đã dọn dẹp bảng users legacy.");
  } catch (e) {}

  // 5. Kiểm tra thông tin sau khi reset
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log("\n=== KẾT QUẢ PROFILE SAU KHI RESET ===");
  console.log(updatedProfile);
}

resetUserData();

