BỘ CÔNG THƯƠNG
TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
  KHOA ĐIỆN TOÁN VÀ CÔNG NGHỆ SỐ NĂNG LƯỢNG

 
		
BÁO CÁO THỰC TẬP TỐT NGHIỆP 

ĐỀ TÀI: NGHIÊN CỨU VÀ XÂY DỰNG HỆ THỐNG CHATBOT HỎI ĐÁP ĐA TÀI LIỆU DỰA TRÊN RAG

Giảng viên hướng dẫn	: (IN HOA)
Sinh viên thực hiện	: ĐÀO DUY QUYỀN
Mã sinh viên	: 22810310231
Ngành	: CÔNG NGHỆ THÔNG TIN
Chuyên ngành	: CÔNG NGHỆ PHẦN MỀM
Lớp	: D17CNPM4
Khóa	: 2022-2027
	

Hà Nội, tháng ….. năm …..
	
	
	
[ĐIỀN: Chèn bản in Quyết định của nhà trường cử đi thực tập (trang đầu) + 01 tờ danh sách có tên mình (tô sáng tên)]
 
ĐỀ CƯƠNG THỰC TẬP TỐT NGHIỆP.
1. Tên đề tài: Nghiên cứu và xây dựng hệ thống chatbot hỏi đáp đa tài liệu dựa trên RAG.
2. Sinh viên thực hiện:
		Họ và tên: Đào Duy Quyền		MSSV: 22810310231
		Số điện thoại: 0868491865		Email: quyenne3704@gmail.com
		Vị trí thực tập: 
3. Giảng viên hướng dẫn:
		Họ và tên: [ĐIỀN]			Học vị: [ĐIỀN]
		Số điện thoại: [ĐIỀN]		Email: [ĐIỀN]
		Đơn vị công tác: Khoa Công nghệ thông tin, Trường đại học Điện lực.
4. Mô tả tóm tắt đề tài 
Đề tài nghiên cứu kỹ thuật Retrieval-Augmented Generation (RAG) và áp dụng để xây dựng hệ thống chatbot hỏi đáp đa tài liệu (Streamlit, LangChain, ChromaDB, Groq). Hệ thống cho phép người dùng tải lên các tệp PDF, DOCX, PPTX, CSV, XLSX, TXT và đặt câu hỏi bằng ngôn ngữ tự nhiên; câu trả lời được sinh dựa trên nội dung tài liệu, kèm trích dẫn nguồn. Các thành phần chính gồm: truy xuất đa ngôn ngữ hỗ trợ tiếng Việt (multilingual-e5 kết hợp BM25), xếp hạng lại bằng cross-encoder hợp nhất với thứ hạng lai, ghi nhớ hội thoại, mô tả hình ảnh trong PDF bằng mô hình thị giác - ngôn ngữ, prompt chống ảo giác, lưu chỉ mục bền vững. Điểm mở rộng của đề tài so với RAG thông thường: (1) chế độ Agent, trong đó LLM tự chọn công cụ - tra cứu tài liệu, truy vấn bảng dữ liệu, máy tính - để trả lời các câu hỏi cần tổng hợp và tính toán; (2) phát hiện mâu thuẫn giữa các tài liệu, cả sau từng câu trả lời lẫn khi rà soát toàn bộ kho tài liệu; (3) module đánh giá định lượng gồm so sánh 6 cấu hình truy xuất (ablation) và so sánh RAG cơ bản với Agent theo từng nhóm câu hỏi.
5. Nội dung báo cáo thực tập:
Chương 1. Đặt vấn đề và tổng quan giải pháp
- Bối cảnh, bài toán hỏi đáp trên tài liệu nội bộ, yêu cầu chức năng và phi chức năng; so sánh các hướng tiếp cận (fine-tuning, long-context, RAG). 
- Tổng quan giải pháp đề xuất.
Chương 2. Cơ sở lý thuyết và giải pháp kỹ thuật
- LLM, kỹ thuật RAG, embedding đa ngôn ngữ, cơ sở dữ liệu vector, BM25, truy xuất lai, cross-encoder, viết lại câu hỏi, RAG đa phương thức, agent gọi công cụ, phát hiện mâu thuẫn giữa tài liệu.
- Phương pháp đánh giá hệ thống RAG và các công nghệ sử dụng.
Chương 3. Triển khai và đánh giá hệ thống
- Phân tích vấn đề kỹ thuật, thiết kế, cài đặt, demo kết quả và đánh giá thực nghiệm (ablation các cấu hình truy xuất, so sánh RAG cơ bản với Agent).
Kết luận và hướng nghiên cứu trong tương lai.
- Những kết quả đạt được. 
- Những hạn chế và hướng phát triển.



Giảng viên hướng dẫn
(Ký, Ghi rõ họ tên)	Sinh viên thực hiện
(Ký, Ghi rõ họ tên)


 
ĐÁNH GIÁ ĐỒ ÁN THỰC TẬP TỐT NGHIỆP
(Dành cho cán bộ chấm thi)
Tiêu chí đánh giá:
Tiêu chí
đánh giá	Yếu (0 - 39%)	Trung Bình
(40-54%)	Khá (55-69%)	Giỏi (70-84%)	Xuất sắc
(85-100%)	Điểm tối đa	CB 1 (Cho lẻ đến 0.25)	CB 2 (Cho lẻ đến 0.25)
1. Báo cáo kết quả	3,0		
Nội dung trình bày đầy đủ, thời gian trình bày phù hợp	- Không có tài liệu trình bày, nội dung trình bày gần như không có	- Có chuẩn bị tài liệu trình bày, tuy nhiên tài liệu còn sơ sài.
- Thời gian trình bày các phần chưa hợp lý 	- Có chuẩn bị tài liệu, tài liệu bố cục chưa hợp lý
- Thời gian trình bày chưa hợp lý	- Có chuẩn bị tài liệu, bố cục tài liệu hợp lý
- Thời gian trình bày phù hợp	- Có sáng tạo trong cách thức trình bày kết quả
- Thời gian trình bày được phân bổ hợp lý	1,0		
Kết quả trả lời các câu hỏi phản biện và câu hỏi khác	- Không trả lời hoặc nội dung trả lời sai	- Trả lời được ít hơn 50% số câu hỏi, kết quả trả lời chưa tốt	- Trả lời được ít hơn 70% câu hỏi, kết quả trả lời phù hợp với nội dung câu hỏi	- Trả lời được ít hơn 85% câu hỏi, kết quả trả lời tốt so với nội dung câu hỏi	- Trả lời được toàn bộ câu hỏi, kết quả trả lời tốt so với nội dung câu hỏi	2,0		
2. Đánh giá kết quả thực hiện	6,0		
2.1 Hoàn thành và đảm bảo đầy đủ nội dung theo yêu cầu học phần thực tập tốt nghiệp	Hầu hết không hoàn thành và đảm bảo đầy đủ nội dung theo yêu cầu của học phần.	Hoàn thành báo cáo thực tập; hầu hết các nội dung thực nghiệm chưa hoàn thành theo yêu cầu của học phần.	Hoàn thành báo cáo thực tập; hoàn thành các nội dung cơ bản của thực nghiệm theo yêu cầu của học phần.	Một số nội dung chưa hoàn thành và đảm bảo đầy đủ theo yêu cầu của học phần.	Hoàn thành và đảm bảo đầy đủ nội dung theo yêu cầu của học phần.	4,0		
2.2 Đảm bảo yêu cầu về hình thức trình bày, bản vẽ, tham khảo, tỉ lệ trùng lặp 	- Hình thức trình bày, cấu trúc, định dạng không đúng quy định.
- Không trích dẫn tham khảo với các nội dung tham khảo
- Tỉ lệ trùng lặp dưới 20%	- Hình thức trình bày, cấu trúc, định dạng … phần lớn không đúng quy định.
- Còn rất nhiều nội dung tham khảo chưa trích dẫn
- Tỉ lệ trùng lặp dưới 20%	- Hình thức trình bày, cấu trúc, định dạng, … của nhiều nội dung không đúng quy định.
- Còn nhiều nội dung tham khảo chưa trích dẫn.
- Tỉ lệ trùng lặp dưới 20%	- Hình thức trình bày, cấu trúc, định dạng, … của một số nội dung không đúng quy định.
- Còn một số nội dung tham khảo chưa trích dẫn
- Tỉ lệ trùng lặp dưới 20%	- Hình thức trình bày, cấu trúc, định dạng, … đúng quy định và thống nhất.
- Các nội dung tham khảo được trích dẫn hết
- Tỉ lệ trùng lặp dưới 20%	2,0		
3. Tính khoa học và ứng dụng thực tiễn	1,0		
3.1 Tính mới, tính sáng tạo	Đề tài không có tính mới, tính sáng tạo	Đề tài có tính sáng tạo, có điểm mới so với các nội dung kế thừa.	0,5		
3.2 Phạm vi và mức độ ứng dụng	Không có khả năng áp dụng cũng như không có hướng phát triển cao hơn trong tương lai	Có khả năng ứng dụng vào thực tế nhưng khó có khả năng phát triển cao hơn trong tương lai	Có khả năng ứng dụng vào thực tế và có thể định hướng phát triển cao hơn trong tương lai	0,5		
TỔNG						10		
Lưu ý: Điểm chấm làm tròn đến một chữ số thập phân
Ngày        tháng      năm 20…
Cán bộ chấm thi 1
(Ký và ghi rõ họ tên)	Cán bộ chấm thi 2
(Ký và ghi rõ họ tên)

 
MỤC LỤC
LỜI NÓI ĐẦU	1
CHƯƠNG 1: ĐẶT VẤN ĐỀ VÀ TỔNG QUAN GIẢI PHÁP	2
1.1. Bối cảnh và lý do chọn đề tài	2
1.2. Phát biểu bài toán	2
1.2.1. Mô tả bài toán	2
1.2.2. Yêu cầu chức năng	3
1.2.3. Yêu cầu phi chức năng	4
1.3. Mục tiêu, đối tượng và phạm vi nghiên cứu	4
1.4. Các hướng tiếp cận	4
1.5. Tổng quan giải pháp đề xuất	5
1.6. Kết luận chương 1	5
CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ GIẢI PHÁP KỸ THUẬT	7
2.1. Mô hình ngôn ngữ lớn	7
2.1.1. Khái niệm và kiến trúc Transformer	7
2.1.2. Hạn chế của LLM khi trả lời câu hỏi về tài liệu riêng	7
2.2. Kỹ thuật Retrieval-Augmented Generation	7
2.2.1. Khái niệm	7
2.2.2. Quy trình hoạt động	7
2.2.3. Chia đoạn văn bản	8
2.3. Biểu diễn văn bản bằng vector và tìm kiếm ngữ nghĩa	8
2.3.1. Embedding văn bản	8
2.3.2. Mô hình embedding đa ngôn ngữ multilingual-e5	8
2.3.3. Cơ sở dữ liệu vector ChromaDB	9
2.4. Tìm kiếm từ khóa với thuật toán BM25	9
2.5. Truy xuất lai và xếp hạng lại	9
2.5.1. Truy xuất lai (hybrid retrieval)	9
2.5.2. Bi-encoder và cross-encoder	9
2.6. Hội thoại nhiều lượt và viết lại câu hỏi	10
2.7. RAG đa phương thức với mô hình thị giác - ngôn ngữ	10
2.8. Agent và cơ chế gọi công cụ	10
2.8.1. Hạn chế của RAG một lượt truy xuất	10
2.8.2. Gọi công cụ (tool calling) và vòng lặp agent	11
2.8.3. Kiểm soát hành vi của agent	11
2.9. Phát hiện mâu thuẫn giữa các tài liệu	11
2.10. Đánh giá hệ thống RAG	12
2.11. Các công nghệ sử dụng	12
2.12. Kết luận chương 2	13
CHƯƠNG 3: TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG	14
3.1. Các vấn đề kỹ thuật cần giải quyết	14
3.2. Thiết kế hệ thống	15
3.2.1. Kiến trúc tổng quan	15
3.2.2 Biểu đồ use-case	16
3.2.3. Quy trình lập chỉ mục	18
3.2.4. Quy trình truy vấn	18
3.2.5. Quy trình rà soát mâu thuẫn	19
3.2.6. Cấu trúc mã nguồn	20
3.3. Cài đặt các thành phần chính	21
3.3.1. Bộ nạp tài liệu đa định dạng	21
3.3.2. Mô tả ảnh bằng mô hình thị giác	21
3.3.3. Bộ truy xuất lai và xếp hạng lại	21
3.3.4. Chuỗi RAG có nhớ hội thoại	22
3.3.5. Agent gọi công cụ	22
3.3.6. Phát hiện mâu thuẫn	24
3.3.7. Lưu trữ chỉ mục bền vững	24
3.3.8. Module đánh giá	24
3.3.9. Các tham số cấu hình	25
3.4. Môi trường cài đặt và hướng dẫn sử dụng	26
3.5. Demo kết quả	26
3.6. Đánh giá thực nghiệm	34
3.6.1. Bộ dữ liệu và kịch bản thử nghiệm	34
3.6.2. So sánh RAG cơ bản và Agent	35
3.6.3. Đánh giá vai trò của các thành phần truy xuất	37
3.6.4. Đánh giá chức năng phát hiện mâu thuẫn	38
3.6.5. Nhận xét	38
3.7. Kết luận chương 3	39
KẾT LUẬN	40
TÀI LIỆU THAM KHẢO	42

