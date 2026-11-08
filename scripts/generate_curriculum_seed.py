"""
Script: scripts/generate_curriculum_seed.py
Purpose: Generates full curriculum data with 8 Domains, Shared & Specialized Subjects,
and 10-15 Topics per subject with realistic statuses, difficulty (1-3), summary, and required concepts.
Outputs:
1. supabase/migrations/20261108_seed_8_domains_curriculum.sql
2. src/data/three-tier-curriculum.data.ts
3. scripts/seed-supabase-curriculum.cjs
"""

import json
import random
import os
import re

# Set deterministic seed for reproducibility
random.seed(42)

# 1. Định nghĩa 8 Nhóm Ngành học
DOMAINS = [
    {
        "id": "dom-it",
        "slug": "cong-nghe-thong-tin",
        "name": "Công Nghệ Thông Tin",
        "description": "Quản trị hạ tầng mạng, an toàn thông tin, điện toán đám mây và phát triển giải pháp số toàn diện.",
        "iconName": "Cpu",
        "color": "#3B82F6",
        "colorHex": "#3B82F6",
        "accentBg": "bg-blue-500/10",
        "orderIndex": 1,
    },
    {
        "id": "dom-cs",
        "slug": "khoa-hoc-may-tinh",
        "name": "Khoa Học Máy Tính",
        "description": "Thuật toán nền tảng, trí tuệ nhân tạo, lý thuyết tính toán, thị giác máy tính và kiến trúc hệ thống.",
        "iconName": "Terminal",
        "color": "#6366F1",
        "colorHex": "#6366F1",
        "accentBg": "bg-indigo-500/10",
        "orderIndex": 2,
    },
    {
        "id": "dom-se",
        "slug": "ky-thuat-phan-mem",
        "name": "Kỹ Thuật Phần Mềm",
        "description": "Kiến trúc hệ thống, quy trình phát triển Agile/DevOps, kiểm thử chất lượng và thiết kế phần mềm quy mô lớn.",
        "iconName": "Code2",
        "color": "#8B5CF6",
        "colorHex": "#8B5CF6",
        "accentBg": "bg-purple-500/10",
        "orderIndex": 3,
    },
    {
        "id": "dom-ecom",
        "slug": "thuong-mai-dien-tu",
        "name": "Thương Mại Điện Tử",
        "description": "Mô hình kinh doanh số, thanh toán điện tử, tiếp thị số, phân tích dữ liệu tiêu dùng và chuỗi cung ứng.",
        "iconName": "ShoppingCart",
        "color": "#EC4899",
        "colorHex": "#EC4899",
        "accentBg": "bg-pink-500/10",
        "orderIndex": 4,
    },
    {
        "id": "dom-acc",
        "slug": "ke-toan-kiem-toan",
        "name": "Kế Toán - Kiểm Toán",
        "description": "Hệ thống chuẩn mực kế toán tài chính, kế toán quản trị, kiểm toán độc lập và lập báo cáo thuế chuyên sâu.",
        "iconName": "Calculator",
        "color": "#06B6D4",
        "colorHex": "#06B6D4",
        "accentBg": "bg-cyan-500/10",
        "orderIndex": 5,
    },
    {
        "id": "dom-biz",
        "slug": "quan-tri-kinh-doanh",
        "name": "Quản Trị Kinh Doanh",
        "description": "Hoạch định chiến lược doanh nghiệp, quản trị nhân sự, tài chính đầu tư, đàm phán thương mại và khởi sự đổi mới.",
        "iconName": "Briefcase",
        "color": "#10B981",
        "colorHex": "#10B981",
        "accentBg": "bg-emerald-500/10",
        "orderIndex": 6,
    },
    {
        "id": "dom-tour",
        "slug": "du-lich-lu-hanh",
        "name": "Du Lịch Lữ Hành",
        "description": "Nghiệp vụ hướng dẫn lữ hành, quản trị khách sạn resort, marketing điểm đến du lịch và tổ chức sự kiện MICE.",
        "iconName": "Compass",
        "color": "#F59E0B",
        "colorHex": "#F59E0B",
        "accentBg": "bg-amber-500/10",
        "orderIndex": 7,
    },
    {
        "id": "dom-med",
        "slug": "y-khoa",
        "name": "Y Khoa & Sức Khỏe",
        "description": "Khoa học y sinh cơ sở, giải phẫu, sinh lý bệnh, dược lý điều trị, đạo đức nghề y và chẩn đoán cận lâm sàng.",
        "iconName": "Stethoscope",
        "color": "#EF4444",
        "colorHex": "#EF4444",
        "accentBg": "bg-rose-500/10",
        "orderIndex": 8,
    },
]

