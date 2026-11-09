# -*- coding: utf-8 -*-
"""
Script: scripts/create_feynman_doc.py
Mục đích: Khởi tạo tài liệu học thuật chuẩn DOCX về Lý thuyết & Kỹ thuật học tập Feynman
Lưu tại: docs/Giao_Trinh_Ly_Thuyet_Va_Ky_Thuat_Feynman.docx
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Đặt màu nền cho cell trong bảng"""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    """Đặt lề trong cho cell"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_document():
    doc = Document()

    # Cấu hình lề trang chuẩn A4
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # -------------------------------------------------------------
    # 1. TIÊU ĐỀ CHÍNH & HEADER TRANG BÌA
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(20)
    title_p.paragraph_format.space_after = Pt(6)
    
    title_run = title_p.add_run("TÀI LIỆU CHUYÊN KHẢO")
    title_run.font.name = "Arial"
    title_run.font.size = Pt(13)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(114, 134, 211) # #7286D3

    main_title_p = doc.add_paragraph()
    main_title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    main_title_p.paragraph_format.space_after = Pt(12)
    main_run = main_title_p.add_run("LÝ THUYẾT VÀ KỸ THUẬT HỌC TẬP FEYNMAN\n(THE FEYNMAN TECHNIQUE)")
    main_run.font.name = "Arial"
    main_run.font.size = Pt(22)
    main_run.font.bold = True
    main_run.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(28)
    sub_run = sub_p.add_run("Phương Pháp Đơn Giản Hóa Tri Thức, Bóc Tách Bản Chất & Chuyển Hóa Thành Trí Nhớ Vĩnh Cửu")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139) # Slate 500

    # -------------------------------------------------------------
    # CALLOUT QUOTE RICHARD FEYNMAN
    # -------------------------------------------------------------
    quote_table = doc.add_table(rows=1, cols=1)
    quote_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = quote_table.cell(0, 0)
    set_cell_background(cell, "F1F5FD")
    set_cell_margins(cell, top=200, bottom=200, left=240, right=240)
    
    qp = cell.paragraphs[0]
    qp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    q_run = qp.add_run('“Nếu bạn không thể giải thích đơn giản cho một đứa trẻ 10 tuổi hiểu,\nthì chính bạn vẫn chưa thực sự hiểu sâu sắc về nó.”\n')
    q_run.font.name = "Georgia"
    q_run.font.size = Pt(12)
    q_run.font.italic = True
    q_run.font.bold = True
    q_run.font.color.rgb = RGBColor(67, 56, 202) # Indigo 700

    q_author = qp.add_run('— Giáo sư Richard P. Feynman (Giải Nobel Vật lý 1965)')
    q_author.font.name = "Arial"
    q_author.font.size = Pt(10)
    q_author.font.color.rgb = RGBColor(99, 102, 241)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # -------------------------------------------------------------
    # PHẦN 1: TỔNG QUAN VỀ RICHARD FEYNMAN & TRIẾT LÝ HỌC TẬP
    # -------------------------------------------------------------
    h1 = doc.add_heading("I. TỔNG QUAN VỀ RICHARD FEYNMAN VÀ NGUYÊN LÝ CỐT LÕI", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p1 = doc.add_paragraph()
    p1.paragraph_format.line_spacing = 1.25
    p1.paragraph_format.space_after = Pt(8)
    p1.add_run(
        "Richard Phillips Feynman (1918 – 1988) là một trong những nhà vật lý học vĩ đại nhất thế kỷ 20, "
        "được trao giải Nobel Vật lý năm 1965 cho công trình tiên phong về Điện động lực học lượng tử (QED). "
        "Không chỉ là một nhà khoa học kiệt xuất, ông còn được mệnh danh là “The Great Explainer” (Nhà sư phạm vĩ đại) "
        "bởi năng lực phi thường trong việc chuyển hóa những khái niệm vật lý lượng tử trừu tượng nhất thành những câu chuyện "
        "đời thường, sáng rõ và sống động mà bất kỳ ai cũng có thể nắm bắt."
    )

    p2 = doc.add_paragraph()
    p2.paragraph_format.line_spacing = 1.25
    p2.paragraph_format.space_after = Pt(14)
    p2.add_run(
        "Triết lý học tập của Feynman xoay quanh sự phân biệt tối hậu giữa hai trạng thái hiểu biết:\n"
    )
    r1 = p2.add_run("1. Chỉ biết cái tên của sự vật (Knowing the name of something): ")
    r1.bold = True
    p2.add_run("Bạn có thể thuộc lòng tên thuật ngữ, đọc vanh vách định nghĩa sách giáo khoa, nhưng không giải thích được vì sao nó lại diễn ra như vậy và liên hệ ra sao với thực tại.\n")
    r2 = p2.add_run("2. Thấu hiểu bản chất sự vật (Knowing something truly): ")
    r2.bold = True
    p2.add_run("Bạn có thể tháo rời cơ chế vận hành của khái niệm, sử dụng vốn từ ngữ mộc mạc nhất để tái hiện nó, đồng thời dùng các ẩn dụ trực quan để một người hoàn toàn không có chuyên môn cũng lĩnh hội được.")

    # -------------------------------------------------------------
    # PHẦN 2: 4 BƯỚC CỐT LÕI CỦA PHƯƠNG PHÁP FEYNMAN
    # -------------------------------------------------------------
    h2 = doc.add_heading("II. 4 BƯỚC CỐT LÕI CỦA PHƯƠNG PHÁP FEYNMAN", level=1)
    h2.paragraph_format.space_before = Pt(18)
    h2.paragraph_format.space_after = Pt(8)

    steps = [
        ("Bước 1: Lựa chọn chủ đề và nghiên cứu tài liệu gốc",
         "Viết tên khái niệm hoặc học phần bạn muốn làm chủ lên đầu trang giấy trắng. Đọc kỹ tài liệu, giáo trình, bài giảng để nắm bắt các định lý, công thức và tiền đề nền tảng ban đầu."),
        
        ("Bước 2: Giảng giải lại cho một đứa trẻ 10 tuổi (Teach it to a child)",
         "Đóng vai người thầy và bắt đầu giảng giải chủ đề đó cho một người nghe giả định (hoặc một đứa trẻ 10 tuổi). "
         "Quy tắc vàng: Tuyệt đối không được ẩn nấp đằng sau các thuật ngữ chuyên ngành phức tạp (Jargon). "
         "Nếu bạn buộc phải dùng biệt ngữ khó, đó là bằng chứng không thể chối cãi cho thấy bạn chưa thực sự hiểu thấu đáo."),
        
        ("Bước 3: Xác định lỗ hổng kiến thức và quay lại củng cố (Identify Gaps & Review)",
         "Khi đang giảng giải, mỗi khi bạn bị ngắc ngứ, lúng túng hoặc nhận ra mình đang 'nói vẹt', hãy dừng lại ngay lập tức. "
         "Đó chính là 'Vùng lõm tri thức' (Knowledge Gap). Hãy mở lại sách vở, đào sâu vào cơ chế cốt lõi cho đến khi bạn có thể trả lời các câu hỏi tại sao một cách gãy gọn."),
        
        ("Bước 4: Tinh giản ngôn từ và sáng tạo phép ẩn dụ (Simplify & Create Analogies)",
         "Viết lại lời giải thích bằng những câu văn ngắn gọn, giàu hình tượng. Xây dựng ít nhất một 'Phép ẩn dụ Feynman' (Feynman Analogy) "
         "để kết nối khái niệm trừu tượng này với các sự vật quen thuộc trong đời sống hàng ngày.")
    ]

    for title, desc in steps:
        p_step = doc.add_paragraph()
        p_step.paragraph_format.line_spacing = 1.25
        p_step.paragraph_format.space_after = Pt(8)
        run_title = p_step.add_run(f"• {title}:\n")
        run_title.bold = True
        run_title.font.color.rgb = RGBColor(79, 70, 229) # Indigo 600
        p_step.add_run(desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------
    # PHẦN 3: BẢNG TIÊU CHÍ ĐÁNH GIÁ (RUBRICS) CHUẨN THEODORE
    # -------------------------------------------------------------
    h3 = doc.add_heading("III. BẢNG TIÊU CHÍ ĐÁNH GIÁ VÀ THẨM ĐỊNH (FEYNMAN RUBRICS)", level=1)
    h3.paragraph_format.space_before = Pt(18)
    h3.paragraph_format.space_after = Pt(8)

    p_rub = doc.add_paragraph(
        "Hệ thống giáo dục Theodore cụ thể hóa lý thuyết Feynman thành bộ thang đo định lượng 4 chiều "
        "để AI Agent và Kiểm định viên (Curator) thẩm định độ tinh thông của người học:"
    )
    p_rub.paragraph_format.space_after = Pt(10)

    rubric_table = doc.add_table(rows=5, cols=4)
    rubric_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Tiêu Chí Đánh Giá", "Trọng Số", "Mô Tả Năng Lực Cần Thể Hiện", "Ngưỡng Đạt"]
    for col_idx, h_text in enumerate(headers):
        cell = rubric_table.cell(0, col_idx)
        set_cell_background(cell, "4F46E5") # Indigo
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(10)

    rows_data = [
        ("1. Tính Đơn Giản (Simplicity)", "30%", "Sử dụng câu từ bình dị, trong sáng, dễ tiếp cận cho người mới bắt đầu.", ">= 80/100"),
        ("2. Độ Chính Xác Cốt Lõi (Core Accuracy)", "30%", "Bao quát đầy đủ các Khái niệm cốt lõi bắt buộc (Required Concepts), không bóp méo chân lý.", ">= 85/100"),
        ("3. Ẩn Dụ Trực Quan (Analogy Power)", "20%", "Có ít nhất 1 phép so sánh liên tưởng đời thường chuẩn xác, giúp người nghe hình dung tức thì.", "Có ẩn dụ hợp lệ"),
        ("4. Né Tránh Bẫy Thuật Ngữ (Jargon Defense)", "20%", "Không lạm dụng từ chuyên môn để che đậy điểm mơ hồ; phát hiện và né tránh bẫy sáo rỗng.", "0 vi phạm nghiêm trọng")
    ]

    for row_idx, rdata in enumerate(rows_data, start=1):
        for col_idx, text in enumerate(rdata):
            cell = rubric_table.cell(row_idx, col_idx)
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
            p = cell.paragraphs[0]
            if col_idx in [1, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(text)
            run.font.size = Pt(9.5)
            if col_idx == 0:
                run.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # PHẦN 4: MA TRẬN ẨN DỤ THỰC CHIẾN MINH HỌA
    # -------------------------------------------------------------
    h4 = doc.add_heading("IV. MA TRẬN ẨN DỤ FEYNMAN MINH HỌA (CASE STUDIES)", level=1)
    h4.paragraph_format.space_before = Pt(18)
    h4.paragraph_format.space_after = Pt(8)

    cases = [
        ("Chủ đề: Docker Container vs. Máy Ảo (Virtual Machine)",
         "• Thuật ngữ học thuật: Cách ly Namespace & Cgroups trên Linux Kernel so với Hypervisor ảo hóa phần cứng.\n"
         "• Ẩn dụ Feynman: Máy ảo giống như bạn mua cả mảnh đất rồi xây từ móng một ngôi nhà riêng rẽ (tốn đất, tốn vật liệu). "
         "Trong khi Docker giống như các căn hộ chung cư được phân chia trong cùng một tòa nhà: mỗi nhà có chìa khóa riêng độc lập, "
         "nhưng dùng chung hệ thống điện nước móng cọc của tòa nhà (rất nhẹ và triển khai tức thì)."),

        ("Chủ đề: Cơ Chế Self-Attention trong Trí Tuệ Nhân Tạo (Transformers)",
         "• Thuật ngữ học thuật: Tích vô hướng ma trận phân tầng Q, K, V chuẩn hóa qua hàm Softmax.\n"
         "• Ẩn dụ Feynman: Giống như bạn bước vào một thư viện lớn: Phiếu mượn ghi tên chủ đề bạn đang tìm là 'Query', "
         "nhãn dán in trên gáy của từng cuốn sách trên giá là 'Key', còn toàn bộ kiến thức chứa đựng bên trong cuốn sách là 'Value'."),

        ("Chủ đề: Cơ Chế Bơm Máu Của Tim (Sinh Lý Y Khoa)",
         "• Thuật ngữ học thuật: Chu kỳ co bóp tâm thu tâm trương, tuần hoàn phổi và tuần hoàn hệ thống.\n"
         "• Ẩn dụ Feynman: Trái tim giống như một trạm bơm nước 2 máy độc lập: một máy chuyên thu nước đục đưa sang nhà máy lọc sạch (phổi), "
         "máy còn lại nhận nước sạch tinh khiết để bơm phân phối đi nuôi mạng lưới toàn thành phố (các cơ quan trong cơ thể).")
    ]

    for title, content in cases:
        cp = doc.add_paragraph()
        cp.paragraph_format.line_spacing = 1.25
        cp.paragraph_format.space_after = Pt(10)
        c_run = cp.add_run(f"■ {title}\n")
        c_run.bold = True
        c_run.font.color.rgb = RGBColor(30, 41, 59)
        cp.add_run(content)

    # -------------------------------------------------------------
    # PHẦN 5: LỜI KẾT & QUY TRÌNH HỌC TẬP VỚI THEODORE
    # -------------------------------------------------------------
    h5 = doc.add_heading("V. TỔNG KẾT VÀ ỨNG DỤNG TRONG THỰC TIỄN", level=1)
    h5.paragraph_format.space_before = Pt(18)
    h5.paragraph_format.space_after = Pt(8)

    p_end = doc.add_paragraph()
    p_end.paragraph_format.line_spacing = 1.25
    p_end.paragraph_format.space_after = Pt(8)
    p_end.add_run(
        "Kỹ thuật Feynman không đơn thuần là một phương pháp ghi nhớ đối phó kỳ thi, "
        "mà là một kim chỉ nam rèn luyện tư duy phản biện và khả năng truyền đạt cả đời. "
        "Khi bạn buộc mình phải diễn giải mọi thứ một cách đơn giản, bạn đang dọn sạch sự mù mờ trong nhận thức "
        "và biến kiến thức của nhân loại thành tài sản trí tuệ vĩnh cửu của chính mình.\n\n"
        "Nền tảng Theodore ra đời nhằm hiện thực hóa phương pháp này thông qua Bục giảng AI (Feynman Stage), "
        "giúp người học tương tác đa chiều với các nhân vật mô phỏng, nhận phản hồi tức thì và tiến bước trên con đường thấu suốt tri thức."
    )

    # Lưu tệp tin
    output_dir = os.path.abspath("docs")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "Ly_Thuyet_Va_Ky_Thuat_Hoc_Tap_Feynman.docx")
    doc.save(output_path)
    print(f"Đã tạo thành công tệp DOCX tại: {output_path}")

if __name__ == "__main__":
    create_document()