DANH MỤC TỪ VIẾT TẮT
Từ viết tắt	Tiếng Anh	Nghĩa tiếng Việt
RAG	Retrieval-Augmented Generation	Sinh văn bản tăng cường truy xuất
LLM	Large Language Model	Mô hình ngôn ngữ lớn
VLM	Vision Language Model	Mô hình thị giác - ngôn ngữ
NLP	Natural Language Processing	Xử lý ngôn ngữ tự nhiên
BM25	Best Matching 25 (Okapi BM25)	Thuật toán xếp hạng theo từ khóa
IDF	Inverse Document Frequency	Tần suất tài liệu nghịch đảo
RRF	Reciprocal Rank Fusion	Hợp nhất theo nghịch đảo thứ hạng
MRR	Mean Reciprocal Rank	Trung bình nghịch đảo thứ hạng
HNSW	Hierarchical Navigable Small World	Đồ thị thế giới nhỏ phân cấp
MoE	Mixture of Experts	Kiến trúc hỗn hợp chuyên gia
API	Application Programming Interface	Giao diện lập trình ứng dụng
UI	User Interface	Giao diện người dùng
CPU / GPU	Central / Graphics Processing Unit	Bộ xử lý trung tâm / đồ họa
PDF	Portable Document Format	Định dạng tài liệu di động
CSV	Comma-Separated Values	Tệp dữ liệu phân tách bằng dấu phẩy
JSON	JavaScript Object Notation	Định dạng dữ liệu JSON
KPI	Key Performance Indicator	Chỉ số đánh giá hiệu quả công việc
AST	Abstract Syntax Tree	Cây cú pháp trừu tượng
DANH MỤC HÌNH ẢNH
Hình 2.1. Quy trình tổng quát của một hệ thống RAG	8
Hình 2.2. So sánh bi-encoder và cross-encoder	10
Hình 3.2. Biểu đồ use-case của hệ thống	16
Hình 3.3. Quy trình lập chỉ mục tài liệu	18
Hình 3.4. Quy trình xử lý câu hỏi	18
Hình 3.5. Quy trình xử lý câu hỏi ở chế độ Agent	19
Hình 3.6. Biểu đồ tuần tự của chức năng hỏi đáp (chế độ RAG cơ bản)	19
Hình 3.7. Quy trình rà soát mâu thuẫn trên toàn bộ kho tài liệu	20
Hình 3.8. Giao diện hệ thống sau khi tải lên bộ tài liệu thử nghiệm	27
Hình 3.9. Hỏi đáp kèm trích dẫn nguồn và đoạn văn gốc	28
Hình 3.10. Câu hỏi nối tiếp trong hội thoại nhiều lượt	29
Hình 3.11. Trả lời câu hỏi dựa trên nội dung biểu đồ trong PDF	30
Hình 3.12. RAG cơ bản và Agent với câu hỏi tổng hợp trên bảng dữ liệu	31
Hình 3.13. Agent áp dụng quy định để tính kết quả, và từ chối trả lời ngoài phạm vi tài liệu	32
Hình 3.14. Cảnh báo khi các nguồn mâu thuẫn nhau	33
Hình 3.15. Trang rà soát mâu thuẫn trên toàn bộ kho tài liệu	34
Hình 3.16. So sánh các cấu hình truy xuất (Hit@1 và MRR@4)	37

DANH MỤC BẢNG BIỂU
Bảng 1.1. Các yêu cầu chức năng của hệ thống	3
Bảng 1.2. So sánh các hướng tiếp cận	4
Bảng 2.1. Các công nghệ và thư viện sử dụng	11
Bảng 3.1. Các vấn đề kỹ thuật và giải pháp của hệ thống	13
Bảng 3.2. Đặc tả use-case “Đặt câu hỏi”	16
Bảng 3.3. Cấu trúc mã nguồn của hệ thống	19
Bảng 3.4. Các công cụ của agent	22
Bảng 3.5. Các tham số cấu hình chính của hệ thống	24
Bảng 3.6. Bộ tài liệu thử nghiệm	25
Bảng 3.7. Các nhóm câu hỏi trong bộ kiểm thử	33
Bảng 3.8. Kết quả tổng thể của hai chế độ trả lời	34
Bảng 3.9. Độ chính xác câu trả lời theo nhóm câu hỏi	34
Bảng 3.10. So sánh các cấu hình truy xuất	35
Bảng 3.11. Hiệu quả của bước hợp nhất trên phiên bản dữ liệu trước (15 đoạn)	36

LỜI CẢM ƠN
Trong quá trình thực tập tốt nghiệp và hoàn thành báo cáo này, em đã nhận được rất nhiều sự quan tâm, giúp đỡ của thầy cô, gia đình và bạn bè. Em xin bày tỏ lòng biết ơn sâu sắc tới [ĐIỀN: học vị, họ tên GVHD], giảng viên Khoa Công nghệ Thông tin, Trường Đại học Điện lực, người đã tận tình hướng dẫn, định hướng và góp ý cho em trong suốt quá trình thực hiện đề tài. Em xin chân thành cảm ơn [ĐIỀN: tên đơn vị thực tập] và [ĐIỀN: họ tên cán bộ hướng dẫn tại đơn vị] đã tạo điều kiện, hỗ trợ em trong thời gian thực tập. Em cũng xin cảm ơn các thầy cô Khoa Công nghệ Thông tin đã truyền đạt cho em những kiến thức nền tảng trong suốt những năm học tập tại trường.
Xin chân thành cảm ơn các anh, các chị và các bạn học lớp [ĐIỀN] Trường Đại học Điện lực đã luôn động viên, giúp đỡ và nhiệt tình chia sẻ với em những kinh nghiệm học tập, công tác trong suốt khoá học.
Và lời cuối cùng, em xin bày tỏ lòng chân thành và biết ơn tới cha mẹ, anh chị, những người trong gia đình và bạn bè đã luôn ở bên cạnh em những lúc khó khăn nhất, giúp em vượt qua khó khăn trong học tập cũng như trong cuộc sống.
	Hà Nội, ngày [ĐIỀN] tháng [ĐIỀN] năm 2026
Sinh viên thực hiện


Đào Duy Quyền
 