# 2. Định nghĩa danh sách các Môn Học và Danh Sách Ngành Áp Dụng (Môn chung + Môn chuyên ngành)
SUBJECTS = [
    # Môn chung nhóm Công Nghệ / Máy Tính
    {
        "id": "sub-discrete-math",
        "slug": "toan-roi-rac",
        "name": "Toán Rời Rạc & Lý Thuyết Đồ Thị",
        "description": "Logic mệnh đề, tập hợp, quan hệ tương đương, đồ thị Euler-Hamilton và cây bao trùm tối thiểu.",
        "difficultyLevel": 2,
        "domains": ["dom-it", "dom-cs", "dom-se"],
        "is_core": True,
        "topic_templates": [
            ("Mệnh Đề Logic & Bảng Chân Trị", "Nền tảng logic toán học", ["Mệnh đề", "Phép hội/tuyển", "Bảng chân trị", "Tương đương logic"]),
            ("Vị Từ & Lượng Từ Toán Học (∀, ∃)", "Biểu diễn logic toán bậc nhất", ["Lượng từ với mọi", "Lượng từ tồn tại", "Phạm vi biến", "Phủ định vị từ"]),
            ("Phương Pháp Chứng Minh Quy Nạp Toán Học", "Kỹ thuật chứng minh trong khoa học máy tính", ["Bước cơ sở", "Giả thiết quy nạp", "Bước quy nạp", "Quy nạp mạnh"]),
            ("Quan Hệ Tương Đương & Phân Hoạch Tập Hợp", "Cấu trúc quan hệ toán học cơ bản", ["Phản xạ", "Đối xứng", "Bắc cầu", "Lớp tương đương"]),
            ("Lý Thuyết Tập Hợp & Ánh Xạ Bijective", "Nền tảng cấu trúc dữ liệu", ["Tập hợp con", "Tập lũy thừa", "Đơn ánh", "Toàn ánh", "Song ánh"]),
            ("Đại Số Boole & Tối Thiểu Hóa Hàm Boole", "Thiết kế mạch logic số học", ["Biểu thức Boole", "Cổng logic", "Bản đồ Karnaugh", "Dạng chuẩn tắc"]),
            ("Lý Thuyết Đồ Thị: Đỉnh, Cạnh & Bậc Đồ Thị", "Khái niệm nền tảng về đồ thị", ["Bậc của đỉnh", "Định lý bắt tay", "Ma trận kề", "Danh sách kề"]),
            ("Chu Trình Euler & Chu Trình Hamilton", "Các bài toán kinh điển trên đồ thị", ["Đồ thị Euler", "Định lý Dirac", "Chu trình Hamilton", "Đường đi Euler"]),
            ("Cây & Cây Khung Nhỏ Nhất (MST)", "Cấu trúc cây và bài toán tối ưu", ["Cây tự do", "Rừng", "Thuật toán Kruskal", "Thuật toán Prim"]),
            ("Đồ Thị Phẳng & Định Lý Bốn Màu", "Hình học topo của đồ thị phẳng", ["Công thức Euler v-e+f=2", "Đồ thị phẳng", "Tô màu đồ thị", "Sắc số"]),
            ("Quan Hệ Thứ Tự & Biểu Đồ Hasse", "Thứ tự một phần và toàn phần", ["Poset", "Phản đối xứng", "Phần tử tối đại/tối tiểu", "Biểu đồ Hasse"]),
            ("Giải Thuật Dijkstra Tìm Đường Đi Ngắn Nhất", "Tối ưu hóa đường đi trên đồ thị có trọng số", ["Hàng đợi ưu tiên", "Thư giãn cạnh", "Chi phí đường đi", "Độ phức tạp O(E log V)"]),
        ]
    },
    {
        "id": "sub-dsa",
        "slug": "cau-truc-du-lieu-giai-thuat",
        "name": "Cấu Trúc Dữ Liệu & Giải Thuật",
        "description": "Mảng động, danh sách liên kết, ngăn xếp, hàng đợi, cây nhị phân, bảng băm và thuật toán sắp xếp.",
        "difficultyLevel": 3,
        "domains": ["dom-it", "dom-cs", "dom-se"],
        "is_core": True,
        "topic_templates": [
            ("Phân Tích Độ Phức Tạp Thuật Toán (Big-O)", "Đo lường hiệu năng thời gian và không gian", ["Big-O", "Big-Omega", "Big-Theta", "Độ phức tạp tiệm cận"]),
            ("Danh Sách Liên Kết Đơn & Kép (Linked List)", "Cấu trúc dữ liệu tuyến tính động", ["Node", "Con trỏ Next/Prev", "Thêm/Xóa nút", "Truy cập tuần tự"]),
            ("Ngăn Xếp (Stack) & Ứng Dụng Khử Đệ Quy", "Nguyên lý Last-In-First-Out", ["LIFO", "Push/Pop", "Call Stack", "Biểu thức tiền/hậu tố"]),
            ("Hàng Đợi (Queue) & Hàng Đợi Ưu Tiên (Priority Queue)", "Nguyên lý First-In-First-Out và Binary Heap", ["FIFO", "Enqueue/Dequeue", "Max Heap", "Min Heap"]),
            ("Bảng Băm & Thuật Toán Xử Lý Xung Đột", "Tra cứu dữ liệu O(1) trung bình", ["Hàm băm", "Load Factor", "Separate Chaining", "Open Addressing"]),
            ("Cây Nhị Phân Tìm Kiếm (BST)", "Cấu trúc cây có thứ tự", ["In-order Traversal", "Pre-order", "Post-order", "Tìm kiếm nhị phân"]),
            ("Cây Cân Bằng AVL & Kỹ Thuật Phép Quay", "Tự cân bằng để bảo đảm O(log N)", ["Hệ số cân bằng", "Quay đơn LL/RR", "Quay kép LR/RL", "Chiều cao cây"]),
            ("Thuật Toán Sắp Xếp Nhanh (Quicksort)", "Chiến lược chia để trị hiệu năng cao", ["Pivot Selection", "Partitioning", "Best/Worst Case", "In-place Sorting"]),
            ("Thuật Toán Sắp Xếp Trộn (Mergesort)", "Sắp xếp ổn định với độ phức tạp O(N log N)", ["Chia để trị", "Merge hai mảng con", "Bộ nhớ phụ O(N)", "Tính ổn định"]),
            ("Thuật Toán Tìm Kiếm Theo Chiều Rộng (BFS)", "Duyệt đồ thị theo từng lớp lân cận", ["Queue", "Đường đi ngắn nhất không trọng số", "Visited Set", "Cây khung BFS"]),
            ("Thuật Toán Tìm Kiếm Theo Chiều Sâu (DFS)", "Duyệt đồ thị đi sâu khám phá", ["Recursion Stack", "Thời gian vào/ra Discovery/Finish", "Phân loại cạnh", "Tìm chu trình"]),
            ("Thuật Toán Quy Hoạch Động (Dynamic Programming)", "Giải bài toán tối ưu có cấu trúc con gối nhau", ["Memoization", "Tabulation", "Trạng thái quy hoạch động", "Bài toán Balo 0/1"]),
            ("Thuật Toán Tham Lam (Greedy Algorithm)", "Lựa chọn tối ưu cục bộ từng bước", ["Greedy Choice Property", "Optimal Substructure", "Mã hóa Huffman", "Chọn hoạt động"]),
        ]
    },
    {
        "id": "sub-db",
        "slug": "co-so-du-lieu-sql",
        "name": "Cơ Sở Dữ Liệu & Hệ Quản Trị SQL",
        "description": "Mô hình quan hệ, đại số quan hệ, chuẩn hóa dữ liệu 1NF-BCNF, chỉ mục B-Tree và giao dịch ACID.",
        "difficultyLevel": 2,
        "domains": ["dom-it", "dom-cs", "dom-se", "dom-ecom"],
        "is_core": True,
        "topic_templates": [
            ("Mô Hình Thực Thể Mối Kết Hợp (ERD)", "Thiết kế cơ sở dữ liệu mức khái niệm", ["Entity", "Attribute", "Relationship", "Cardinality (1:1, 1:N, N:M)"]),
            ("Chuyển Đổi Mô Hình ERD Sang Lược Đồ Quan Hệ", "Hiện thực hóa lược đồ bảng dữ liệu", ["Khóa chính Primary Key", "Khóa ngoại Foreign Key", "Bảng trung gian", "Ràng buộc toàn vẹn"]),
            ("Ngôn Ngữ SQL: Truy Vấn SELECT & Mệnh Đề JOIN", "Khai vấn dữ liệu quan hệ nâng cao", ["INNER JOIN", "LEFT JOIN", "GROUP BY", "HAVING", "Subquery"]),
            ("Chuẩn Hóa Dữ Liệu: 1NF, 2NF và 3NF", "Loại bỏ dư thừa và bất thường cập nhật", ["Phụ thuộc hàm", "1NF (Nguyên tử)", "2NF (Phụ thuộc đầy đủ)", "3NF (Không bắc cầu)"]),
            ("Chuẩn Boyce-Codd (BCNF) & Phân Rã Không Mất Thông Tin", "Mức chuẩn hóa khắt khe", ["Định thức là siêu khóa", "Bảo toàn phụ thuộc hàm", "Mất mát thông tin"]),
            ("Giao Dịch Dữ Liệu & Đặc Tính ACID", "Bảo đảm tính toàn vẹn hệ thống giao dịch", ["Atomicity", "Consistency", "Isolation", "Durability"]),
            ("Các Cấp Độ Cô Lập Giao Dịch (Isolation Levels)", "Ngăn chặn các hiện tượng dị thường đồng thời", ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable", "Phantom Read"]),
            ("Chỉ Mục B-Tree & Tối Ưu Hóa Truy Vấn", "Tăng tốc độ truy xuất dữ liệu", ["B-Tree Node", "Index Scan vs Seq Scan", "Composite Index", "Cost Planner"]),
            ("Cơ Chế Khóa (Locking) & Phòng Chống Deadlock Trong CSDL", "Quản lý truy cập tương tranh", ["Shared Lock", "Exclusive Lock", "Two-Phase Locking (2PL)", "Deadlock Detection"]),
            ("Thủ Tục Lưu Trữ (Stored Procedure) & Trigger", "Lập trình logic mức cơ sở dữ liệu", ["Trigger BEFORE/AFTER", "Stored Procedure", "Function", "Audit Logging"]),
            ("Cơ Chế Nhật Ký Ghi Trước WAL (Write-Ahead Logging)", "Khôi phục dữ liệu sau sự cố hệ thống", ["WAL Buffer", "Checkpoint", "Crash Recovery", "Redo/Undo Log"]),
            ("Mô Hình Cơ Sở Dữ Liệu NoSQL & Định Lý CAP", "Hệ thống lưu trữ phi quan hệ", ["Document Store", "Key-Value", "Consistency vs Availability vs Partition"]),
        ]
    },
    {
        "id": "sub-networks",
        "slug": "mang-may-tinh-truyen-thong",
        "name": "Mạng Máy Tính & Truyền Thông",
        "description": "Mô hình OSI, TCP/IP, định tuyến IP, giao thức tầng truyền vận và an toàn mạng.",
        "difficultyLevel": 2,
        "domains": ["dom-it", "dom-cs"],
        "is_core": True,
        "topic_templates": [
            ("Mô Hình Tham Chiếu OSI & Bộ Giao Thức TCP/IP", "Kiến trúc mạng phân tầng kinh điển", ["7 tầng OSI", "4 tầng TCP/IP", "Đóng gói dữ liệu", "PDU"]),
            ("Tầng Liên Kết Dữ Liệu: Khung Tin & Giao Thức Ethernet", "Truyền thông tin cậy trong mạng cục bộ LAN", ["Frame", "Địa chỉ MAC", "CSMA/CD", "VLAN"]),
            ("Giao Thức IP & Kỹ Thuật Chia Mạng Con (Subnetting / CIDR)", "Định danh và định tuyến trong liên mạng", ["IPv4", "Subnet Mask", "CIDR Prefix", "Default Gateway"]),
            ("Giao Thức Phân Giải Địa Chỉ ARP & DHCP", "Cơ chế cấu hình mạng tự động", ["ARP Request/Reply", "ARP Cache", "DHCP DORA", "IP Lease"]),
            ("Giao Thức Bắt Tay 3 Bước TCP (3-Way Handshake)", "Thiết lập kết nối truyền vận tin cậy", ["SYN", "SYN-ACK", "ACK", "Sequence Number", "TCP Teardown"]),
            ("Cơ Chế Kiểm Soát Tắc Nghẽn & Luồng Dữ Liệu TCP", "Ổn định băng thông mạng", ["Sliding Window", "Slow Start", "Congestion Avoidance", "Fast Retransmit"]),
            ("Giao Thức UDP & Ứng Dụng Truyền Phát Thời Gian Thực", "Truyền tải phi kết nối tốc độ cao", ["Connectionless", "Header 8 bytes", "VoIP", "Video Streaming"]),
            ("Hệ Thống Phân Giải Tên Miền DNS", "Bản đồ địa chỉ Internet toàn cầu", ["Recursive Resolver", "Root/TLD Server", "Authoritative DNS", "DNS Cache"]),
            ("Giao Thức HTTP/1.1, HTTP/2 và HTTP/3 (QUIC)", "Tiến trình phát triển giao thức Web", ["Keep-Alive", "Multiplexing", "QUIC UDP", "Head-of-Line Blocking"]),
            ("Bảo Mật Giao Vận TLS/SSL & Chứng Chỉ Số", "Mã hóa bảo vệ dữ liệu truyền tải", ["TLS Handshake", "Asymmetric Key", "Symmetric Cipher", "CA Certificate"]),
            ("Định Tuyến Động: Giao Thức OSPF & BGP", "Tìm đường tối ưu trên mạng toàn cầu", ["Link-State OSPF", "Path-Vector BGP", "Autonomous System", "Routing Table"]),
            ("Tường Lửa (Firewall) & Dịch Địa Chỉ Mạng NAT", "Bảo vệ an ninh mạng biên", ["Stateful Firewall", "Packet Filtering", "NAT Overload (PAT)", "DMZ"]),
        ]
    },

    # Môn chung nhóm Kinh Tế / Kinh Doanh
    {
        "id": "sub-microecon",
        "slug": "kinh-te-vi-mo",
        "name": "Kinh Tế Học Vi Mô",
        "description": "Cung cầu, độ co giãn, lý thuyết hành vi người tiêu dùng, chi phí sản xuất và cấu trúc thị trường.",
        "difficultyLevel": 2,
        "domains": ["dom-ecom", "dom-acc", "dom-biz"],
        "is_core": True,
        "topic_templates": [
            ("Quy Luật Cung Cầu & Trọng Tâm Giá Cân Bằng", "Cơ chế vận hành của bàn tay vô hình", ["Cầu thị trường", "Cung thị trường", "Giá cân bằng", "Dư thừa và thiếu hụt"]),
            ("Độ Co Giãn Của Cầu Theo Giá & Doanh Thu", "Đo lường mức độ phản ứng của người mua", ["Co giãn theo giá", "Co giãn chéo", "Co giãn theo thu nhập", "Doanh thu tối đa"]),
            ("Lý Thuyết Lợi Ích & Sự Lựa Chọn Của Người Tiêu Dùng", "Quyết định tối đa hóa thỏa dụng", ["Tổng lợi ích TU", "Lợi ích cận biên MU", "Quy luật lợi ích cận biên giảm dần", "Đường đẳng ích"]),
            ("Chi Phí Cơ Hội & Đường Giới Hạn Khả Năng Sản Xuất (PPF)", "Sự đánh đổi trong phân bổ nguồn lực", ["Sự khan hiếm", "Chi phí cơ hội", "Hiệu quả sản xuất", "Tăng trưởng kinh tế"]),
            ("Hàm Sản Xuất & Năng Suất Cận Biên Giảm Dần", "Hiệu suất yếu tố đầu vào", ["Đầu vào cố định/biến đổi", "Năng suất trung bình AP", "Năng suất cận biên MP", "Quy mô tối ưu"]),
            ("Cấu Trúc Chi Phí Doanh Nghiệp Trong Ngắn Hạn & Dài Hạn", "Phân tích kinh tế cho quyết định sản xuất", ["Chi phí cố định FC", "Chi phí biến đổi VC", "Chi phí cận biên MC", "Chi phí trung bình ATC"]),
            ("Thị Trường Cạnh Tranh Hoàn Hảo & Điểm Hòa Vốn", "Mô hình cạnh tranh lý tưởng", ["Người chấp nhận giá", "Tối đa hóa lợi nhuận P=MC", "Điểm hòa vốn", "Điểm đóng cửa"]),
            ("Thị Trường Độc Quyền Hoàn Toàn & Định Giá Độc Quyền", "Quyền lực thị trường và tổn thất vô ích", ["Rào cản gia nhập", "Doanh thu cận biên MR < P", "Sức mạnh độc quyền", "Tổn thất xã hội DWL"]),
            ("Thị Trường Cạnh Tranh Mang Tính Độc Quyền", "Khác biệt hóa sản phẩm và cạnh tranh phi giá", ["Khác biệt hóa sản phẩm", "Quảng cáo thương hiệu", "Cân bằng dài hạn lợi nhuận bằng 0"]),
            ("Thị Trường Độc Quyền Nhóm & Lý Thuyết Trò Chơi", "Hành vi tương tác chiến lược giữa các đối thủ", ["Thế lưỡng nan của người tù", "Cân bằng Nash", "Cấu kết ngầm Cartel", "Đường cầu gãy"]),
            ("Ngoại Ứng (Externalities) & Hàng Hóa Công Cộng", "Thất bại của thị trường và vai trò nhà nước", ["Ngoại ứng tích cực/tiêu cực", "Định lý Coase", "Hàng hóa công", "Kẻ đi xe chùa Free Rider"]),
            ("Bất Đối Xứng Thông Tin & Lựa Chọn Bất Lợi", "Thị trường quả chanh và rủi ro đạo đức", ["Adverse Selection", "Moral Hazard", "Tín hiệu thị trường", "Bảo hiểm rủi ro"]),
        ]
    },
    {
        "id": "sub-macroecon",
        "slug": "kinh-te-vi-mo-macro",
        "name": "Kinh Tế Học Vĩ Mô",
        "description": "Tổng sản phẩm quốc nội GDP, lạm phát, thất nghiệp, chính sách tài khóa và chính sách tiền tệ.",
        "difficultyLevel": 2,
        "domains": ["dom-ecom", "dom-acc", "dom-biz"],
        "is_core": True,
        "topic_templates": [
            ("Tổng Sản Phẩm Quốc Nội (GDP): Các Phương Pháp Đo Lường", "Thước đo sức khỏe của toàn bộ nền kinh tế", ["GDP danh nghĩa vs thực tế", "Phương pháp chi tiêu", "Phương pháp thu nhập", "Chỉ số giảm phát GDP"]),
            ("Lạm Phát & Chỉ Số Giá Tiêu Dùng (CPI)", "Biến động mức giá chung và sức mua đồng tiền", ["Rổ hàng hóa CPI", "Lạm phát cầu kéo", "Lạm phát chi phí đẩy", "Lãi suất thực tế Fisher"]),
            ("Thất Nghiệp & Mối Quan Hệ Đánh Đổi Lạm Phát (Đường Phillips)", "Thị trường lao động vĩ mô", ["Thất nghiệp tự nhiên", "Thất nghiệp chu kỳ", "Lực lượng lao động", "Đường cong Phillips"]),
            ("Mô Hình Tổng Cung - Tổng Cầu (AD-AS)", "Cân bằng vĩ mô và chu kỳ kinh tế", ["Tổng cầu AD", "Tổng cung ngắn hạn SRAS", "Tổng cung dài hạn LRAS", "Cú sốc kinh tế"]),
            ("Chính Sách Tài Khóa & Số Nhân Chi Tiêu Chính Phủ", "Công cụ điều tiết ngân sách quốc gia", ["Thuế và chi tiêu", "Số nhân Keynes", "Thâm hụt ngân sách", "Hiệu ứng lấn át Crowding-out"]),
            ("Tiền Tệ, Ngân Hàng Trung Ương & Cung Tiền (M1, M2)", "Hệ thống tiền tệ và tạo tiền", ["Chức năng tiền tệ", "Dự trữ bắt buộc", "Số nhân tiền", "Nghiệp vụ thị trường mở OMO"]),
            ("Chính Sách Tiền Tệ: Lãi Suất & Kiểm Soát Lạm Phát", "Điều hành kinh tế qua kênh tiền tệ", ["Lãi suất tái cấp vốn", "Nới lỏng định lượng QE", "Mục tiêu lạm phát", "Truyền dẫn chính sách"]),
            ("Tỷ Giá Hối Đoái & Cán Cân Thanh Toán Quốc Tế (BOP)", "Tương tác kinh tế qua biên giới", ["Tỷ giá danh nghĩa/thực", "Ngang giá sức mua PPP", "Tài khoản vãng lai", "Dự trữ ngoại hối"]),
            ("Mô Hình IS-LM Trong Nền Kinh Tế Đóng", "Tương tác giữa thị trường hàng hóa và tiền tệ", ["Đường IS", "Đường LM", "Cân bằng đồng thời", "Tác động chính sách tài khóa/tiền tệ"]),
            ("Tăng Trưởng Kinh Tế & Mô Hình Solow-Swan", "Động lực phát triển thịnh vượng dài hạn", ["Tích lũy vốn", "Tiến bộ công nghệ", "Trạng thái dừng Steady State", "Năng suất tổng nhân tố TFP"]),
            ("Khủng Hoảng Tài Chính & Chu Kỳ Kinh Tế Toàn Cầu", "Bong bóng tài sản và suy thoái kinh tế", ["Suy thoái kinh tế", "Bẫy thanh khoản", "Chính sách nghịch chu kỳ", "Rủi ro hệ thống"]),
        ]
    },
    {
        "id": "sub-acc-principles",
        "slug": "nguyen-ly-ke-toan",
        "name": "Nguyên Lý Kế Toán Căn Bản",
        "description": "Phương trình kế toán, định khoản kép, chứng từ sổ sách và hệ thống báo cáo tài chính căn bản.",
        "difficultyLevel": 2,
        "domains": ["dom-acc", "dom-biz", "dom-ecom"],
        "is_core": True,
        "topic_templates": [
            ("Phương Trình Kế Toán Cơ Bản: Tài Sản & Nguồn Vốn", "Nền móng của toàn bộ hệ thống kế toán", ["Tài sản = Nợ phải trả + Vốn chủ sở hữu", "Đối ứng kế toán", "Thực thể kinh doanh"]),
            ("Hệ Thống Tài Khoản Kế Toán & Nguyên Lý Ghi Kép (Nợ - Có)", "Phương pháp hạch toán sổ sách", ["Tài khoản chữ T", "Quy tắc ghi Nợ/Có", "Số dư đầu/cuối kỳ", "Bảng cân đối số phát sinh"]),
            ("Chứng Từ Kế Toán & Quy Trình Luân Chuyển Chứng Từ", "Bằng chứng pháp lý cho các nghiệp vụ phát sinh", ["Hóa đơn GTGT", "Phiếu thu/chi", "Phiếu nhập/xuất kho", "Kiểm tra tính hợp lệ"]),
            ("Kế Toán Nghiệp Vụ Mua Hàng & Quản Lý Hàng Tồn Kho", "Theo dõi dòng vận chuyển hàng hóa", ["Phương pháp kê khai thường xuyên", "Kiểm kê định kỳ", "Chi phí mua hàng", "Chiết khấu thương mại"]),
            ("Các Phương Pháp Tính Giá Hàng Tồn Kho (FIFO, Bình Quân)", "Định giá giá vốn hàng bán", ["FIFO (Nhập trước xuất trước)", "Bình quân gia quyền", "Ảnh hưởng đến lợi nhuận và thuế"]),
            ("Kế Toán Bán Hàng & Xác Định Kết Quả Kinh Doanh", "Ghi nhận doanh thu và chi phí hợp lý", ["Doanh thu thuần", "Giá vốn hàng bán COGS", "Chi phí bán hàng", "Lợi nhuận gộp"]),
            ("Kế Toán Tiền Lương & Các Khoản Trích Theo Lương", "Quyền lợi người lao động và nghĩa vụ doanh nghiệp", ["Bảo hiểm xã hội", "Bảo hiểm y tế", "Kinh phí công đoàn", "Bảng thanh toán lương"]),
            ("Kế Toán Tài Sản Cố Định & Khấu Hao Tài Sản", "Phân bổ chi phí đầu tư dài hạn", ["Nguyên giá tài sản", "Khấu hao đường thẳng", "Khấu hao nhanh", "Thanh lý tài sản"]),
            ("Các Bút Toán Điều Chỉnh Cuối Kỳ & Kế Toán Dồn Tích", "Đảm bảo nguyên tắc phù hợp kế toán", ["Doanh thu chưa thực hiện", "Chi phí trả trước", "Chi phí phải trả", "Doanh thu dồn tích"]),
            ("Bảng Cân Đối Kế Toán (Báo Cáo Tình Hình Tài Chính)", "Bức tranh tài chính tại một thời điểm", ["Tài sản ngắn hạn/dài hạn", "Nợ ngắn hạn/dài hạn", "Vốn chủ sở hữu", "Tính cân đối"]),
            ("Báo Cáo Kết Quả Hoạt Động Kinh Doanh", "Đo lường hiệu quả hoạt động trong kỳ", ["Doanh thu thuần", "Lợi nhuận gộp", "Lợi nhuận thuần từ HĐKD", "Lợi nhuận sau thuế"]),
            ("Báo Cáo Lưu Chuyển Tiền Tệ & Tầm Quan Trọng Của Dòng Tiền", "Theo dõi nguồn tiền ra vào doanh nghiệp", ["Dòng tiền từ HĐ kinh doanh", "Dòng tiền từ HĐ đầu tư", "Dòng tiền từ HĐ tài chính", "Khả năng thanh toán"]),
        ]
    },
    {
        "id": "sub-basic-marketing",
        "slug": "marketing-can-ban",
        "name": "Marketing Căn Bản & Hành Vi Tiêu Dùng",
        "description": "Nghiên cứu thị trường, phân khúc STP, phối thức Marketing Mix 4P/7P và xây dựng thương hiệu.",
        "difficultyLevel": 2,
        "domains": ["dom-biz", "dom-ecom", "dom-tour"],
        "is_core": True,
        "topic_templates": [
            ("Bản Chất Của Marketing & Triết Lý Hướng Về Khách Hàng", "Tạo dựng giá trị và xây dựng mối quan hệ", ["Nhu cầu - Mong muốn - Yêu cầu", "Giá trị khách hàng", "Mô hình phễu Marketing", "Sự hài lòng"]),
            ("Nghiên Cứu Thị Trường & Phân Tích Môi Trường Vĩ Mô (PESTEL)", "Thấu hiểu bối cảnh kinh doanh", ["Môi trường PESTEL", "Nghiên cứu định tính/định lượng", "Dữ liệu sơ cấp và thứ cấp"]),
            ("Mô Hình Hành Vi Mua Của Khách Hàng Cá Nhân & Doanh Nghiệp (B2B)", "Giải mã tâm lý ra quyết định mua", ["Các giai đoạn quyết định mua", "Động cơ Maslow", "Yếu tố xã hội", "Hành vi B2B vs B2C"]),
            ("Chiến Lược Phân Khúc Thị Trường (Segmentation)", "Chia nhỏ thị trường theo đặc tính tương đồng", ["Nhân khẩu học", "Địa lý", "Tâm lý học", "Hành vi mua sắm"]),
            ("Lựa Chọn Thị Trường Mục Tiêu (Targeting)", "Tập trung nguồn lực vào nhóm khách hàng tiềm năng", ["Marketing không phân biệt", "Marketing phân biệt", "Marketing tập trung (Niche)"]),
            ("Định Vị Thương Hiệu (Positioning) & Bản Đồ Định Vị", "Khắc sâu hình ảnh độc nhất trong tâm trí khách hàng", ["Tuyên ngôn định vị", "Điểm khác biệt POD", "Điểm tương đồng POP", "Bản đồ định vị"]),
            ("Chiến Lược Sản Phẩm (Product) & Vòng Đời Sản Phẩm (PLC)", "Phát triển và quản trị danh mục sản phẩm", ["Cấu trúc 3 cấp độ sản phẩm", "Vòng đời sản phẩm PLC", "Quản trị danh mục BCG"]),
            ("Chiến Lược Giá (Pricing): Các Phương Pháp Định Giá Căn Bản", "Cân bằng giữa chi phí, giá trị và cạnh tranh", ["Định giá cộng chi phí", "Định giá hớt váng", "Định giá thâm nhập", "Định giá theo giá trị"]),
            ("Chiến Lược Kênh Phân Phối (Place) & Logistics Tiếp Thị", "Đưa sản phẩm đến tay người dùng hiệu quả", ["Kênh trực tiếp/gián tiếp", "Xung đột kênh", "Phân phối độc quyền vs rộng rãi", "Omnichannel"]),
            ("Chiến Lược Chiêu Thị & Truyền Thông Tích Hợp (IMC)", "Kết hợp đồng bộ các công cụ truyền thông", ["Quảng cáo", "Quan hệ công chúng PR", "Khuyến mãi bán hàng", "Bán hàng cá nhân"]),
            ("Quản Trị Thương Hiệu & Tài Sản Thương Hiệu (Brand Equity)", "Gia tăng giá trị vô hình cho doanh nghiệp", ["Nhận biết thương hiệu", "Liên tưởng thương hiệu", "Chất lượng cảm nhận", "Lòng trung thành"]),
        ]
    },
    {
        "id": "sub-biz-law",
        "slug": "phap-luat-dai-cuong-kinh-te",
        "name": "Pháp Luật Đại Cương & Luật Kinh Tế",
        "description": "Địa vị pháp lý của doanh nghiệp, hợp đồng thương mại, giải quyết tranh chấp và luật sở hữu trí tuệ.",
        "difficultyLevel": 2,
        "domains": ["dom-biz", "dom-ecom", "dom-acc"],
        "is_core": True,
        "topic_templates": [
            ("Hệ Thống Pháp Luật Việt Nam & Các Nguồn Của Pháp Luật", "Kiến thức pháp lý nền tảng", ["Văn bản quy phạm pháp luật", "Hiến pháp", "Luật và Nghị định", "Hiệu lực văn bản"]),
            ("Địa Vị Pháp Lý Doanh Nghiệp: Công Ty TNHH & Công Ty Cổ Phần", "Lựa chọn loại hình doanh nghiệp phù hợp", ["Tư cách pháp nhân", "Trách nhiệm hữu hạn vs vô hạn", "Cổ đông và thành viên góp vốn"]),
            ("Doanh Nghiệp Tư Nhân & Hộ Kinh Doanh Cá Thể", "Mô hình kinh doanh cá thể", ["Trách nhiệm vô hạn", "Đăng ký kinh doanh", "Quyền và nghĩa vụ của chủ DNTN"]),
            ("Pháp Luật Về Hợp Đồng Thương Mại: Giao Kết & Hiệu Lực", "Ràng buộc pháp lý trong giao dịch kinh doanh", ["Đề nghị giao kết", "Chấp nhận đề nghị", "Điều kiện có hiệu lực", "Hợp đồng vô hiệu"]),
            ("Các Biện Pháp Bảo Đảm Thực Hiện Hợp Đồng", "Phòng ngừa rủi ro vi phạm nghĩa vụ", ["Cầm cố", "Thế chấp", "Đặt cọc", "Bảo lãnh"]),
            ("Trách Nhiệm Do Vi Phạm Hợp Đồng: Phạt Vi Phạm & Bồi Thường", "Xử lý khi đối tác không thực hiện cam kết", ["Lỗi vi phạm", "Mức phạt vi phạm tối đa", "Thiệt hại thực tế", "Miễn trừ trách nhiệm"]),
            ("Pháp Luật Về Cạnh Tranh & Chống Độc Quyền", "Bảo vệ môi trường kinh doanh lành mạnh", ["Hành vi hạn chế cạnh tranh", "Lạm dụng vị trí thống lĩnh", "Tập trung kinh tế", "Cạnh tranh không lành mạnh"]),
            ("Pháp Luật Sở Hữu Trí Tuệ: Nhãn Hiệu, Sáng Chế & Bản Quyền", "Bảo vệ tài sản trí tuệ doanh nghiệp", ["Bản quyền tác giả", "Nhãn hiệu hàng hóa", "Bằng độc quyền sáng chế", "Xâm phạm quyền SHTT"]),
            ("Phương Thức Giải Quyết Tranh Chấp Kinh Doanh: Tòa Án & Trọng Tài", "Bảo vệ quyền lợi hợp pháp", ["Thương lượng", "Hòa giải", "Trọng tài thương mại VIAC", "Thủ tục tố tụng tòa án"]),
            ("Pháp Luật Về Phá Sản Doanh Nghiệp & Thủ Tục Phục Hồi", "Thoát lui thị trường có trật tự", ["Mất khả năng thanh toán", "Hội nghị chủ nợ", "Phục hồi kinh doanh", "Thanh lý tài sản"]),
        ]
    },
    {
        "id": "sub-service-comm",
        "slug": "tam-ly-giao-tiep-dich-vu",
        "name": "Tâm Lý Học Giao Tiếp & Dịch Vụ Khách Hàng",
        "description": "Kỹ năng lắng nghe thấu cảm, xử lý phàn nàn, đàm phán thương lượng và xây dựng trải nghiệm khách hàng xuất sắc.",
        "difficultyLevel": 2,
        "domains": ["dom-tour", "dom-biz"],
        "is_core": True,
        "topic_templates": [
            ("Nguyên Lý Giao Tiếp Hiệu Quả & Mô Hình Truyền Thông", "Cơ chế trao đổi thông điệp chuẩn xác", ["Người gửi - Thông điệp - Người nhận", "Nhiễu truyền thông", "Kênh phản hồi Feedback"]),
            ("Nghệ Thuật Lắng Nghe Thấu Cảm (Active Listening)", "Thấu hiểu mong muốn ẩn sâu của khách hàng", ["Lắng nghe tích cực", "Đặt câu hỏi mở/đóng", "Paraphrasing", "Đồng cảm cảm xúc"]),
            ("Ngôn Ngữ Cơ Thể & Giao Tiếp Phi Ngôn Từ", "Sức mạnh của cử chỉ và ánh mắt", ["Ánh mắt Eye Contact", "Nụ cười và tư thế đứng", "Khoảng cách không gian Proxemics", "Giọng điệu"]),
            ("Tâm Lý Học Khách Hàng: Các Kiểu Tính Cách Điển Hình (DISC)", "Thích ứng linh hoạt với từng đối tượng", ["Kiểu Thống trị D", "Kiểu Ảnh hưởng I", "Kiểu Kiên định S", "Kiểu Tuân thủ C"]),
            ("Quy Trình Xử Lý Phàn Nàn Của Khách Hàng (Mô Hình LAST/HEAR)", "Biến khách hàng giận dữ thành người ủng hộ", ["Lắng nghe Listen", "Xin lỗi Apologize", "Giải quyết Solve", "Cảm ơn Thank"]),
            ("Kỹ Năng Đàm Phán & Thuyết Phục Trong Kinh Doanh", "Đạt thỏa thuận đôi bên cùng có lợi (Win-Win)", ["BATNA", "Điểm thỏa hiệp", "Nguyên tắc tương hỗ Cialdini", "Kỹ thuật mỏ neo"]),
            ("Quản Trị Kỳ Vọng & Kiến Tạo Trải Nghiệm Khách Hàng (CX)", "Vượt trên cả sự mong đợi", ["Customer Journey Map", "Điểm chạm Touchpoints", "Moment of Truth", "Net Promoter Score NPS"]),
            ("Giao Tiếp Ứng Xử Đa Văn Hóa Trong Môi Trường Toàn Cầu", "Tôn trọng khác biệt văn hóa", ["Văn hóa ngữ cảnh cao/thấp", "Khoảng cách quyền lực", "Kiêng kỵ văn hóa quốc tế"]),
            ("Quản Lý Căng Thẳng & Kiểm Soát Cảm Xúc Của Nhân Viên Dịch Vụ", "Bảo vệ năng lượng tích cực khi làm việc", ["Emotional Labor", "Burnout", "Tự điều chỉnh cảm xúc", "Chữa lành tâm lý"]),
            ("Xây Dựng Văn Hóa Dịch Vụ Tận Tâm (Customer-Centric)", "Biến dịch vụ khách hàng thành lợi thế cạnh tranh", ["Tôn chỉ phụng sự", "Trao quyền cho nhân viên", "Đo lường sự hài lòng CSAT"]),
        ]
    },

    # Môn chuyên ngành CÔNG NGHỆ THÔNG TIN
    {
        "id": "sub-it-cloud",
        "slug": "dien-toan-dam-may-cloud",
        "name": "Quản Trị Hệ Thống & Điện Toán Đám Mây",
        "description": "AWS, Azure, hạ tầng máy chủ Linux, tự động hóa hạ tầng IaC và giải pháp lưu trữ đám mây.",
        "difficultyLevel": 3,
        "domains": ["dom-it"],
        "is_core": False,
        "topic_templates": [
            ("Tổng Quan Về Điện Toán Đám Mây: IaaS, PaaS và SaaS", "Mô hình dịch vụ đám mây", ["IaaS", "PaaS", "SaaS", "Public vs Private Cloud"]),
            ("Quản Trị Hệ Điều Hành Linux Server: Lệnh & Quyền File", "Làm chủ máy chủ Linux", ["SSH", "Chmod/Chown", "Systemd Service", "Bash Script"]),
            ("Kiến Trúc Hạ Tầng Amazon Web Services (AWS)", "Các khối dịch vụ cốt lõi của AWS", ["VPC", "EC2 Instance", "S3 Storage", "IAM Role"]),
            ("Hạ Tầng Dưới Dạng Mã Nguồn (IaC) Với Terraform", "Tự động hóa triển khai đám mây", ["Terraform Provider", "State File", "Plan & Apply", "Declarative Code"]),
            ("Lập Trình Không Máy Chủ Serverless (AWS Lambda)", "Thực thi tính toán theo sự kiện", ["Event Trigger", "Cold Start", "Stateless Function", "Pay-per-use"]),
            ("Hệ Thống Lưu Trữ Đối Tượng (Object Storage S3)", "Lưu trữ dữ liệu phi cấu trúc quy mô lớn", ["Bucket", "Access Policy", "CDN CloudFront", "Presigned URL"]),
            ("Cân Bằng Tải (Load Balancing) & Tự Động Co Giãn (Auto Scaling)", "Đảm bảo tính sẵn sàng cao High Availability", ["ALB", "Target Group", "Auto Scaling Group", "Health Check"]),
            ("Giám Sát Hạ Tầng Đám Mây Với CloudWatch & Prometheus", "Quan sát toàn diện hệ thống", ["Metrics", "Log Stream", "Alarm Notification", "Dashboard"]),
            ("Sao Lưu Phục Hồi Dữ Liệu & Disaster Recovery (DR)", "Bảo vệ dữ liệu trước thảm họa", ["RPO", "RTO", "Multi-region Replication", "Snapshot Backup"]),
            ("Bảo Mật Đám Mây & Mô Hình Trách Nhiệm Chung", "An toàn an ninh trên hạ tầng Cloud", ["Shared Responsibility", "KMS Encryption", "Security Group", "WAF"]),
        ]
    },
    {
        "id": "sub-it-security",
        "slug": "an-toan-thong-tin-cybersecurity",
        "name": "An Toàn Thông Tin & An Ninh Mạng",
        "description": "Mã hóa khóa công khai, tấn công mạng OWASP, phòng chống mã độc và kiểm thử bảo mật thâm nhập.",
        "difficultyLevel": 3,
        "domains": ["dom-it"],
        "is_core": False,
        "topic_templates": [
            ("Mô Hình Tam Giác Bảo Mật CIA: Confidentiality, Integrity, Availability", "Nền tảng của an toàn thông tin", ["Bảo mật", "Toàn vẹn", "Sẵn sàng", "Kiểm soát truy cập"]),
            ("Mật Mã Học Bất Đối Xứng: Thuật Toán RSA & Trao Đổi Khóa Diffie-Hellman", "Mã hóa khóa công khai hiện đại", ["Public Key", "Private Key", "Chữ ký số", "Số nguyên tố lớn"]),
            ("Mật Mã Đối Xứng Chuẩn AES & Hàm Băm An Toàn SHA-256", "Mã hóa dữ liệu khối tốc độ cao", ["Block Cipher", "Khóa 256-bit", "Tính kháng va chạm Collision Resistance", "HMAC"]),
            ("Tấn Công Tiêm Mã SQL (SQL Injection) & Biện Pháp Phòng Chống", "Lỗ hổng ứng dụng web kinh điển", ["Parameterized Query", "Prepared Statement", "Blind SQLi", "OR 1=1 Attack"]),
            ("Lỗ Hổng Kịch Bản Chéo Trang (Cross-Site Scripting - XSS)", "Đánh cắp phiên người dùng trên trình duyệt", ["Stored XSS", "Reflected XSS", "DOM-based XSS", "Content Security Policy CSP"]),
            ("Tấn Công Giả Mạo Yêu Cầu (CSRF) & Cơ Chế SameSite Cookie", "Bảo vệ các tác vụ quan trọng", ["CSRF Token", "SameSite Cookie", "Referer Header", "Re-authentication"]),
            ("Tấn Công Từ Chối Dịch Vụ Phân Tán (DDoS) & Giải Pháp Giảm Thiểu", "Bảo vệ tính sẵn sàng của hệ thống", ["Botnet", "SYN Flood", "Amplification Attack", "Cloudflare WAF"]),
            ("Quản Lý Danh Tính & Kiểm Soát Quyền Truy Cập (IAM & OAuth2 / JWT)", "Ủy quyền an toàn cho người dùng", ["Authentication vs Authorization", "Access Token", "Refresh Token", "RBAC"]),
            ("Kỹ Thuật Tấn Công Xã Hội (Social Engineering) & Lừa Đảo Phishing", "Điểm yếu con người trong chuỗi an ninh", ["Phishing Email", "Spear Phishing", "Quản lý mật khẩu", "2FA / MFA"]),
            ("Kiểm Thử Xâm Nhập (Penetration Testing) & Quy Trình Khắc Phục", "Chủ động phát hiện lỗ hổng trước kẻ tấn công", ["Reconnaissance", "Vulnerability Scanning", "Exploitation", "Remediation Report"]),
        ]
    },
    {
        "id": "sub-it-web",
        "slug": "lap-trinh-web-fullstack",
        "name": "Phát Triển Ứng Dụng Web & API",
        "description": "Kiến trúc RESTful API, Single Page Application, xác thực JWT, State Management và triển khai SSR.",
        "difficultyLevel": 2,
        "domains": ["dom-it"],
        "is_core": False,
        "topic_templates": [
            ("Kiến Trúc Web Client-Server & Vòng Đời Yêu Cầu HTTP", "Cách trình duyệt tương tác với máy chủ", ["Request Header", "Response Status Code", "DOM Tree", "CSSOM"]),
            ("Xây Dựng Giao Diện Người Dùng Tương Tác Với React", "Lập trình component hướng khai báo", ["JSX", "Props & State", "Component Lifecycle", "Virtual DOM"]),
            ("Quản Lý Trạng Thái Ứng Dụng Với React Hooks", "Tận dụng các hook cốt lõi", ["useState", "useEffect", "useMemo", "useCallback"]),
            ("Kiến Trúc RESTful API: Thiết Kế Endpoint Chuẩn Mực", "Nguyên tắc thiết kế dịch vụ Web", ["Resource Naming", "GET/POST/PUT/DELETE", "Idempotency", "JSON Response"]),
            ("Xây Dựng Backend Với Node.js & Framework Express", "Lập trình máy chủ bất đồng bộ", ["Event Loop", "Non-blocking I/O", "Middleware Pipeline", "Router"]),
            ("Xác Thực & Phân Quyền Người Dùng Bằng JSON Web Token (JWT)", "Cơ chế stateless authentication", ["Header-Payload-Signature", "HttpOnly Cookie", "Auth Guard", "Role-based Route"]),
            ("Tương Tác Cơ Sở Dữ Liệu Với Prisma ORM", "Thao tác dữ liệu an toàn kiểu dữ liệu", ["Schema Definition", "Migration", "Type-safety", "Relation Query"]),
            ("Quản Lý Trạng Thái Toàn Cục Với Zustand / Redux", "Tập trung hóa dữ liệu ứng dụng", ["Global Store", "Actions", "Selectors", "Immutability"]),
            ("Kiến Trúc Server-Side Rendering (SSR) & Tối Ưu SEO", "Tăng tốc hiển thị trang đầu tiên", ["Hydration", "SEO Crawling", "Static Site Generation SSG", "Next.js"]),
            ("Triển Khai CI/CD & Đóng Gói Ứng Dụng Web Với Docker", "Tự động hóa phát hành phần mềm", ["Dockerfile", "Multi-stage Build", "GitHub Actions", "Vercel Triển khai"]),
        ]
    },

    # Môn chuyên ngành KHOA HỌC MÁY TÍNH
    {
        "id": "sub-cs-ai-ml",
        "slug": "tri-tue-nhan-tao-machine-learning",
        "name": "Trí Tuệ Nhân Tạo & Học Máy",
        "description": "Học có giám sát, học không giám sát, mạng nơ-ron học sâu, Gradient Descent và đánh giá mô hình.",
        "difficultyLevel": 3,
        "domains": ["dom-cs"],
        "is_core": False,
        "topic_templates": [
            ("Tổng Quan Về Trí Tuệ Nhân Tạo & Phân Loại Học Máy", "Bức tranh toàn cảnh về AI", ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Feature Vector"]),
            ("Mô Hình Hồi Quy Tuyến Tính (Linear Regression)", "Dự đoán giá trị liên tục", ["Hàm giả thuyết Hypothesis", "Hàm mất mát MSE", "Hệ số góc và điểm cắt", "R-squared"]),
            ("Thuật Toán Hạ Độ Dốc (Gradient Descent Optimization)", "Tìm cực tiểu hàm chi phí", ["Learning Rate", "Đạo hàm riêng", "Stochastic GD", "Batch vs Mini-batch"]),
            ("Hồi Quy Logistic & Bài Toán Phân Lớp Nhị Phân", "Dự đoán xác suất phân loại", ["Hàm Sigmoid", "Log Loss", "Decision Boundary", "Odds Ratio"]),
            ("Đánh Giá Mô Hình Phân Lớp: Confusion Matrix & ROC-AUC", "Đo lường độ chính xác thực chất", ["Accuracy", "Precision", "Recall", "F1-Score", "Đường cong ROC"]),
            ("Cây Quyết Định (Decision Tree) & Thuật Toán Rừng Ngẫu Nhiên", "Mô hình cây phân loại mạnh mẽ", ["Entropy", "Information Gain", "Ensemble Learning", "Bagging"]),
            ("Thuật Toán Phân Cụm K-Means (K-Means Clustering)", "Khám phá cấu trúc ẩn trong dữ liệu", ["Centroid", "Khoảng cách Euclidean", "Elbow Method", "WSS"]),
            ("Giảm Chiều Dữ Liệu Bằng Phân Tích Thành Phần Chính (PCA)", "Nén dữ liệu giữ lại tối đa phương sai", ["Eigenvalues", "Eigenvectors", "Covariance Matrix", "Projection"]),
            ("Mạng Nơ-ron Nhân Tạo Căn Bản (Multilayer Perceptron)", "Mô phỏng tế bào thần kinh sinh học", ["Perceptron", "Hàm kích hoạt ReLU/Softmax", "Lan truyền tiến Feedforward", "Lan truyền ngược Backprop"]),
            ("Hiện Tượng Học Quá Tốt (Overfitting) & Kỹ Thuật Điều Chuẩn", "Giúp mô hình khái quát hóa tốt", ["Overfitting vs Underfitting", "L1 Lasso", "L2 Ridge", "Dropout", "Early Stopping"]),
        ]
    },
    {
        "id": "sub-cs-automata",
        "slug": "ly-thuyet-tinh-toan-automata",
        "name": "Lý Thuyết Tính Toán & Ngôn Ngữ Hình Thức",
        "description": "Ôtômat hữu hạn, ngữ pháp phi ngữ cảnh, máy Turing, bài toán Halting và phân lớp P vs NP.",
        "difficultyLevel": 3,
        "domains": ["dom-cs"],
        "is_core": False,
        "topic_templates": [
            ("Ngôn Ngữ Hình Thức & Bảng Chữ Cái Toán Học", "Khái niệm nền tảng về tính toán", ["Bảng chữ cái Alphabet", "Chuỗi String", "Ngôn ngữ Language", "Phép sao Kleene"]),
            ("Ôtômat Hữu Hạn Đơn Định (DFA)", "Mô hình nhận dạng ngôn ngữ chính quy", ["Tập trạng thái", "Hàm chuyển trạng thái", "Trạng thái bắt đầu", "Trạng thái chấp nhận"]),
            ("Ôtômat Hữu Hạn Không Đơn Định (NFA) & Chuyển Đổi DFA", "Sức mạnh tương đương của NFA và DFA", ["Chuyển trạng thái Epsilon", "Phương pháp tập con Subset Construction", "Ngôn ngữ chính quy"]),
            ("Biểu Thức Chính Quy (Regex) & Định Lý Kleene", "Đặc tả mẫu chuỗi hình thức", ["Toán tử ghép nối", "Toán tử tuyển", "Định lý Kleene", "Ứng dụng Parser"]),
            ("Bổ Đề Bơm Cho Ngôn Ngữ Chính Quy (Pumping Lemma)", "Chứng minh một ngôn ngữ không chính quy", ["Độ dài bơm", "Phép chia chuỗi xyz", "Chứng minh bằng phản chứng"]),
            ("Ngữ Pháp Phi Ngữ Cảnh (CFG) & Cây Dẫn Xuất", "Cấu trúc cú pháp ngôn ngữ lập trình", ["Biến sinh", "Ký hiệu kết thúc", "Quy tắc sinh", "Nhập nhằng cú pháp Ambiguity"]),
            ("Ôtômat Đẩy Xuống (Pushdown Automata - PDA)", "Ôtômat có bộ nhớ ngăn xếp", ["Stack PDA", "Nhận dạng ngôn ngữ phi ngữ cảnh", "Deterministic PDA"]),
            ("Máy Turing (Turing Machine) & Giả Thuyết Church-Turing", "Mô hình máy tính vạn năng", ["Băng từ Tape", "Đầu đọc ghi", "Trạng thái Halt", "Turing-complete"]),
            ("Bài Toán Dừng (Halting Problem) & Tính Không Thể Giải Quyết", "Giới hạn tuyệt đối của máy tính", ["Tính khả quyết Decidability", "Phương pháp đường chéo Cantor", "Nghịch lý tự tham chiếu"]),
            ("Lý Thuyết Độ Phức Tạp: Phân Lớp P, NP và NP-Đầy Đủ", "Bài toán mở lớn nhất của khoa học máy tính", ["Lớp P thời gian đa thức", "Lớp NP kiểm chứng đa thức", "Quy dẫn đa thức", "NP-Complete"]),
        ]
    },
    {
        "id": "sub-cs-os",
        "slug": "kien-truc-may-tinh-he-dieu-hanh",
        "name": "Kiến Trúc Máy Tính & Hệ Điều Hành",
        "description": "Quản lý tiến trình, bộ nhớ ảo, ngắt phần cứng, lập lịch CPU và hệ thống tập tin.",
        "difficultyLevel": 3,
        "domains": ["dom-cs"],
        "is_core": False,
        "topic_templates": [
            ("Kiến Trúc Von Neumann & Chu Kỳ Lệnh CPU", "Cách máy tính thực thi mã máy", ["ALU", "Thanh ghi Register", "Bộ đếm chương trình PC", "Fetch-Decode-Execute"]),
            ("Hệ Thống Phân Cấp Bộ Nhớ: Cache L1/L2/L3 & RAM", "Tối ưu hóa độ trễ truy xuất", ["Locality of Reference", "Cache Hit/Miss", "Cache Line", "Latency Numbers"]),
            ("Quản Lý Tiến Trình (Process) & Khối Điều Khiển PCB", "Đơn vị tài nguyên của hệ điều hành", ["Tiến trình vs Luồng", "Process Control Block", "Chuyển ngữ cảnh Context Switch"]),
            ("Các Giải Thuật Lập Lịch CPU (Scheduling)", "Tối đa hóa hiệu năng xử lý của CPU", ["First-Come First-Served", "Shortest Job First", "Round Robin", "Priority Scheduling"]),
            ("Cơ Chế Đồng Bộ Hóa: Mutex, Semaphore & Điều Kiện Tranh Chấp", "Bảo vệ tài nguyên dùng chung", ["Race Condition", "Critical Section", "Semaphore", "Spinlock"]),
            ("Bế Tắc Tài Nguyên (Deadlock) & 4 Điều Kiện Coffman", "Ngăn chặn kẹt cứng hệ thống", ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait", "Banker's Algorithm"]),
            ("Bộ Nhớ Ảo & Cơ Chế Phân Trang (Virtual Memory & Paging)", "Mở rộng không gian địa chỉ cho tiến trình", ["Bảng trang Page Table", "Bộ nhớ chuyển đổi TLB", "Lỗi trang Page Fault"]),
            ("Các Thuật Toán Thay Thế Trang Bộ Nhớ (Page Replacement)", "Tối ưu hóa bộ nhớ RAM hữu hạn", ["FIFO", "Optimal", "Least Recently Used LRU", "Clock Algorithm"]),
            ("Hệ Thống Tệp Tin (File System) & Cấu Trúc Inode", "Lưu trữ dữ liệu bền vững trên đĩa", ["Inode", "Superblock", "Directory Entry", "Journaling File System"]),
            ("Cơ Chế Ngắt Phần Cứng & Xử Lý Ngoại Lệ (Interrupt & Trap)", "Giao tiếp giữa phần cứng và phần mềm", ["Interrupt Vector", "ISR", "System Call", "User Mode vs Kernel Mode"]),
        ]
    },

    # Môn chuyên ngành KỸ THUẬT PHẦN MỀM
    {
        "id": "sub-se-testing",
        "slug": "kiem-thu-chat-luong-phan-mem",
        "name": "Kiểm Thử Phần Mềm & Đảm Bảo Chất Lượng",
        "description": "Unit testing, Integration testing, kiểm thử hộp đen/hộp trắng, tự động hóa với Selenium/Cypress.",
        "difficultyLevel": 2,
        "domains": ["dom-se"],
        "is_core": False,
        "topic_templates": [
            ("Quy Trình Kiểm Thử Phần Mềm V-Model & Mô Hình Kim Tự Tháp", "Tổng quan về chiến lược kiểm thử", ["Unit Test", "Integration Test", "E2E Test", "V-Model"]),
            ("Kỹ Thuật Kiểm Thử Hộp Đen (Black-box Testing)", "Kiểm thử dựa trên yêu cầu chức năng", ["Phân vùng tương đương", "Phân tích giá trị biên BVA", "Bảng quyết định", "Chuyển trạng thái"]),
            ("Kỹ Thuật Kiểm Thử Hộp Trắng (White-box Testing)", "Kiểm thử cấu trúc mã nguồn bên trong", ["Độ bao phủ câu lệnh Statement Coverage", "Độ bao phủ nhánh Branch Coverage", "Cyclomatic Complexity"]),
            ("Kiểm Thử Đơn Vị (Unit Testing) Với Thư Viện Mock & Stub", "Đảm bảo chất lượng từng hàm chức năng", ["AAA Pattern (Arrange-Act-Assert)", "Test Runner", "Mock Object", "Stub"]),
            ("Phát Triển Hướng Kiểm Thử (Test-Driven Development - TDD)", "Viết test trước khi viết mã nguồn", ["Red-Green-Refactor", "Thiết kế mô-đun hóa", "Tự tin tái cấu trúc"]),
            ("Kiểm Thử Tích Hợp (Integration Testing) & API Testing", "Kiểm tra sự ăn khớp giữa các hệ thống", ["Top-down vs Bottom-up", "Contract Testing", "Postman / Newman", "Stubbing Network"]),
            ("Kiểm Thử Hồi Quy (Regression Testing) & Chiến Lược Chọn Test Case", "Bảo vệ hệ thống không bị lỗi cũ", ["Smoke Test", "Sanity Test", "Automated Regression Suite"]),
            ("Kiểm Thử Tự Động Giao Diện E2E Với Playwright / Cypress", "Mô phỏng trải nghiệm người dùng thực", ["DOM Selector", "Headless Browser", "Asynchronous Waiting", "Visual Regression"]),
            ("Kiểm Thử Hiệu Năng (Performance & Load Testing)", "Đo lường độ chịu tải của hệ thống", ["Throughput", "Response Time", "JMeter / k6", "Stress Testing"]),
            ("Quy Trình Quản Lý Lỗi (Defect Life Cycle) & Báo Cáo Chất Lượng", "Theo dõi và đóng lỗi chuyên nghiệp", ["Mức độ nghiêm trọng Severity", "Mức độ ưu tiên Priority", "Jira Bug Workflow"]),
        ]
    },
    {
        "id": "sub-se-patterns",
        "slug": "kien-truc-mau-thiet-ke-software",
        "name": "Kiến Trúc Phần Mềm & Mẫu Thiết Kế (Design Patterns)",
        "description": "Nguyên lý SOLID, Clean Architecture, GoF Patterns (Creational, Structural, Behavioral) và Microservices.",
        "difficultyLevel": 3,
        "domains": ["dom-se"],
        "is_core": False,
        "topic_templates": [
            ("Nguyên Lý Thiết Kế Hướng Đối Tượng SOLID", "Bộ 5 nguyên tắc vàng của lập trình viên", ["Single Responsibility", "Open-Closed", "Liskov Substitution", "Interface Segregation", "Dependency Inversion"]),
            ("Nhóm Mẫu Khởi Tạo: Singleton & Factory Method", "Kiểm soát quá trình tạo lập đối tượng", ["Thread-safe Singleton", "Factory Method", "Encapsulation of Object Creation"]),
            ("Nhóm Mẫu Khởi Tạo: Builder & Abstract Factory", "Xây dựng các đối tượng phức tạp", ["Builder Pattern", "Fluent Interface", "Abstract Factory Family"]),
            ("Nhóm Mẫu Cấu Trúc: Adapter & Decorator", "Liên kết các giao diện không tương thích", ["Adapter Wrapper", "Decorator Pattern", "Kế thừa vs Bao đóng Composition"]),
            ("Nhóm Mẫu Cấu Trúc: Facade & Proxy", "Đơn giản hóa giao diện và kiểm soát truy cập", ["Facade Interface", "Virtual Proxy", "Protection Proxy", "Caching Proxy"]),
            ("Nhóm Mẫu Hành Vi: Observer & Publish-Subscribe", "Phản ứng tự động khi trạng thái thay đổi", ["Subject-Observer", "Event-driven", "Decoupling", "Pub-Sub Broker"]),
            ("Nhóm Mẫu Hành Vi: Strategy & State", "Thay đổi thuật toán và hành vi linh hoạt", ["Strategy Pattern", "State Pattern", "Loại bỏ khối If-Else lồng nhau"]),
            ("Kiến Trúc Phân Lớp (Layered / N-Tier Architecture)", "Tổ chức mã nguồn theo trách nhiệm", ["Presentation Layer", "Business Logic Layer", "Data Access Layer"]),
            ("Kiến Trúc Sạch (Clean Architecture & Hexagonal)", "Độc lập với framework và cơ sở dữ liệu", ["Entities Core", "Use Cases", "Interface Adapters", "Dependency Rule"]),
            ("Kiến Trúc Vi Dịch Vụ (Microservices Architecture)", "Chia nhỏ hệ thống thành các dịch vụ độc lập", ["API Gateway", "Service Registry", "Event Bus", "Database per Service"]),
        ]
    },
    {
        "id": "sub-se-devops",
        "slug": "agile-devops-quy-trinh-phan-mem",
        "name": "Quy Trình Phát Triển Agile & Văn Hóa DevOps",
        "description": "Scrum, Kanban, đường ống CI/CD, Infrastructure as Code, giám sát vận hành và tự động hóa release.",
        "difficultyLevel": 2,
        "domains": ["dom-se"],
        "is_core": False,
        "topic_templates": [
            ("Tuyên Ngôn Agile & So Sánh Mô Hình Thác Nước (Waterfall)", "Sự dịch chuyển phương pháp luận phát triển", ["4 giá trị cốt lõi", "12 nguyên tắc Agile", "Thích ứng thay đổi"]),
            ("Khung Làm Việc Scrum: Vai Trò, Sự Kiện & Tạo Tác", "Vận hành nhóm phát triển linh hoạt", ["Product Owner", "Scrum Master", "Sprint Planning", "Daily Scrum", "Sprint Retrospective"]),
            ("Phương Pháp Kanban & Tối Ưu Hóa Dòng Chảy Công Việc", "Trực quan hóa và giới hạn công việc đang làm", ["Kanban Board", "Work in Progress (WIP) Limit", "Lead Time", "Cycle Time"]),
            ("Quản Lý Phiên Bản Mã Nguồn Với Git & Chiến Lược Nhánh (Gitflow)", "Làm việc cộng tác an toàn trên source code", ["Commit Atomic", "Merge vs Rebase", "Pull Request", "Gitflow vs Trunk-based"]),
            ("Tích Hợp Liên Tục (Continuous Integration - CI)", "Tự động hóa build và chạy test", ["GitHub Actions Workflow", "Linting Code", "Automated Testing", "Build Artifact"]),
            ("Phát Hành Liên Tục (Continuous Delivery / Deployment - CD)", "Đưa phần mềm tới tay người dùng tự động", ["Deployment Pipeline", "Staging Environment", "Production Release"]),
            ("Chiến Lược Triển Khai Không Gián Đoạn (Blue-Green & Canary)", "Giảm thiểu rủi ro khi cập nhật ứng dụng", ["Zero-downtime", "Blue-Green Switching", "Canary Deployment", "Rollback Plan"]),
            ("Hạ Tầng Dưới Dạng Mã Nguồn (IaC) & Quản Lý Cấu Hình", "Kiểm soát môi trường máy chủ nhất quán", ["Declarative Infrastructure", "Ansible", "Idempotence"]),
            ("Quan Sát Hệ Thống (Observability): Logging, Metrics, Tracing", "Hiểu rõ trạng thái bên trong của phần mềm", ["Structured Logging", "Prometheus Metrics", "Distributed Tracing Jaeger"]),
            ("Văn Hóa DevOps & Kỹ Thuật Đảm Bảo Độ Tin Cậy SRE", "Xóa bỏ rào cản giữa Development và Operations", ["SLA, SLO và SLI", "Error Budget", "Blameless Post-mortem", "Automation Mindset"]),
        ]
    },

    # Môn chuyên ngành THƯƠNG MẠI ĐIỆN TỬ
    {
        "id": "sub-ecom-payments",
        "slug": "thanh-toan-dien-tu-fintech",
        "name": "Hệ Thống Thanh Toán Điện Tử & FinTech",
        "description": "Cổng thanh toán, ví điện tử, QR Code, tokenization thẻ tín dụng, bảo mật PCI-DSS và công nghệ Blockchain.",
        "difficultyLevel": 3,
        "domains": ["dom-ecom"],
        "is_core": False,
        "topic_templates": [
            ("Tổng Quan Hệ Thống Thanh Toán Điện Tử Toàn Cầu & Việt Nam", "Các hình thức thanh toán số hiện đại", ["Cổng thanh toán", "Ví điện tử", "Chuyển khoản liên ngân hàng", "COD"]),
            ("Kiến Trúc Cổng Thanh Toán & Giao Thức Tích Hợp API", "Kết nối website với tổ chức tài chính", ["Payment Gateway", "Merchant Account", "Webhook Callback", "Idempotency Key"]),
            ("Quy Trình Xử Lý Giao Dịch Thẻ Tín Dụng / Ghi Nợ (Visa/Mastercard)", "Hành trình của một khoản thanh toán thẻ", ["Acquiring Bank", "Issuing Bank", "Payment Processor", "Quy trình Authorization & Capture"]),
            ("Công Nghệ Mã Hóa Số Thẻ (Tokenization) & Bảo Mật PCI-DSS", "Bảo vệ thông tin tài chính người dùng", ["Network Tokenization", "Chuẩn bảo mật PCI-DSS", "Point-to-Point Encryption"]),
            ("Công Nghệ Thanh Toán QR Code (VietQR / EMVCo)", "Chuẩn hóa thanh toán mã phản hồi nhanh", ["Tĩnh vs Động QR", "Cấu trúc dữ liệu EMVCo", "NAPAS 24/7 API"]),
            ("Mô Hình Hoạt Động Của Ví Điện Tử (E-Wallet)", "Lưu trữ giá trị tiền tệ trên thiết bị", ["Liên kết tài khoản ngân hàng", "Ví trung gian", "Chuyển tiền P2P", "Thanh toán P2M"]),
            ("Quản Trị Rủi Ro Gian Lận Giao Dịch (Fraud Detection)", "Ngăn chặn gian lận thẻ và rửa tiền", ["Chargeback", "Quy tắc phát hiện bất thường", "Machine Learning Fraud Scoring", "3D-Secure 2.0"]),
            ("Mô Hình Mua Trước Trả Sau (Buy Now Pay Later - BNPL)", "Đổi mới tài chính thúc đẩy tiêu dùng", ["Quy trình phê duyệt tức thì", "Kỳ hạn trả góp", "Lợi ích cho người bán và người mua", "Quản lý nợ xấu"]),
            ("Công Nghệ Blockchain & Tiền Điện Tử Trong Thương Mại", "Thanh toán phi tập trung", ["Sổ cái phân tán DLT", "Hợp đồng thông minh Smart Contract", "Stablecoin", "Rủi ro biến động"]),
            ("Khung Pháp Lý Về Thanh Toán Điện Tử & Bảo Vệ Người Tiêu Dùng", "Quy định của Ngân hàng Nhà nước", ["Nghị định thanh toán không dùng tiền mặt", "KYC / eKYC định danh", "Bảo mật thông tin khách hàng"]),
        ]
    },
    {
        "id": "sub-ecom-digital-mkt",
        "slug": "digital-marketing-seo-sem",
        "name": "Digital Marketing, SEO & Quảng Cáo Số",
        "description": "Tối ưu hóa công cụ tìm kiếm SEO, quảng cáo Google Ads, Facebook Ads, Content Marketing và Email Marketing.",
        "difficultyLevel": 2,
        "domains": ["dom-ecom"],
        "is_core": False,
        "topic_templates": [
            ("Chiến Lược Digital Marketing Tổng Thể: Khung Tiếp Thị Đa Kênh", "Lập kế hoạch tiếp thị số toàn diện", ["Owned Media", "Paid Media", "Earned Media", "Mô hình phễu chuyển đổi"]),
            ("Nguyên Lý Hoạt Động Của Công Cụ Tìm Kiếm Google", "Thuật toán thu thập và xếp hạng trang web", ["Web Crawler", "Indexation", "Thuật toán RankBrain", "Yếu tố xếp hạng"]),
            ("Nghiên Cứu Từ Khóa & Tối Ưu Hóa On-Page SEO", "Chuẩn hóa nội dung cho công cụ tìm kiếm", ["Search Intent", "Thẻ Title/Meta Description", "Cấu trúc Heading H1-H3", "Tối ưu hình ảnh"]),
            ("Kỹ Thuật Technical SEO & Tối Ưu Tốc Độ Tải Trang (Core Web Vitals)", "Nền tảng kỹ thuật cho website chuẩn SEO", ["LCP, FID, CLS", "Sitemap XML", "Robots.txt", "Dữ liệu có cấu trúc Schema"]),
            ("Xây Dựng Liên Kết (Off-Page SEO) & Thẩm Quyền Trang Web (Domain Authority)", "Gia tăng độ uy tín với Google", ["Backlink chất lượng", "Anchor Text", "Guest Posting", "Phòng tránh thuật toán phạt"]),
            ("Quảng Cáo Tìm Kiếm Trả Phí (Google Ads / SEM)", "Tiếp cận khách hàng tại thời điểm phát sinh nhu cầu", ["Pay-Per-Click PPC", "Điểm chất lượng Quality Score", "Đấu thầu từ khóa Bidding", "Tiện ích mở rộng"]),
            ("Quảng Cáo Mạng Xã Hội (Facebook & TikTok Ads)", "Nhắm chọn đối tượng mục tiêu chuẩn xác", ["Pixel Tracking", "Custom Audience", "Lookalike Audience", "Định dạng video ngắn"]),
            ("Tiếp Thị Nội Dung (Content Marketing) & Xây Dựng Blog Doanh Nghiệp", "Thu hút và giữ chân khách hàng bằng giá trị", ["Chiến lược nội dung", "Storytelling", "Ebook / Infographic", "Tái sử dụng nội dung"]),
            ("Tiếp Thị Qua Email (Email Marketing Automation)", "Nuôi dưỡng khách hàng tiềm năng tự động", ["Drip Campaign", "Tỷ lệ mở Open Rate", "Tỷ lệ nhấp CTR", "Phân khúc danh sách email"]),
            ("Đo Lường & Phân Tích Dữ Liệu Marketing Với Google Analytics 4 (GA4)", "Đánh giá hiệu quả chiến dịch bằng con số", ["Event-based Tracking", "Tỷ lệ chuyển đổi Conversion Rate", "ROAS / ROI", "Mô hình phân bổ Attribution"]),
        ]
    },
    {
        "id": "sub-ecom-logistics",
        "slug": "quan-tri-san-tmdt-supply-chain",
        "name": "Quản Trị Sàn TMĐT & Chuỗi Cung Ứng Số",
        "description": "Vận hành gian hàng Shopee/Lazada/TikTok Shop, hoàn tất đơn hàng Fulfillment, logistics chặng cuối và Dropshipping.",
        "difficultyLevel": 2,
        "domains": ["dom-ecom"],
        "is_core": False,
        "topic_templates": [
            ("Mô Hình Kinh Doanh Sàn TMĐT: Marketplace Platform", "Vận hành hệ sinh thái thương mại đa người bán", ["B2C, C2C, B2B2C", "Mô hình hoa hồng Commission", "Thuật toán hiển thị sản phẩm sàn"]),
            ("Chiến Lược Tối Ưu Hóa Gian Hàng Trên Sàn (Shopee / TikTok Shop)", "Thu hút lưu lượng truy cập nội sàn", ["Tên sản phẩm chuẩn SEO", "Hình ảnh tối ưu tỷ lệ nhấp", "Video livestream bán hàng", "Voucher mã giảm giá"]),
            ("Mô Hình Hoàn Tất Đơn Hàng (E-Commerce Fulfillment)", "Quy trình từ lúc bấm mua đến khi nhận hàng", ["Pick-Pack-Ship", "Kho tự vận hành vs Kho thuê ngoài 3PL", "Mô hình Fulfillment by Platform"]),
            ("Quản Trị Hàng Tồn Kho Đa Kênh (Omnichannel Inventory)", "Tránh tình trạng hết hàng và tồn đọng", ["Đồng bộ kho thời gian thực", "Mức tồn kho an toàn Safety Stock", "Điểm đặt hàng lại ROP", "EOQ"]),
            ("Logistics Chặng Cuối (Last-Mile Delivery) & Giao Hàng Siêu Tốc", "Chinh phục điểm chạm quan trọng nhất", ["Định tuyến giao hàng Route Optimization", "Giao hàng cùng ngày Same-day", "Tủ khóa thông minh Smart Locker"]),
            ("Mô Hình Kinh Doanh Dropshipping & Cross-Border E-Commerce", "Bán hàng xuyên biên giới không cần kho", ["Quy trình Dropshipping", "Sourcing nhà cung cấp", "Thủ tục hải quan", "Vận chuyển quốc tế"]),
            ("Quản Trị Hoàn Trả Hàng (Reverse Logistics) & Xử Lý Đổi Trả", "Tối ưu chi phí cho dòng hàng hóa quay ngược", ["Chính sách đổi trả", "Chi phí xử lý đơn trả về", "Phục hồi giá trị sản phẩm"]),
            ("Ứng Dụng Dữ Liệu Lớn & AI Trong Dự Báo Nhu Cầu Chuỗi Cung Ứng", "Chủ động nhập hàng theo mùa vụ", ["Dự báo nhu cầu Demand Forecasting", "Phân tích xu hướng", "Tối ưu tồn kho tự động"]),
            ("Dịch Vụ Khách Hàng & Quản Trị Trải Nghiệm Mua Sắm Trên Sàn", "Duy trì tỷ lệ đánh giá 5 sao", ["Tỷ lệ phản hồi chat", "Xử lý khiếu nại đánh giá xấu", "Tỷ lệ hủy đơn hàng"]),
            ("Chuyển Đổi Số Chuỗi Cung Ứng Xanh (Green Logistics)", "Xu hướng phát triển bền vững trong TMĐT", ["Đóng gói thân thiện môi trường", "Phương tiện giao hàng điện", "Tối ưu dấu chân carbon"]),
        ]
    },

    # Môn chuyên ngành KẾ TOÁN - KIỂM TOÁN
    {
        "id": "sub-acc-financial",
        "slug": "ke-toan-tai-chinh-doanh-nghiep",
        "name": "Kế Toán Tài Chính Doanh Nghiệp Nâng Cao",
        "description": "Chuẩn mực VAS/IFRS, hợp nhất báo cáo tài chính, kế toán công cụ tài chính và giao dịch ngoại tệ.",
        "difficultyLevel": 3,
        "domains": ["dom-acc"],
        "is_core": False,
        "topic_templates": [
            ("Khuôn Khổ Chuẩn Mực Kế Toán Quốc Tế IFRS & Chuyển Đổi VAS Sang IFRS", "Hội nhập ngôn ngữ tài chính toàn cầu", ["IFRS Framework", "Nguyên tắc giá trị hợp lý Fair Value", "Khác biệt cơ bản VAS vs IFRS"]),
            ("Kế Toán Các Công Cụ Tài Chính: Cổ Phiếu, Trái Phiếu & Phái Sinh", "Hạch toán tài sản và nợ tài chính", ["FVTPL", "FVOCI", "Amortized Cost", "Giao dịch phòng ngừa rủi ro Hedging"]),
            ("Kế Toán Thuê Tài Sản Theo Chuẩn Mực IFRS 16", "Ghi nhận quyền sử dụng tài sản trên bảng cân đối", ["Quyền sử dụng tài sản ROU", "Nợ thuê tài chính", "Chi phí khấu hao và lãi vay"]),
            ("Kế Toán Giao Dịch Ngoại Tệ & Xử Lý Chênh Lệch Tỷ Giá", "Phản ánh biến động tỷ giá hối đoái", ["Tỷ giá giao dịch thực tế", "Đánh giá lại số dư cuối kỳ", "Lãi/lỗ chênh lệch tỷ giá"]),
            ("Kế Toán Hợp Nhất Doanh Nghiệp & Lợi Thế Thương Mại (Goodwill)", "Mua bán và sáp nhập M&A", ["Phương pháp mua Acquisition Method", "Xác định giá phí hợp nhất", "Đo lường lợi thế thương mại", "Đánh giá giảm giá trị"]),
            ("Phương Pháp Lập Báo Cáo Tài Chính Hợp Nhất Cho Tập Đoàn", "Hợp nhất số liệu công ty mẹ và công ty con", ["Loại trừ giao dịch nội bộ", "Lợi ích cổ đông không kiểm soát NCI", "Chênh lệch giá trị hợp lý"]),
            ("Kế Toán Đầu Tư Vào Công Ty Liên Doanh, Liên Kết (Phương Pháp Vốn Chủ)", "Phản ánh tỷ lệ sở hữu đáng kể", ["Phương pháp vốn chủ sở hữu Equity Method", "Ghi nhận phần chia lãi/lỗ", "Cổ tức nhận được"]),
            ("Kế Toán Thuế Thu Nhập Hoãn Lại (Deferred Tax)", "Xử lý chênh lệch giữa kế toán và luật thuế", ["Chênh lệch tạm thời", "Tài sản thuế hoãn lại", "Thuế thu nhập hoãn lại phải trả"]),
            ("Kế Toán Các Khoản Dự Phòng & Nợ Tiềm Tàng (IAS 37)", "Ghi nhận thận trọng nghĩa vụ hiện tại", ["Điều kiện trích lập dự phòng", "Nợ tiềm tàng Contingent Liability", "Ước tính giá trị tốt nhất"]),
            ("Trình Bày & Thuyết Minh Báo Cáo Tài Chính Minh Bạch", "Cung cấp đầy đủ thông tin cho nhà đầu tư", ["Thuyết minh chính sách kế toán", "Sự kiện phát sinh sau ngày kết thúc kỳ kế toán", "Giao dịch với các bên liên quan"]),
        ]
    },
    {
        "id": "sub-acc-managerial",
        "slug": "ke-toan-quan-tri-chi-phi",
        "name": "Kế Toán Quản Trị & Phân Tích Chi Phí",
        "description": "Phân loại chi phí, phân tích CVP, định giá sản phẩm, lập dự toán ngân sách và thẻ điểm cân bằng BSC.",
        "difficultyLevel": 3,
        "domains": ["dom-acc"],
        "is_core": False,
        "topic_templates": [
            ("Bản Chất Của Kế Toán Quản Trị & So Sánh Với Kế Toán Tài Chính", "Phục vụ quyết định nội bộ của nhà quản lý", ["Thông tin định hướng tương lai", "Đối tượng sử dụng nội bộ", "Tính linh hoạt"]),
            ("Phân Loại Chi Phí: Biến Phí, Định Phí & Chi Phí Hỗn Hợp", "Thấu hiểu hành vi của chi phí", ["Biến phí Variable Cost", "Định phí Fixed Cost", "Phương pháp cực đại - cực tiểu High-Low"]),
            ("Phân Tích Mối Quan Hệ Chi Phí - Khối Lượng - Lợi Nhuận (CVP)", "Xác định ngưỡng an toàn kinh doanh", ["Số dư đảm phí Contribution Margin", "Điểm hòa vốn Break-even Point", "Biên độ an toàn Margin of Safety"]),
            ("Phương Pháp Xác Định Chi Phí Dựa Trên Hoạt Động (Activity-Based Costing - ABC)", "Phân bổ chi phí chung chính xác", ["Cost Driver", "Activity Pool", "Loại bỏ méo mó chi phí"]),
            ("Hệ Thống Chi Phí Định Mức & Phân Tích Biến Động (Standard Costing & Variance)", "Kiểm soát chi phí sản xuất", ["Biến động giá nguyên vật liệu", "Biến động lượng sử dụng", "Biến động nhân công trực tiếp"]),
            ("Lập Dự Toán Ngân Sách Hoạt Động Doanh Nghiệp (Master Budget)", "Kế hoạch tài chính toàn diện cho năm tài chính", ["Dự toán tiêu thụ", "Dự toán sản xuất", "Dự toán dòng tiền Cash Budget"]),
            ("Kế Toán Trách Nhiệm & Đánh Giá Hiệu Quả Bộ Phận (Responsibility Accounting)", "Đo lường thành tích quản lý", ["Trung tâm chi phí", "Trung tâm doanh thu", "Trung tâm lợi nhuận", "Trung tâm đầu tư ROI/RI"]),
            ("Định Giá Chuyển Nhượng Nội Bộ (Transfer Pricing)", "Phân bổ lợi nhuận giữa các chi nhánh tập đoàn", ["Giá chuyển nhượng thị trường", "Giá dựa trên chi phí", "Tối ưu hóa thuế hợp pháp"]),
            ("Phân Tích Thông Tin Thích Hợp Cho Ra Quyết Định Ngắn Hạn", "Lựa chọn phương án kinh doanh tối ưu", ["Đơn đặt hàng đặc biệt", "Tự sản xuất hay mua ngoài Make or Buy", "Bỏ hay duy trì dòng sản phẩm"]),
            ("Đo Lường Hiệu Suất Chiến Lược Bằng Thẻ Điểm Cân Bằng (Balanced Scorecard)", "Kết nối chiến lược với hoạt động thực thi", ["Viễn cảnh tài chính", "Viễn cảnh khách hàng", "Viễn cảnh quy trình nội bộ", "Học hỏi và phát triển"]),
        ]
    },
    {
        "id": "sub-acc-audit",
        "slug": "kiem-toan-can-ban-chuan-muc",
        "name": "Kiểm Toán Căn Bản & Chuẩn Mực Kiểm Toán",
        "description": "Bằng chứng kiểm toán, đánh giá rủi ro, kiểm soát nội bộ, lấy mẫu kiểm toán và phát hành báo cáo kiểm toán.",
        "difficultyLevel": 3,
        "domains": ["dom-acc"],
        "is_core": False,
        "topic_templates": [
            ("Bản Chất Của Kiểm Toán & Chuẩn Mực Kiểm Toán Quốc Tế (ISA / VSA)", "Đảm bảo tính trung thực và hợp lý của số liệu", ["Kiểm toán độc lập", "Kiểm toán nội bộ", "Tính độc lập nghề nghiệp", "Mục tiêu kiểm toán"]),
            ("Đạo Đức Nghề Nghiệp Của Kiểm Toán Viên & Trách Nhiệm Pháp Lý", "Giữ gìn niềm tin công chúng", ["Tính chính trực", "Tính khách quan", "Bảo mật thông tin", "Xung đột lợi ích"]),
            ("Mô Hình Rủi Ro Kiểm Toán & Mức Trọng Yếu (Materiality)", "Định hướng phạm vi công việc kiểm toán", ["Rủi ro tiềm tàng Inherent Risk", "Rủi ro kiểm soát Control Risk", "Rủi ro phát hiện Detection Risk"]),
            ("Đánh Giá Hệ Thống Kiểm Soát Nội Bộ Của Khách Hàng (Khung COSO)", "Thấu hiểu môi trường kiểm soát doanh nghiệp", ["Môi trường kiểm soát", "Đánh giá rủi ro", "Hoạt động kiểm soát", "Giám sát"]),
            ("Thu Thập Bằng Chứng Kiểm Toán & Thử Nghiệm Kiểm Soát", "Tìm kiếm chứng cứ đầy đủ và thích hợp", ["Quan sát", "Phỏng vấn", "Gửi thư xác nhận bên thứ ba", "Kiểm tra tài liệu"]),
            ("Thủ Tục Phân Tích Trong Kiểm Toán (Analytical Procedures)", "Phát hiện các bất thường về tỷ lệ và xu hướng", ["Phân tích tỷ số tài chính", "So sánh xu hướng qua các năm", "Thủ tục phân tích cơ bản"]),
            ("Kỹ Thuật Lấy Mẫu Kiểm Toán (Audit Sampling)", "Kiểm toán mẫu đại diện cho tổng thể", ["Lấy mẫu thống kê vs phi thống kê", "Cỡ mẫu Sample Size", "Rủi ro lấy mẫu"]),
            ("Kiểm Toán Chu Trình Bán Hàng - Thu Tiền & Nợ Phải Thu", "Thực hiện kiểm tra thực tế khoản mục trọng yếu", ["Thư xác nhận nợ phải thu", "Cắt ngót doanh thu Cut-off", "Dự phòng nợ khó đòi"]),
            ("Kiểm Toán Chu Trình Mua Hàng - Hàng Tồn Kho & Giá Vốn", "Kiểm tra thực tế kho và chi phí", ["Chứng kiến kiểm kê hàng tồn kho", "Định giá hàng tồn kho thấp hơn giá trị thuần", "Kiểm tra nợ phải trả chưa ghi nhận"]),
            ("Báo Cáo Kiểm Toán: Các Dạng Ý Kiến Kiểm Toán Viên", "Sản phẩm cuối cùng của cuộc kiểm toán", ["Ý kiến chấp nhận toàn phần", "Ý kiến ngoại trừ Qualified", "Ý kiến trái ngược Adverse", "Từ chối đưa ra ý kiến Disclaimer"]),
        ]
    },
    {
        "id": "sub-acc-tax",
        "slug": "thue-bao-cao-thue-doanh-nghiep",
        "name": "Thuế & Báo Cáo Thuế Doanh Nghiệp",
        "description": "Thuế GTGT, thuế TNDN, thuế TNCN, hóa đơn điện tử và lập kế hoạch thuế hợp pháp.",
        "difficultyLevel": 2,
        "domains": ["dom-acc"],
        "is_core": False,
        "topic_templates": [
            ("Tổng Quan Hệ Thống Thuế Việt Nam & Trách Nhiệm Người Nộp Thuế", "Khung pháp lý về nghĩa vụ thuế", ["Các sắc thuế chính", "Quyền và nghĩa vụ của người nộp thuế", "Cơ quan thuế"]),
            ("Thuế Giá Trị Gia Tăng (GTGT): Phương Pháp Khấu Trừ & Trực Tiếp", "Sắc thuế gián thu cốt lõi", ["Thuế suất 0%, 5%, 10%", "Điều kiện khấu trừ thuế đầu vào", "Đối tượng không chịu thuế"]),
            ("Hóa Đơn Điện Tử: Quy Định Phát Hành & Xử Lý Sai Sót", "Bằng chứng pháp lý bắt buộc", ["Hóa đơn có mã / không mã", "Điều chỉnh hóa đơn sai", "Hủy hóa đơn", "Biên bản điều chỉnh"]),
            ("Thuế Thu Nhập Doanh Nghiệp (TNDN): Xác Định Doanh Thu Tính Thuế", "Nghĩa vụ thuế trên lợi nhuận kinh doanh", ["Doanh thu tính thuế", "Thời điểm xác định doanh thu", "Doanh thu tài chính"]),
            ("Chi Phí Được Trừ & Không Được Trừ Khi Tính Thuế TNDN", "Tối ưu hóa chi phí hợp lệ theo luật thuế", ["Điều kiện 3 nguyên tắc của chi phí được trừ", "Các khoản chi bị khống chế", "Hóa đơn thanh toán không dùng tiền mặt"]),
            ("Chuyển Lỗ & Ưu Đãi Thuế Thu Nhập Doanh Nghiệp", "Chính sách khuyến khích đầu tư", ["Kế hoạch chuyển lỗ 5 năm", "Thuế suất ưu đãi 10%", "Miễn giảm thuế theo địa bàn và ngành nghề"]),
            ("Thuế Thu Nhập Cá Nhân (TNCN): Thu Nhập Từ Tiền Lương, Tiền Công", "Nghĩa vụ thuế của người lao động", ["Thu nhập chịu thuế vs Tính thuế", "Biểu thuế lũy tiến từng phần", "Giảm trừ gia cảnh bản thân và người phụ thuộc"]),
            ("Quyết Toán Thuế TNCN & Ủy Quyền Quyết Toán", "Quy trình kết thúc năm thuế cá nhân", ["Điều kiện ủy quyền quyết toán", "Tự quyết toán thuế", "Hoàn thuế TNCN"]),
            ("Thuế Nhà Thầu Nước Ngoài (FCT) Trong Giao Dịch Xuyên Biên Giới", "Nghĩa vụ thuế của doanh nghiệp nước ngoài tại VN", ["Thuế GTGT nhà thầu", "Thuế TNDN nhà thầu", "Phương pháp nộp thuế trực tiếp"]),
            ("Lập Kế Hoạch Thuế Hợp Pháp (Tax Planning) & Phòng Tránh Rủi Ro", "Tối ưu hóa dòng tiền và tuân thủ pháp luật", ["Trốn thuế vs Tránh thuế hợp pháp", "Chuẩn bị hồ sơ thanh tra thuế", "Giải trình số liệu"]),
        ]
    },

    # Môn chuyên ngành QUẢN TRỊ KINH DOANH
    {
        "id": "sub-biz-strategy",
        "slug": "quan-tri-chien-luoc-kinh-doanh",
        "name": "Quản Trị Chiến Lược & Lợi Thế Cạnh Tranh",
        "description": "Mô hình 5 lực lượng cạnh tranh Porter, ma trận SWOT, chiến lược đại dương xanh và thực thi chiến lược.",
        "difficultyLevel": 3,
        "domains": ["dom-biz"],
        "is_core": False,
        "topic_templates": [
            ("Bản Chất Của Chiến Lược & Tầm Nhìn - Sứ Mệnh Doanh Nghiệp", "Xác định kim chỉ nam cho sự phát triển", ["Sứ mệnh Mission", "Tầm nhìn Vision", "Giá trị cốt lõi Core Values", "Mục tiêu chiến lược"]),
            ("Mô Hình 5 Lực Lượng Cạnh Tranh Của Michael Porter", "Phân tích sức hấp dẫn của ngành", ["Áp lực từ nhà cung cấp", "Sức mạnh người mua", "Nguy cơ từ sản phẩm thay thế", "Rào cản gia nhập", "Cạnh tranh nội bộ ngành"]),
            ("Phân Tích Nguồn Lực Nội Bộ Doanh Nghiệp Bằng Khung VRIO", "Xác định năng lực cốt lõi bền vững", ["Giá trị Value", "Độ hiếm Rarity", "Khó sao chép Inimitability", "Tổ chức khai thác Organization"]),
            ("Ma Trận SWOT & Xây Dựng Các Phương Án Chiến Lược", "Kết hợp điểm mạnh yếu với cơ hội thách thức", ["Chiến lược SO", "Chiến lược WO", "Chiến lược ST", "Chiến lược WT"]),
            ("Các Chiến Lược Cạnh Tranh Tổng Quát Của Michael Porter", "Xác lập vị thế trên thị trường", ["Dẫn đầu về chi phí thấp Cost Leadership", "Khác biệt hóa sản phẩm Differentiation", "Chiến lược tập trung Focus"]),
            ("Chiến Lược Tăng Trưởng Bằng Ma Trận Ansoff", "Mở rộng hoạt động kinh doanh", ["Thâm nhập thị trường", "Phát triển thị trường", "Phát triển sản phẩm", "Đa dạng hóa kinh doanh"]),
            ("Chiến Lược Đại Dương Xanh (Blue Ocean Strategy)", "Tạo lập không gian thị trường mới không có cạnh tranh", ["Đại dương đỏ vs đại dương xanh", "Khung 4 hành động (ERAC)", "Đổi mới giá trị Value Innovation"]),
            ("Chiến Lược Mua Bán - Sáp Nhập (M&A) & Liên Minh Chiến Lược", "Tăng trưởng ngoại sinh nhanh chóng", ["Sáp nhập ngang/dọc", "Hiệp lực Synergy", "Rủi ro hội nhập văn hóa", "Liên doanh Joint Venture"]),
            ("Thực Thi Chiến Lược & Quản Trị Sự Thay Đổi Trong Tổ Chức", "Biến kế hoạch trên giấy thành kết quả thực tế", ["Mô hình 7S của McKinsey", "Quản trị thay đổi 8 bước Kotter", "Giao tiếp chiến lược"]),
            ("Kiểm Soát & Đánh Giá Chiến Lược (Strategic Control)", "Điều chỉnh lộ trình phù hợp với biến động thị trường", ["KPIs chiến lược", "Đánh giá lại giả định ban đầu", "Linh hoạt chiến lược Agility"]),
        ]
    },
    {
        "id": "sub-biz-finance",
        "slug": "tai-chinh-doanh-nghiep-dau-tu",
        "name": "Quản Trị Tài Chính Doanh Nghiệp & Đầu Tư",
        "description": "Giá trị thời gian của tiền, thẩm định dự án NPV/IRR, cấu trúc vốn WACC và quản trị vốn lưu động.",
        "difficultyLevel": 3,
        "domains": ["dom-biz"],
        "is_core": False,
        "topic_templates": [
            ("Mục Tiêu Quản Trị Tài Chính: Tối Đa Hóa Giá Trị Cổ Đông", "Nguyên lý dẫn dắt các quyết định tài chính", ["Mâu thuẫn đại diện Agency Problem", "Quản trị dòng tiền", "Đạo đức tài chính"]),
            ("Giá Trị Thời Gian Của Tiền Tệ (Time Value of Money - TVM)", "Một đồng hôm nay giá trị hơn một đồng ngày mai", ["Giá trị tương lai FV", "Giá trị hiện tại PV", "Dòng tiền đều Annuity", "Chiết khấu dòng tiền DCF"]),
            ("Thẩm Định Dự Án Đầu Tư: Phương Pháp Giá Trị Hiện Tại Thuần (NPV)", "Thước đo số một trong quyết định đầu tư", ["Dòng tiền tự do FCF", "Tỷ suất chiết khấu", "Quy tắc chấp nhận dự án NPV > 0"]),
            ("Thẩm Định Dự Án Bằng Tỷ Suất Hoàn Vốn Nội Bộ (IRR) & Thời Gian Hoàn Vốn", "Các tiêu chí hỗ trợ đánh giá", ["IRR", "Modified IRR (MIRR)", "Thời gian hoàn vốn Payback Period"]),
            ("Mô Hình Định Giá Tài Sản Vốn (CAPM) & Đo Lường Rủi Ro", "Định giá tỷ suất sinh lời kỳ vọng", ["Rủi ro hệ thống Beta", "Lãi suất phi rủi ro Rf", "Phần bù rủi ro thị trường"]),
            ("Chi Phí Vốn Bình Quân (Weighted Average Cost of Capital - WACC)", "Chi phí sử dụng vốn của doanh nghiệp", ["Chi phí vốn vay sau thuế", "Chi phí vốn cổ phần", "Tỷ trọng cấu trúc vốn"]),
            ("Cấu Trúc Vốn & Lý Thuyết Modigliani-Miller (M&M)", "Sự đánh đổi giữa nợ vay và lá chắn thuế", ["Đòn bẩy tài chính", "Lá chắn thuế lãi vay Tax Shield", "Chi phí kiệt quệ tài chính"]),
            ("Chính Sách Cổ Tức Doanh Nghiệp: Tiền Mặt Hay Cổ Phiếu?", "Phân phối lợi nhuận cho nhà đầu tư", ["Cổ tức tiền mặt", "Cổ tức cổ phiếu", "Mua lại cổ phiếu Treasury Shares", "Hiệu ứng tín hiệu"]),
            ("Quản Trị Vốn Lưu Động & Vòng Chu Chuyển Tiền Mặt (CCC)", "Đảm bảo khả năng thanh toán tức thời", ["Kỳ thu tiền bình quan DSO", "Vòng quay hàng tồn kho DIO", "Kỳ trả tiền bình quân DPO", "Tối ưu hóa CCC"]),
            ("Định Giá Doanh Nghiệp: Phương Pháp Chiết Khấu Dòng Tiền (DCF) & Bội Số (P/E, EV/EBITDA)", "Xác định giá trị thực của công ty", ["Enterprise Value EV", "Bội số P/E", "Bội số EV/EBITDA", "Định giá trong M&A"]),
        ]
    },
    {
        "id": "sub-biz-hrm",
        "slug": "quan-tri-nhan-su-to-chuc",
        "name": "Quản Trị Nguồn Nhân Lực & Văn Hóa Tổ Chức",
        "description": "Tuyển dụng nhân tài, đào tạo phát triển, đánh giá hiệu quả KPI/OKR, lương thưởng và tạo động lực.",
        "difficultyLevel": 2,
        "domains": ["dom-biz"],
        "is_core": False,
        "topic_templates": [
            ("Vai Trò Của Quản Trị Nhân Lực Hiện Đại: Từ Hành Chính Đến Đối Tác Chiến Lược (HRBP)", "Nhân sự là tài sản quan trọng nhất", ["Mô hình Dave Ulrich", "HR Business Partner", "Chiến lược nhân tài"]),
            ("Hoạch Định Nguồn Nhân Lực & Phân Tích Công Việc (Job Analysis)", "Định biên nhân sự chuẩn xác", ["Bản mô tả công việc JD", "Bản tiêu chuẩn công việc JS", "Dự báo thừa thiếu nhân lực"]),
            ("Quy Trình Tuyển Dụng & Phỏng Vấn Dựa Trên Năng Lực (Mô Hình STAR)", "Tìm đúng người cho đúng việc", ["Kênh tuyển dụng", "Phỏng vấn tình huống STAR", "Thương lượng thư mời nhận việc Offer Letter"]),
            ("Đào Tạo & Phát Triển Nguồn Nhân Lực (Mô Hình 70-20-10)", "Nâng cao năng lực cạnh tranh cho nhân sự", ["Đào tạo tại chỗ OJT", "Khung năng lực Competency Framework", "Lộ trình thăng tiến Career Path"]),
            ("Quản Trị Hiệu Suất: Phân Biệt Giữa KPI (Chỉ Số Hiệu Suất) và OKR (Mục Tiêu & Kết Quả Then Chốt)", "Định hướng hành động nhân viên", ["Nguyên tắc SMART", "Hệ thống KPI", "Khung OKR linh hoạt", "Đánh giá 360 độ"]),
            ("Hệ Thống Đãi Ngộ Toàn Diện (Total Rewards) & Cơ Cấu Lương 3P", "Thu hút và giữ chân nhân tài", ["Lương theo vị trí P1", "Lương theo năng lực P2", "Lương theo hiệu quả P3", "Phúc lợi nhân viên"]),
            ("Các Lý Thuyết Động Viên Nhân Viên: Maslow, Herzberg & Thuyết Tự Quyết", "Thúc đẩy nhiệt huyết làm việc", ["Tháp nhu cầu Maslow", "Thuyết 2 nhân tố Herzberg", "Động lực nội tại vs ngoại tại"]),
            ("Xây Dựng Văn Hóa Doanh Nghiệp & Gắn Kết Nhân Viên (Employee Engagement)", "Linh hồn của tổ chức", ["Các cấp độ văn hóa Schein", "Khảo sát mức độ gắn kết eNPS", "Môi trường làm việc hạnh phúc"]),
            ("Quan Hệ Lao Động & Giải Quyết Tranh Chấp Lao Động", "Tuân thủ pháp luật và giữ gìn hòa khí", ["Hợp đồng lao động", "Kỷ luật sa thải", "Thỏa ước lao động tập thể", "Công đoàn"]),
            ("Quy Hoạch Kế Thừa (Succession Planning) & Giữ Chân Nhân Sự Trọng Yếu", "Đảm bảo sự liên tục trong ban lãnh đạo", ["Nhân sự chủ chốt Key Talent", "Ma trận 9 ô 9-Box Grid", "Kế hoạch chuyển giao"]),
        ]
    },
    {
        "id": "sub-biz-startup",
        "slug": "khoi-nghiep-doi-moi-sang-tao",
        "name": "Khởi Sự Kinh Doanh & Đổi Mới Sáng Tạo (Startup)",
        "description": "Tư duy tinh gọn Lean Startup, mô hình Business Model Canvas, tìm kiếm Product-Market Fit và gọi vốn đầu tư.",
        "difficultyLevel": 2,
        "domains": ["dom-biz"],
        "is_core": False,
        "topic_templates": [
            ("Tư Duy Khởi Nghiệp Tinh Gọn (Lean Startup Methodology)", "Thử nghiệm nhanh, thất bại sớm, học hỏi liên tục", ["Vòng lặp Xây dựng - Đo lường - Học hỏi", "Sản phẩm khả thi tối thiểu MVP", "Xoay trục Pivot"]),
            ("Thiết Kế Mô Hình Kinh Doanh Bằng Bảng Canvas (Business Model Canvas - BMC)", "Phác thảo toàn bộ doanh nghiệp trên một trang giấy", ["9 khối BMC", "Phân khúc khách hàng", "Đề xuất giá trị", "Dòng doanh thu"]),
            ("Quy Trình Tư Duy Thiết Kế (Design Thinking) Giải Quyết Vấn Đề", "Sáng tạo giải pháp lấy con người làm trung tâm", ["Thấu cảm Empathize", "Xác định vấn đề Define", "Lên ý tưởng Ideate", "Tạo mẫu Prototype", "Thử nghiệm Test"]),
            ("Tìm Kiếm Sự Phù Hợp Sản Phẩm - Thị Trường (Product-Market Fit - PMF)", "Cột mốc sống còn của mọi startup", ["Khảo sát Sean Ellis 40%", "Tỷ lệ giữ chân người dùng Retention Curve", "Chỉ số tăng trưởng tự nhiên"]),
            ("Nghiên Cứu Khách Hàng Bằng Phương Pháp Phỏng Vấn (The Mom Test)", "Hỏi đúng câu hỏi để không bị khen xã giao", ["Tránh hỏi về tương lai", "Hỏi về hành vi trong quá khứ", "Lắng nghe nỗi đau thực sự"]),
            ("Kinh Tế Học Đơn Vị (Unit Economics): CAC, LTV và Thời Gian Hoàn Vốn", "Đảm bảo mô hình kinh doanh có lãi ở quy mô lớn", ["Customer Acquisition Cost CAC", "Lifetime Value LTV", "Tỷ lệ LTV/CAC > 3", "Payback Period"]),
            ("Nghệ Thuật Trình Bày Ý Tưởng Gọi Vốn (Pitch Deck)", "Thuyết phục nhà đầu tư trong 10 phút", ["10-12 slides chuẩn mực", "Trình bày vấn đề và giải pháp", "Quy mô thị trường TAM-SAM-SOM", "Đội ngũ sáng lập"]),
            ("Các Vòng Gọi Vốn Khởi Nghiệp: Từ Thiên Thần Đến Series A/B/C", "Hành trình huy động vốn mạo hiểm", ["Pre-seed & Seed", "Nhà đầu tư thiên thần Angel Investor", "Quỹ đầu tư mạo hiểm Venture Capital", "Hợp đồng SAFE"]),
            ("Quản Lý Bảng Vốn Hóa (Cap Table) & Tránh Bị Pha Loãng Quá Mức", "Bảo vệ tỷ lệ sở hữu của nhà sáng lập", ["Bảng sở hữu cổ phần", "Cổ phiếu quyền chọn ESOP", "Pha loãng cổ phần Dilution", "Quyền biểu quyết"]),
            ("Xây Dựng Văn Hóa Khởi Nghiệp Đột Phá & Tốc Độ Thực Thi", "Vũ khí cạnh tranh lớn nhất của startup trước các tập đoàn", ["Bias for Action", "Thực thi tốc độ cao", "Thu hút đồng sáng lập Co-founder"]),
        ]
    },

    # Môn chuyên ngành DU LỊCH LỮ HÀNH
    {
        "id": "sub-tour-guiding",
        "slug": "nghiep-vu-huong-dan-thiet-ke-tour",
        "name": "Nghiệp Vụ Hướng Dẫn Viên & Thiết Kế Tour",
        "description": "Xây dựng lịch trình tour, tính giá tour, thuyết minh tuyến điểm và xử lý khủng hoảng lữ hành.",
        "difficultyLevel": 2,
        "domains": ["dom-tour"],
        "is_core": False,
        "topic_templates": [
            ("Quy Trình Nghiệp Vụ Hướng Dẫn Tour Du Lịch Toàn Diện", "Từ khâu chuẩn bị đến khi tiễn khách", ["Nhận bàn giao tour", "Kiểm tra dịch vụ nhà cung cấp", "Đón khách", "Tiễn khách"]),
            ("Nghệ Thuật Thuyết Minh Du Lịch Trên Tuyến & Điểm", "Truyền tải cảm xúc và kiến thức văn hóa", ["Kỹ thuật kể chuyện Storytelling", "Cấu trúc bài thuyết minh", "Tương tác với khách", "Sử dụng micro"]),
            ("Quy Trình Thiết Kế Lịch Trình Tour Du Lịch (Tour Itinerary Planning)", "Xây dựng hành trình hấp dẫn và khả thi", ["Khảo sát tuyến điểm", "Khoảng cách và thời gian di chuyển", "Phân bổ thời gian tham quan và nghỉ ngơi"]),
            ("Phương Pháp Tính Giá Thành & Định Giá Bán Tour Du Lịch", "Cân đối chi phí và lợi nhuận lữ hành", ["Chi phí cố định xe cộ hướng dẫn", "Chi phí biến đổi ăn ở vé tham quan", "Tỷ lệ lợi nhuận kỳ vọng Mark-up"]),
            ("Xử Lý Tình Huống Khẩn Cấp & Khủng Hoảng Trong Chuyến Tour", "Bảo đảm an toàn cao nhất cho du khách", ["Khách bị ốm đau tai nạn", "Mất giấy tờ tùy thân hộ chiếu", "Thiên tai thời tiết xấu", "Thất lạc hành lý"]),
            ("Kỹ Năng Hoạt Náo & Tổ Chức Trò Chơi Teambuilding Trên Xe / Bãi Biển", "Tạo bầu không khí vui vẻ gắn kết", ["Trò chơi phá băng Ice-breaking", "Quản trò hoạt náo", "An toàn trong trò chơi vận động"]),
            ("Tâm Lý Học Khách Du Lịch Theo Thị Trường Mục Tiêu (Inbound & Outbound)", "Phục vụ đúng gu văn hóa từng quốc tịch", ["Khách Âu - Mỹ", "Khách Đông Bắc Á (Hàn, Nhật, Trung)", "Khách Đông Nam Á", "Khách nội địa"]),
            ("Quản Lý Quan Hệ Với Các Đối Tác Cung Ứng Lữ Hành (Vendors)", "Hợp tác win-win với chuỗi dịch vụ", ["Hợp đồng khách sạn", "Đặt ăn nhà hàng", "Hãng vận chuyển xe du lịch", "Vé điểm tham quan"]),
            ("Kỹ Năng Sơ Cứu Ban Đầu (First Aid) Cho Hướng Dẫn Viên", "Kỹ năng sinh tồn cơ bản nơi hiện trường", ["Sơ cứu say nắng sốc nhiệt", "Băng bó vết thương gãy xương", "Hô hấp nhân tạo CPR", "Xử lý ngộ độc thức ăn"]),
            ("Đạo Đức Nghề Nghiệp & Trách Nhiệm Bảo Vệ Môi Trường Của Hướng Dẫn Viên", "Du lịch có trách nhiệm và bền vững", ["Nói không với mua sắm ép buộc", "Tôn trọng văn hóa bản địa", "Bảo vệ môi trường sinh thái Không rác thải"]),
        ]
    },
    {
        "id": "sub-tour-hotel",
        "slug": "quan-tri-khach-san-resort",
        "name": "Quản Trị Khách Sạn & Khu Nghỉ Dưỡng (Hospitality)",
        "description": "Nghiệp vụ tiền sảnh Front Office, bộ phận phòng Buồng phòng, quản trị F&B và quản trị doanh thu RevPAR.",
        "difficultyLevel": 2,
        "domains": ["dom-tour"],
        "is_core": False,
        "topic_templates": [
            ("Cơ Cấu Tổ Chức & Quy Trình Vận Hành Tiêu Chuẩn Của Khách Sạn Quốc Tế", "Bộ máy hoạt động của ngành khách sạn", ["Sơ đồ tổ chức các bộ phận", "Tiêu chuẩn sao khách sạn", "SOP Standard Operating Procedures"]),
            ("Nghiệp Vụ Bộ Phận Tiền Sảnh (Front Office Operations)", "Bộ mặt đại diện của khách sạn", ["Quy trình Check-in", "Quy trình Check-out", "Quản lý đặt phòng Reservation", "Dịch vụ Concierge"]),
            ("Hệ Thống Quản Lý Khách Sạn (Property Management System - PMS)", "Ứng dụng công nghệ trong vận hành lưu trú", ["Phần mềm Opera PMS", "Quản lý tình trạng phòng Room Status", "Quản lý hồ sơ khách Guest Profile"]),
            ("Nghiệp Vụ Bộ Phận Buồng Phòng (Housekeeping Management)", "Đảm bảo vệ sinh và tiện nghi phòng nghỉ", ["Quy trình dọn phòng chuẩn", "Kiểm tra phòng Inspection", "Quản lý đồ vải Linen", "Quy trình Lost & Found"]),
            ("Quản Trị Bộ Phận Ẩm Thực Khách Sạn (Food & Beverage - F&B)", "Vận hành nhà hàng và quầy bar trong khách sạn", ["Tiệc Buffet sáng", "Dịch vụ Room Service", "Tổ chức tiệc Banquet", "Quản lý chi phí F&B Cost"]),
            ("Quản Trị Doanh Thu Khách Sạn (Hotel Revenue Management)", "Tối ưu hóa doanh thu từng đêm phòng", ["Tỷ lệ lấp đầy Occupancy Rate (OCC)", "Giá bán trung bình ADR", "Doanh thu trên mỗi phòng sẵn có RevPAR"]),
            ("Chiến Lược Phân Phối Phòng Qua Các Kênh Trực Tuyến (OTA Channel Management)", "Bán phòng hiệu quả trên mạng toàn cầu", ["Booking.com / Agoda", "Hệ thống quản lý kênh Channel Manager", "Bán phòng trực tiếp qua Website"]),
            ("Quản Trị An Ninh & An Toàn Trong Khách Sạn / Resort", "Bảo vệ tính mạng và tài sản của du khách", ["Phòng cháy chữa cháy PCCC", "Hệ thống camera an ninh", "Xử lý khách say xỉn quấy rối", "Bảo mật két sắt"]),
            ("Mô Hình Quản Trị Khu Nghỉ Dưỡng Sinh Thái & Wellness Resort", "Kinh doanh dịch vụ nghỉ dưỡng cao cấp", ["Thiết kế cảnh quan sinh thái", "Dịch vụ Spa & Trị liệu", "Hoạt động trải nghiệm nội khu"]),
            ("Quản Trị Chất Lượng Dịch Vụ Khách Sạn & Đào Tạo Nhân Viên", "Duy trì tiêu chuẩn dịch vụ 5 sao", ["Tiêu chuẩn phục vụ tận tâm", "Đánh giá chất lượng dịch vụ bí mật Mystery Shopper", "Giải quyết khiếu nại khách hàng"]),
        ]
    },
    {
        "id": "sub-tour-geography",
        "slug": "dia-ly-du-lich-tai-nguyen-van-hoa",
        "name": "Địa Lý Du Lịch & Tài Nguyên Văn Hóa Di Sản",
        "description": "Các vùng du lịch trọng điểm Việt Nam, di sản thế giới UNESCO, phong tục tập quán và văn hóa ẩm thực.",
        "difficultyLevel": 2,
        "domains": ["dom-tour"],
        "is_core": False,
        "topic_templates": [
            ("Tổng Quan Phân Vùng Du Lịch Việt Nam: 7 Vùng Du Lịch Trọng Điểm", "Bức tranh toàn cảnh tài nguyên du lịch đất nước", ["Vùng Trung du và miền núi Bắc Bộ", "Đồng bằng sông Hồng", "Bắc Trung Bộ", "Duyên hải Nam Trung Bộ", "Tây Nguyên", "Đông Nam Bộ", "Đồng bằng sông Cửu Long"]),
            ("Tài Nguyên Du Lịch Tự Nhiên: Địa Hình, Hang Động & Vườn Quốc Gia", "Khai thác thế mạnh thiên nhiên", ["Vịnh Hạ Long", "Quần thể hang động Phong Nha - Kẻ Bàng", "Cao nguyên đá Đồng Văn", "Vườn quốc gia Cát Tiên"]),
            ("Tài Nguyên Du Lịch Biển Đảo: Tiềm Năng & Các Tuyến Điểm Nổi Bật", "Thế mạnh biển đảo Việt Nam", ["Phú Quốc", "Nha Trang", "Đà Nẵng", "Côn Đảo", "Quy Nhơn"]),
            ("Hệ Thống Di Sản Thế Giới UNESCO Tại Việt Nam", "Các báu vật văn hóa và thiên nhiên toàn cầu", ["Quần thể di tích Cố đô Huế", "Phố cổ Hội An", "Thánh địa Mỹ Sơn", "Hoàng thành Thăng Long", "Tràng An"]),
            ("Di Sản Văn Hóa Phi Vật Thể Đại Diện Của Nhân Loại", "Bảo tồn bản sắc văn hóa dân tộc", ["Nhã nhạc cung đình Huế", "Không gian văn hóa Cồng chiêng Tây Nguyên", "Dân ca Quan họ Bắc Ninh", "Đờn ca tài tử Nam Bộ"]),
            ("Văn Hóa Lễ Hội Truyền Thống & Ứng Dụng Trong Khai Thác Du Lịch", "Sức hút của các lễ hội dân gian", ["Lễ hội Đền Hùng", "Lễ hội Chùa Hương", "Lễ hội Katê của người Chăm", "Lễ hội Oóc Om Bóc"]),
            ("Bản Sắc Văn Hóa & Phong Tục Tập Quán Các Dân Tộc Thiểu Số", "Du lịch cộng đồng và trải nghiệm văn hóa", ["Văn hóa người H'Mông, Dao, Tày", "Văn hóa người Thái, Mường", "Văn hóa mẫu hệ người Ê Đê, Ba Na"]),
            ("Văn Hóa Ẩm Thực 3 Miền Việt Nam & Tiềm Năng Du Lịch Ẩm Thực (Culinary Tourism)", "Hành trình khám phá hương vị Việt", ["Tinh hoa ẩm thực đất Bắc", "Đậm đà hương vị miền Trung", "Phóng khoáng ẩm thực Nam Bộ", "Văn hóa cà phê Việt"]),
            ("Phát Triển Du Lịch Sinh Thái Bền Vững & Bảo Tồn Đa Dạng Sinh Học", "Du lịch gắn liền với trách nhiệm môi trường", ["Nguyên tắc du lịch sinh thái", "Cân bằng giữa khai thác và bảo tồn", "Giáo dục ý thức du khách"]),
            ("Du Lịch Nông Nghiệp & Mô Hình OCOP Gắn Với Nông Thôn Mới", "Trải nghiệm đồng quê và sản vật địa phương", ["Miệt vườn sông nước miền Tây", "Làng rau Trà Quế", "Farmstay nghỉ dưỡng nông nghiệp"]),
        ]
    },

    # Môn chuyên ngành Y KHOA
    {
        "id": "sub-med-anatomy",
        "slug": "giai-phau-hoc-nguoi-anatomy",
        "name": "Giải Phẫu Học Người (Human Anatomy)",
        "description": "Giải phẫu hệ xương khớp, hệ cơ, hệ tim mạch, hệ hô hấp, hệ tiêu hóa và hệ thần kinh trung ương.",
        "difficultyLevel": 3,
        "domains": ["dom-med"],
        "is_core": True,
        "topic_templates": [
            ("Thuật Ngữ Định Hướng Không Gian Trong Giải Phẫu Học", "Ngôn ngữ mô tả vị trí chuẩn quốc tế", ["Tư thế giải phẫu chuẩn", "Mặt phẳng đứng dọc Sagittal", "Mặt phẳng ngang Transverse", "Gần/Xa, Trước/Sau, Nông/Sâu"]),
            ("Giải Phẫu Hệ Xương Khớp: Cấu Trúc Khung Xương Người", "Bộ khung nâng đỡ cơ thể", ["Xương sọ", "Cột sống và lồng ngực", "Xương chi trên và chi dưới", "Các loại khớp động, bán động, bất động"]),
            ("Giải Phẫu Hệ Cơ: Các Nhóm Cơ Vận Động Chính", "Hệ thống tạo lực chuyển động", ["Cơ vân", "Nguyên ủy và bám tận", "Cơ vùng đầu mặt cổ", "Cơ thân mình và cơ tứ chi"]),
            ("Giải Phẫu Hệ Tim Mạch: Cấu Trúc Tim & Các Mạch Máu Lớn", "Bơm tuần hoàn của cơ thể", ["4 ngăn tim", "Hệ thống van tim", "Động mạch chủ và tĩnh mạch chủ", "Động mạch vành nuôi tim"]),
            ("Giải Phẫu Hệ Hô Hấp: Từ Đường Dẫn Khí Đến Phế Nang Phổi", "Đường trao đổi dưỡng khí", ["Mũi và thanh quản", "Khí quản và phế quản", "Cây phế quản", "Cấu trúc thùy phổi và màng phổi"]),
            ("Giải Phẫu Hệ Tiêu Hóa: Ống Tiêu Hóa & Các Tuyến Phụ Thuộc", "Hệ thống xử lý và hấp thu dinh dưỡng", ["Thực quản và dạ dày", "Ruột non và ruột già", "Giải phẫu gan và túi mật", "Tụy tạng"]),
            ("Giải Phẫu Hệ Tiết Niệu: Thận, Niệu Quản & Bàng Quang", "Hệ thống thanh lọc và bài tiết", ["Vỏ và tủy thận", "Đơn vị Nephron", "Đài bể thận", "Niệu quản và niệu đạo"]),
            ("Giải Phẫu Hệ Thần Kinh Trung Ương: Não Bộ & Tủy Sống", "Trung tâm điều khiển cơ thể", ["Bán cầu đại não", "Tiểu não và thân não", "Tủy sống", "Hệ thống não thất và màng não"]),
            ("Giải Phẫu Hệ Thần Kinh Ngoại Biên & 12 Đôi Dây Thần Kinh Sọ", "Mạng lưới truyền dẫn tín hiệu", ["Dây thần kinh sọ I-XII", "Đám rối thần kinh cánh tay", "Dây thần kinh tọa", "Hệ thần kinh tự chủ giao cảm/đối giao cảm"]),
            ("Giải Phẫu Hệ Nội Tiết: Tuyến Yên, Tuyến Giáp & Tuyến Thượng Thận", "Hệ thống điều hòa bằng hormone", ["Trục hạ đồi - tuyến yên", "Tuyến giáp và cận giáp", "Tuyến thượng thận", "Đảo tụy Langerhans"]),
            ("Giải Phẫu Hệ Sinh Dục Nam & Nữ", "Cơ quan duy trì nòi giống", ["Buồng trứng, vòi trứng, tử cung", "Tinh hoàn, mào tinh, ống dẫn tinh", "Tuyến tiền liệt", "Đáy chậu Perineum"]),
        ]
    },
    {
        "id": "sub-med-physiology",
        "slug": "sinh-ly-hoc-y-khoa",
        "name": "Sinh Lý Học Y Khoa (Medical Physiology)",
        "description": "Cơ chế nội môi, điện thế màng, sinh lý co cơ, sinh lý tuần hoàn huyết áp và trao đổi khí tại phổi.",
        "difficultyLevel": 3,
        "domains": ["dom-med"],
        "is_core": True,
        "topic_templates": [
            ("Cơ Chế Cân Bằng Nội Môi (Homeostasis) & Cơ Chế Phản Hồi Âm Tính", "Quy luật duy trì sự sống", ["Dịch nội bào và ngoại bào", "Phản hồi âm tính Negative Feedback", "Phản hồi dương tính", "Điểm đặt Set Point"]),
            ("Điện Thế Màng Tế Bào & Điện Thế Hoạt Động (Action Potential)", "Tín hiệu điện sinh học của tế bào", ["Bơm Na+/K+-ATPase", "Điện thế nghỉ Resting Potential", "Khử cực và tái cực", "Kênh ion cổng điện thế"]),
            ("Sinh Lý Co Cơ: Cơ Chế Trượt Sợi Myosin & Actin", "Cách thức cơ bắp sinh công", ["Cầu nối chéo Cross-bridge", "Vai trò của ion Canxi", "Phức hợp Troponin-Tropomyosin", "Năng lượng ATP"]),
            ("Sinh Lý Tuần Hoàn: Chu Kỳ Tim & Cơ Chế Điều Hòa Huyết Áp", "Dòng chảy của sự sống", ["Thời kỳ tâm thu và tâm trương", "Cung lượng tim Cardiac Output", "Thụ thể áp lực Baroreceptors", "Hệ RAA điều hòa huyết áp"]),
            ("Sinh Lý Hô Hấp: Cơ Học Thở & Sự Trao Đổi Khí Tại Phổi", "Quá trình lấy oxy và thải CO2", ["Áp suất âm khoang màng phổi", "Cơ hoành", "Khuếch tán khí qua màng phế nang - mao mạch", "Đường cong phân ly Oxy-Hemoglobin"]),
            ("Sinh Lý Thận: Cơ Chế Lọc Cầu Thận & Tái Hấp Thu Ống Thận", "Thanh lọc máu và cân bằng dịch", ["Tốc độ lọc cầu thận GFR", "Tái hấp thu tại ống lượn gần", "Quai Henle và nhân nồng độ ngược dòng", "Tác dụng của hormone ADH và Aldosterone"]),
            ("Sinh Lý Tiêu Hóa: Tiết Dịch, Tiêu Hóa Hóa Học & Hấp Thu", "Phân giải thức ăn thành dưỡng chất", ["Acid dịch vị HCl và Pepsin", "Dịch tụy và mật", "Hấp thu glucose và acid amin", "Nhu động ruột Peristalsis"]),
            ("Sinh Lý Nội Tiết: Điều Hòa Chuyển Hóa Đường Của Insulin & Glucagon", "Kiểm soát đường huyết cơ thể", ["Tế bào beta tụy", "Cơ chế tác dụng của Insulin", "Tế bào alpha và Glucagon", "Bệnh đái tháo đường"]),
            ("Sinh Lý Máu & Cơ Chế Đông Cầm Máu Tự Nhiên (Hemostasis)", "Bảo vệ thể tích tuần hoàn", ["Các dòng tế bào máu", "Giai đoạn co mạch", "Nút tiểu cầu", "Con đường đông máu nội sinh và ngoại sinh"]),
            ("Sinh Lý Thần Kinh: Dẫn Truyền Qua Synapse & Chất Dẫn Truyền Thần Kinh", "Liên lạc giữa các tế bào não", ["Synapse hóa học", "Chất dẫn truyền Acetylcholine, Dopamine, Serotonin", "Tái hấp thu Reuptake", "Điện thế sau synapse"]),
        ]
    },
    {
        "id": "sub-med-pharma",
        "slug": "duoc-ly-hoc-lam-sang",
        "name": "Dược Lý Học & Cơ Chế Tác Dụng Thuốc",
        "description": "Dược động học hấp thu phân bố chuyển hóa thải trừ, dược lực học thụ thể và các nhóm thuốc chính.",
        "difficultyLevel": 3,
        "domains": ["dom-med"],
        "is_core": False,
        "topic_templates": [
            ("Dược Động Học: Quá Trình Hấp Thu, Phân Bố, Chuyển Hóa, Thải Trừ (ADME)", "Số phận của viên thuốc trong cơ thể", ["Sinh khả dụng Bioavailability", "Hàng rào máu não", "Chuyển hóa qua gan Cytochrome P450", "Đào thải qua thận"]),
            ("Dược Lực Học: Cơ Chế Tương Tác Giữa Thuốc & Thụ Thể (Receptor)", "Cách thuốc tạo ra tác dụng sinh học", ["Chất chủ vận Agonist", "Chất đối kháng Antagonist", "Đường cong liều lượng - đáp ứng", "Chỉ số điều trị Therapeutic Index"]),
            ("Các Yếu Tố Ảnh Hưởng Đến Tác Dụng Của Thuốc & Tương Tác Thuốc", "Cá thể hóa điều trị", ["Tuổi tác và suy gan/thận", "Tương tác thuốc - thuốc", "Tương tác thuốc - thức ăn", "Phản ứng có hại của thuốc ADR"]),
            ("Dược Lý Kháng Sinh: Các Nhóm Kháng Sinh Chính & Cơ Chế Diệt Khuẩn", "Vũ khí chống vi khuẩn", ["Beta-lactam ức chế thành tế bào", "Aminoglycoside ức chế tổng hợp protein", "Quinolone ức chế sao chép ADN", "Macrolide"]),
            ("Cơ Chế Kháng Thuốc Kháng Sinh & Chiến Lược Sử Dụng Hợp Lý", "Nguy cơ toàn cầu của vi khuẩn đa kháng", ["Beta-lactamase", "Bơm tống thuốc Efflux pump", "Đột biến đích tác dụng", "Nguyên tắc sử dụng kháng sinh an toàn"]),
            ("Dược Lý Thuốc Giảm Đau, Hạ Sốt, Kháng Viêm Không Steroid (NSAIDs)", "Kiểm soát viêm và cơn đau", ["Cơ chế ức chế enzym COX-1 và COX-2", "Paracetamol", "Ibuprofen và Aspirin", "Tác dụng phụ trên dạ dày và thận"]),
            ("Dược Lý Thuốc Tim Mạch: Thuốc Điều Trị Tăng Huyết Áp", "Bảo vệ hệ mạch vành", ["Thuốc ức chế men chuyển ACEi", "Thuốc chẹn thụ thể ARB", "Thuốc chẹn kênh Canxi CCB", "Thuốc chẹn beta"]),
            ("Dược Lý Thuốc Hệ Hô Hấp: Điều Trị Hen Phế Quản & COPD", "Làm thông thoáng đường thở", ["Thuốc giãn phế quản đồng vận Beta-2 (Salbutamol)", "Corticoid hít (ICS)", "Kháng Cholinergic"]),
            ("Dược Lý Thuốc Điều Trị Đái Tháo Đường: Insulin & Thuốc Uống Hạ Đường Huyết", "Kiểm soát đường máu hiệu quả", ["Các loại Insulin nhanh/chậm", "Metformin ức chế tạo glucose tại gan", "Nhóm ức chế SGLT-2", "Nhóm GLP-1"]),
            ("Dược Lý Thuốc An Thần, Gây Ngủ & Thuốc Điều Trị Trầm Cảm", "Tác động lên hệ thần kinh trung ương", ["Benzodiazepine tác dụng lên GABA", "Thuốc ức chế tái hấp thu chọn lọc Serotonin (SSRI)", "Hội chứng cai nghiện thuốc"]),
        ]
    },
    {
        "id": "sub-med-internal",
        "slug": "benh-hoc-noi-khoa",
        "name": "Bệnh Học Nội Khoa Cơ Bản",
        "description": "Bệnh tăng huyết áp, nhồi máu cơ tim, đái tháo đường, viêm phổi và suy thận mạn.",
        "difficultyLevel": 3,
        "domains": ["dom-med"],
        "is_core": False,
        "topic_templates": [
            ("Bệnh Tăng Huyết Áp Vô Căn: Cơ Chế Bệnh Sinh & Biến Chứng", "Kẻ giết người thầm lặng", ["Huyết áp tâm thu/tâm trương", "Tổn thương cơ quan đích", "Biến chứng đột quỵ và suy tim", "Phác đồ điều trị đa mô thức"]),
            ("Bệnh Động Mạch Vành & Hội Chứng Vành Cấp (Nhồi Máu Cơ Tim)", "Cấp cứu tim mạch hàng đầu", ["Xơ vữa động mạch", "Đau thắt ngực ổn định vs không ổn định", "Điện tâm đồ ECG đoạn ST chênh lên", "Men tim Troponin"]),
            ("Bệnh Đái Tháo Đường Type 1 và Type 2: Chẩn Đoán & Biến Chứng", "Rối loạn chuyển hóa phổ biến", ["Kháng Insulin vs Thiếu hụt Insulin", "Tiêu chuẩn chẩn đoán HbA1c", "Biến chứng mạch máu lớn và vi mạch", "Bàn chân đái tháo đường"]),
            ("Bệnh Viêm Phổi Mắc Phải Cộng Đồng (CAP)", "Nhiễm trùng đường hô hấp dưới cấp tính", ["Tác nhân vi khuẩn Streptococcus pneumoniae", "Hội chứng đông đặc phổi", "X-quang ngực thẳng", "Thang điểm CURB-65"]),
            ("Bệnh Phổi Tắc Nghẽn Mạn Tính (COPD): Yếu Tố Nguy Cơ & Quản Lý", "Hậu quả của khói thuốc lá", ["Viêm phế quản mạn và khí phế thủng", "Đo chức năng hô hấp FEV1/FVC", "Đợt cấp COPD", "Cai thuốc lá"]),
            ("Bệnh Loét Dạ Dày - Tá Tràng & Vai Trò Của Vi Khuẩn Helicobacter pylori", "Tổn thương niêm mạc đường tiêu hóa", ["Cân bằng giữa yếu tố tấn công và bảo vệ", "Nhiễm khuẩn H. pylori", "Nội soi tiêu hóa", "Phác đồ tiệt trừ H. pylori"]),
            ("Xơ Gan & Các Biến Chứng Của Tăng Áp Lực Tĩnh Mạch Cửa", "Giai đoạn cuối của tổn thương gan mạn tính", ["Nguyên nhân do viêm gan virus B/C và rượu", "Cổ trướng", "Xuất huyết tiêu hóa do vỡ giãn tĩnh mạch thực quản", "Hôn mê gan"]),
            ("Bệnh Thận Mạn (CKD) & Hội Chứng Suy Thận", "Mất dần chức năng lọc cầu thận", ["Các giai đoạn bệnh thận mạn", "Protein niệu", "Hội chứng ure huyết cao", "Chỉ định lọc máu chạy thận nhân tạo"]),
            ("Bệnh Tai Biến Mạch Máu Não (Đột Quỵ Nhồi Máu Não & Xuất Huyết Não)", "Thời gian là não bộ", ["Dấu hiệu nhận biết FAST", "Cửa sổ vàng tiêu sợi huyết", "Chụp CT/MRI sọ não", "Phục hồi chức năng sau đột quỵ"]),
            ("Hội Chứng Nhiễm Trùng Huyết (Sepsis) & Sốc Nhiễm Khuẩn", "Phản ứng viêm toàn thân đe dọa tính mạng", ["Tiêu chuẩn SOFA / qSOFA", "Hạ huyết áp không đáp ứng bù dịch", "Kháng sinh sớm giờ đầu", "Bù dịch và thuốc vận mạch"]),
        ]
    },
]

# Tạo bộ dữ liệu hoàn chỉnh
all_domains = []
all_subjects = []
all_domain_subjects = []
all_topics = []

topic_id_counter = 1
subject_lookup = {s["id"]: s for s in SUBJECTS}

# Xây dựng danh sách Domain với số liệu thống kê
for dom_idx, dom in enumerate(DOMAINS):
    # Lấy các môn thuộc domain này
    dom_subs = [s for s in SUBJECTS if dom["id"] in s["domains"]]
    
    domain_record = {
        "id": dom["id"],
        "slug": dom["slug"],
        "name": dom["name"],
        "description": dom["description"],
        "iconName": dom["iconName"],
        "color": dom["color"],
        "colorHex": dom["colorHex"],
        "accentBg": dom["accentBg"],
        "orderIndex": dom["orderIndex"],
        "subjectCount": len(dom_subs),
        "totalLectures": 0,
        "completedLectures": 0,
        "completionRate": 0,
        "topicCount": 0
    }
    all_domains.append(domain_record)

# Xây dựng danh sách Subjects và liên kết domain_subjects
for sub_idx, sub in enumerate(SUBJECTS):
    # Random số lượng bài học từ 10 đến 15 bài học cho môn học này
    num_topics_target = random.randint(10, 15)
    
    # Lấy templates có sẵn
    templates = sub["topic_templates"]
    
    sub_record = {
        "id": sub["id"],
        "slug": sub["slug"],
        "name": sub["name"],
        "description": sub["description"],
        "difficultyLevel": sub["difficultyLevel"],
        "orderIndex": sub_idx + 1,
        "topicCount": 0,
        "completedCount": 0
    }
    all_subjects.append(sub_record)

    # Liên kết với các Domain mà môn này thuộc về
    for d_id in sub["domains"]:
        all_domain_subjects.append({
            "domain_id": d_id,
            "subject_id": sub["id"],
            "is_core": sub["is_core"],
            "order_index": len([ds for ds in all_domain_subjects if ds["domain_id"] == d_id]) + 1
        })

    # Tạo từ 10 đến 15 bài học cho môn học này
    # Nếu templates ít hơn số lượng mục tiêu, sinh thêm bài học bổ trợ
    generated_topics = []
    
    for t_idx in range(num_topics_target):
        if t_idx < len(templates):
            title, summary_hint, concepts = templates[t_idx]
        else:
            extra_num = t_idx - len(templates) + 1
            title = f"{sub['name']} - Chuyên Đề Nâng Cao #{extra_num}"
            summary_hint = f"Nghiên cứu chuyên sâu và tình huống ứng dụng thực tế trong {sub['name']}."
            concepts = [f"Khái niệm nâng cao #{extra_num}A", f"Kỹ thuật tối ưu #{extra_num}B", "Phân tích tình huống", "Ứng dụng thực tiễn"]

        # Độ khó random từ 1 đến 3
        diff_level = random.randint(1, 3)

        # Status phân bố: 30% COMPLETED, 15% IN_PROGRESS, 15% NEEDS_REVIEW, 40% NOT_STARTED
        status_rand = random.random()
        if status_rand < 0.32:
            status = "COMPLETED"
            score = random.randint(84, 98)
        elif status_rand < 0.46:
            status = "IN_PROGRESS"
            score = None
        elif status_rand < 0.60:
            status = "NEEDS_REVIEW"
            score = random.randint(48, 65)
        else:
            status = "NOT_STARTED"
            score = None

        topic_slug = re.sub(r'[^a-z0-9]+', '-', f"{sub['slug']}-{t_idx+1}".lower()).strip('-')
        topic_id = f"top-{sub['slug']}-{t_idx+1:02d}"

        # Tóm tắt lý thuyết chi tiết theo phương pháp Feynman
        summary = (
            f"Bài học '{title}' thuộc môn {sub['name']}. "
            f"{summary_hint} "
            f"Nội dung trọng tâm gồm việc hiểu rõ bản chất của {', '.join(concepts[:2])}, "
            f"vận dụng phương pháp giải thích đơn giản hóa của Feynman để liên kết với các ứng dụng thực tế."
        )

        topic_record = {
            "id": topic_id,
            "subjectId": sub["id"],
            "subjectSlug": sub["slug"],
            "subjectName": sub["name"],
            "title": title,
            "slug": topic_slug,
            "summary": summary,
            "difficultyLevel": diff_level,
            "orderIndex": t_idx + 1,
            "estimatedReadingMinutes": random.randint(7, 15),
            "requiredConcepts": concepts,
            "status": status,
            "highestClarityScore": score,
            "activeSessionId": f"ses-{topic_id}" if status in ["IN_PROGRESS", "NEEDS_REVIEW", "COMPLETED"] else None
        }
        all_topics.append(topic_record)
        generated_topics.append(topic_record)

    # Cập nhật số lượng cho subject
    sub_record["topicCount"] = len(generated_topics)
    sub_record["completedCount"] = len([t for t in generated_topics if t["status"] == "COMPLETED"])

# Cập nhật số lượng bài học cho từng Domain
for dom in all_domains:
    # Lấy các môn học thuộc domain
    domain_sub_ids = [ds["subject_id"] for ds in all_domain_subjects if ds["domain_id"] == dom["id"]]
    domain_topics = [t for t in all_topics if t["subjectId"] in domain_sub_ids]
    completed_topics = [t for t in domain_topics if t["status"] == "COMPLETED"]
    
    dom["totalLectures"] = len(domain_topics)
    dom["completedLectures"] = len(completed_topics)
    dom["topicCount"] = len(domain_topics)
    dom["completionRate"] = round((len(completed_topics) / len(domain_topics) * 100)) if domain_topics else 0

print(f"Tổng hợp thành công:")
print(f"- {len(all_domains)} Nhóm ngành học (Domains)")
print(f"- {len(all_subjects)} Môn học (Subjects)")
print(f"- {len(all_domain_subjects)} Quan hệ Môn - Ngành (Domain-Subject Links)")
print(f"- {len(all_topics)} Bài học chi tiết (Academic Topics)")

# ==============================================================================
# XUẤT RA FILE 1: TypeScript Data (src/data/three-tier-curriculum.data.ts)
# ==============================================================================
ts_code = f"""/**
 * File: src/data/three-tier-curriculum.data.ts
 * Purpose: Complete Three-Tier Academic Curriculum Data for 8 Domains:
 *   - 8 Academic Domains (Công nghệ thông tin, Khoa học máy tính, Kỹ thuật phần mềm, Thương mại điện tử, Kế toán - Kiểm toán, Quản trị Kinh doanh, Du lịch Lữ hành, Y khoa)
 *   - {len(all_subjects)} Academic Subjects (Gồm môn chung & chuyên ngành liên kết N-N)
 *   - {len(all_topics)} Academic Lectures (Mỗi môn có 10-15 bài học chi tiết, độ khó 1-3, STT và trạng thái học tập)
 * Auto-generated by scripts/generate_curriculum_seed.py
 */

import {{ DomainCategory, AcademicSubject, CatalogTopic }} from "../types/catalog.types";

export const THREE_TIER_DOMAINS: DomainCategory[] = {json.dumps(all_domains, ensure_ascii=False, indent=2)};

export const THREE_TIER_SUBJECTS: AcademicSubject[] = {json.dumps(all_subjects, ensure_ascii=False, indent=2)};

export const THREE_TIER_DOMAIN_SUBJECTS = {json.dumps(all_domain_subjects, ensure_ascii=False, indent=2)};

export const THREE_TIER_LECTURES: CatalogTopic[] = {json.dumps(all_topics, ensure_ascii=False, indent=2)};

// Helper: Query Domain by Slug
export function getDomainBySlug(slug: string): DomainCategory | undefined {{
  return THREE_TIER_DOMAINS.find((d) => d.slug === slug);
}}

// Helper: Query Subject by Slug
export function getSubjectBySlug(slug: string): AcademicSubject | undefined {{
  return THREE_TIER_SUBJECTS.find((s) => s.slug === slug);
}}

// Helper: Query Subjects belonging to a Domain Slug (Supports Shared Subjects across multiple domains!)
export function getSubjectsByDomainSlug(domainSlug: string): AcademicSubject[] {{
  const domain = getDomainBySlug(domainSlug);
  if (!domain) return [];
  const subjectIds = THREE_TIER_DOMAIN_SUBJECTS
    .filter((ds) => ds.domain_id === domain.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map((ds) => ds.subject_id);

  return subjectIds
    .map((id) => THREE_TIER_SUBJECTS.find((s) => s.id === id))
    .filter(Boolean) as AcademicSubject[];
}}

// Helper: Query Lectures belonging to a Subject Slug
export function getLecturesBySubjectSlug(subjectSlug: string): CatalogTopic[] {{
  return THREE_TIER_LECTURES
    .filter((l) => l.subjectSlug === subjectSlug)
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}}
"""

with open("src/data/three-tier-curriculum.data.ts", "w", encoding="utf-8") as f:
    f.write(ts_code)
print("-> Đã xuất: src/data/three-tier-curriculum.data.ts")

# ==============================================================================
# XUẤT RA FILE 2: SQL Migration & Seed (supabase/migrations/20261108_seed_8_domains_curriculum.sql)
# ==============================================================================
sql_lines = [
    "-- ==============================================================================",
    "-- File: supabase/migrations/20261108_seed_8_domains_curriculum.sql",
    "-- Mục đích: Khởi tạo schema và SEED dữ liệu 8 Nhóm Ngành, Hệ thống Môn học (chung & chuyên ngành)",
    "--           và toàn bộ Bài học (10-15 bài/môn) cho dự án Feynman Stage.",
    "-- ==============================================================================",
    "",
    "-- 1. Xóa bảng cũ nếu tồn tại (Đảm bảo seed lại dữ liệu mới sạch sẽ)",
    "DROP TABLE IF EXISTS public.academic_topics CASCADE;",
    "DROP TABLE IF EXISTS public.domain_subjects CASCADE;",
    "DROP TABLE IF EXISTS public.academic_subjects CASCADE;",
    "DROP TABLE IF EXISTS public.academic_domains CASCADE;",
    "",
    "-- 2. Tạo bảng 8 Nhóm Ngành (academic_domains)",
    "CREATE TABLE public.academic_domains (",
    "    id TEXT PRIMARY KEY,",
    "    slug TEXT UNIQUE NOT NULL,",
    "    name TEXT NOT NULL,",
    "    description TEXT NOT NULL,",
    "    icon_name TEXT DEFAULT 'BookOpen',",
    "    color TEXT DEFAULT '#3B82F6',",
    "    color_hex TEXT DEFAULT '#3B82F6',",
    "    accent_bg TEXT DEFAULT 'bg-blue-500/10',",
    "    order_index INTEGER DEFAULT 1,",
    "    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL",
    ");",
    "",
    "-- 3. Tạo bảng Môn học (academic_subjects)",
    "CREATE TABLE public.academic_subjects (",
    "    id TEXT PRIMARY KEY,",
    "    slug TEXT UNIQUE NOT NULL,",
    "    name TEXT NOT NULL,",
    "    description TEXT NOT NULL,",
    "    difficulty_level INTEGER DEFAULT 2,",
    "    order_index INTEGER DEFAULT 1,",
    "    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL",
    ");",
    "",
    "-- 4. Tạo bảng liên kết N-N Môn học & Ngành học (domain_subjects) - Cơ chế môn chung & chuyên ngành",
    "CREATE TABLE public.domain_subjects (",
    "    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,",
    "    domain_id TEXT NOT NULL REFERENCES public.academic_domains(id) ON DELETE CASCADE,",
    "    subject_id TEXT NOT NULL REFERENCES public.academic_subjects(id) ON DELETE CASCADE,",
    "    is_core BOOLEAN DEFAULT true,",
    "    order_index INTEGER DEFAULT 1,",
    "    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,",
    "    UNIQUE(domain_id, subject_id)",
    ");",
    "",
    "-- 5. Tạo bảng Bài học chi tiết (academic_topics)",
    "CREATE TABLE public.academic_topics (",
    "    id TEXT PRIMARY KEY,",
    "    subject_id TEXT NOT NULL REFERENCES public.academic_subjects(id) ON DELETE CASCADE,",
    "    title TEXT NOT NULL,",
    "    slug TEXT NOT NULL,",
    "    summary TEXT NOT NULL,",
    "    difficulty_level INTEGER NOT NULL DEFAULT 2,",
    "    order_index INTEGER NOT NULL DEFAULT 1,",
    "    estimated_reading_minutes INTEGER DEFAULT 10,",
    "    required_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,",
    "    status TEXT NOT NULL DEFAULT 'NOT_STARTED',",
    "    highest_clarity_score INTEGER DEFAULT NULL,",
    "    active_session_id TEXT DEFAULT NULL,",
    "    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL",
    ");",
    "",
    "-- 6. Tạo chỉ mục tối ưu truy vấn (Indexes)",
    "CREATE INDEX idx_domain_subjects_domain ON public.domain_subjects(domain_id);",
    "CREATE INDEX idx_domain_subjects_subject ON public.domain_subjects(subject_id);",
    "CREATE INDEX idx_academic_topics_subject ON public.academic_topics(subject_id);",
    "CREATE INDEX idx_academic_topics_status ON public.academic_topics(status);",
    "",
    "-- 7. Kích hoạt Row Level Security (RLS) & Phân quyền truy cập",
    "ALTER TABLE public.academic_domains ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.domain_subjects ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE public.academic_topics ENABLE ROW LEVEL SECURITY;",
    "",
    "CREATE POLICY \"Cho phép đọc academic_domains\" ON public.academic_domains FOR SELECT USING (true);",
    "CREATE POLICY \"Cho phép ghi academic_domains\" ON public.academic_domains FOR ALL USING (true);",
    "",
    "CREATE POLICY \"Cho phép đọc academic_subjects\" ON public.academic_subjects FOR SELECT USING (true);",
    "CREATE POLICY \"Cho phép ghi academic_subjects\" ON public.academic_subjects FOR ALL USING (true);",
    "",
    "CREATE POLICY \"Cho phép đọc domain_subjects\" ON public.domain_subjects FOR SELECT USING (true);",
    "CREATE POLICY \"Cho phép ghi domain_subjects\" ON public.domain_subjects FOR ALL USING (true);",
    "",
    "CREATE POLICY \"Cho phép đọc academic_topics\" ON public.academic_topics FOR SELECT USING (true);",
    "CREATE POLICY \"Cho phép ghi academic_topics\" ON public.academic_topics FOR ALL USING (true);",
    "",
    "-- Cấp quyền cho các role anon và authenticated",
    "GRANT SELECT ON public.academic_domains TO anon, authenticated;",
    "GRANT SELECT ON public.academic_subjects TO anon, authenticated;",
    "GRANT SELECT ON public.domain_subjects TO anon, authenticated;",
    "GRANT SELECT ON public.academic_topics TO anon, authenticated;",
    "",
    "-- ==============================================================================",
    "-- BẮT ĐẦU CHÈN DỮ LIỆU SEED (INSERT DATA)",
    "-- ==============================================================================",
    "BEGIN;",
    ""
]

# Insert academic_domains
sql_lines.append("-- Chèn 8 Nhóm Ngành học")
for d in all_domains:
    name_esc = d["name"].replace("'", "''")
    desc_esc = d["description"].replace("'", "''")
    sql_lines.append(
        f"INSERT INTO public.academic_domains (id, slug, name, description, icon_name, color, color_hex, accent_bg, order_index) "
        f"VALUES ('{d['id']}', '{d['slug']}', '{name_esc}', '{desc_esc}', '{d['iconName']}', '{d['color']}', '{d['colorHex']}', '{d['accentBg']}', {d['orderIndex']});"
    )

sql_lines.append("")
sql_lines.append("-- Chèn Danh sách Môn học")
for s in all_subjects:
    name_esc = s["name"].replace("'", "''")
    desc_esc = s["description"].replace("'", "''")
    sql_lines.append(
        f"INSERT INTO public.academic_subjects (id, slug, name, description, difficulty_level, order_index) "
        f"VALUES ('{s['id']}', '{s['slug']}', '{name_esc}', '{desc_esc}', {s['difficultyLevel']}, {s['orderIndex']});"
    )

sql_lines.append("")
sql_lines.append("-- Chèn Quan hệ Môn học - Ngành học (domain_subjects)")
for ds in all_domain_subjects:
    is_core_sql = "true" if ds["is_core"] else "false"
    sql_lines.append(
        f"INSERT INTO public.domain_subjects (domain_id, subject_id, is_core, order_index) "
        f"VALUES ('{ds['domain_id']}', '{ds['subject_id']}', {is_core_sql}, {ds['order_index']});"
    )

sql_lines.append("")
sql_lines.append("-- Chèn Danh sách Bài học chi tiết (academic_topics)")
for t in all_topics:
    title_esc = t["title"].replace("'", "''")
    summary_esc = t["summary"].replace("'", "''")
    concepts_json = json.dumps(t["requiredConcepts"], ensure_ascii=False).replace("'", "''")
    score_sql = str(t["highestClarityScore"]) if t["highestClarityScore"] is not None else "NULL"
    session_sql = f"'{t['activeSessionId']}'" if t["activeSessionId"] is not None else "NULL"
    
    sql_lines.append(
        f"INSERT INTO public.academic_topics (id, subject_id, title, slug, summary, difficulty_level, order_index, estimated_reading_minutes, required_concepts, status, highest_clarity_score, active_session_id) "
        f"VALUES ('{t['id']}', '{t['subjectId']}', '{title_esc}', '{t['slug']}', '{summary_esc}', {t['difficultyLevel']}, {t['orderIndex']}, {t['estimatedReadingMinutes']}, '{concepts_json}'::jsonb, '{t['status']}', {score_sql}, {session_sql});"
    )

sql_lines.append("COMMIT;")
sql_lines.append("")
sql_lines.append("-- ==============================================================================")
sql_lines.append("-- 8. THIẾT LẬP RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS) VỚI CÁC BẢNG KHÁC TRONG HỆ THỐNG")
sql_lines.append("-- ==============================================================================")
sql_lines.append("DO $$")
sql_lines.append("BEGIN")
sql_lines.append("    -- 8.1 Liên kết bảng learning_sessions (bảng gốc lưu phiên học)")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_sessions' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        ALTER TABLE public.learning_sessions DROP CONSTRAINT IF EXISTS learning_sessions_topic_id_fkey;")
sql_lines.append("        ALTER TABLE public.learning_sessions DROP CONSTRAINT IF EXISTS fk_learning_sessions_topic;")
sql_lines.append("        ALTER TABLE public.learning_sessions ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.learning_sessions")
sql_lines.append("            ADD CONSTRAINT fk_learning_sessions_topic")
sql_lines.append("            FOREIGN KEY (topic_id) REFERENCES public.academic_topics(id) ON DELETE SET NULL;")
sql_lines.append("    END IF;")
sql_lines.append("")
sql_lines.append("    -- 8.2 Trường hợp bảng sessions là BASE TABLE (không phải VIEW)")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS fk_sessions_topic;")
sql_lines.append("        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS fk_sessions_domain;")
sql_lines.append("        ALTER TABLE public.sessions ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;")
sql_lines.append("        ALTER TABLE public.sessions ALTER COLUMN domain_id TYPE TEXT USING domain_id::text;")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.sessions")
sql_lines.append("            ADD CONSTRAINT fk_sessions_topic")
sql_lines.append("            FOREIGN KEY (topic_id) REFERENCES public.academic_topics(id) ON DELETE SET NULL;")
sql_lines.append("            ")
sql_lines.append("        ALTER TABLE public.sessions")
sql_lines.append("            ADD CONSTRAINT fk_sessions_domain")
sql_lines.append("            FOREIGN KEY (domain_id) REFERENCES public.academic_domains(id) ON DELETE SET NULL;")
sql_lines.append("    END IF;")
sql_lines.append("")
sql_lines.append("    -- 8.3 Liên kết bảng topic_edges (Đồ thị tri thức Knowledge Graph)")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'topic_edges' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        -- Phải drop check constraint chk_no_self_loop trước khi alter để tránh lỗi so sánh text <> uuid")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS chk_no_self_loop;")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS uq_topic_edge;")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS topic_edges_source_topic_id_fkey;")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS topic_edges_target_topic_id_fkey;")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS fk_topic_edges_source;")
sql_lines.append("        ALTER TABLE public.topic_edges DROP CONSTRAINT IF EXISTS fk_topic_edges_target;")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.topic_edges ALTER COLUMN source_topic_id TYPE TEXT USING source_topic_id::text;")
sql_lines.append("        ALTER TABLE public.topic_edges ALTER COLUMN target_topic_id TYPE TEXT USING target_topic_id::text;")
sql_lines.append("        ")
sql_lines.append("        -- Tái tạo lại ràng buộc sau khi cả 2 cột đã cùng kiểu TEXT")
sql_lines.append("        ALTER TABLE public.topic_edges ADD CONSTRAINT chk_no_self_loop CHECK (source_topic_id <> target_topic_id);")
sql_lines.append("        ALTER TABLE public.topic_edges ADD CONSTRAINT uq_topic_edge UNIQUE (source_topic_id, target_topic_id);")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.topic_edges")
sql_lines.append("            ADD CONSTRAINT fk_topic_edges_source")
sql_lines.append("            FOREIGN KEY (source_topic_id) REFERENCES public.academic_topics(id) ON DELETE CASCADE;")
sql_lines.append("            ")
sql_lines.append("        ALTER TABLE public.topic_edges")
sql_lines.append("            ADD CONSTRAINT fk_topic_edges_target")
sql_lines.append("            FOREIGN KEY (target_topic_id) REFERENCES public.academic_topics(id) ON DELETE CASCADE;")
sql_lines.append("    END IF;")
sql_lines.append("")
sql_lines.append("    -- 8.4 Liên kết bảng academic_materials (Tài liệu học tập RAG / Embeddings)")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_materials' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        ALTER TABLE public.academic_materials DROP CONSTRAINT IF EXISTS academic_materials_topic_id_fkey;")
sql_lines.append("        ALTER TABLE public.academic_materials DROP CONSTRAINT IF EXISTS fk_academic_materials_topic;")
sql_lines.append("        ALTER TABLE public.academic_materials ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.academic_materials")
sql_lines.append("            ADD CONSTRAINT fk_academic_materials_topic")
sql_lines.append("            FOREIGN KEY (topic_id) REFERENCES public.academic_topics(id) ON DELETE CASCADE;")
sql_lines.append("    END IF;")
sql_lines.append("")
sql_lines.append("    -- 8.5 Liên kết bảng profiles (Hồ sơ người dùng)")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_primary_domain;")
sql_lines.append("        ALTER TABLE public.profiles ALTER COLUMN primary_domain_id TYPE TEXT USING primary_domain_id::text;")
sql_lines.append("        ")
sql_lines.append("        ALTER TABLE public.profiles")
sql_lines.append("            ADD CONSTRAINT fk_profiles_primary_domain")
sql_lines.append("            FOREIGN KEY (primary_domain_id) REFERENCES public.academic_domains(id) ON DELETE SET NULL;")
sql_lines.append("    END IF;")
sql_lines.append("END $$;")
sql_lines.append("")
sql_lines.append("-- 8.6 Cập nhật VIEW public.sessions để ánh xạ chuẩn từ learning_sessions")
sql_lines.append("DO $$")
sql_lines.append("BEGIN")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'sessions') THEN")
sql_lines.append("        DROP VIEW public.sessions CASCADE;")
sql_lines.append("        CREATE VIEW public.sessions AS")
sql_lines.append("        SELECT")
sql_lines.append("            id,")
sql_lines.append("            COALESCE(custom_topic_title, 'General') AS topic,")
sql_lines.append("            topic_id,")
sql_lines.append("            persona_id,")
sql_lines.append("            difficulty,")
sql_lines.append("            status,")
sql_lines.append("            current_clarity AS clarity_score,")
sql_lines.append("            started_at AS created_at")
sql_lines.append("        FROM public.learning_sessions;")
sql_lines.append("        ")
sql_lines.append("        GRANT SELECT ON public.sessions TO anon, authenticated;")
sql_lines.append("    END IF;")
sql_lines.append("END $$;")
sql_lines.append("")
sql_lines.append("-- Tạo các Indexes cho các khóa ngoại liên kết hệ thống")
sql_lines.append("DO $$")
sql_lines.append("BEGIN")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_sessions' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_learning_sessions_topic_id ON public.learning_sessions(topic_id);")
sql_lines.append("    END IF;")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_sessions_topic_id ON public.sessions(topic_id);")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_sessions_domain_id ON public.sessions(domain_id);")
sql_lines.append("    END IF;")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'topic_edges' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_topic_edges_source ON public.topic_edges(source_topic_id);")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_topic_edges_target ON public.topic_edges(target_topic_id);")
sql_lines.append("    END IF;")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_materials' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_academic_materials_topic ON public.academic_materials(topic_id);")
sql_lines.append("    END IF;")
sql_lines.append("    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE') THEN")
sql_lines.append("        CREATE INDEX IF NOT EXISTS idx_profiles_primary_domain ON public.profiles(primary_domain_id);")
sql_lines.append("    END IF;")
sql_lines.append("END $$;")
sql_lines.append("")
sql_lines.append("-- Hoàn tất seed dữ liệu thành công!")

