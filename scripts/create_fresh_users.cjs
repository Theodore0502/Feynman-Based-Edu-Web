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

const NEW_USERS = [
  {
    username: "minhanh_it",
    email: "minhanh.it@elis.edu.vn",
    password: "Password@123",
    fullName: "Trần Minh Anh",
    role: "learner",
    fieldOfStudy: "Khoa Học Máy Tính & Lập Trình Web",
  },
  {
    username: "hoangnam_ecom",
    email: "hoangnam.ecom@elis.edu.vn",
    password: "Password@123",
    fullName: "Nguyễn Hoàng Nam",
    role: "learner",
    fieldOfStudy: "Thương Mại Điện Tử & Marketing Số",
  },
  {
    username: "thuha_med",
    email: "thuha.med@elis.edu.vn",
    password: "Password@123",
    fullName: "Phạm Thu Hà",
    role: "learner",
    fieldOfStudy: "Y Khoa & Dược Học Cơ Bản",
  },
  {
    username: "quocbao_curator",
    email: "quocbao.curator@elis.edu.vn",
    password: "Password@123",
    fullName: "Đặng Quốc Bảo",
    role: "curator",
    fieldOfStudy: "Kiểm Định Tri Thức & Sư Phạm",
  },
  {
    username: "phuonglinh_admin",
    email: "phuonglinh.admin@elis.edu.vn",
    password: "Password@123",
    fullName: "Vũ Phương Linh",
    role: "admin",
    fieldOfStudy: "Quản Trị Hệ Thống & Kiểm Chuẩn AI",
  },
];

async function run() {
  console.log("=== Bắt đầu tạo 5 người dùng mới tinh trên Supabase ===");

  for (const u of NEW_USERS) {
    console.log(`\nĐang xử lý: ${u.email} (${u.username})...`);

    // 1. Kiểm tra xem user auth đã tồn tại chưa
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find((x) => x.email === u.email);

    if (!authUser) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          username: u.username,
          full_name: u.fullName,
          role: u.role,
          field_of_study: u.fieldOfStudy,
        },
      });

      if (createErr) {
        console.error(`- Lỗi tạo auth user:`, createErr.message);
        continue;
      }
      authUser = created.user;
      console.log(`- Đã tạo Supabase Auth User: ${authUser.id}`);
    } else {
      console.log(`- Supabase Auth User đã tồn tại: ${authUser.id}`);
    }

    // 2. Chèn vào bảng profiles
    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: authUser.id,
        email: u.email,
        full_name: u.fullName,
        streak_count: 0,
        total_xp: 0,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profErr) {
      console.error(`- Lỗi chèn profile:`, profErr.message);
    } else {
      console.log(`- Đã cập nhật bảng profiles thành công!`);
    }

    // 3. Chèn vào bảng users (nếu có)
    try {
      const { error: userTableErr } = await supabase.from("users").upsert(
        {
          id: authUser.id,
          name: u.fullName,
          email: u.email,
          field_of_study: u.fieldOfStudy,
          streak_count: 0,
        },
        { onConflict: "email" }
      );
      if (!userTableErr) {
        console.log(`- Đã cập nhật bảng users (legacy) thành công!`);
      }
    } catch {}
  }

  console.log("\n=== HOÀN TẤT TẠO 5 TÀI KHOẢN TRÊN SUPABASE ===");

  // Kiểm tra đăng nhập thử bằng anon key
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const anonClient = createClient(supabaseUrl, anonKey);
  console.log("\n=== Kiểm tra xác thực đăng nhập khách hàng (Client Login Test) ===");
  for (const u of NEW_USERS) {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });
    if (error) {
      console.error(`❌ Đăng nhập ${u.email} thất bại:`, error.message);
    } else {
      console.log(`✅ Đăng nhập ${u.email} thành công! ID: ${data.user.id}`);
    }
  }
}

run();