LỜI NÓI ĐẦU
Các mô hình ngôn ngữ lớn (Large Language Model - LLM) như GPT, Llama hay Qwen có thể trả lời câu hỏi bằng ngôn ngữ tự nhiên rất mạch lạc. Tuy nhiên, trong doanh nghiệp, mô hình không biết gì về quy chế, sổ tay hay báo cáo nội bộ, và khi không biết thì có xu hướng “bịa” ra câu trả lời nghe rất thuyết phục.
Kỹ thuật Retrieval-Augmented Generation (RAG) giải quyết vấn đề này bằng cách tìm các đoạn liên quan trong kho tài liệu rồi đưa vào ngữ cảnh để LLM trả lời dựa trên đó, kèm trích dẫn nguồn.
Trong thời gian thực tập, em thực hiện đề tài “Nghiên cứu và xây dựng hệ thống chatbot hỏi đáp đa tài liệu dựa trên RAG”. Ngoài các chức năng RAG cơ bản (đa định dạng, tiếng Việt, truy xuất lai, xếp hạng lại, nhớ hội thoại, hiểu ảnh trong PDF), đề tài mở rộng theo hai hướng: chế độ Agent tự gọi công cụ truy vấn bảng và tính toán để trả lời câu hỏi tổng hợp, và cơ chế phát hiện mâu thuẫn giữa các tài liệu. Hiệu quả của từng thành phần được đo bằng bộ công cụ đánh giá định lượng.
Nội dung báo cáo gồm 03 chương:
Chương 1: Đặt vấn đề - bối cảnh, bài toán, các hướng tiếp cận và tổng quan giải pháp.
Chương 2: Cơ sở lý thuyết - LLM, RAG, embedding, BM25, truy xuất lai, xếp hạng lại, agent gọi công cụ, phát hiện mâu thuẫn và phương pháp đánh giá.
Chương 3: Triển khai và đánh giá - thiết kế, cài đặt, demo và đánh giá thực nghiệm.
Do thời gian và kiến thức còn hạn chế, báo cáo không tránh khỏi những thiếu sót. Em rất mong nhận được ý kiến đóng góp của thầy cô và các bạn để đề tài được hoàn thiện hơn.
CHƯƠNG 1: ĐẶT VẤN ĐỀ VÀ TỔNG QUAN GIẢI PHÁP
1.1. Bối cảnh và lý do chọn đề tài
Tri thức của một tổ chức nằm rải rác trong nhiều tài liệu đa định dạng: sổ tay nhân viên, quy chế, slide sản phẩm, bảng danh sách dự án… Để tra một thông tin như “nhân viên được nghỉ phép bao nhiêu ngày”, người dùng phải tự tìm đúng tài liệu và đọc; nhân viên mới thường phải hỏi lại phòng nhân sự hoặc IT.
Tìm kiếm từ khóa chỉ trả về danh sách tài liệu chứ không trả lời trực tiếp, và thất bại khi người dùng diễn đạt khác tài liệu (hỏi “làm ở nhà” trong khi tài liệu viết “làm việc từ xa”).
LLM hiểu được câu hỏi tự nhiên nhưng không biết dữ liệu riêng và có thể sinh thông tin sai (ảo giác). RAG kết hợp hai thế mạnh: bộ truy xuất tìm đúng đoạn tài liệu, LLM tổng hợp câu trả lời và chỉ rõ nguồn.
RAG thông thường còn hai điểm yếu. Thứ nhất, chỉ vài đoạn được đưa vào ngữ cảnh nên hệ thống trả lời sai các câu hỏi cần tổng hợp trên cả một bảng (“có bao nhiêu dự án đang thực hiện”). Thứ hai, khi hai tài liệu nói khác nhau về cùng một nội dung, hệ thống lặng lẽ chọn một phiên bản mà người dùng không biết.
Phần lớn các dự án RAG mã nguồn mở được thiết kế cho tiếng Anh, dừng ở mức minh họa và chưa đo được chất lượng. Vì vậy em chọn đề tài này với mục tiêu xây dựng hệ thống RAG hoạt động tốt với tiếng Việt, khắc phục hai điểm yếu trên và đo được đóng góp của từng thành phần.
1.2. Phát biểu bài toán
1.2.1. Mô tả bài toán
Cho một tập tài liệu PDF, DOCX, PPTX, CSV, XLSX, TXT (PDF có thể chứa biểu đồ, sơ đồ) và các câu hỏi bằng tiếng Việt hoặc tiếng Anh, có thể nối tiếp nhau trong hội thoại. Hệ thống cần:
- Tìm các đoạn tài liệu liên quan và trả lời chính xác bằng ngôn ngữ của câu hỏi.
- Chỉ rõ nguồn (tệp, trang hoặc slide) và cho xem đoạn văn gốc.
- Nói rõ khi tài liệu không có thông tin, không tự suy diễn.
- Trả lời đúng câu hỏi tổng hợp trên bảng (đếm, lọc, tính tổng, xếp hạng) và câu hỏi cần tính toán.
- Cảnh báo khi các tài liệu mâu thuẫn nhau, nêu đủ các phiên bản.
1.2.2. Yêu cầu chức năng
Bảng 1.1. Các yêu cầu chức năng của hệ thống
Mã	Chức năng	Mô tả
F1	Tải lên tài liệu	Tải lên đồng thời nhiều tệp PDF, DOCX, PPTX, CSV, XLSX, TXT
F2	Lập chỉ mục	Trích xuất văn bản, mô tả hình ảnh, chia đoạn, tạo vector và lưu chỉ mục
F3	Hỏi đáp	Nhận câu hỏi bằng ngôn ngữ tự nhiên và trả lời dựa trên tài liệu
F4	Hội thoại nhiều lượt	Hiểu các câu hỏi nối tiếp có đại từ thay thế (“nó”, “cô ấy”, “còn … thì sao”)
F5	Trích dẫn nguồn	Hiển thị tên tệp, trang/slide và đoạn văn gốc đã dùng để trả lời
F6	Lọc theo tệp	Giới hạn phạm vi tìm kiếm trong một tệp cụ thể
F7	Cấu hình tham số	Điều chỉnh kích thước đoạn, độ chồng lấp, số đoạn truy xuất
F8	Đánh giá	Chạy bộ câu hỏi kiểm thử; so sánh các cấu hình truy xuất và hai chế độ trả lời
F9	Chế độ Agent	Tự chọn công cụ: tra cứu tài liệu, truy vấn bảng (đếm, lọc, tính tổng, xếp hạng), máy tính chính xác; hiển thị các bước đã thực hiện
F10	Cảnh báo mâu thuẫn	Phát hiện các nguồn mâu thuẫn trong câu trả lời và hiển thị cả hai phiên bản
F11	Rà soát kho tài liệu	Quét toàn bộ tài liệu để tìm các phát biểu mâu thuẫn giữa các tệp

1.2.3. Yêu cầu phi chức năng
Yêu cầu phi chức năng gồm: chính xác và có trích dẫn; hỗ trợ tiếng Việt và hỏi chéo ngôn ngữ; không xử lý lại tài liệu khi mở lại, câu trả lời hiển thị dạng streaming; chạy được trên máy không có GPU với dịch vụ LLM miễn phí; mã nguồn chia module rõ ràng; minh bạch - người dùng xem được các bước agent đã thực hiện.
1.3. Mục tiêu, đối tượng và phạm vi nghiên cứu
Mục tiêu: (1) nghiên cứu kỹ thuật RAG và các kỹ thuật truy xuất liên quan; (2) phân tích vấn đề khi áp dụng cho tiếng Việt; (3) xây dựng hệ thống, mở rộng bằng agent gọi công cụ và phát hiện mâu thuẫn; (4) đánh giá định lượng đóng góp của từng thành phần.
Đối tượng nghiên cứu là các kỹ thuật trong chuỗi RAG: trích xuất tài liệu, chia đoạn, embedding đa ngôn ngữ, BM25, truy xuất lai, cross-encoder, viết lại câu hỏi, mô tả ảnh, gọi công cụ, phát hiện mâu thuẫn và đánh giá bằng LLM.
Phạm vi: hệ thống chạy cục bộ cho một người dùng; dữ liệu thử nghiệm là tài liệu nội bộ giả lập tiếng Việt; LLM gọi qua dịch vụ Groq; không tinh chỉnh mô hình và không xây dựng phân quyền.
1.4. Các hướng tiếp cận
Có ba hướng để LLM trả lời câu hỏi về tài liệu riêng: tinh chỉnh mô hình (fine-tuning) trên tài liệu nội bộ, đưa toàn bộ tài liệu vào cửa sổ ngữ cảnh dài (long-context), và RAG - chỉ đưa vào ngữ cảnh vài đoạn liên quan nhất. Bảng 1.2 so sánh ba hướng này.
Bảng 1.2. So sánh các hướng tiếp cận
Tiêu chí	Fine-tuning	Long-context	RAG
Chi phí xây dựng	Cao (cần GPU, dữ liệu huấn luyện)	Thấp	Thấp
Chi phí mỗi câu hỏi	Thấp	Rất cao	Thấp
Cập nhật tài liệu	Phải huấn luyện lại	Tức thì	Tức thì (lập chỉ mục lại)
Trích dẫn nguồn	Khó	Có thể	Dễ
Kiểm soát ảo giác	Kém	Trung bình	Tốt (nếu truy xuất tốt)
Quy mô kho tài liệu	Lớn	Giới hạn bởi cửa sổ ngữ cảnh	Lớn

RAG có chi phí thấp, cập nhật tài liệu tức thì và dễ trích dẫn nguồn nên phù hợp nhất với bài toán và điều kiện của đề tài; chất lượng của RAG phụ thuộc chủ yếu vào bước truy xuất.
1.5. Tổng quan giải pháp đề xuất
- Truy xuất: multilingual-e5 kết hợp BM25 (tách từ Unicode cho tiếng Việt), xếp hạng lại bằng cross-encoder đa ngôn ngữ, hợp nhất thứ hạng bằng Reciprocal Rank Fusion.
- Hội thoại nhiều lượt: viết lại câu hỏi theo lịch sử trước khi truy xuất.
- RAG đa phương thức: mô hình thị giác mô tả và trích chữ từ ảnh trong PDF.
- Bộ nạp đa định dạng với metadata trích dẫn thống nhất; bảng được giữ ở dạng có cấu trúc để truy vấn.
- Prompt chống ảo giác, bắt buộc trích dẫn; chỉ mục lưu bền vững trên đĩa, câu trả lời dạng streaming.
- Đánh giá: 32 câu hỏi chia 6 nhóm; ablation 6 cấu hình truy xuất; so sánh RAG cơ bản với Agent.
- Chế độ Agent: LLM tự chọn công cụ - tra cứu tài liệu, truy vấn bảng, máy tính - trước khi trả lời.
- Phát hiện mâu thuẫn sau mỗi câu trả lời và rà soát mâu thuẫn trên toàn bộ kho tài liệu.
1.6. Kết luận chương 1
Chương 1 đã phát biểu bài toán hỏi đáp trên tài liệu nội bộ với 11 yêu cầu chức năng, trong đó có trả lời câu hỏi tổng hợp trên bảng và cảnh báo mâu thuẫn. Qua so sánh ba hướng tiếp cận, đề tài chọn RAG và đề xuất giải pháp tập trung vào: truy xuất tốt cho tiếng Việt, hội thoại nhiều lượt, khai thác ảnh, agent gọi công cụ, phát hiện mâu thuẫn và đánh giá định lượng. Chương 2 trình bày cơ sở lý thuyết của các kỹ thuật này.
CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ GIẢI PHÁP KỸ THUẬT
Chương này trình bày các kiến thức nền tảng và công nghệ được sử dụng trong đề tài.
2.1. Mô hình ngôn ngữ lớn
2.1.1. Khái niệm và kiến trúc Transformer
LLM là mô hình ngôn ngữ hàng tỷ tham số dự đoán token tiếp theo, phần lớn dựa trên kiến trúc Transformer [2]. Cốt lõi của Transformer là cơ chế tự chú ý, cho phép mỗi token “nhìn” tới mọi token khác trong chuỗi:
Attention(Q, K, V) = softmax( Q·Kᵀ / √dₖ ) · V
với dₖ là số chiều vector khóa. Khối mã hóa (encoder, như BERT) dùng để hiểu văn bản - đề tài dùng cho embedding và xếp hạng lại; khối giải mã (decoder, như GPT) dùng để sinh câu trả lời.
LLM của đề tài là gpt-oss-120b [11], mô hình trọng số mở kiến trúc Mixture-of-Experts (117 tỷ tham số, chỉ kích hoạt khoảng 5,1 tỷ cho mỗi token), truy cập qua Groq [13].
2.1.2. Hạn chế của LLM khi trả lời câu hỏi về tài liệu riêng
- Kiến thức tĩnh: không biết tài liệu nội bộ và thông tin mới.
- Ảo giác: vẫn sinh câu trả lời trôi chảy nhưng sai khi không biết.
- Không có nguồn để kiểm chứng câu trả lời.
- Cửa sổ ngữ cảnh giới hạn, chi phí tỷ lệ với số token.
2.2. Kỹ thuật Retrieval-Augmented Generation
2.2.1. Khái niệm
RAG được Lewis và cộng sự đề xuất năm 2020 [1]: một bộ truy xuất tìm các đoạn văn liên quan trong kho tri thức bên ngoài, một mô hình ngôn ngữ đọc các đoạn đó trong ngữ cảnh và tổng hợp câu trả lời [8].
2.2.2. Quy trình hoạt động
Một hệ thống RAG gồm hai giai đoạn (Hình 2.1):
- Lập chỉ mục (offline): tài liệu được chia đoạn, mỗi đoạn được embedding thành vector và lưu vào cơ sở dữ liệu vector cùng metadata (tệp, trang).
- Truy vấn (online): câu hỏi được chuyển thành vector, tìm các đoạn gần nhất và đưa vào prompt cho LLM sinh câu trả lời kèm nguồn.
 