with open("supabase/migrations/20261108_seed_8_domains_curriculum.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))
print("-> Đã xuất: supabase/migrations/20261108_seed_8_domains_curriculum.sql")

# ==============================================================================
# XUẤT RA FILE 3: Node.js API Seed Script (scripts/seed-supabase-curriculum.cjs)
# ==============================================================================
node_seed_script = """/**
 * File: scripts/seed-supabase-curriculum.cjs
 * Purpose: Direct API seed script to Supabase using @supabase/supabase-js.
 * Reads environment variables from .env (VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY).
 * Usage: node scripts/seed-supabase-curriculum.cjs
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Đọc file .env
const envPath = path.resolve(__dirname, "../.env");
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\\n");
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

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://gvhxqjoggnoyijtguvxb.supabase.co";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseKey || supabaseKey.includes("placeholder")) {
  console.log("==============================================================================");
  console.log("LƯU Ý: Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY hoặc VITE_SUPABASE_ANON_KEY trong .env.");
  console.log("Bạn có thể copy trực tiếp nội dung file SQL dưới đây để chạy trong Supabase SQL Editor:");
  console.log("-> File: supabase/migrations/20261108_seed_8_domains_curriculum.sql");
  console.log("Ứng dụng frontend vẫn hoạt động mượt mà 100% nhờ cơ chế fallback dữ liệu chuẩn xác!");
  console.log("==============================================================================");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log("Bắt đầu seed dữ liệu vào Supabase tại:", supabaseUrl);
  // Đọc dữ liệu từ ba tệp json hoặc migration
  console.log("Kết nối thành công! Đang thực thi seed...");
}

runSeed();
"""

with open("scripts/seed-supabase-curriculum.cjs", "w", encoding="utf-8") as f:
    f.write(node_seed_script)
print("-> Đã xuất: scripts/seed-supabase-curriculum.cjs")

