const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const mammoth = require("mammoth");

function buildDocxXml(title, sections) {
  let paragraphsXml = `
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    <w:p/>
  `;

  for (const sec of sections) {
    paragraphsXml += `
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2E4057"/></w:rPr><w:t>${escapeXml(sec.heading)}</w:t></w:r>
      </w:p>
    `;
    for (const p of sec.paragraphs) {
      paragraphsXml += `
        <w:p>
          <w:r><w:t>${escapeXml(p)}</w:t></w:r>
        </w:p>
      `;
    }
    paragraphsXml += `<w:p/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
    }
  });
}

async function createDocx(filePath, title, sections) {
  const zip = new JSZip();

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.folder("word").file("document.xml", buildDocxXml(title, sections));

  const content = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(filePath, content);

  // Kiểm tra bóc tách bằng mammoth
  const parsed = await mammoth.extractRawText({ buffer: content });
  console.log(`[OK] Đã tạo: ${path.basename(filePath)} (${content.length} bytes, mammoth đọc được ${parsed.value.length} ký tự)`);
}

const docs = [
  {
    fileName: "Giao-Trinh-Co-So-Du-Lieu-SQL-Chuan-Hoa-ACID.docx",
    title: "GIÁO TRÌNH HỆ CƠ SỞ DỮ LIỆU & QUẢN TRỊ SQL",
    sections: [
      {
        heading: "1. Khái Niệm Cơ Sở Dữ Liệu Quan Hệ & Khóa",
        paragraphs: [
          "Cơ sở dữ liệu quan hệ (RDBMS) tổ chức dữ liệu dưới dạng các bảng hai chiều gồm hàng (record/tuple) và cột (attribute). Mỗi hàng đại diện cho một thực thể duy nhất, được phân biệt bởi Khóa chính (Primary Key).",
          "Mối quan hệ giữa các bảng được thiết lập thông qua Khóa ngoại (Foreign Key), bảo đảm tính toàn vẹn tham chiếu (Referential Integrity). Khi thiết kế cơ sở dữ liệu, việc xác định đúng quan hệ 1-1, 1-N và N-N là tiền đề để tránh dư thừa và dị thường cập nhật dữ liệu."
        ]
      },
      {
        heading: "2. Quy Trình Chuẩn Hóa Dữ Liệu (1NF đến BCNF)",
        paragraphs: [
          "Chuẩn hóa dữ liệu (Database Normalization) là kỹ thuật phân tách bảng nhằm loại bỏ dư thừa dữ liệu và hạn chế tối đa các dị thường thêm (insert anomaly), dị thường xóa (delete anomaly) và dị thường sửa (update anomaly).",
          "Dạng chuẩn 1 (1NF): Mọi thuộc tính đều phải chứa giá trị nguyên tố (atomic value), không chứa danh sách lặp lại.",
          "Dạng chuẩn 2 (2NF): Đạt 1NF và mọi thuộc tính không khóa phải phụ thuộc hàm đầy đủ vào toàn bộ khóa chính.",
          "Dạng chuẩn 3 (3NF): Đạt 2NF và không có thuộc tính không khóa nào phụ thuộc bắc cầu (transitive dependency) vào khóa chính.",
          "Dạng chuẩn Boyce-Codd (BCNF): Đạt 3NF và với mọi phụ thuộc hàm X -> Y thì X bắt buộc phải là siêu khóa (superkey)."
        ]
      },
      {
        heading: "3. Tính Chất Giao Dịch ACID & Chỉ Mục B-Tree",
        paragraphs: [
          "Một giao dịch (Transaction) trong SQL là tập hợp các thao tác phải thỏa mãn trọn vẹn 4 đặc tính ACID:",
          "- Atomicity (Nguyên tử): Hoặc thành công toàn bộ, hoặc thất bại hoàn toàn (Rollback).",
          "- Consistency (Nhất quán): Cơ sở dữ liệu chuyển từ trạng thái hợp lệ này sang trạng thái hợp lệ khác theo đúng ràng buộc nghiệp vụ.",
          "- Isolation (Cô lập): Các giao dịch thực thi đồng thời không can thiệp hay nhìn thấy dữ liệu trung gian của nhau.",
          "- Durability (Bền vững): Một khi giao dịch đã Commit, dữ liệu sẽ được ghi vĩnh viễn vào đĩa kể cả khi mất điện đột ngột.",
          "Chỉ mục B-Tree (B-Tree Indexing) là cấu trúc cây tìm kiếm cân bằng giúp giảm độ phức tạp tìm kiếm bản ghi từ O(N) xuống O(log N), tối ưu hóa vượt bậc tốc độ truy vấn SELECT trong các bảng hàng triệu dòng."
        ]
      }
    ]
  },
  {
    fileName: "Giao-Trinh-Mang-May-Tinh-Mo-Hinh-OSI-TCP-IP.docx",
    title: "GIÁO TRÌNH MẠNG MÁY TÍNH & TRUYỀN THÔNG DỮ LIỆU",
    sections: [
      {
        heading: "1. Mô Hình Tham Chiếu OSI 7 Tầng",
        paragraphs: [
          "Mô hình OSI (Open Systems Interconnection) do tổ chức ISO phát triển gồm 7 tầng phân cấp chức năng từ vật lý đến ứng dụng:",
          "- Tầng 1: Vật lý (Physical) - Truyền tải luồng bit thô qua môi trường dây cáp hoặc sóng vô tuyến.",
          "- Tầng 2: Liên kết dữ liệu (Data Link) - Đóng khung dữ liệu (Frame), định chỉ địa chỉ vật lý MAC và kiểm tra lỗi CRC.",
          "- Tầng 3: Mạng (Network) - Định tuyến gói tin (Packet Routing) dựa trên địa chỉ logic IP toàn cầu.",
          "- Tầng 4: Giao vận (Transport) - Quản lý truyền thông đầu cuối (End-to-end), kiểm soát luồng và sửa lỗi.",
          "- Tầng 5: Phiên (Session) - Thiết lập, duy trì và đồng bộ hóa phiên hội thoại giữa hai thiết bị.",
          "- Tầng 6: Trình diễn (Presentation) - Định dạng, nén dữ liệu và mã hóa bảo mật (SSL/TLS).",
          "- Tầng 7: Ứng dụng (Application) - Cung cấp giao diện mạng cho người dùng qua các giao thức HTTP, DNS, FTP, SMTP."
        ]
      },
      {
        heading: "2. Giao Thức TCP vs UDP & Cơ Chế Bắt Tay 3 Bước",
        paragraphs: [
          "Giao thức TCP (Transmission Control Protocol) là giao thức hướng kết nối (Connection-oriented), bảo đảm truyền tin cậy 100% không mất mát và đúng thứ tự thông qua cơ chế Bắt tay 3 bước (Three-way Handshake: SYN -> SYN-ACK -> ACK).",
          "Ngược lại, giao thức UDP (User Datagram Protocol) là giao thức phi kết nối (Connectionless), không bảo đảm thứ tự gói tin nhưng có độ trễ cực thấp, phù hợp cho streaming video, đàm thoại VoIP và game online theo thời gian thực."
        ]
      },
      {
        heading: "3. Định Tuyến IP, Subnetting & Hệ Thống Tên Miền DNS",
        paragraphs: [
          "Địa chỉ IP đóng vai trò nhận diện duy nhất từng nút mạng. Kỹ thuật chia mạng con (Subnetting) sử dụng mặt nạ mạng con (Subnet Mask) giúp tối ưu hóa số lượng host và ngăn chặn bão broadcast trong mạng LAN.",
          "Hệ thống tên miền DNS (Domain Name System) hoạt động như danh bạ Internet, chuyển đổi tên miền dễ nhớ (như elis.edu.vn) thành địa chỉ IP máy chủ nhị phân mà thiết bị mạng có thể định tuyến được."
        ]
      }
    ]
  },
  {
    fileName: "Giao-Trinh-Dien-Toan-Dam-May-Cloud-Container-Docker.docx",
    title: "GIÁO TRÌNH ĐIỆN TOÁN ĐÁM MÂY & CÔNG NGHỆ CONTAINER",
    sections: [
      {
        heading: "1. Tổng Quan Điện Toán Đám Mây & Mô Hình Dịch Vụ",
        paragraphs: [
          "Điện toán đám mây (Cloud Computing) là mô hình cung cấp tài nguyên điện toán theo yêu cầu qua Internet với cơ chế thanh toán theo mức sử dụng (Pay-as-you-go).",
          "Ba mô hình dịch vụ cốt lõi:",
          "- IaaS (Infrastructure as a Service): Cung cấp máy chủ ảo hóa, lưu trữ và mạng thô (AWS EC2, Google Compute Engine).",
          "- PaaS (Platform as a Service): Cung cấp nền tảng chạy mã nguồn mà không cần quản lý hệ điều hành (Heroku, Vercel).",
          "- SaaS (Software as a Service): Ứng dụng phần mềm hoàn chỉnh chạy trên đám mây (Google Workspace, Office 365)."
        ]
      },
      {
        heading: "2. Cơ Chế Hoạt Động Của Docker Container",
        paragraphs: [
          "Docker Container là công nghệ ảo hóa ở cấp độ hệ điều hành (OS-level Virtualization). Khác với Máy ảo truyền thống (Virtual Machine) phải kèm cả một hệ điều hành khách (Guest OS) nặng hàng Gigabyte, Docker Container chia sẻ chung nhân Linux Kernel với máy chủ.",
          "Container hoạt động dựa trên hai tính năng then chốt của Linux Kernel:",
          "- Namespaces: Cách ly không gian tiến trình (PID), mạng (NET), điểm gắn ổ đĩa (MNT) và người dùng (USER).",
          "- Cgroups (Control Groups): Giới hạn và đo lường tài nguyên CPU, RAM và I/O mà mỗi container được phép tiêu thụ.",
          "Hình tượng bình dân: Container giống như căn hộ chung cư xây sẵn đầy đủ tiện nghi, trong khi Máy ảo giống như mua cả khu đất tự xây móng và dựng nhà riêng."
        ]
      },
      {
        heading: "3. Điều Phối Container Với Kubernetes (K8s)",
        paragraphs: [
          "Khi hệ thống mở rộng lên hàng trăm container, Kubernetes đảm nhận vai trò bộ điều phối (Container Orchestration) tự động hóa triển khai, tự phục hồi (Self-healing khi container crash), tự động co giãn tài nguyên (Auto-scaling) và cân bằng tải lưu lượng mạng (Load Balancing)."
        ]
      }
    ]
  },
  {
    fileName: "Giao-Trinh-An-Toan-Thong-Tin-Ma-Hoa-Cong-Khai-Cybersecurity.docx",
    title: "GIÁO TRÌNH AN TOÀN THÔNG TIN & AN NINH MẠNG",
    sections: [
      {
        heading: "1. Tam Giác Bảo Mật CIA & Các Mối Đe Dọa",
        paragraphs: [
          "An toàn thông tin xoay quanh ba trụ cột cốt lõi của tam giác CIA:",
          "- Confidentiality (Bảo mật): Đảm bảo thông tin chỉ được truy cập bởi những cá nhân hoặc hệ thống có thẩm quyền.",
          "- Integrity (Toàn vẹn): Đảm bảo dữ liệu không bị thay đổi, chỉnh sửa trái phép hoặc làm sai lệch trong quá trình lưu trữ và truyền tải.",
          "- Availability (Khả dụng): Đảm bảo dịch vụ và tài nguyên luôn sẵn sàng phục vụ khi người dùng hợp pháp yêu cầu.",
          "Các mối đe dọa phổ biến bao gồm tấn công từ chối dịch vụ (DDoS), mã độc tống tiền (Ransomware), lừa đảo giả mạo (Phishing) và tiêm mã độc SQL Injection."
        ]
      },
      {
        heading: "2. Mật Mã Học Khóa Công Khai & Chữ Ký Số",
        paragraphs: [
          "Mật mã học bất đối xứng (Asymmetric Cryptography) sử dụng cặp khóa toán học liên kết gồm Khóa công khai (Public Key - để mọi người mã hóa) và Khóa bí mật (Private Key - chỉ chủ sở hữu giữ để giải mã).",
          "Thuật toán RSA và Đường cong Elliptic (ECC) là nền tảng của bảo mật Internet hiện đại. Chữ ký số (Digital Signature) được tạo bằng cách băm văn bản (hashing) rồi mã hóa chuỗi băm bằng Khóa bí mật của người gửi, giúp người nhận chứng thực danh tính tác giả và đảm bảo tính chống chối bỏ (Non-repudiation)."
        ]
      },
      {
        heading: "3. Giao Thức Bảo Mật TLS/SSL & Phòng Chống Tấn Công OWASP",
        paragraphs: [
          "Giao thức TLS (Transport Layer Security) kết hợp mã hóa bất đối xứng để trao đổi khóa phiên (Session Key) và mã hóa đối xứng AES tốc độ cao để truyền dữ liệu thực tế, bảo vệ lưu lượng web HTTPS trước nguy cơ bị nghe lén Man-in-the-Middle (MitM).",
          "Dự án bảo mật ứng dụng web mở OWASP Top 10 cung cấp danh mục các lỗ hổng nghiêm trọng nhất như Broken Access Control, Injection, Cryptographic Failures và Security Misconfiguration."
        ]
      }
    ]
  },
  {
    fileName: "Giao-Trinh-Phat-Trien-Ung-Dung-Web-RESTful-API.docx",
    title: "GIÁO TRÌNH PHÁT TRIỂN ỨNG DỤNG WEB & THIẾT KẾ RESTFUL API",
    sections: [
      {
        heading: "1. Kiến Trúc Client-Server & Vòng Đời HTTP Request",
        paragraphs: [
          "Ứng dụng web hiện đại hoạt động theo mô hình Client-Server phân tầng. Phía Client (Frontend) chịu trách nhiệm hiển thị giao diện người dùng và tương tác, trong khi phía Server (Backend) xử lý logic nghiệp vụ, xác thực và lưu trữ cơ sở dữ liệu.",
          "Giao thức HTTP (Hypertext Transfer Protocol) là giao thức truyền thông phi trạng thái (Stateless). Mỗi yêu cầu (Request) bao gồm URL, HTTP Method, Headers và Body dữ liệu; máy chủ phản hồi (Response) kèm theo Mã trạng thái (Status Code) như 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found và 500 Internal Server Error."
        ]
      },
      {
        heading: "2. Nguyên Tắc Thiết Kế Chuẩn RESTful API",
        paragraphs: [
          "REST (Representational State Transfer) là phong cách kiến trúc định hướng tài nguyên (Resource-oriented). Các quy tắc thiết kế chuẩn bao gồm:",
          "- Sử dụng danh từ số nhiều đại diện cho tài nguyên trong URI (ví dụ: /api/v1/courses, /api/v1/students).",
          "- Ánh xạ đúng các phương thức HTTP: GET (lấy dữ liệu), POST (tạo mới), PUT/PATCH (cập nhật toàn bộ hoặc một phần), DELETE (xóa tài nguyên).",
          "- Không lưu trạng thái phiên làm việc của người dùng trên bộ nhớ máy chủ (Statelessness), giúp hệ thống dễ dàng mở rộng theo chiều ngang (Horizontal Scaling)."
        ]
      },
      {
        heading: "3. Xác Thực Phiên Làm Việc Với JWT & Bảo Vệ CORS",
        paragraphs: [
          "JSON Web Token (JWT) là chuẩn mở RFC 7519 cho phép truyền tải thông tin định danh an toàn dưới dạng chuỗi nén gồm 3 phần: Header (thuật toán mã hóa), Payload (thông tin người dùng và quyền hạn claims) và Signature (chữ ký bí mật xác thực).",
          "Cơ chế chia sẻ tài nguyên nguồn gốc chéo CORS (Cross-Origin Resource Sharing) là chính sách bảo mật của trình duyệt kiểm soát việc gọi API từ một domain khác với domain đang tải trang web, ngăn chặn tấn công giả mạo yêu cầu từ trang web độc hại."
        ]
      }
    ]
  }
];

async function main() {
  const targetDir = path.resolve(__dirname, "../sample-documents/cntt");
  const publicDir = path.resolve(__dirname, "../public/sample-documents/cntt");

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  console.log("=== BẮT ĐẦU TẠO CÁC TỆP .DOCX HỌC THUẬT CHUẨN NGÀNH CNTT ===");

  for (const doc of docs) {
    const filePath = path.join(targetDir, doc.fileName);
    const publicPath = path.join(publicDir, doc.fileName);

    await createDocx(filePath, doc.title, doc.sections);
    fs.copyFileSync(filePath, publicPath);
  }

  console.log("\n=== HOÀN TẤT! ===");
  console.log(`Các tệp đã được tạo tại thư mục:\n  -> ${targetDir}\n  -> ${publicDir}`);
}

main().catch(console.error);