Hình 2.1. Quy trình tổng quát của một hệ thống RAG
2.2.3. Chia đoạn văn bản
Tài liệu được chia nhỏ vì mô hình embedding chỉ nhận tối đa 512 token và đoạn ngắn, đúng trọng tâm cho kết quả tốt hơn. Đề tài dùng RecursiveCharacterTextSplitter của LangChain: tách lần lượt theo đoạn văn, xuống dòng, khoảng trắng, mỗi đoạn tối đa 1000 ký tự, hai đoạn liền kề chồng lấp 200 ký tự để không mất ngữ cảnh ở ranh giới.
2.3. Biểu diễn văn bản bằng vector và tìm kiếm ngữ nghĩa
2.3.1. Embedding văn bản
Embedding ánh xạ đoạn văn thành vector sao cho các đoạn có nghĩa gần nhau có vector gần nhau. Các mô hình như Sentence-BERT [4] dùng Transformer encoder và được huấn luyện tương phản trên các cặp câu hỏi - đoạn văn. Độ tương đồng thường đo bằng cosin (bằng tích vô hướng khi vector đã chuẩn hóa):
cos(u, v) = (u · v) / (‖u‖ · ‖v‖)
2.3.2. Mô hình embedding đa ngôn ngữ multilingual-e5
Các mô hình như all-MiniLM-L6-v2 chủ yếu học tiếng Anh nên biểu diễn kém tiếng Việt. Đề tài dùng intfloat/multilingual-e5-small [5]: 12 tầng, vector 384 chiều, 512 token, huấn luyện trên khoảng 100 ngôn ngữ và hỗ trợ truy vấn chéo ngôn ngữ. Mô hình yêu cầu tiền tố “query: ” cho câu hỏi và “passage: ” cho đoạn văn; bỏ tiền tố làm chất lượng giảm rõ rệt.
2.3.3. Cơ sở dữ liệu vector ChromaDB
ChromaDB [12] lưu vector, văn bản và metadata, tìm láng giềng gần đúng bằng chỉ mục HNSW [10] - đồ thị nhiều tầng cho độ phức tạp tìm kiếm xấp xỉ logarit. Đề tài dùng thêm hai tính năng: lưu bền vững trên đĩa và lọc theo metadata.
2.4. Tìm kiếm từ khóa với thuật toán BM25
Tìm kiếm vector kém với mã số, tên riêng (“DA04”, “SunCRM”, “8888”). BM25 [3] xếp hạng theo từ khóa và khắc phục điểm yếu này. Điểm của tài liệu D với truy vấn Q:
score(D, Q) = Σᵢ IDF(qᵢ) · f(qᵢ, D)·(k₁ + 1) / ( f(qᵢ, D) + k₁·(1 − b + b·|D| / avgdl) )
Trong đó f(qᵢ, D) là tần suất của qᵢ trong D, |D| là độ dài tài liệu, avgdl là độ dài trung bình, k₁ và b là tham số; IDF cho trọng số cao với từ hiếm. Đề tài dùng BM25Okapi của thư viện rank-bm25, tách từ ở mức âm tiết tiếng Việt bằng biểu thức Unicode “\w+” trên văn bản chữ thường.
2.5. Truy xuất lai và xếp hạng lại
2.5.1. Truy xuất lai (hybrid retrieval)
Truy xuất lai kết hợp tìm kiếm vector (mạnh về ngữ nghĩa) và BM25 (mạnh về khớp chính xác). Reciprocal Rank Fusion (RRF) [17] hợp nhất các danh sách xếp hạng mà không cần chuẩn hóa điểm:
RRF(d) = Σᵣ 1 / ( k + rankᵣ(d) ),   k = 60
Đề tài lấy 10 ứng viên từ mỗi phương pháp, hợp nhất bằng RRF, xếp hạng lại bằng cross-encoder, rồi hợp nhất thêm lần nữa thứ hạng cross-encoder với thứ hạng lai. Bước cuối được bổ sung sau khi thực nghiệm (mục 3.6.3) cho thấy cross-encoder có lúc xếp sai các đoạn dạng bảng.
2.5.2. Bi-encoder và cross-encoder
Mô hình embedding là bi-encoder: câu hỏi và đoạn văn được mã hóa độc lập, nên vector đoạn văn tính trước được và tìm kiếm rất nhanh, nhưng hai chuỗi không “nhìn thấy” nhau.
Cross-encoder đưa cả cặp (câu hỏi, đoạn văn) vào một mô hình và trả về một điểm liên quan (Hình 2.2), chính xác hơn rõ rệt [6] nhưng phải chạy cho từng cặp, nên chỉ dùng để xếp hạng lại vài chục ứng viên.
 
Hình 2.2. So sánh bi-encoder và cross-encoder
Đề tài dùng cross-encoder/mmarco-mMiniLMv2-L12-H384-v1, huấn luyện trên mMARCO [7] - bản dịch đa ngôn ngữ (có tiếng Việt) của MS MARCO.
2.6. Hội thoại nhiều lượt và viết lại câu hỏi
Câu hỏi nối tiếp như “Còn thời gian thử việc thì sao?” không đủ thông tin để truy xuất. Đề tài dùng bước viết lại câu hỏi: LLM nhận lịch sử hội thoại và viết lại thành câu hỏi độc lập, giữ nguyên ngôn ngữ, rồi dùng câu này để truy xuất (create_history_aware_retriever của LangChain).
2.7. RAG đa phương thức với mô hình thị giác - ngôn ngữ
Thông tin trong biểu đồ, sơ đồ của PDF không đọc được bằng trích xuất văn bản. Đề tài trích ảnh bằng PyMuPDF, gửi tới mô hình thị giác - ngôn ngữ qwen3.8-27b để chép lại chữ, số liệu và mô tả ý nghĩa; mô tả được lập chỉ mục như một đoạn văn bản có metadata loại “image” và số trang.
2.8. Agent và cơ chế gọi công cụ
2.8.1. Hạn chế của RAG một lượt truy xuất
RAG một lượt (truy xuất một lần rồi trả lời) thất bại với ba loại câu hỏi thường gặp:
- Tổng hợp trên bảng: bảng bị chia thành nhiều đoạn, LLM chỉ thấy vài đoạn nên không đếm, cộng đúng được.
- Tính toán: LLM sinh văn bản theo xác suất nên dễ tính sai.
- Nhiều bước: tra một quy định rồi áp dụng vào số liệu của người hỏi.
2.8.2. Gọi công cụ (tool calling) và vòng lặp agent
Với cơ chế gọi công cụ (tool calling), ứng dụng mô tả các công cụ cho LLM bằng lược đồ JSON; mô hình có thể trả về một lời gọi có cấu trúc thay vì trả lời ngay, ứng dụng thực thi và đưa kết quả trở lại để mô hình quyết định bước tiếp theo. Vòng lặp “suy luận - hành động - quan sát” này là ý tưởng của ReAct [15]; Toolformer [16] cho thấy LLM có thể tự quyết định khi nào cần công cụ. Hệ thống như vậy được gọi là agent.
Trong đề tài, câu hỏi tra cứu dùng bộ truy xuất lai, câu hỏi tổng hợp truy vấn trực tiếp bảng dữ liệu, phép tính dùng bộ tính toán chính xác; LLM chỉ hiểu câu hỏi, chọn công cụ và diễn đạt kết quả.
2.8.3. Kiểm soát hành vi của agent
Các ràng buộc để kiểm soát agent:
- Vòng đầu bắt buộc gọi công cụ, không được trả lời từ trí nhớ.
- Giới hạn số vòng và số lần tìm kiếm; hết ngân sách thì buộc trả lời.
- Lỗi của công cụ được trả lại cho mô hình để tự sửa lời gọi.
- Biểu thức được tính bằng cây cú pháp trừu tượng (AST), không dùng eval.
2.9. Phát hiện mâu thuẫn giữa các tài liệu
Khi một tài liệu được cập nhật mà tài liệu khác thì không, chúng mâu thuẫn nhau. RAG thông thường trả lời theo đoạn được xếp hạng cao hơn, nên người dùng nhận một câu trả lời chắc chắn nhưng có thể là thông tin cũ.
Đề tài dùng LLM để kiểm tra mâu thuẫn (một dạng suy luận ngôn ngữ tự nhiên): mô hình nhận các đoạn văn đánh số, chỉ ra các phát biểu khác nhau về cùng một đối tượng (số liệu, ngày, giới hạn, quy tắc) và trả về JSON. Áp dụng ở hai mức:
- Theo câu trả lời: kiểm tra các đoạn nguồn khi chúng đến từ ít nhất hai tệp.
- Toàn kho: thay vì kiểm tra mọi cặp (tăng theo bình phương), chỉ ghép mỗi đoạn với k đoạn gần nhất về embedding ở tệp khác - hai phát biểu mâu thuẫn nói về cùng chủ đề nên thường gần nhau - rồi giữ M cặp gần nhất; số lời gọi LLM chỉ còn ⌈M / b⌉ với b cặp mỗi lần gọi.
2.10. Đánh giá hệ thống RAG
Đề tài đánh giá cả truy xuất và câu trả lời trên bộ câu hỏi có nguồn và đáp án kỳ vọng.
Hit Rate@K là tỷ lệ câu hỏi có đoạn đúng nguồn (và trang) trong K đoạn truy xuất; MRR là trung bình nghịch đảo thứ hạng của đoạn đúng đầu tiên (bằng 0 nếu không tìm thấy):
HitRate@K = (1/|Q|) · Σ 𝟙[ rankᵢ ≤ K ]
MRR = (1/|Q|) · Σ 1 / rankᵢ
Độ chính xác câu trả lời được chấm bằng LLM-as-a-judge [9]: một LLM so sánh câu trả lời với đáp án tham chiếu và chấm 1, 0,5 hoặc 0; câu hỏi ngoài phạm vi được tính đúng khi hệ thống nói rõ là không có thông tin.
Đóng góp của từng thành phần được đo bằng ablation: chạy cùng bộ câu hỏi với nhiều cấu hình truy xuất, mỗi cấu hình bỏ hoặc thay một thành phần (không cần gọi LLM). Các câu hỏi được chia nhóm để so sánh RAG cơ bản và Agent theo từng loại, tránh để giá trị trung bình che mất điểm yếu cụ thể.
2.11. Các công nghệ sử dụng
Bảng 2.1. Các công nghệ và thư viện sử dụng
Công nghệ	Vai trò trong hệ thống
Python 3.9	Ngôn ngữ lập trình chính
Streamlit	Xây dựng giao diện web: tải tệp, khung chat, thanh cấu hình
LangChain	Điều phối chuỗi RAG: retriever, prompt, chuỗi truy xuất có lịch sử; gọi công cụ (bind_tools)
ChromaDB	Cơ sở dữ liệu vector, lưu bền vững trên đĩa, lọc theo metadata
SentenceTransformers	Chạy mô hình embedding và cross-encoder trên CPU
rank-bm25	Cài đặt thuật toán BM25Okapi
Groq API	Dịch vụ suy luận LLM tốc độ cao: gpt-oss-120b, qwen3.8-27b
pypdf, PyMuPDF	Trích văn bản và ảnh từ PDF
python-docx, python-pptx, pandas, openpyxl	Đọc tệp Word, PowerPoint, CSV, Excel; truy vấn bảng dữ liệu cho agent
python-dotenv	Đọc khóa API từ tệp .env

