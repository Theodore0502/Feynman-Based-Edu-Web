const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

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
        <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>${escapeXml(sec.heading)}</w:t></w:r>
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
  console.log(`[OK] Đã tạo tệp liên ngành: ${path.basename(filePath)} (${content.length} bytes)`);
}

const multiDocs = [
  {
    fileName: "Do-An-Web-Dashboard-Va-Thi-Giac-May-Tinh-AI-Camera.docx",
    title: "ĐỒ ÁN LIÊN NGÀNH: WEB DASHBOARD & HỆ THỐNG THỊ GIÁC MÁY TÍNH AI CAMERA",
    sections: [
      {
        heading: "PHẦN I: PHÁT TRIỂN ỨNG DỤNG WEB & GIAO TIẾP RESTFUL API",
        paragraphs: [
          "Hệ thống trung tâm điều hành Web Dashboard được xây dựng theo kiến trúc Single Page Application kết hợp Backend Node.js/Go để xử lý luồng dữ liệu thời gian thực. Giao thức HTTP RESTful API quản lý vòng đời tài nguyên người dùng, cấu hình thiết bị camera và cấp phát token xác thực JSON Web Token (JWT).",
          "Phía giao diện web React sử dụng WebSocket để duy trì kết nối hai chiều với máy chủ, nhận dữ liệu cảnh báo an ninh và vẽ biểu đồ luồng giao thông. Cơ chế State Management quản lý trạng thái luồng video, lọc danh sách sự kiện và hiển thị bảng chỉ số thời gian thực."
        ]
      },
      {
        heading: "PHẦN II: THỊ GIÁC MÁY TÍNH & MÔ HÌNH NHẬN DIỆN ĐỐI TƯỢNG (COMPUTER VISION)",
        paragraphs: [
          "Mô đun phân tích thị giác máy tính nhận diện khung hình từ luồng camera sử dụng mạng nơ-ron tích chập (Convolutional Neural Network - CNN) và kiến trúc YOLO (You Only Look Once). Quá trình trích xuất đặc trưng sử dụng các bộ lọc tích chập (Convolution Kernel) trượt trên ma trận điểm ảnh để phát hiện đường biên, góc cạnh và hình khối đối tượng.",
          "Thuật toán theo dõi đa đối tượng DeepSORT duy trì mã định danh duy nhất (Tracking ID) cho từng phương tiện qua các khung hình liên tiếp. Các bẫy thuật ngữ cần tránh: Nhầm lẫn giữa phân loại ảnh (Classification) và định vị đối tượng (Object Detection kèm Bounding Box)."
        ]
      }
    ]
  },
  {
    fileName: "Giao-Trinh-Tich-Hop-Co-So-Du-Lieu-Va-Mang-May-Tinh.docx",
    title: "GIÁO TRÌNH TÍCH HỢP: CƠ SỞ DỮ LIỆU SQL & HẠ TẦNG MẠNG TRUYỀN THÔNG",
    sections: [
      {
        heading: "CHƯƠNG 1: HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU QUAN HỆ & CHUẨN HÓA ACID",
        paragraphs: [
          "Cơ sở dữ liệu quan hệ quản trị bảng dữ liệu với khóa chính và khóa ngoại bảo đảm toàn vẹn tham chiếu. Quy trình chuẩn hóa dữ liệu 1NF đến BCNF loại bỏ hoàn toàn dư thừa và dị thường dữ liệu.",
          "Bốn đặc tính giao dịch ACID (Atomicity, Consistency, Isolation, Durability) là nguyên tắc bắt buộc khi thực thi các truy vấn ghi nhận giao dịch tài chính và tài nguyên nhạy cảm. Cấu trúc chỉ mục B-Tree giúp rút ngắn thời gian tìm kiếm từ O(N) xuống O(log N)."
        ]
      },
      {
        heading: "CHƯƠNG 2: MÔ HÌNH MẠNG TCP/IP & TRUYỀN THÔNG DỮ LIỆU PHÂN TÁN",
        paragraphs: [
          "Mạng máy tính truyền tải dữ liệu qua bộ giao thức TCP/IP gồm 4 tầng. Tầng mạng thực hiện định tuyến gói tin (Packet Routing) dựa trên địa chỉ IPv4/IPv6, trong khi tầng giao vận TCP sử dụng cơ chế Bắt tay 3 bước (SYN -> SYN-ACK -> ACK) để thiết lập kênh truyền tin cậy.",
          "Hệ thống tên miền DNS phân giải tên máy chủ, kết hợp kỹ thuật chia mạng con Subnetting để tối ưu hóa lưu lượng trong hệ thống mạng cục bộ và kết nối cơ sở dữ liệu từ xa."
        ]
      }
    ]
  }
];

async function main() {
  const dirs = [
    path.resolve("D:/Theodore/docs"),
    path.resolve(__dirname, "../public/sample-documents/cntt"),
    path.resolve(__dirname, "../sample-documents/cntt")
  ];

  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  for (const doc of multiDocs) {
    for (const d of dirs) {
      const p = path.join(d, doc.fileName);
      await createDocx(p, doc.title, doc.sections);
    }
  }
}

main().catch(console.error);