Giao diện dùng Streamlit [14]; LangChain [12] ghép các bước RAG và gắn công cụ cho mô hình (bind_tools); Groq [13] cung cấp API suy luận nhanh, có gói miễn phí nhưng giới hạn số token mỗi phút và mỗi ngày.
2.12. Kết luận chương 2
Chương 2 đã trình bày cơ sở lý thuyết của các kỹ thuật được sử dụng: RAG, embedding đa ngôn ngữ, BM25, truy xuất lai và RRF, cross-encoder, viết lại câu hỏi, mô tả ảnh, agent gọi công cụ, phát hiện mâu thuẫn và các phương pháp đánh giá. Chương 3 áp dụng các kỹ thuật này để xây dựng và đánh giá hệ thống.
CHƯƠNG 3: TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG
3.1. Các vấn đề kỹ thuật cần giải quyết
Bảng 3.1 tổng hợp các vấn đề kỹ thuật chính và giải pháp tương ứng của hệ thống.
Bảng 3.1. Các vấn đề kỹ thuật và giải pháp của hệ thống
Vấn đề	Ảnh hưởng nếu không xử lý	Giải pháp của hệ thống
Mô hình embedding chỉ huấn luyện tiếng Anh	Truy xuất kém với tài liệu tiếng Việt, không hỗ trợ hỏi chéo ngôn ngữ	multilingual-e5-small với tiền tố query/passage
Tìm kiếm vector yếu với mã số, tên riêng	Bỏ sót các câu hỏi chứa mã dự án, tên sản phẩm, số máy lẻ	Truy xuất lai vector + BM25 với tách từ Unicode
Thứ hạng các đoạn ứng viên chưa chính xác	Đoạn đúng bị đẩy xuống, LLM nhận ngữ cảnh nhiễu	Xếp hạng lại bằng cross-encoder đa ngôn ngữ mMARCO, hợp nhất với thứ hạng lai bằng RRF
Câu hỏi nối tiếp phụ thuộc ngữ cảnh	Không tìm được đoạn liên quan khi câu hỏi dùng đại từ	Viết lại câu hỏi theo lịch sử hội thoại
Thông tin nằm trong hình ảnh	Không trả lời được câu hỏi về biểu đồ, sơ đồ	Mô tả ảnh bằng mô hình thị giác - ngôn ngữ
LLM có xu hướng bịa câu trả lời	Thông tin sai, mất độ tin cậy	Prompt chống ảo giác, bắt buộc trích dẫn nguồn
Bảng trong DOCX, dữ liệu CSV, slide PPTX	Mất dữ liệu bảng, khó truy xuất từng bản ghi, trích dẫn không chính xác	Đọc bảng DOCX, mỗi dòng CSV thành bản ghi “cột: giá trị”, tách PPTX theo slide
Xử lý lại tài liệu mỗi lần thay đổi cấu hình	Chậm, lãng phí tài nguyên	Lưu chỉ mục bền vững theo khóa băm, lọc bằng metadata, lưu đệm mô hình
Thiếu cách đo chất lượng	Không biết hệ thống trả lời đúng hay sai	Bộ câu hỏi kiểm thử: Hit Rate, MRR, LLM-as-a-judge
Câu hỏi đếm, tính tổng, xếp hạng trên bảng dữ liệu	Bảng nằm rải trên nhiều đoạn, LLM chỉ thấy vài đoạn nên đếm và tính sai	Agent với công cụ query_table truy vấn trực tiếp bảng (pandas)
Câu hỏi cần tính toán theo quy định	LLM tính nhẩm dễ sai	Công cụ calculate dựa trên cây cú pháp (AST)
Các tài liệu mâu thuẫn nhau	Hệ thống tự chọn một phiên bản, người dùng không biết có mâu thuẫn	Kiểm tra mâu thuẫn sau mỗi câu trả lời và rà soát toàn bộ kho tài liệu

3.2. Thiết kế hệ thống
3.2.1. Kiến trúc tổng quan
Hệ thống gồm năm tầng (Hình 3.1): giao diện Streamlit ba trang (Chat, Knowledge audit, Evaluation); tầng xử lý (nạp tài liệu, mô tả ảnh, truy xuất, agent, phát hiện mâu thuẫn, đánh giá); tầng công cụ; tầng mô hình (cục bộ và qua Groq); tầng dữ liệu (ChromaDB, bảng DataFrame, cấu hình).
 
Hình 3.1. Kiến trúc tổng quan của hệ thống
3.2.2 Biểu đồ use-case
Hệ thống có hai tác nhân: người dùng (tải tài liệu, chọn chế độ, đặt câu hỏi) và người quản trị/đánh giá (rà soát mâu thuẫn, chạy đánh giá) (Hình 3.2).
 
Hình 3.2. Biểu đồ use-case của hệ thống
Use-case quan trọng nhất của hệ thống là “Đặt câu hỏi”, được đặc tả chi tiết ở Bảng 3.2.
Bảng 3.2. Đặc tả use-case “Đặt câu hỏi”
Thành phần	Nội dung
Tác nhân	Người dùng
Tiền điều kiện	Đã tải lên ít nhất một tài liệu và hệ thống đã lập chỉ mục xong
Luồng chính	1. Người dùng nhập câu hỏi vào khung chat. 
2. Hệ thống lấy 6 tin nhắn gần nhất làm lịch sử. 
3a. Chế độ RAG cơ bản: LLM viết lại câu hỏi thành câu độc lập, bộ truy xuất lai tìm và xếp hạng lại các đoạn liên quan, LLM sinh câu trả lời. 
3b. Chế độ Agent: LLM chọn và gọi các công cụ (tra cứu, truy vấn bảng, tính toán), các bước được hiển thị trực tiếp, sau đó sinh câu trả lời. 
4. Câu trả lời được hiển thị dạng streaming. 
5. Nếu các nguồn đến từ nhiều tệp, hệ thống kiểm tra mâu thuẫn và hiển thị cảnh báo. 
6. Hệ thống hiển thị danh sách nguồn, các bước công cụ và thời gian phản hồi
Luồng thay thế	4a. Không có đoạn liên quan: LLM trả lời tài liệu không chứa thông tin. 
5a. Lỗi gọi API: hệ thống hiển thị thông báo lỗi, giữ nguyên lịch sử chat
Hậu điều kiện	Câu hỏi và câu trả lời kèm nguồn được lưu vào lịch sử hội thoại của phiên

3.2.3. Quy trình lập chỉ mục
Hệ thống tính khóa SHA-256 từ tên, nội dung các tệp và các tham số chỉ mục. Nếu thư mục chroma_db/<khóa> đã có, chỉ mục được nạp lại từ đĩa; nếu chưa, hệ thống đọc tệp, mô tả ảnh, chia đoạn, tạo embedding và lưu vào ChromaDB (Hình 3.3).
 
Hình 3.3. Quy trình lập chỉ mục tài liệu
3.2.4. Quy trình truy vấn
Ở chế độ RAG cơ bản (Hình 3.4), câu hỏi được viết lại theo lịch sử; bộ truy xuất lấy 10 ứng viên từ mỗi phương pháp, hợp nhất RRF, xếp hạng lại bằng cross-encoder, hợp nhất lần nữa với thứ hạng lai và giữ 4 đoạn; các đoạn kèm nhãn [Nguồn | Trang] được đưa vào prompt và câu trả lời được stream ra màn hình (Hình 3.6).
 
Hình 3.4. Quy trình xử lý câu hỏi
Ở chế độ Agent (Hình 3.5), LLM nhận câu hỏi, lịch sử, mô tả các bảng và định nghĩa ba công cụ. Mỗi lời gọi công cụ được thực thi, đưa kết quả trở lại và hiển thị lên giao diện; khi mô hình trả về văn bản, đó là câu trả lời cuối. Vòng đầu bắt buộc gọi công cụ; tối đa 5 vòng hoặc 3 lần tìm kiếm.
 
Hình 3.5. Quy trình xử lý câu hỏi ở chế độ Agent
 
Hình 3.6. Biểu đồ tuần tự của chức năng hỏi đáp (chế độ RAG cơ bản)
3.2.5. Quy trình rà soát mâu thuẫn
Khi rà soát (Hình 3.7), mỗi đoạn được ghép với 2 đoạn gần nhất ở tệp khác; sau khi loại trùng, 16 cặp gần nhất được gửi tới LLM theo lô 4 cặp, tức chỉ 4 lời gọi.
 
Hình 3.7. Quy trình rà soát mâu thuẫn trên toàn bộ kho tài liệu
3.2.6. Cấu trúc mã nguồn
Bảng 3.3. Cấu trúc mã nguồn của hệ thống
Tệp / thư mục	Chức năng
app.py	Giao diện Streamlit ba trang (Chat, Knowledge audit, Evaluation), lập chỉ mục, khung chat streaming, hiển thị bước công cụ và cảnh báo mâu thuẫn
config.py	Tên các mô hình và tham số cấu hình, nạp biến môi trường từ .env
loaders/multi_loader.py	Đọc PDF, TXT, DOCX (cả bảng), CSV và XLSX (theo dòng), PPTX (theo slide)
loaders/image_pdf_loader.py	Trích ảnh trong PDF, bỏ ảnh nhỏ và ảnh lặp lại
services/image_captioner.py	Mô tả ảnh bằng mô hình thị giác qua Groq
services/chunker.py	Chia đoạn văn bản
services/embeddings.py	Mô hình embedding multilingual-e5 với tiền tố query/passage
services/vector_db.py	Tạo, lưu và nạp chỉ mục ChromaDB theo khóa băm
services/reranker.py	Xếp hạng lại bằng cross-encoder
services/rag.py	Bộ truy xuất với 6 chế độ (phục vụ ablation), hợp nhất RRF, chuỗi RAG có nhớ hội thoại, định dạng nguồn
services/agent.py	Vòng lặp agent: gọi công cụ, giới hạn vòng/lần tìm kiếm, streaming câu trả lời
services/tools.py	TableStore (truy vấn bảng bằng pandas), máy tính AST an toàn, lược đồ JSON của công cụ
services/conflicts.py	Kiểm tra mâu thuẫn theo câu trả lời và rà soát toàn bộ kho tài liệu
services/llm.py	Khởi tạo LLM Groq
services/evaluator.py	Ablation 6 cấu hình truy xuất; đánh giá câu trả lời theo nhóm câu hỏi bằng LLM-as-a-judge
prompts/prompt.py	Các prompt: viết lại câu hỏi, sinh câu trả lời, agent, phát hiện mâu thuẫn, chấm điểm
demo_data/	Bộ tài liệu thử nghiệm và bộ câu hỏi kiểm thử

3.3. Cài đặt các thành phần chính
3.3.1. Bộ nạp tài liệu đa định dạng
MultiLoader gắn cho mọi đoạn metadata source (tệp) và page_label (trang). PDF được đọc theo trang (chuẩn hóa ký tự \xa0), PPTX theo slide, DOCX gồm cả bảng, mỗi dòng CSV/XLSX thành bản ghi “cột: giá trị | …”. Các bảng CSV, XLSX, DOCX còn được giữ ở dạng DataFrame cho agent. Ảnh PDF được trích bằng PyMuPDF, bỏ ảnh nhỏ hơn 100 điểm ảnh và ảnh lặp lại, tối đa 10 ảnh mỗi tệp.
3.3.2. Mô tả ảnh bằng mô hình thị giác
Ảnh được thu nhỏ về tối đa 1024 × 1024, mã hóa JPEG base64 và gửi tới qwen3.8-27b với yêu cầu chép chính xác chữ, số liệu và giải thích biểu đồ (tối đa 120 từ); nếu gọi API lỗi, hệ thống dùng mô tả mặc định. Nhờ đó, câu hỏi “Doanh thu năm 2024 là bao nhiêu?” - số liệu chỉ có trong biểu đồ cột ở trang 4 - được trả lời đúng.
3.3.3. Bộ truy xuất lai và xếp hạng lại
HybridRetriever kế thừa BaseRetriever của LangChain, dựng chỉ mục BM25 từ các đoạn khi khởi tạo và hỗ trợ 6 chế độ phục vụ thực nghiệm. Chế độ mặc định:
def _get_relevant_documents(self, query, **kwargs):
    # 1. Tìm kiếm vector, lọc theo tệp bằng metadata
    vector_docs = self.vector_db.similarity_search(
        query, k=self.top_k,
        filter={"source": self.source_filter} if self.source_filter else None)
    # 2. Tìm kiếm từ khóa BM25
    scores = self.bm25.get_scores(tokenize(query))
    ranked = sorted(range(len(scores)), key=lambda i: scores[i],
                    reverse=True)[:self.top_k]
    keyword_docs = [self.documents[i] for i in ranked if scores[i] > 0]
    # 3. Hợp nhất hai danh sách bằng Reciprocal Rank Fusion
    merged = reciprocal_rank_fusion([vector_docs, keyword_docs])
    # 4. Xếp hạng lại toàn bộ ứng viên bằng cross-encoder
    reranked = self.reranker.rerank(query, merged, top_n=len(merged))
    # 5. Hợp nhất thứ hạng cross-encoder với thứ hạng lai, giữ top_n đoạn
    return reciprocal_rank_fusion([reranked, merged])[:self.top_n]

reciprocal_rank_fusion cộng điểm 1/(60 + thứ hạng) của mỗi đoạn; cross-encoder chấm tất cả các cặp trong một lần gọi theo lô và được nạp một lần nhờ lru_cache.
3.3.4. Chuỗi RAG có nhớ hội thoại
Chuỗi RAG dùng create_history_aware_retriever, create_stuff_documents_chain (mỗi đoạn có tiền tố [Source | Page]) và create_retrieval_chain. Prompt yêu cầu chỉ dùng ngữ cảnh, nói rõ khi không có thông tin, trả lời cùng ngôn ngữ câu hỏi và trích dẫn [tệp, trang]. Lịch sử 6 tin nhắn gần nhất được truyền vào chuỗi.
3.3.5. Agent gọi công cụ
Lớp Agent nhận bộ truy xuất và kho bảng TableStore; ba công cụ được khai báo bằng lược đồ JSON (Bảng 3.4).
Bảng 3.4. Các công cụ của agent
Công cụ	Tham số	Chức năng
search_documents	query	Tìm các đoạn liên quan bằng bộ truy xuất lai, trả về nội dung kèm nhãn [tệp, trang]; truy vấn trùng lặp bị từ chối
query_table	table, filters (cột, toán tử, giá trị), operation (list, count, sum, mean, min, max), column, group_by, sort_by, descending, limit	Lọc, đếm, tính tổng/trung bình/lớn nhất/nhỏ nhất, nhóm và sắp xếp các dòng của một bảng
calculate	expression	Tính chính xác một biểu thức số học (+ − × ÷, lũy thừa, round, min, max, …)

TableStore đọc các bảng CSV, XLSX, DOCX thành DataFrame, làm sạch tên cột và chuyển cột chỉ chứa số sang kiểu số. Mô tả bảng (số dòng, cột, kiểu, 3 dòng đầu, các giá trị hợp lệ của cột phân loại như “Trạng thái”) được đưa vào prompt để mô hình viết điều kiện lọc khớp chính xác. Văn bản được chuẩn hóa Unicode NFC và chữ thường trước khi so sánh, vì chữ tiếng Việt có thể được mã hóa dựng sẵn hoặc tổ hợp.
calculate phân tích biểu thức bằng module ast và chỉ chấp nhận số, phép toán và vài hàm cho phép. Mọi lỗi công cụ được trả về dạng “Error: …” để mô hình tự sửa. Ví dụ lời gọi thực tế cho câu hỏi “Tổng ngân sách của các dự án đang thực hiện là bao nhiêu?”:
query_table(
    table="Danh_sach_du_an.csv",
    filters=[{"column": "Trạng thái", "operator": "==", "value": "Đang thực hiện"}],
    operation="sum", column="Ngân sách (triệu đồng)")

→ 32 matching row(s).
  sum(Ngân sách (triệu đồng)) = 53600

Prompt của agent yêu cầu: chỉ dùng kết quả công cụ; dùng query_table cho câu hỏi tổng hợp và calculate cho phép tính; nêu tất cả các dòng khi có nhiều dòng cùng giá trị lớn nhất; nêu đủ các phiên bản khi nguồn mâu thuẫn. Câu trả lời cuối vẫn được stream; các bước hiển thị trong mục “Tool calls”.
3.3.6. Phát hiện mâu thuẫn
ConflictDetector.check_answer đánh số các đoạn nguồn (khi đến từ ít nhất hai tệp) và yêu cầu LLM trả về JSON {topic, statements: [{passage, claim}], note}. Mô hình chỉ trả số thứ tự đoạn, tên tệp và trang do hệ thống tự ánh xạ, nên không thể bịa nguồn; kết quả hiển thị thành khung “Sources disagree”.
Hàm audit dùng similarity_search_with_score của ChromaDB để ghép cặp theo quy trình ở Hình 3.7 và hiển thị kết quả ở trang Knowledge audit kèm đoạn văn gốc.
3.3.7. Lưu trữ chỉ mục bền vững
Chỉ mục được lưu tại chroma_db/<16 ký tự đầu của khóa SHA-256>; khi nạp lại, các đoạn được đọc ngược từ ChromaDB để dựng BM25. Chỉ mục và chuỗi được lưu đệm bằng st.cache_resource nên đổi bộ lọc hay tham số truy xuất không phải xử lý lại tài liệu.
3.3.8. Module đánh giá
Evaluator đọc bộ câu hỏi JSON (question, category, expected_source, expected_page, expected_answer). retrieval_ablation chạy 6 chế độ truy xuất và tính Hit Rate, MRR, thời gian mà không gọi LLM; run nhận một hàm trả lời bất kỳ nên dùng chung cho RAG cơ bản và Agent, chấm điểm bằng LLM. Kết quả xem trên trang Evaluation và tải về dạng CSV.
3.3.9. Các tham số cấu hình
Bảng 3.5. Các tham số cấu hình chính của hệ thống
Tham số	Giá trị	Ý nghĩa
EMBEDDING_MODEL	intfloat/multilingual-e5-small	Mô hình embedding đa ngôn ngữ
RERANKER_MODEL	cross-encoder/mmarco-mMiniLMv2-L12-H384-v1	Mô hình xếp hạng lại
GROQ_MODEL	openai/gpt-oss-120b	LLM sinh câu trả lời, viết lại câu hỏi
VISION_MODEL	qwen/qwen3.8-27b	Mô hình mô tả ảnh
Chunk size / overlap	1000 / 200 ký tự	Kích thước đoạn và độ chồng lấp (điều chỉnh được)
Top-K candidates	10	Số ứng viên lấy từ mỗi phương pháp truy xuất
Chunks sent to LLM	4	Số đoạn giữ lại sau xếp hạng lại và hợp nhất
HISTORY_MESSAGES	6	Số tin nhắn gần nhất dùng làm lịch sử
MAX_IMAGES_PER_PDF	10	Số ảnh tối đa được mô tả trong mỗi PDF
MIN_IMAGE_SIZE	100 điểm ảnh	Bỏ qua ảnh nhỏ hơn kích thước này
AGENT_MAX_STEPS	5	Số vòng gọi công cụ tối đa của agent
AGENT_MAX_SEARCHES	3	Số lần tìm kiếm tài liệu tối đa trước khi buộc trả lời
AUDIT_MAX_PAIRS	16	Số cặp đoạn tối đa được kiểm tra khi rà soát
AUDIT_NEIGHBOURS	2	Số đoạn gần nhất ở tệp khác ghép với mỗi đoạn
AUDIT_BATCH_SIZE	4	Số cặp đoạn trong một lời gọi LLM khi rà soát

3.4. Môi trường cài đặt và hướng dẫn sử dụng
Hệ thống chạy trên macOS, Python 3.9, không cần GPU. Cài đặt: tạo môi trường ảo, pip install -r requirements.txt, ghi khóa Groq vào tệp .env (GROQ_API_KEY=…), rồi chạy streamlit run app.py và mở http://localhost:8501. Lần đầu chạy, hệ thống tải mô hình embedding và cross-encoder (khoảng 1 GB).
3.5. Demo kết quả
Bộ tài liệu thử nghiệm là tài liệu nội bộ giả lập của “Công ty TNHH Công nghệ Ánh Dương” do em tự soạn (Bảng 3.6). Bảng dự án có 60 dòng để trải trên nhiều đoạn như dữ liệu thực tế; tài liệu hướng dẫn IT được cố ý ghi làm việc từ xa tối đa 3 ngày/tuần, trái với sổ tay nhân viên (2 ngày), để kiểm tra phát hiện mâu thuẫn.
Bảng 3.6. Bộ tài liệu thử nghiệm
Tệp	Định dạng	Nội dung
So_tay_nhan_vien.pdf	PDF, 4 trang, 2 ảnh	Giới thiệu công ty, thời gian làm việc, lương thưởng; sơ đồ quy trình hội nhập và biểu đồ doanh thu (số liệu chỉ có trong ảnh)
Quy_dinh_nghi_phep.docx	DOCX, có bảng	Quy định nghỉ phép năm, nghỉ ốm, bảng chế độ nghỉ việc riêng
Gioi_thieu_san_pham.pptx	PPTX, 5 slide	Giới thiệu các sản phẩm, giá bán, lộ trình năm 2026
Danh_sach_du_an.csv	CSV, 60 dòng	Danh sách dự án: khách hàng, trưởng dự án, ngân sách, trạng thái, ngày bắt đầu
Huong_dan_IT.txt	TXT	Hướng dẫn wifi, mật khẩu, VPN, hỗ trợ kỹ thuật, thiết bị; chính sách làm việc từ xa ghi 3 ngày/tuần (mâu thuẫn được cài có chủ đích)

Hình 3.8: là giao diện sau khi tải 5 tài liệu: thanh bên để tải tệp, chọn tệp, chọn chế độ, bật kiểm tra mâu thuẫn và chỉnh tham số; thanh điều hướng chuyển giữa ba trang. Giao diện tối giản, chỉ dùng chữ.
 
Hình 3.8. Giao diện hệ thống sau khi tải lên bộ tài liệu thử nghiệm
Hình 3.9: câu trả lời có trích dẫn tệp và trang; mục “Sources” hiển thị đoạn văn gốc, mục “Tool calls” cho biết agent đã tìm kiếm với truy vấn nào.
 
Hình 3.9. Hỏi đáp kèm trích dẫn nguồn và đoạn văn gốc
 
Hình 3.10: câu hỏi nối tiếp “Còn phụ cấp gửi xe thì sao?” được hiểu theo ngữ cảnh lượt trước và trả lời đúng 150.000 đồng/tháng.
 
Hình 3.10. Câu hỏi nối tiếp trong hội thoại nhiều lượt
 
Hình 3.11: số liệu doanh thu chỉ có trong biểu đồ ở trang 4 nhưng vẫn được trả lời đúng nhờ mô tả ảnh; nguồn được đánh dấu “(image)”.
 
Hình 3.11. Trả lời câu hỏi dựa trên nội dung biểu đồ trong PDF
 
Hình 3.12 so sánh hai chế độ với câu hỏi “Tổng ngân sách của các dự án đang thực hiện là bao nhiêu?”. RAG cơ bản chỉ thấy 4 đoạn của bảng 60 dòng nên trả lời sai (18.350 triệu đồng); Agent gọi query_table với điều kiện Trạng thái = “Đang thực hiện” và phép sum, trả lời đúng 53.600 triệu đồng từ 32 dự án.
 
Hình 3.12. RAG cơ bản và Agent với câu hỏi tổng hợp trên bảng dữ liệu
 
Hình 3.13: agent tra quy định nghỉ phép rồi trả lời 14 ngày kèm công thức (trong lần chụp này agent tự cộng 12 + 2 mà không gọi calculate; ở lần chạy khác có gọi - quy tắc trong prompt không luôn được tuân thủ với phép tính đơn giản). Với câu hỏi về hỗ trợ nhà ở, agent tìm 3 lần rồi trả lời rõ là tài liệu không có thông tin.
 
Hình 3.13. Agent áp dụng quy định để tính kết quả, và từ chối trả lời ngoài phạm vi tài liệu
Hình 3.14: agent nêu cả hai phiên bản (2 ngày theo sổ tay, 3 ngày theo hướng dẫn IT) kèm trích dẫn, và khung “Sources disagree” đặt hai phát biểu cạnh nhau. Hành vi tương tự khi hỏi bằng tiếng Anh.
 
Hình 3.14. Cảnh báo khi các nguồn mâu thuẫn nhau
 
Hình 3.15: trang Knowledge audit kiểm tra 16 cặp đoạn và tìm được đúng 1 mâu thuẫn đã cài, kèm đoạn văn gốc của hai tệp - không cần người dùng đặt câu hỏi.
 
Hình 3.15. Trang rà soát mâu thuẫn trên toàn bộ kho tài liệu
3.6. Đánh giá thực nghiệm
3.6.1. Bộ dữ liệu và kịch bản thử nghiệm
Bộ kiểm thử gồm 32 câu hỏi xây dựng thủ công, bao phủ 5 định dạng tệp, chia 6 nhóm (Bảng 3.7); 31 câu có tệp nguồn kỳ vọng. Đáp án các câu về bảng được tính bằng pandas.
Bảng 3.7. Các nhóm câu hỏi trong bộ kiểm thử
Nhóm câu hỏi	Số câu	Ví dụ
Văn bản (gồm 2 câu chỉ có trong ảnh)	18	Công ty Ánh Dương được thành lập khi nào?
Tổng hợp trên bảng	7	Ai là trưởng dự án chatbot chăm sóc khách hàng ngân hàng?
Tính toán	3	Nhân viên làm việc liên tục 10 năm được bao nhiêu ngày phép năm?
Mâu thuẫn giữa tài liệu	1	Nhân viên được làm việc từ xa mấy ngày mỗi tuần?
Tiếng Anh trên tài liệu tiếng Việt	2	How many days of annual leave do employees get?
Ngoài phạm vi tài liệu	1	Công ty có chính sách hỗ trợ nhà ở cho nhân viên không?

Chỉ mục gồm 31 đoạn (2 đoạn mô tả ảnh); cấu hình như Bảng 3.5. Cả hai chế độ dùng gpt-oss-120b, nhiệt độ 0; LLM chấm điểm là gpt-oss-20b, khác với mô hình được đánh giá.
3.6.2. So sánh RAG cơ bản và Agent
Bảng 3.8. Kết quả tổng thể của hai chế độ trả lời
Chỉ số	RAG cơ bản	Agent
Độ chính xác câu trả lời (LLM-as-a-judge)	87,5%	100,0%
Số câu trả lời đúng hoàn toàn	27/32	32/32
Hit Rate (đúng nguồn/trang trong ngữ cảnh)	100,0%	77,4% (*)
Thời gian phản hồi trung bình	7,0 giây	21,8 giây

Bảng 3.9. Độ chính xác câu trả lời theo nhóm câu hỏi
Nhóm câu hỏi	Số câu	RAG cơ bản	Agent
Văn bản (gồm 2 câu chỉ có trong ảnh)	18	100,0%	100,0%
Tổng hợp trên bảng	7	42,9%	100,0%
Tính toán	3	100,0%	100,0%
Mâu thuẫn giữa tài liệu	1	100,0%	100,0%
Tiếng Anh trên tài liệu tiếng Việt	2	100,0%	100,0%
Ngoài phạm vi tài liệu	1	100,0%	100,0%

(*) Với 7 câu hỏi về bảng, agent dùng query_table chứ không tra văn bản nên không có đoạn ngữ cảnh để tính Hit Rate; tính trên 24 câu agent có tra cứu, Hit Rate đạt 100,0%.
Agent đúng hoàn toàn 32/32 câu (100,0%), RAG cơ bản 27/32 câu (87,5%). Toàn bộ chênh lệch nằm ở nhóm câu hỏi tổng hợp trên bảng (42,9% so với 100%): RAG cơ bản đúng hai câu tra cứu một dòng nhưng sai hoàn toàn ba câu đếm và tính tổng (ví dụ trả lời 12 dự án đang thực hiện với 18.350 triệu đồng, trong khi đáp án là 32 dự án và 53.600 triệu đồng) và chỉ đúng một phần hai câu liệt kê, tìm giá trị lớn nhất, vì 4 đoạn ngữ cảnh chỉ chứa một phần bảng. Agent đúng cả 7 câu với một hoặc hai lời gọi query_table.
Ở nhóm tính toán, cả hai chế độ đều đúng 3/3 vì các phép tính đơn giản, nên lợi thế của calculate chưa thể hiện trên bộ dữ liệu này. Câu hỏi mâu thuẫn được cả hai chế độ trả lời bằng cách nêu đủ hai phiên bản.
LLM chấm điểm bỏ sót một lỗi: với câu “Dự án nào có ngân sách lớn nhất?”, agent liệt kê đúng ba dự án 3.000 triệu đồng nhưng câu dẫn lại viết “300 triệu đồng”.
Agent chậm hơn (21,8 so với 7,0 giây) vì cần ít nhất hai lời gọi LLM mỗi câu và phải chờ giới hạn tốc độ; một lượt đánh giá đầy đủ đã vượt hạn mức 200.000 token/ngày của gói miễn phí Groq.
3.6.3. Đánh giá vai trò của các thành phần truy xuất
So sánh 6 cấu hình truy xuất trên 31 câu có nguồn kỳ vọng, không qua LLM. Hit@1 là chỉ số khắt khe nhất; Hit@4 và MRR@4 tính trên 4 đoạn gửi tới LLM.
Bảng 3.10. So sánh các cấu hình truy xuất
Cấu hình truy xuất	Hit@1	Hit@4	MRR@4
Chỉ tìm kiếm vector (multilingual-e5)	93,5%	100,0%	0,968
Chỉ BM25	74,2%	96,8%	0,844
Truy xuất lai, hợp nhất RRF	90,3%	100,0%	0,944
Vector + cross-encoder	93,5%	100,0%	0,968
Truy xuất lai + cross-encoder	93,5%	100,0%	0,968
Lai + cross-encoder, hợp nhất RRF (hệ thống)	93,5%	100,0%	0,968

 
Hình 3.16. So sánh các cấu hình truy xuất (Hit@1 và MRR@4)
Chỉ dùng vector đã đạt Hit@4 100,0% và MRR@4 0,968: mô hình embedding đa ngôn ngữ là cải tiến quan trọng nhất. BM25 yếu nhất (Hit@1 74,2%) vì không nối được câu hỏi tiếng Anh với văn bản tiếng Việt. Hợp nhất RRF làm MRR@4 giảm còn 0,944 do nhiễu từ BM25; cross-encoder khôi phục về 0,968, đổi lại thời gian truy xuất tăng từ khoảng 10 ms lên khoảng 186 ms trên CPU.
Bước hợp nhất cuối được bổ sung sau thử nghiệm trên phiên bản dữ liệu trước (15 đoạn, bảng 8 dòng, chưa mô tả ảnh), khi cross-encoder dùng một mình làm kết quả kém hẳn (Bảng 3.11): nó xếp các dòng CSV và slide ngắn lên trước đoạn chứa câu trả lời (ví dụ slide lộ trình đứng đầu cho câu “Có bao nhiêu dự án đang thực hiện?”).
Bảng 3.11. Hiệu quả của bước hợp nhất trên phiên bản dữ liệu trước (15 đoạn)
Cấu hình truy xuất	Hit@1	MRR@2	MRR@4
Chỉ tìm kiếam vector	90,3%	0,952	0,952
Truy xuất lai, hợp nhất RRF	90,3%	0,952	0,952
Truy xuất lai + cross-encoder	80,6%	0,855	0,874
Lai + cross-encoder, hợp nhất RRF	93,5%	0,968	0,968

Đóng góp của cross-encoder phụ thuộc vào dữ liệu; cấu hình hợp nhất không kém cấu hình tốt nhất trong cả hai lần đo nên được chọn làm mặc định. Do dữ liệu nhỏ, chênh lệch chỉ tương ứng 1-4 câu hỏi.
3.6.4. Đánh giá chức năng phát hiện mâu thuẫn
Rà soát trên 31 đoạn tạo 16 cặp ứng viên, cần 4 lời gọi LLM, hoàn tất sau 25,2 giây và tìm đúng 1 mâu thuẫn đã cài (2 và 3 ngày làm việc từ xa); 15 cặp còn lại không bị báo nhầm. Kết quả lặp lại trên phiên bản dữ liệu trước.
Ở mức câu trả lời, câu hỏi về làm việc từ xa (tiếng Việt và tiếng Anh) đều có cảnh báo kèm hai nguồn; các câu hỏi khác có nguồn từ nhiều tệp không bị cảnh báo sai. Đây là kết quả định tính trên số câu hỏi nhỏ.
3.6.5. Nhận xét
Nhận xét:
- Mô hình embedding đa ngôn ngữ là yếu tố quan trọng nhất; BM25 và cross-encoder có đóng góp thay đổi theo dữ liệu - cross-encoder từng làm giảm MRR, chỉ ablation mới phát hiện được.
- Câu hỏi tổng hợp trên bảng là điểm yếu cấu trúc của RAG một lượt; giao việc tính toán cho công cụ giải quyết trực tiếp vấn đề, đổi lại agent chậm hơn và tốn token hơn.		
- Tiền xử lý tài liệu (bảng, CSV, ảnh) quyết định thông tin có tới được bộ truy xuất hay không.
- Ghép cặp theo embedding giúp rà soát mâu thuẫn rẻ (4 lời gọi LLM) mà vẫn tìm đúng mâu thuẫn.
3.7. Kết luận chương 3
Chương 3 đã trình bày thiết kế, cài đặt, demo và đánh giá hệ thống. Hệ thống trả lời chính xác với tài liệu tiếng Việt, hiểu câu hỏi nối tiếp và nội dung ảnh, biết từ chối khi không có thông tin; Agent trả lời đúng các câu hỏi tổng hợp mà RAG cơ bản làm sai; rà soát tìm đúng mâu thuẫn; ablation dẫn tới cải tiến bước hợp nhất thứ hạng.
KẾT LUẬN
Kết quả đạt được
- Tìm hiểu LLM, RAG và các kỹ thuật truy xuất, xếp hạng lại, mô tả ảnh, agent gọi công cụ, phát hiện mâu thuẫn và đánh giá bằng LLM.
- Xây dựng hệ thống hỏi đáp đa tài liệu hỗ trợ tiếng Việt với truy xuất lai hợp nhất RRF, nhớ hội thoại, hiểu ảnh, chế độ Agent ba công cụ và phát hiện mâu thuẫn.
- Xây dựng bộ dữ liệu và 32 câu hỏi kiểm thử. Kết quả: Hit@4 100,0%, MRR@4 0,968; Agent đúng 100% so với 87,5% của RAG cơ bản (nhóm câu hỏi bảng: 100% so với 42,9%); rà soát tìm đúng mâu thuẫn với 4 lời gọi LLM.
Qua đề tài, em nắm được quy trình xây dựng một ứng dụng LLM hoàn chỉnh, từ xử lý dữ liệu, truy xuất, sinh câu trả lời tới đánh giá thực nghiệm.
Hạn chế
- Dữ liệu thử nghiệm nhỏ (32 câu hỏi, 5 tài liệu, 1 mâu thuẫn được cài sẵn).
- Phụ thuộc Groq: gói miễn phí giới hạn 200.000 token/ngày; dữ liệu được gửi tới dịch vụ bên ngoài.
- Chưa hỗ trợ PDF quét và bảng phức tạp trong PDF; LLM chấm điểm có thể bỏ sót lỗi.
- Phát hiện mâu thuẫn phụ thuộc LLM và chỉ kiểm tra các cặp đoạn gần nhau nhất.
- Agent chậm hơn RAG cơ bản; truy vấn bảng trên bộ nhớ chưa phù hợp dữ liệu lớn.
Hướng phát triển
- Đánh giá trên tài liệu thực tế và bộ mâu thuẫn tự nhiên; bổ sung độ đo tính trung thực (faithfulness).
- Bổ sung OCR, thử embedding và reranker lớn hơn (bge-m3, bge-reranker-v2-m3) khi có GPU.
- Chạy LLM cục bộ (Ollama, vLLM) để dữ liệu không rời doanh nghiệp; xây dựng phiên bản nhiều người dùng.
- Tự động xác định phiên bản ưu tiên khi có mâu thuẫn theo ngày hiệu lực.
- Truy vấn SQL trên cơ sở dữ liệu thật; tự chọn chế độ RAG cơ bản cho câu hỏi đơn giản để giảm độ trễ.
TÀI LIỆU THAM KHẢO
[1] Lewis P., Perez E., Piktus A., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In: Advances in Neural Information Processing Systems 33 (NeurIPS 2020), pp. 9459-9474.
[2] Vaswani A., Shazeer N., Parmar N., et al. (2017). Attention Is All You Need. In: Advances in Neural Information Processing Systems 30 (NIPS 2017), pp. 5998-6008.
[3] Robertson S. and Zaragoza H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. Foundations and Trends in Information Retrieval, 3(4), pp. 333-389.
[4] Reimers N. and Gurevych I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. In: Proceedings of EMNLP-IJCNLP 2019, pp. 3982-3992.
[5] Wang L., Yang N., Huang X., et al. (2024). Multilingual E5 Text Embeddings: A Technical Report [online], truy cập ngày 31/10/2026, từ <https://arxiv.org/abs/2402.05672>.
[6] Nogueira R. and Cho K. (2019). Passage Re-ranking with BERT [online], truy cập ngày 31/10/2026, từ <https://arxiv.org/abs/1901.04085>.
[7] Bonifacio L., Jeronymo V., Abonizio H. Q., et al. (2021). mMARCO: A Multilingual Version of the MS MARCO Passage Ranking Dataset [online], truy cập ngày 31/10/2026, từ <https://arxiv.org/abs/2108.13897>.
[8] Gao Y., Xiong Y., Gao X., et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey [online], truy cập ngày 31/10/2026, từ <https://arxiv.org/abs/2312.10997>.
[9] Zheng L., Chiang W.-L., Sheng Y., et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. In: Advances in Neural Information Processing Systems 36 (NeurIPS 2023), Datasets and Benchmarks Track.
[10] Malkov Y. A. and Yashunin D. A. (2020). Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs. IEEE Transactions on Pattern Analysis and Machine Intelligence, 42(4), pp. 824-836.
[11] OpenAI (2025). gpt-oss-120b & gpt-oss-20b Model Card [online], truy cập ngày 31/10/2026, từ <https://openai.com/index/gpt-oss-model-card/>.
[12] LangChain (2026). LangChain Documentation [online], truy cập ngày 31/10/2026, từ <https://python.langchain.com>; Chroma (2026). Chroma Documentation [online], truy cập ngày 31/10/2026, từ <https://docs.trychroma.com>.
[13] Groq (2026). GroqCloud Documentation - Models and Rate Limits [online], truy cập ngày 31/10/2026, từ <https://console.groq.com/docs>.
[14] Streamlit (2026). Streamlit Documentation [online], truy cập ngày 31/10/2026, từ <https://docs.streamlit.io>.
[15] Yao S., Zhao J., Yu D., et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. In: International Conference on Learning Representations (ICLR 2023).
[16] Schick T., Dwivedi-Yu J., Dessì R., et al. (2023). Toolformer: Language Models Can Teach Themselves to Use Tools. In: Advances in Neural Information Processing Systems 36 (NeurIPS 2023).
[17] Cormack G. V., Clarke C. L. A. and Büttcher S. (2009). Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods. In: Proceedings of SIGIR 2009, pp. 758-759.

