"""
File: scripts/enrich_academic_catalog.py
Purpose: Automated academic catalog enrichment pipeline for Feynman Technique Stage.
Fetches verified encyclopedic summaries from Wikipedia REST API and compiles 40+
rigorous academic topics across 4 domains (Math, Discrete Math, Computer Vision, CS)
into TypeScript data stores, knowledge graph topologies, and PostgreSQL SQL seed files.
"""

import json
import os
import time
from typing import Dict, List, Optional
import httpx
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Pydantic Schemas for Strict Academic Quality Assurance
# ---------------------------------------------------------------------------

class JargonTrap(BaseModel):
    term: str
    trap: str
    feynman_translation: str

class AnalogyHint(BaseModel):
    title: str
    metaphor: str
    target_audience: str

class TopicDefinition(BaseModel):
    id: str
    slug: str
    domain_id: str
    domain_name: str
    title_vi: str
    title_en: str
    wikipedia_slug: str
    difficulty: str  # Beginner, Intermediate, Advanced
    ground_truth_vi: str
    core_concepts: List[str]
    jargon_traps: List[JargonTrap]
    analogy_hints: List[AnalogyHint]
    prerequisites: List[str] = Field(default_factory=list)
    sub_concepts: List[str] = Field(default_factory=list)
    practical_applications: List[str] = Field(default_factory=list)
    wikipedia_summary: Optional[str] = None
    wikipedia_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

class GraphNode(BaseModel):
    id: str
    label: str
    domain: str
    category: str
    level: str
    mastery_score: int
    x: int
    y: int
    prerequisites: List[str]

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str  # PREREQUISITE, SUB_CONCEPT, RELATED

# ---------------------------------------------------------------------------
# Master Curated Academic Catalog (40 Topics, 4 Core Domains)
# ---------------------------------------------------------------------------

RAW_TOPICS: List[TopicDefinition] = [
    # =========================================================================
    # 1. TOÁN CAO CẤP & ĐẠI SỐ TUYẾN TÍNH (10 Topics)
    # =========================================================================
    TopicDefinition(
        id="math-gradient-descent",
        slug="gradient-descent",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Thuật Toán Hạ Độ Dốc (Gradient Descent)",
        title_en="Gradient Descent Optimization",
        wikipedia_slug="Gradient_descent",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Gradient Descent là thuật toán tối ưu hóa bậc một lặp lại nhằm tìm cực tiểu địa phương của hàm khả vi f(θ). "
            "Tại mỗi bước, vector tham số được cập nhật ngược hướng của vector gradient: θ_{t+1} = θ_t - η ∇f(θ_t), "
            "trong đó ∇f(θ) = [∂f/∂θ_1, ..., ∂f/∂θ_n]^T là vector các đạo hàm riêng chỉ hướng dốc nhất, và η > 0 là hệ số học (learning rate)."
        ),
        core_concepts=[
            "Vector Gradient ∇f là hướng tốc độ tăng giá trị hàm số lớn nhất",
            "Cập nhật ngược hướng -∇f đảm bảo giá trị hàm mục tiêu giảm trong lân cận cục bộ",
            "Tác động của Learning Rate η: Quá nhỏ gây hội tụ chậm, quá lớn gây phân kỳ / dao động",
            "Điểm yên ngựa (Saddle Points) và cực tiểu địa phương (Local Minima) trong không gian nhiều chiều",
            "Các biến thể ngẫu nhiên và quán tính: SGD (Stochastic), Mini-batch, Adam, Momentum"
        ],
        jargon_traps=[
            JargonTrap(
                term="Learning Rate (Tốc độ học)",
                trap="Nghĩ rằng máy tính đang 'học' với tốc độ nhanh hay chậm theo nghĩa đen",
                feynman_translation="Độ dài của bước chân bạn bước khi dò đường xuống dốc trong sương mù."
            ),
            JargonTrap(
                term="Gradient",
                trap="Nói chung chung là 'độ dốc' mà không hiểu nó là một vector đa chiều chỉ hướng leo lên dốc nhanh nhất",
                feynman_translation="Mũi tên chỉ thẳng lên đỉnh dốc đứng nhất tại điểm bạn đang đứng."
            ),
            JargonTrap(
                term="Saddle Point (Điểm yên ngựa)",
                trap="Nhầm lẫn điểm yên ngựa với cực tiểu cục bộ vì cả hai đều có gradient bằng 0",
                feynman_translation="Vị trí ở giữa chiếc yên ngựa: nhìn ngang thì là đáy trũng, nhưng nhìn dọc thì lại là đỉnh dốc."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Người đi bộ xuống núi trong sương mù dày đặc",
                metaphor="Bạn bị bịt mắt trên một quả đồi và muốn xuống đáy thung lũng. Bạn dùng chân cảm nhận chỗ nào dốc xuống sâu nhất và bước một bước ngắn về hướng đó.",
                target_audience="Người mới bắt đầu"
            ),
            AnalogyHint(
                title="Hòn bi lăn trên bề mặt gồ ghề",
                metaphor="Hòn bi chịu tác dụng của trọng lực tự động lăn theo phương nghiêng nhất xuống lòng chảo thấp nhất.",
                target_audience="Học sinh trung học"
            )
        ],
        prerequisites=["math-partial-derivatives", "math-vectors"],
        sub_concepts=["math-learning-rate-decay", "math-adam-optimizer"],
        practical_applications=["Huấn luyện mạng Neural Networks", "Hồi quy tuyến tính và Logistic Regression", "Hệ thống khuyến nghị gợi ý sản phẩm"]
    ),

    TopicDefinition(
        id="math-linear-transformations",
        slug="linear-transformations",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Ma Trận Biến Đổi Tuyến Tính",
        title_en="Linear Transformation & Matrices",
        wikipedia_slug="Linear_map",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Phép biến đổi tuyến tính T: V -> W giữa hai không gian vector là ánh xạ thỏa mãn hai tiên đề: "
            "1) Tính cộng: T(u + v) = T(u) + T(v); 2) Tính thuần nhất: T(c * u) = c * T(u). "
            "Trong hệ tọa độ hữu hạn chiều, mọi biến đổi tuyến tính đều được biểu diễn hoàn toàn bằng phép nhân ma trận y = A * x, "
            "trong đó các cột của ma trận A chính là tọa độ ảnh của các vector cơ sở (basis vectors) sau biến đổi."
        ),
        core_concepts=[
            "Gốc tọa độ (0, 0) luôn bất biến (T(0) = 0)",
            "Mọi đường thẳng vẫn giữ nguyên là đường thẳng (hoặc co lại thành điểm), không bị uốn cong",
            "Các đường lưới song song và cách đều nhau vẫn song song và cách đều nhau sau khi biến đổi",
            "Các cột của ma trận A ghi lại tọa độ mới của vector cơ sở i-hat và j-hat",
            "Định thức det(A) đo lường hệ số thay đổi diện tích hoặc thể tích của không gian sau biến đổi"
        ],
        jargon_traps=[
            JargonTrap(
                term="Matrix (Ma trận)",
                trap="Coi ma trận chỉ là một bảng số hình chữ nhật vô tri để tính toán thủ công",
                feynman_translation="Một bộ quy tắc nhào nặn, xoay, kéo dãn hoặc ép bẹp toàn bộ không gian không gian nhiều chiều."
            ),
            JargonTrap(
                term="Determinant (Định thức)",
                trap="Nhớ công thức tính ad - bc mà không hiểu ý nghĩa hình học",
                feynman_translation="Tỷ lệ diện tích của một hình vuông 1x1 bị phồng to hoặc teo nhỏ lại sau khi bị ma trận nhào nặn."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Tấm cao su đàn hồi được kéo dãn",
                metaphor="Vẽ hệ trục tọa độ lên tấm màng cao su. Bạn có thể kéo dãn, xoay, nghiêng tấm màng nhưng không được xé rách hay gấp mép nó.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-vectors", "math-basis-span"],
        sub_concepts=["math-determinant", "math-matrix-multiplication"],
        practical_applications=["Xử lý đồ họa 3D trong Game Engine (OpenGL/Vulkan)", "Xoay và co dãn ảnh trong Computer Vision", "Mạng nơ-ron Fully Connected"]
    ),

    TopicDefinition(
        id="math-eigenvalues-eigenvectors",
        slug="eigenvalues-eigenvectors",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Vector Riêng và Trị Riêng (Eigenvalues & Eigenvectors)",
        title_en="Eigenvalues and Eigenvectors",
        wikipedia_slug="Eigenvalues_and_eigenvectors",
        difficulty="Advanced",
        ground_truth_vi=(
            "Cho ma trận vuông A kích thước n x n. Vector v khác vector không được gọi là vector riêng (eigenvector) "
            "và số thực/phức λ được gọi là trị riêng (eigenvalue) tương ứng nếu thỏa mãn phương trình: A * v = λ * v. "
            "Về mặt hình học, khi ma trận A biến đổi toàn bộ không gian, hướng của vector v hoàn toàn không bị xoay lệch, "
            "mà chỉ bị kéo dãn hoặc nén lại theo hệ số tỉ lệ bằng đúng λ. Phương trình đặc trưng: det(A - λI) = 0."
        ),
        core_concepts=[
            "Vector riêng là những trục phương hướng đặc biệt không bị chệch hướng sau phép biến đổi ma trận",
            "Trị riêng λ là hệ số co giãn dọc theo trục vector riêng (λ > 1 dãn, 0 < λ < 1 nén, λ < 0 đảo chiều)",
            "Phương trình đa thức đặc trưng det(A - λI) = 0 dùng để tìm toàn bộ phổ trị riêng",
            "Đường chéo hóa ma trận: A = P * D * P^{-1} giúp tính toán lũy thừa ma trận A^k tức thời",
            "Ứng dụng phân rã ma trận phương sai trong PCA (Principal Component Analysis)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Eigenvector (Vector riêng)",
                trap="Học thuộc phương trình Av = λv mà không giải thích được tại sao nó đặc biệt",
                feynman_translation="Trục xương sống của phép biến đổi: trong khi mọi vector khác đều bị vặn vẹo xoay tròn, vector này giữ nguyên hướng chỉ tay."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Trục quay của quả địa cầu",
                metaphor="Khi quả cầu xoay, mọi điểm trên bề mặt đều đổi vị trí, duy chỉ có hai điểm cực Bắc và cực Nam nằm trên trục xoay vẫn giữ nguyên hướng.",
                target_audience="Học sinh trung học"
            )
        ],
        prerequisites=["math-linear-transformations", "math-determinant"],
        sub_concepts=["math-svd", "math-pca"],
        practical_applications=["Thuật toán PageRank của Google xếp hạng website", "Nén dữ liệu khuôn mặt Eigenfaces", "Phân tích dao động cơ học công trình"]
    ),

    TopicDefinition(
        id="math-svd",
        slug="svd",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Phép Phân Tích Giá Trị Kỳ Dị (SVD)",
        title_en="Singular Value Decomposition",
        wikipedia_slug="Singular_value_decomposition",
        difficulty="Advanced",
        ground_truth_vi=(
            "Phân tích giá trị kỳ dị (SVD) là phép phân tích tổng quát cho mọi ma trận thực A kích thước m x n thành tích ba ma trận: "
            "A = U * Σ * V^T, trong đó U (m x m) và V (n x n) là các ma trận trực giao (orthogonal), "
            "và Σ (m x n) là ma trận đường chéo chứa các giá trị kỳ dị σ_1 ≥ σ_2 ≥ ... ≥ σ_r ≥ 0. "
            "Về mặt hình học, SVD phân rã mọi phép biến đổi tuyến tính thành 3 bước: Xoay hệ trục (V^T) -> Co dãn theo trục chính (Σ) -> Xoay tiếp (U)."
        ),
        core_concepts=[
            "Áp dụng được cho mọi ma trận, kể cả ma trận chữ nhật không vuông",
            "Giá trị kỳ dị σ_i là căn bậc hai trị riêng của ma trận A^T * A",
            "Định lý Eckart-Young: Giữ lại k giá trị kỳ dị lớn nhất cho phép xấp xỉ ma trận hạng thấp tối ưu (Low-rank approximation)",
            "Khử nhiễu dữ liệu và nén dung lượng mà vẫn giữ nguyên thông tin cấu trúc cốt lõi"
        ],
        jargon_traps=[
            JargonTrap(
                term="Singular Values (Giá trị kỳ dị)",
                trap="Nghĩ chữ 'kỳ dị' nghĩa là bất thường hay lỗi toán học",
                feynman_translation="Thước đo độ quan trọng hoặc sức mạnh của từng hướng đặc trưng trong khối dữ liệu."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Lăng kính tán sắc ánh sáng",
                metaphor="Một chùm ánh sáng phức tạp đi qua lăng kính được tách thành từng dải màu đơn sắc xếp theo thứ tự cường độ sáng từ mạnh đến yếu.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-eigenvalues-eigenvectors", "math-orthogonal-matrices"],
        sub_concepts=["math-pca", "math-matrix-factorization"],
        practical_applications=["Nén ảnh số không giảm chất lượng nhận thức", "Hệ thống gợi ý phim Netflix (Matrix Factorization)", "Tìm kiếm ngữ nghĩa ẩn LSA trong NLP"]
    ),

    TopicDefinition(
        id="math-hessian-saddle-points",
        slug="hessian-matrix-saddle-points",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Ma Trận Hessian và Điểm Yên Ngựa",
        title_en="Hessian Matrix & Saddle Points",
        wikipedia_slug="Hessian_matrix",
        difficulty="Advanced",
        ground_truth_vi=(
            "Ma trận Hessian H của hàm số khả vi bậc hai f: R^n -> R là ma trận vuông n x n chứa các đạo hàm riêng cấp hai: "
            "H_{ij} = ∂^2 f / (∂x_i ∂x_j). Theo định lý Schwarz, nếu các đạo hàm riêng liên tục thì H là ma trận đối xứng. "
            "Dấu của các trị riêng của ma trận Hessian xác định độ cong của bề mặt: H xác định dương (tất cả λ > 0) -> Cực tiểu địa phương; "
            "H xác định âm -> Cực đại địa phương; H không xác định dấu (có cả λ > 0 và λ < 0) -> Điểm yên ngựa (Saddle Point)."
        ),
        core_concepts=[
            "Hessian biểu diễn độ cong bậc hai (curvature) của hàm số trong không gian nhiều chiều",
            "Gradient cho biết hướng nghiêng, Hessian cho biết độ cong gập của mặt phẳng dốc",
            "Trong không gian nghìn chiều của Deep Learning, phần lớn điểm dừng (∇f = 0) là điểm yên ngựa chứ không phải cực tiểu địa phương",
            "Thuật toán tối ưu bậc hai Newton-Raphson sử dụng H^{-1} ∇f để nhảy trực tiếp tới cực trị"
        ],
        jargon_traps=[
            JargonTrap(
                term="Positive Definite (Xác định dương)",
                trap="Tưởng là mọi phần tử trong ma trận đều phải là số dương",
                feynman_translation="Chiếc bát ngửa lên: dù bạn bước theo bất kỳ hướng nào thì bề mặt cũng đều cong vồng lên trên."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Chiếc đèo núi hiểm trở",
                metaphor="Đứng trên đỉnh đèo: nếu nhìn sang hai bên là sườn núi cao chót vót (cong lên), nhưng nhìn thẳng phía trước và sau là dốc đổ xuống vực (cong xuống).",
                target_audience="Người leo núi"
            )
        ],
        prerequisites=["math-gradient-descent", "math-partial-derivatives"],
        sub_concepts=["math-newton-optimization"],
        practical_applications=["Phân tích ổn định cơ học kết cấu", "Tối ưu hóa siêu tham số Second-order Optimization", "Đánh giá hội tụ mạng nơ-ron"]
    ),

    TopicDefinition(
        id="math-taylor-series",
        slug="taylor-series",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Chuỗi Taylor và Xấp Xỉ Đa Thức",
        title_en="Taylor Series and Polynomial Approximation",
        wikipedia_slug="Taylor_series",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Chuỗi Taylor của một hàm số f(x) khả vi vô hạn tại lân cận điểm a là chuỗi lũy thừa: "
            "f(x) = ∑_{n=0}^∞ [f^{(n)}(a) / n!] * (x - a)^n = f(a) + f'(a)(x-a) + [f''(a)/2!](x-a)^2 + ... "
            "Định lý Taylor cho phép xấp xỉ một hàm phi tuyến phức tạp bất kỳ quanh một điểm bằng một đa thức đơn giản, "
            "với phần dư sai số được ước lượng qua công thức Lagrange."
        ),
        core_concepts=[
            "Hàm số phức tạp (sin, cos, exp) có thể tính toán gần đúng bằng các phép cộng trừ nhân chia đa thức",
            "Bậc 0: Khớp vị trí giá trị f(a)",
            "Bậc 1: Khớp độ dốc / tiếp tuyến f'(a) (Xấp xỉ tuyến tính)",
            "Bậc 2: Khớp độ cong uốn lượn f''(a) (Xấp xỉ Parabol)",
            "Bán kính hội tụ xác định phạm vi mà chuỗi Taylor còn phản ánh đúng hàm số ban đầu"
        ],
        jargon_traps=[
            JargonTrap(
                term="Maclaurin Series",
                trap="Tưởng là một định lý hoàn toàn khác với Taylor",
                feynman_translation="Chỉ đơn giản là chuỗi Taylor khi ta chọn điểm xuất phát đo lường ngay tại gốc tọa độ a = 0."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Dự báo đường bay của quả bóng",
                metaphor="Bậc 0 là bóng đang ở đâu; Bậc 1 là vận tốc bóng đang bay; Bậc 2 là gia tốc rơi của trọng lực. Càng biết thêm nhiều đạo hàm bậc cao, ta càng đoán chính xác quỹ đạo tương lai.",
                target_audience="Học sinh cấp 3"
            )
        ],
        prerequisites=["math-partial-derivatives"],
        sub_concepts=["math-euler-formula"],
        practical_applications=["Cách chip máy tính và máy tính Casio tính hàm sin/cos/ln", "Phân tích độ nhạy rủi ro tài chính Black-Scholes", "Mô phỏng vật lý trong Game"]
    ),

    TopicDefinition(
        id="math-fourier-transform",
        slug="fourier-transform",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Biến Đổi Fourier (Fourier Transform)",
        title_en="Fourier Transform",
        wikipedia_slug="Fourier_transform",
        difficulty="Advanced",
        ground_truth_vi=(
            "Biến đổi Fourier là phép toán tích phân biến đổi tín hiệu f(t) từ miền thời gian (time domain) sang miền tần số (frequency domain): "
            "F(ω) = ∫_{-∞}^∞ f(t) * e^{-i ω t} dt. Phép toán này chứng minh rằng mọi dạng sóng liên tục phức tạp đều có thể được phân tích "
            "thành tổng tích phân của các hàm sóng hình sin và cosin cơ bản với tần số, biên độ và pha xác định."
        ),
        core_concepts=[
            "Chuyển đổi góc nhìn từ 'âm thanh vang lên lúc nào' sang 'âm thanh gồm những nốt nhạc nào'",
            "Công thức Euler e^{iθ} = cos(θ) + i sin(θ) liên kết chuyển động tròn đều với sóng điều hòa",
            "Thuật toán Biến đổi Fourier Nhanh FFT (Fast Fourier Transform) giảm độ phức tạp từ O(N^2) xuống O(N log N)",
            "Phổ biên độ (Magnitude spectrum) và phổ pha (Phase spectrum)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Frequency Domain (Miền tần số)",
                trap="Khó hình dung vì thói quen quan sát đồ thị theo trục thời gian",
                feynman_translation="Bảng danh sách các thành phần nguyên liệu và hàm lượng của một ly sinh tố hoa quả đã xay nhuyễn."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Tách nguyên liệu của một ly sinh tố",
                metaphor="Nếu một bản nhạc là ly sinh tố xay nhuyễn kiwi, chuối và dâu, thì Fourier Transform là chiếc máy thần kỳ tách ly sinh tố ngược lại thành từng dĩa trái cây ban đầu.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-taylor-series", "math-euler-formula"],
        sub_concepts=["math-fft", "math-wavelets"],
        practical_applications=["Nén âm thanh MP3 và nén ảnh JPEG", "Khử tiếng ồn tai nghe Noise-Cancelling", "Chụp cộng hưởng từ MRI trong y khoa"]
    ),

    TopicDefinition(
        id="math-gauss-jordan-elimination",
        slug="gauss-jordan-elimination",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Phép Khử Gauss-Jordan và Nghịch Đảo Ma Trận",
        title_en="Gauss-Jordan Elimination",
        wikipedia_slug="Gaussian_elimination",
        difficulty="Beginner",
        ground_truth_vi=(
            "Phép khử Gauss-Jordan là thuật toán đại số tuyến tính dùng để giải hệ phương trình tuyến tính A * x = b, "
            "tìm hạng ma trận (rank) và tính ma trận nghịch đảo A^{-1}. Thuật toán sử dụng 3 phép biến đổi sơ cấp trên hàng: "
            "1) Hoán vị hai hàng; 2) Nhân một hàng với hằng số khác 0; 3) Cộng bội số của một hàng vào hàng khác, "
            "để đưa ma trận bổ sung [A | b] về ma trận bậc thang rút gọn (Reduced Row Echelon Form - RREF)."
        ),
        core_concepts=[
            "Các phép biến đổi sơ cấp hàng không làm thay đổi tập nghiệm của hệ phương trình",
            "Đưa ma trận về dạng tam giác trên (Khử Gauss) và dạng đường chéo đơn vị (Gauss-Jordan)",
            "Điều kiện ma trận khả nghịch: Ma trận vuông có định thức khác 0 và đủ n phần tử trụ (pivots)",
            "Độ phức tạp tính toán O(n^3)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Pivot (Phần tử trụ)",
                trap="Chọn đại một số ở đầu hàng mà không kiểm tra xem nó có bằng 0 hay không",
                feynman_translation="Điểm tựa đòn bẩy: con số làm mốc để ta dùng nó triệt tiêu toàn bộ các số nằm phía dưới và phía trên cùng cột."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Trò chơi Sudoku triệt tiêu dần khả năng",
                metaphor="Bạn dùng các hàng đã chắc chắn đáp án để suy luận và xóa sạch các ô ẩn số ở những hàng còn lại cho đến khi chỉ còn một kết quả duy nhất.",
                target_audience="Người chơi đố vui"
            )
        ],
        prerequisites=["math-linear-transformations"],
        sub_concepts=["math-lu-decomposition"],
        practical_applications=["Giải mạch điện phức tạp theo định luật Kirchhoff", "Cân bằng phương trình phản ứng hóa học tự động", "Phân tích dòng tải hệ thống điện lưới"]
    ),

    TopicDefinition(
        id="math-gram-schmidt",
        slug="gram-schmidt-orthogonalization",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Trực Giao Hóa Gram-Schmidt",
        title_en="Gram-Schmidt Orthogonalization",
        wikipedia_slug="Gram–Schmidt_process",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Quá trình Gram-Schmidt là phương pháp xây dựng một hệ trực chuẩn (orthonormal basis) {q_1, q_2, ..., q_k} "
            "từ một hệ vector độc lập tuyến tính {v_1, v_2, ..., v_k} trong không gian tích trong. Thuật toán hoạt động bằng cách: "
            "Chọn vector đầu tiên làm chuẩn; với mỗi vector tiếp theo, trừ đi hình chiếu vuông góc (projection) của nó lên các vector trước "
            "để thu được phần vuông góc hoàn toàn, sau đó chia cho độ dài (norm) để chuẩn hóa về độ dài bằng 1. Đây là nền tảng của phân tích QR (A = QR)."
        ),
        core_concepts=[
            "Hai vector trực giao (vuông góc) khi tích vô hướng giữa chúng bằng 0: ⟨u, v⟩ = 0",
            "Hệ trực chuẩn gồm các vector đôi một vuông góc và có độ dài đúng bằng 1",
            "Hình chiếu vector (Vector Projection) phân tách một vector thành phần song song và phần vuông góc",
            "Phân tích QR (A = QR) giúp giải bài toán bình phương tối thiểu (Least Squares) cực kỳ ổn định số học"
        ],
        jargon_traps=[
            JargonTrap(
                term="Orthogonal vs Orthonormal",
                trap="Nhầm lẫn hai từ này là một",
                feynman_translation="Trực giao (Orthogonal) là chỉ cần vuông góc góc 90 độ; Trực chuẩn (Orthonormal) là vừa vuông góc vừa phải có độ dài đúng bằng 1 mét."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Dựng hệ khung nhà góc vuông chuẩn xác",
                metaphor="Người thợ mộc đóng cột thứ nhất xuống đất. Cột thứ hai phải được căn góc eke vuông góc chuẩn với cột một. Cột thứ ba phải dựng vuông góc với mặt sàn do hai cột trước tạo ra.",
                target_audience="Thợ xây dựng"
            )
        ],
        prerequisites=["math-vectors", "math-basis-span"],
        sub_concepts=["math-qr-decomposition"],
        practical_applications=["Xử lý tín hiệu không dây chống nhiễu (Beamforming)", "Thuật toán bình phương tối thiểu trong học máy", "Định hướng tàu vũ trụ 3D"]
    ),

    TopicDefinition(
        id="math-double-integrals-green",
        slug="double-integrals-green-theorem",
        domain_id="math",
        domain_name="Toán Cao Cấp & Đại Số",
        title_vi="Tích Phân Bội và Định Lý Green",
        title_en="Double Integrals & Green's Theorem",
        wikipedia_slug="Green's_theorem",
        difficulty="Advanced",
        ground_truth_vi=(
            "Định lý Green thiết lập mối quan hệ cơ bản giữa tích phân đường (line integral) dọc theo đường cong kín C "
            "với tích phân kép (double integral) trên miền phẳng D được bao quanh bởi C: "
            "∮_C (L dx + M dy) = ∬_D (∂M/∂x - ∂L/∂y) dA. "
            "Về mặt vật lý, định lý chứng minh rằng tổng độ xoáy vi mô (microscopic circulation/curl) của một trường vector bên trong miền "
            "chính bằng lưu số vĩ mô của trường đó chạy dọc theo đường biên ngoài cùng."
        ),
        core_concepts=[
            "Tích phân bội tính thể tích bên dưới mặt cong z = f(x, y)",
            "Đổi biến số trong tích phân bội bằng định thức ma trận Jacobian |J|",
            "Độ xoáy (Curl) đo xu hướng quay của một hạt thả vào dòng chảy",
            "Định lý Green là trường hợp đặc biệt 2 chiều của Định lý Stokes và Định lý Kelvin"
        ],
        jargon_traps=[
            JargonTrap(
                term="Line Integral (Tích phân đường)",
                trap="Nghĩ là tích phân trên một đoạn thẳng",
                feynman_translation="Đo tổng lực gió đẩy vào lưng bạn khi bạn đạp xe đi dọc một con đường ngoằn ngoèo uốn khúc."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hàng ngàn chiếc bánh răng xoay cạnh nhau",
                metaphor="Đặt hàng ngàn chiếc bánh răng nhỏ quay cùng chiều kim đồng hồ cạnh nhau trên sàn. Răng của hai bánh xe cạnh nhau sẽ triệt tiêu lực lẫn nhau, chỉ còn lại các răng ở vành ngoài cùng là tạo thành dòng chuyển động chạy vòng quanh mép phòng.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-partial-derivatives", "math-vectors"],
        sub_concepts=["math-stokes-theorem"],
        practical_applications=["Tính diện tích thửa đất bất kỳ trên bản đồ GPS", "Mô phỏng khí động học cánh máy bay", "Tính công sinh ra trong chu trình nhiệt động lực học động cơ xe hơi"]
    ),

    # =========================================================================
    # 2. TOÁN RỜI RẠC & LÝ THUYẾT ĐỒ THỊ (10 Topics)
    # =========================================================================
    TopicDefinition(
        id="discrete-dijkstra-algorithm",
        slug="dijkstra-algorithm",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Lý Thuyết Đồ Thị & Thuật Toán Dijkstra",
        title_en="Graph Theory & Dijkstra's Algorithm",
        wikipedia_slug="Dijkstra's_algorithm",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Thuật toán Dijkstra là thuật toán tham lam (greedy algorithm) giải bài toán tìm đường đi ngắn nhất từ một đỉnh nguồn đơn (Single-source shortest path) "
            "đến tất cả các đỉnh khác trong đồ thị có hướng hoặc vô hướng với trọng số các cạnh không âm (w(u, v) ≥ 0). "
            "Thuật toán duy trì mảng khoảng cách d[v] và tập hợp các đỉnh đã cố định khoảng cách ngắn nhất. "
            "Sử dụng hàng đợi ưu tiên (Min-Heap), độ phức tạp thời gian đạt O((V + E) log V)."
        ),
        core_concepts=[
            "Kỹ thuật làm giãn cạnh (Edge Relaxation): Nếu d[u] + w(u, v) < d[v] thì d[v] = d[u] + w(u, v)",
            "Chiến lược tham lam (Greedy Choice): Luôn chọn đỉnh chưa thăm có khoảng cách ước lượng nhỏ nhất",
            "Điều kiện tiên quyết bắt buộc: Trọng số các cạnh không được âm (tránh vòng lặp âm vô tận)",
            "Đồ thị biểu diễn bằng ma trận kề (Adjacency Matrix) hoặc danh sách kề (Adjacency List)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Relaxation (Làm giãn cạnh)",
                trap="Tưởng là làm cạnh dài ra hoặc nghỉ ngơi",
                feynman_translation="Thắt chặt lại khoảng cách: phát hiện ra một lối đi tắt ngắn hơn thì lập tức cập nhật lại kỷ lục quãng đường."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Vết dầu loang trên bản đồ",
                metaphor="Nhỏ một giọt mực tại thành phố xuất phát. Mực sẽ từ từ chảy loang đều theo các con đường. Thành phố nào bị mực chạm vào trước thì đó chắc chắn là con đường ngắn nhất dẫn tới đó.",
                target_audience="Học sinh cấp 2"
            )
        ],
        prerequisites=["discrete-graph-fundamentals", "discrete-greedy-algorithms"],
        sub_concepts=["discrete-a-star-search", "discrete-bellman-ford"],
        practical_applications=["Chỉ đường Google Maps và Grab", "Định tuyến gói tin IP trên bộ định tuyến Router mạng Internet (giao thức OSPF)", "Tìm kiếm đường đi cho nhân vật trong Game"]
    ),

    TopicDefinition(
        id="discrete-minimum-spanning-tree",
        slug="minimum-spanning-tree-kruskal-prim",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Cây Bao Trùm Tối Thiểu (Kruskal & Prim)",
        title_en="Minimum Spanning Tree (MST)",
        wikipedia_slug="Minimum_spanning_tree",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Cho đồ thị vô hướng liên thông có trọng số G = (V, E). Cây bao trùm tối thiểu (MST) là một đồ thị con T = (V, E_T) "
            "chứa toàn bộ |V| đỉnh của G, không chứa chu trình (cycle), có đúng |V| - 1 cạnh và tổng trọng số các cạnh là nhỏ nhất. "
            "Thuật toán Kruskal sắp xếp tất cả các cạnh theo thứ tự tăng dần và thêm dần vào cây bằng cấu trúc Disjoint Set Union (DSU) để kiểm tra chu trình; "
            "Thuật toán Prim bắt đầu từ 1 đỉnh và mở rộng dần vết cắt (cut property) bằng Min-Heap."
        ),
        core_concepts=[
            "Cây (Tree) là đồ thị liên thông không chứa chu trình, luôn có đúng V - 1 cạnh",
            "Định lý Cắt (Cut Property): Cạnh có trọng số nhẹ nhất băng qua một vết cắt chia đôi đồ thị luôn thuộc MST",
            "Cấu trúc dữ liệu Disjoint Set Union (DSU / Union-Find) với kỹ thuật nén đường đi (Path Compression)",
            "Khác biệt căn bản: MST tối ưu tổng chi phí toàn mạng lưới; Shortest Path Tree tối ưu khoảng cách từ một điểm gốc"
        ],
        jargon_traps=[
            JargonTrap(
                term="Spanning (Bao trùm)",
                trap="Khó hiểu từ Hán Việt",
                feynman_translation="Phủ sóng toàn bộ: không bỏ sót bất kỳ ngôi làng nào bị cô lập ngoài đảo."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Lắp đặt đường ống dẫn nước cho các thôn bản",
                metaphor="Mục tiêu là nối toàn bộ 10 ngôi làng lại với nhau sao cho mọi nhà đều có nước dùng, nhưng dùng tổng số mét ống nước là ít tốn kém nhất.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["discrete-graph-fundamentals", "discrete-dsu"],
        sub_concepts=["discrete-steiner-tree"],
        practical_applications=["Thiết kế mạng lưới cáp quang viễn thông quốc gia", "Thiết kế mạch in vi điện tử VLSI tiết kiệm dây đồng dẫn", "Thuật toán phân cụm dữ liệu phân cấp (Single-linkage Clustering)"]
    ),

    TopicDefinition(
        id="discrete-propositional-logic-boolean",
        slug="propositional-logic-boolean-algebra",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Logic Mệnh Đề và Đại Số Boole",
        title_en="Propositional Logic & Boolean Algebra",
        wikipedia_slug="Propositional_calculus",
        difficulty="Beginner",
        ground_truth_vi=(
            "Logic mệnh đề là hệ thống hình thức khảo sát các mệnh đề mang giá trị chân lý nhị phân {Đúng, Sai} (hoặc {1, 0}). "
            "Các phép toán cơ bản gồm: Phủ định (NOT ¬), Tuyển (OR ∨), Hội (AND ∧), Kéo theo (IMPLIES →), và Tương đương (IFF ↔). "
            "Đại số Boole cung cấp hệ tiên đề đại số (giao hoán, kết hợp, phân phối, De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q) "
            "đóng vai trò là nền tảng toán học trực tiếp cho thiết kế cổng logic phần cứng máy tính và câu lệnh điều kiện trong lập trình."
        ),
        core_concepts=[
            "Bảng chân trị (Truth Table) biểu diễn đầy đủ 2^n trường hợp của n biến mệnh đề",
            "Quy tắc De Morgan: Phủ định của 'A VÀ B' là 'KHÔNG A HOẶC KHÔNG B'",
            "Mệnh đề kéo theo p → q chỉ sai khi và chỉ khi p Đúng mà q Sai",
            "Dạng chuẩn tắc hội (CNF) và dạng chuẩn tắc tuyển (DNF)",
            "Bài toán thỏa mãn mệnh đề Boolean (SAT / 3-SAT) - bài toán NP-Complete đầu tiên trong lịch sử"
        ],
        jargon_traps=[
            JargonTrap(
                term="Tautology (Hằng đúng)",
                trap="Nghĩ là một câu nói thừa thãi vô nghĩa trong văn học",
                feynman_translation="Một phát biểu luôn luôn đúng trong 100% mọi trường hợp, ví dụ: 'Ngày mai trời mưa hoặc trời không mưa'."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Mạch công tắc bóng đèn nối tiếp và song song",
                metaphor="Hai công tắc nối tiếp nhau là phép AND (cả 2 cùng bật thì đèn mới sáng). Hai công tắc mắc song song là phép OR (chỉ cần 1 trong 2 bật là đèn sáng).",
                target_audience="Học sinh cấp 2"
            )
        ],
        prerequisites=[],
        sub_concepts=["discrete-boolean-circuits", "discrete-sat-solvers"],
        practical_applications=["Thiết kế vi xử lý CPU (cổng AND, OR, XOR, bộ cộng ALU)", "Viết câu truy vấn lọc dữ liệu SQL WHERE", "Xác minh tính đúng đắn của phần mềm máy bay"]
    ),

    TopicDefinition(
        id="discrete-mathematical-induction-recurrence",
        slug="mathematical-induction-recurrence",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Quy Nạp Toán Học và Hệ Thức Truy Hồi",
        title_en="Mathematical Induction & Recurrence Relations",
        wikipedia_slug="Mathematical_induction",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Quy nạp toán học là phương pháp chứng minh mệnh đề P(n) đúng với mọi số tự nhiên n ≥ n_0. Quy trình gồm 2 bước: "
            "1) Cơ sở quy nạp: Chứng minh P(n_0) đúng; "
            "2) Bước quy nạp: Giả sử P(k) đúng (giả thiết quy nạp), chứng minh P(k+1) cũng đúng. "
            "Hệ thức truy hồi định nghĩa dãy số {a_n} thông qua một hoặc nhiều số hạng đứng trước (ví dụ dãy Fibonacci a_n = a_{n-1} + a_{n-2}). "
            "Định lý Thợ (Master Theorem) cung cấp công thức nghiệm giải độ phức tạp thuật toán chia để trị T(n) = a T(n/b) + f(n)."
        ),
        core_concepts=[
            "Cơ sở quy nạp (Base Case) là quân cờ domino đầu tiên phải bị đẩy đổ",
            "Bước quy nạp chứng minh quân cờ thứ k đổ chắc chắn sẽ húc đổ quân cờ thứ k+1",
            "Hệ thức truy hồi tuyến tính thuần nhất giải bằng phương trình đặc trưng",
            "Định lý Thợ (Master Theorem) dùng để phân tích độ phức tạp thuật toán Merge Sort, Binary Search"
        ],
        jargon_traps=[
            JargonTrap(
                term="Inductive Step (Bước quy nạp)",
                trap="Tự ý coi điều cần chứng minh là đã đúng luôn cho mọi n",
                feynman_translation="Chiếc cầu nối logic: chỉ chứng minh nấc thang thứ k có khả năng nâng đỡ bạn bước lên nấc thang thứ k+1."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hàng quân cờ Domino xếp dài vô tận",
                metaphor="Nếu bạn xô ngã quân đầu tiên, và bất kỳ quân cờ nào khi ngã cũng đè trúng quân tiếp theo, thì hàng triệu quân cờ phía sau chắc chắn đều sẽ ngã rạp.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["discrete-propositional-logic-boolean"],
        sub_concepts=["discrete-master-theorem", "discrete-dynamic-programming"],
        practical_applications=["Phân tích độ phức tạp thời gian thuật toán (Big-O)", "Chứng minh tính đúng đắn của hàm đệ quy (Recursive Functions)", "Giải bài toán tháp Hà Nội (Tower of Hanoi)"]
    ),

    TopicDefinition(
        id="discrete-equivalence-relations-partitions",
        slug="equivalence-relations-partitions",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Quan Hệ Tương Đương và Phân Hoạch Tập Hợp",
        title_en="Equivalence Relations & Partitions",
        wikipedia_slug="Equivalence_relation",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Quan hệ hai ngôi R trên tập hợp A được gọi là quan hệ tương đương nếu thỏa mãn đồng thời 3 tính chất: "
            "1) Phản xạ: a R a với mọi a ∈ A; "
            "2) Đối xứng: Nếu a R b thì b R a; "
            "3) Bắc cầu: Nếu a R b và b R c thì a R c. "
            "Định lý cơ bản về quan hệ tương đương khẳng định: Mọi quan hệ tương đương trên A đều tạo ra một phân hoạch (partition) duy nhất "
            "chia tập A thành các lớp tương đương rời nhau không rỗng, và ngược lại. Điển hình là quan hệ đồng dư modulo n: a ≡ b (mod n)."
        ),
        core_concepts=[
            "Tính chất phản xạ, đối xứng và bắc cầu định nghĩa sự 'bình đẳng theo một tiêu chí'",
            "Lớp tương đương [a] gom tất cả các phần tử có cùng tính chất với a",
            "Các lớp tương đương phủ kín tập hợp và không bao giờ chồng chéo giao nhau",
            "Số học Modulo: phép toán chia lấy dư tạo ra n lớp thặng dư"
        ],
        jargon_traps=[
            JargonTrap(
                term="Equivalence (Tương đương) vs Equality (Bằng nhau)",
                trap="Tưởng rằng hai phần tử tương đương nghĩa là chúng phải giống hệt nhau 100%",
                feynman_translation="Hai chiếc xe hơi khác màu, khác hãng nhưng có cùng biển số chẵn thì được xem là tương đương trong ngày cấm xe biển lẻ."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Phân loại học sinh theo khối lớp",
                metaphor="Toàn bộ 1.000 học sinh trong trường được chia dứt khoát vào các khối 10, 11, 12. Mỗi học sinh chỉ thuộc đúng 1 khối, không ai bị bỏ rơi và không ai vừa học lớp 10 vừa học lớp 12.",
                target_audience="Học sinh"
            )
        ],
        prerequisites=[],
        sub_concepts=["discrete-modular-arithmetic", "discrete-quotient-sets"],
        practical_applications=["Phân cụm dữ liệu người dùng (User Segmentation)", "Tối ưu hóa máy trạng thái hữu hạn (DFA State Minimization)", "Mã hóa khóa công khai RSA"]
    ),

    TopicDefinition(
        id="discrete-pigeonhole-principle",
        slug="pigeonhole-principle",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Nguyên Lý Dirichlet (Nguyên Lý Chuồng Bồ Câu)",
        title_en="Pigeonhole Principle",
        wikipedia_slug="Pigeonhole_principle",
        difficulty="Beginner",
        ground_truth_vi=(
            "Nguyên lý Dirichlet phát biểu: Nếu k + 1 hoặc nhiều hơn đồ vật được đặt vào k hộp, "
            "thì chắc chắn có ít nhất một hộp chứa từ hai đồ vật trở lên. "
            "Dạng tổng quát: Nếu N đồ vật được đặt vào k hộp, thì tồn tại ít nhất một hộp chứa ⌈N / k⌉ đồ vật. "
            "Mặc dù có phát biểu cực kỳ đơn giản, nguyên lý này là công cụ toán học tối thượng để chứng minh sự tồn tại "
            "của các cấu trúc trùng lặp, chu kỳ, hoặc sự xung đột băm mà không cần phải chỉ rõ phần tử cụ thể."
        ),
        core_concepts=[
            "Chứng minh sự tồn tại (Existence Proof) thuần túy mà không cần thuật toán kiến tạo",
            "Ứng dụng phân tích xung đột trong cấu trúc dữ liệu bảng băm (Hash Collisions)",
            "Chứng minh giới hạn nén không mất dữ liệu: Không có thuật toán nào nén được mọi tệp tin mà không làm phình to ít nhất một tệp khác",
            "Kỹ thuật chọn khéo léo 'đồ vật' và 'chuồng' trong các bài toán tổ hợp khó"
        ],
        jargon_traps=[
            JargonTrap(
                term="Non-constructive proof (Chứng minh phi kiến tạo)",
                trap="Khó chịu vì chứng minh được vật đó tồn tại nhưng không chỉ ra được nó nằm ở đâu",
                feynman_translation="Bạn biết chắc chắn trong tủ có ít nhất một đôi tất cùng màu, dù chưa hề mở mắt lục tủ."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="13 người trong một căn phòng",
                metaphor="Một năm chỉ có 12 tháng. Nếu gom 13 người vào phòng, chắc chắn 100% sẽ có ít nhất 2 người sinh cùng một tháng, không thể nào khác được.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=[],
        sub_concepts=["discrete-ramsey-theory"],
        practical_applications=["Chứng minh bảng băm (Hash Table) bắt buộc phải xử lý đụng độ", "Chứng minh giới hạn nén dữ liệu lossless", "Thuật toán phát hiện vòng lặp vô tận Floyd's Cycle"]
    ),

    TopicDefinition(
        id="discrete-euler-hamilton-cycles",
        slug="euler-hamilton-cycles",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Chu Trình Euler và Chu Trình Hamilton",
        title_en="Eulerian & Hamiltonian Paths and Cycles",
        wikipedia_slug="Eulerian_path",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Đường đi Euler là đường đi trong đồ thị đi qua mỗi CẠNH đúng một lần. Đồ thị liên thông có chu trình Euler khi và chỉ khi "
            "mọi đỉnh đều có bậc chẵn (Định lý Euler giải bài toán 7 cây cầu Königsberg năm 1736, khai sinh lý thuyết đồ thị). "
            "Ngược lại, Chu trình Hamilton là chu trình đi qua mỗi ĐỈNH đúng một lần. "
            "Trong khi kiểm tra đồ thị Euler giải được trong thời gian tuyến tính O(V + E), bài toán kiểm tra chu trình Hamilton và bài toán Người du lịch (TSP) "
            "là bài toán NP-đầy đủ (NP-Complete), chưa có thuật toán đa thức nào giải được."
        ),
        core_concepts=[
            "Euler tập trung vào CẠNH (mọi đỉnh phải có bậc chẵn để vào được thì ra được)",
            "Hamilton tập trung vào ĐỈNH (bài toán du lịch ghé thăm mọi thành phố đúng 1 lần)",
            "Độ tương phản độ phức tạp tính toán: Euler thuộc lớp P, Hamilton thuộc lớp NP-Complete",
            "Định lý Dirac và Định lý Ore về điều kiện đủ cho chu trình Hamilton"
        ],
        jargon_traps=[
            JargonTrap(
                term="Bậc của đỉnh (Degree of Vertex)",
                trap="Tưởng là số đo góc nhọn hay góc tù hình học",
                feynman_translation="Số lượng con đường nối trực tiếp đâm thẳng vào ngã tư đó."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Vẽ hình một nét không nhấc bút",
                metaphor="Đường đi Euler giống trò đố vui thời thơ ấu: vẽ một ngôi nhà bằng một nét bút duy nhất sao cho không đè lên nét vẽ cũ nào.",
                target_audience="Học sinh cấp 1"
            )
        ],
        prerequisites=["discrete-graph-fundamentals"],
        sub_concepts=["discrete-traveling-salesman", "discrete-np-completeness"],
        practical_applications=["Tối ưu hóa đường đi của xe dọn rác và xe quét tuyết (Chinese Postman Problem)", "Ghép mảnh chuỗi DNA giải trình tự gen sinh học (De Bruijn Graphs)", "Lập trình đường đi cho máy khoan lỗ bảng mạch điện tử CNC"]
    ),

    TopicDefinition(
        id="discrete-bfs-dfs-graph-traversal",
        slug="bfs-dfs-graph-traversal",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Duyệt Đồ Thị: BFS và DFS",
        title_en="Breadth-First Search & Depth-First Search",
        wikipedia_slug="Breadth-first_search",
        difficulty="Beginner",
        ground_truth_vi=(
            "BFS (Tìm kiếm theo chiều rộng) và DFS (Tìm kiếm theo chiều sâu) là hai chiến lược nền tảng để duyệt qua mọi đỉnh của đồ thị: "
            "BFS sử dụng cấu trúc hàng đợi (Queue - FIFO) để thăm các đỉnh theo từng lớp khoảng cách tăng dần từ gốc, đảm bảo tìm ra đường đi ngắn nhất "
            "trên đồ thị không trọng số; "
            "DFS sử dụng ngăn xếp (Stack - LIFO hoặc đệ quy) để đi sâu nhất có thể theo một nhánh trước khi quay lui (Backtracking). "
            "Cả hai thuật toán đều có độ phức tạp thời gian O(V + E)."
        ),
        core_concepts=[
            "BFS dùng Hàng đợi (Queue) -> Lan tỏa hình gợn sóng đồng tâm",
            "DFS dùng Ngăn xếp (Stack/Recursion) -> Thăm dò tận đáy ngõ cụt rồi mới lùi bước",
            "DFS phát hiện chu trình đồ thị và sắp xếp topo (Topological Sort) cho đồ thị DAG",
            "BFS tìm đường đi ngắn nhất trên đồ thị có trọng số các cạnh bằng nhau"
        ],
        jargon_traps=[
            JargonTrap(
                term="Backtracking (Quay lui)",
                trap="Tưởng là chương trình bị lỗi phải chạy lùi lại",
                feynman_translation="Khi đi lạc vào ngõ cụt trong mê cung, bạn lần theo sợi chỉ quay ngược ra ngã ba gần nhất để thử rẽ sang ngách khác."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Khám phá mê cung ngầm",
                metaphor="DFS giống như một người thám hiểm liều lĩnh cứ cắm đầu đi thẳng một đường hầm cho đến khi đụng tường đá mới chịu quay lại. BFS giống như đội quân chia nhau tỏa đều ra mọi ngã rẽ xung quanh cùng lúc.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["discrete-graph-fundamentals"],
        sub_concepts=["discrete-topological-sort", "discrete-connected-components"],
        practical_applications=["Thuật toán Web Crawler của Google cào dữ liệu Internet", "Tìm kiếm bạn bè gợi ý trên mạng xã hội Facebook (khoảng cách 6 bậc)", "Giải các câu đố Sudoku, Rubik và trò chơi cờ vua"]
    ),

    TopicDefinition(
        id="discrete-graph-coloring-four-color",
        slug="graph-coloring-four-color-theorem",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Tô Màu Đồ Thị và Định Lý Bốn Màu",
        title_en="Graph Coloring & Four Color Theorem",
        wikipedia_slug="Graph_coloring",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Tô màu đồ thị (Graph Coloring) là việc gán các nhãn màu cho các đỉnh sao cho không có hai đỉnh kề nhau có cùng màu. "
            "Sắc số χ(G) là số lượng màu tối thiểu cần thiết để tô đồ thị G. "
            "Định lý Bốn Màu (Appel & Haken 1976) chứng minh rằng mọi đồ thị phẳng (planar graph - bản đồ không có đường biên cắt nhau) "
            "đều có thể tô được bằng không quá 4 màu. Đây là định lý lớn đầu tiên trong lịch sử toán học được chứng minh bằng máy tính "
            "thông qua việc kiểm tra vét cạn 1.936 cấu hình đồ thị."
        ),
        core_concepts=[
            "Hai đỉnh nối với nhau bằng một cạnh thì bắt buộc phải mang hai màu khác nhau",
            "Sắc số χ(G) đo lường độ phức tạp liên kết của đồ thị",
            "Bài toán tô màu đồ thị tổng quát là NP-đầy đủ (NP-Complete)",
            "Chuyển đổi bài toán xung đột tài nguyên thành bài toán tô màu đồ thị"
        ],
        jargon_traps=[
            JargonTrap(
                term="Chromatic Number (Sắc số)",
                trap="Nghĩ là cường độ hay sắc thái màu sắc quang học",
                feynman_translation="Số lượng màu ít nhất bạn cần mua ở tiệm văn phòng phẩm để hoàn thành bức vẽ mà không bị phạm quy."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Xếp lịch thi học kỳ cho sinh viên",
                metaphor="Mỗi môn thi là một đỉnh. Nếu có sinh viên đăng ký cả 2 môn thì nối một cạnh giữa chúng. Hai môn nối nhau không được xếp thi cùng một ca giờ (cùng màu). Số màu ít nhất chính là số ca thi tối thiểu nhà trường cần tổ chức.",
                target_audience="Sinh viên đại học"
            )
        ],
        prerequisites=["discrete-graph-fundamentals"],
        sub_concepts=["discrete-planar-graphs"],
        practical_applications=["Phân bổ thanh ghi CPU trong trình biên dịch (Register Allocation in Compilers)", "Phân bổ tần số sóng phát cho các trạm BTS điện thoại di động", "Xếp lịch bay và cửa ra máy bay tại các sân bay quốc tế"]
    ),

    TopicDefinition(
        id="discrete-combinatorics-binomial",
        slug="combinatorics-binomial-theorem",
        domain_id="discrete",
        domain_name="Toán Rời Rạc & Đồ Thị",
        title_vi="Tổ Hợp, Chỉnh Hợp và Nhị Thức Newton",
        title_en="Combinatorics & Binomial Theorem",
        wikipedia_slug="Binomial_theorem",
        difficulty="Beginner",
        ground_truth_vi=(
            "Tổ hợp C(n, k) = n! / (k!(n-k)!) là số cách chọn k phần tử từ tập n phần tử mà không quan tâm đến thứ tự. "
            "Chỉnh hợp P(n, k) = n! / (n-k)! tính số cách chọn có phân biệt thứ tự. "
            "Định lý Nhị thức Newton khai triển lũy thừa của một nhị thức: (x + y)^n = ∑_{k=0}^n C(n, k) x^{n-k} y^k. "
            "Các hệ số nhị thức tạo thành tam giác Pascal đối xứng với hệ thức Pascal: C(n, k) = C(n-1, k-1) + C(n-1, k)."
        ),
        core_concepts=[
            "Chỉnh hợp quan tâm thứ tự (Ai giải Nhất, ai giải Nhì); Tổ hợp không quan tâm thứ tự (Ai vào ban đại diện)",
            "Quy tắc cộng (các trường hợp rời nhau) và quy tắc nhân (các công đoạn liên tiếp)",
            "Đẳng thức Pascal và mối liên hệ với thuật toán quy hoạch động",
            "Ứng dụng tính xác suất trong không gian mẫu hữu hạn"
        ],
        jargon_traps=[
            JargonTrap(
                term="Combination vs Permutation",
                trap="Hay nhầm lẫn khóa số vali gọi là 'combination lock' nhưng thực chất nó là permutation vì thứ tự số rất quan trọng",
                feynman_translation="Tổ hợp là dĩa salad trộn (bỏ cà chua trước hay sau vẫn là dĩa đó); Chỉnh hợp là mật mã thẻ ATM (bấm lộn thứ tự là khóa thẻ)."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Chọn kem ốc quế 3 viên",
                metaphor="Nếu tiệm kem có 10 vị, chọn 3 vị để trộn vào một cốc là tổ hợp. Nếu xếp chồng 3 viên lên que kem và vị nào ở trên cùng sẽ cắn trước thì đó là chỉnh hợp.",
                target_audience="Trẻ em"
            )
        ],
        prerequisites=[],
        sub_concepts=["discrete-generating-functions"],
        practical_applications=["Tính toán độ mạnh của mật khẩu chống brute-force", "Mô phỏng xác suất trúng vé số Vietlott", "Phân tích số lượng trạng thái trong các thuật toán tìm kiếm"]
    ),

    # =========================================================================
    # 3. THỊ GIÁC MÁY TÍNH (COMPUTER VISION) (10 Topics)
    # =========================================================================
    TopicDefinition(
        id="cv-convolution-cnn",
        slug="convolutional-neural-networks",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Phép Tích Chập 2D & Mạng Nơ-ron CNN",
        title_en="Convolutional Neural Networks & 2D Convolution",
        wikipedia_slug="Convolutional_neural_network",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Phép tích chập 2D trên ảnh số là phép toán trượt một ma trận trọng số nhỏ (Kernel/Filter kích thước k x k) "
            "qua toàn bộ ma trận điểm ảnh đầu vào I, thực hiện nhân từng phần tử tương ứng rồi cộng lại: "
            "(I * K)(x, y) = ∑_i ∑_j I(x - i, y - j) K(i, j). "
            "Trong mạng CNN, các giá trị kernel không được định nghĩa thủ công mà được tự động học qua Backpropagation. "
            "Đặc tính then chốt của CNN là chia sẻ trọng số (Weight Sharing) và tính bất biến tịnh tiến (Translation Equivariance)."
        ),
        core_concepts=[
            "Kernel/Filter hoạt động như các bộ lọc trích xuất đặc trưng (Feature Detectors) từ cạnh, góc đến kết cấu",
            "Stride (Bước nhảy) và Padding (Chèn viền 0) kiểm soát kích thước bản đồ đặc trưng (Feature Map)",
            "Tính chia sẻ trọng số giúp giảm hàng triệu tham số so với mạng Fully Connected truyền thống",
            "Lớp Pooling (Max Pooling / Average Pooling) giúp giảm kích thước và tạo tính bất biến tịnh tiến",
            "Trường tiếp nhận (Receptive Field): Vùng ảnh đầu vào mà một nơ-ron ở tầng sâu có thể 'nhìn thấy'"
        ],
        jargon_traps=[
            JargonTrap(
                term="Kernel (Bộ lọc tích chập)",
                trap="Nhầm lẫn với nhân hệ điều hành Kernel của Linux/Windows",
                feynman_translation="Một chiếc kính lúp nhỏ 3x3 có in sẵn hoa văn mờ, rê khắp bức tranh để tìm xem chỗ nào có nét vẽ trùng khớp với hoa văn đó."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Soi kính lúp tìm dấu vết trên bản đồ",
                metaphor="Bạn cầm chiếc kính lúp nhỏ lướt từ trái sang phải, từ trên xuống dưới bức tranh. Kính lúp chỉ sáng lên khi nó phát hiện một mép viền hoặc một góc nhọn.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-linear-transformations", "math-gradient-descent"],
        sub_concepts=["cv-pooling-layers", "cv-feature-maps"],
        practical_applications=["Nhận diện khuôn mặt FaceID trên điện thoại", "Xe tự lái phát hiện làn đường và biển báo giao thông", "Chẩn đoán khối u ác tính từ phim chụp X-quang/CT"]
    ),

    TopicDefinition(
        id="cv-edge-detection-canny-sobel",
        slug="edge-detection-canny-sobel",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Phát Hiện Biên Cạnh: Toán Tử Sobel & Thuật Toán Canny",
        title_en="Edge Detection: Sobel Operator & Canny Algorithm",
        wikipedia_slug="Canny_edge_detector",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Biên cạnh (Edge) là những vị trí trong ảnh có sự thay đổi đột ngột về cường độ sáng. "
            "Toán tử Sobel tính xấp xỉ đạo hàm bậc nhất của ảnh bằng hai kernel 3x3 (G_x phát hiện cạnh dọc, G_y phát hiện cạnh ngang): "
            "Độ lớn gradient G = √(G_x^2 + G_y^2), hướng gradient θ = arctan(G_y / G_x). "
            "Thuật toán Canny (1986) hoàn thiện quy trình phát hiện biên cạnh tối ưu qua 5 bước: "
            "1) Làm mịn ảnh bằng Gaussian Filter; 2) Tính Gradient Sobel; 3) Triệt tiêu không cực đại (Non-Maximum Suppression - NMS) để làm mỏng biên về 1 pixel; "
            "4) Phân ngưỡng kép (Double Thresholding); 5) Nối biên bằng phân tích liên thông (Hysteresis Tracking)."
        ),
        core_concepts=[
            "Đạo hàm bậc nhất tạo cực trị tại vị trí biên cạnh",
            "Lọc nhiễu Gaussian là bắt buộc vì đạo hàm cực kỳ nhạy cảm với nhiễu hạt",
            "Non-Maximum Suppression (NMS) ép các đường biên dày thành nét mảnh đúng 1 pixel sắc lẹm",
            "Ngưỡng kép (High/Low Threshold) giúp giữ lại các cạnh yếu nếu chúng nối liền với cạnh mạnh"
        ],
        jargon_traps=[
            JargonTrap(
                term="Non-Maximum Suppression (Triệt tiêu không cực đại)",
                trap="Từ ngữ phức tạp làm khó hiểu",
                feynman_translation="Nếu bạn đứng trên sống lưng ngọn núi, bạn chỉ giữ lại điểm cao nhất của sống núi và gọt bỏ toàn bộ sườn dốc thoai thoải hai bên."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Họa sĩ vẽ tranh phác thảo bằng bút chì",
                metaphor="Họa sĩ nheo mắt nhìn bức tranh để loại bỏ các chi tiết nhiễu hạt vụn vặt, sau đó dùng đầu ngòi bút chì sắc nét vẽ viền theo ranh giới giữa vùng sáng và vùng tối.",
                target_audience="Người yêu nghệ thuật"
            )
        ],
        prerequisites=["math-partial-derivatives", "cv-convolution-cnn"],
        sub_concepts=["cv-laplacian-of-gaussian"],
        practical_applications=["Máy quét tài liệu scan hóa đơn CamScanner", "Hệ thống cánh tay robot công nghiệp gắp linh kiện cơ khí", "Tách phông nền ảnh chân dung"]
    ),

    TopicDefinition(
        id="cv-color-spaces-morphology",
        slug="color-spaces-morphology",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Không Gian Màu & Biến Đổi Hình Thái Học",
        title_en="Color Spaces & Mathematical Morphology",
        wikipedia_slug="Color_space",
        difficulty="Beginner",
        ground_truth_vi=(
            "Không gian màu là mô hình toán học biểu diễn màu sắc dưới dạng bộ tọa độ số: "
            "RGB phù hợp cho màn hình phát sáng nhưng các kênh bị phụ thuộc mạnh vào cường độ chiếu sáng; "
            "HSV (Hue - Sắc thái, Saturation - Độ bão hòa, Value - Độ sáng) tách biệt hoàn toàn thông tin màu sắc khỏi ánh sáng môi trường, "
            "rất lý tưởng cho việc lọc màu theo ngưỡng (Color Thresholding). "
            "Biến đổi hình thái học (Morphology) trên ảnh nhị phân gồm hai phép toán nền tảng dựa trên phần tử cấu trúc (Structuring Element): "
            "1) Giãn nở (Dilation - phóng to vùng trắng, lấp lỗ hổng); "
            "2) Xói mòn (Erosion - bào mòn đường viền, xóa nhiễu li ti); kết hợp thành Opening (Erosion rồi Dilation) và Closing."
        ),
        core_concepts=[
            "Kênh H (Hue) trong HSV đo góc màu từ 0 đến 360 độ (Đỏ, Vàng, Lục, Lam), không đổi khi ánh sáng chập chờn",
            "Chuyển đổi ảnh màu sang Grayscale bằng công thức trọng số sinh lý mắt người: Y = 0.299R + 0.587G + 0.114B",
            "Phép Opening loại bỏ các chấm nhiễu trắng nhỏ mà không làm thay đổi hình dạng vật thể",
            "Phép Closing hàn gắn các vết nứt và lấp các lỗ đen nhỏ bên trong vật thể"
        ],
        jargon_traps=[
            JargonTrap(
                term="Structuring Element (Phần tử cấu trúc)",
                trap="Tưởng là một linh kiện phần cứng",
                feynman_translation="Chiếc cọ vẽ hình tròn hoặc hình vuông nhỏ dùng để dặm hoặc cạo mép ảnh nhị phân."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Lăn sơn và chà nhám bề mặt gỗ",
                metaphor="Dilation giống như quét thêm một lớp sơn dày làm phồng mọi khe rãnh; Erosion giống như dùng giấy nhám chà mòn các gờ thừa li ti trên thanh gỗ.",
                target_audience="Thợ thủ công"
            )
        ],
        prerequisites=[],
        sub_concepts=["cv-thresholding-otsu"],
        practical_applications=["Nhận diện quả bóng tennis màu vàng trên sân đấu camera", "Đọc biển số xe máy tự động qua bãi giữ xe thông minh", "Tách tế bào máu trong kính hiển vi sinh học"]
    ),

    TopicDefinition(
        id="cv-yolo-object-detection",
        slug="yolo-real-time-object-detection",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Nhận Diện Vật Thể Thời Gian Thực YOLO",
        title_en="YOLO: You Only Look Once Object Detection",
        wikipedia_slug="Object_detection",
        difficulty="Advanced",
        ground_truth_vi=(
            "YOLO (Redmon et al., 2016) tái định nghĩa bài toán nhận diện vật thể từ phân loại nhiều giai đoạn (Two-stage như R-CNN) "
            "thành bài toán hồi quy đơn nhất (Single-stage regression) từ toàn bộ điểm ảnh đầu vào sang tọa độ Bounding Box và xác suất lớp đối tượng. "
            "Mô hình chia bức ảnh thành lưới S x S ô. Mỗi ô chịu trách nhiệm dự đoán B hộp bao quanh (x, y, w, h), độ tin cậy Confidence = Pr(Object) * IoU, "
            "và phân phối xác suất lớp C. Thuật toán chạy qua toàn bộ ảnh đúng 1 lần (You Only Look Once), "
            "đạt tốc độ xử lý thời gian thực từ 45 đến 150+ FPS trên GPU."
        ),
        core_concepts=[
            "Chuyển đổi bài toán trượt cửa sổ (Sliding Window) chậm chạp thành dự đoán mạng nơ-ron một lượt duy nhất",
            "Chỉ số IoU (Intersection over Union) đo lường độ trùng khớp diện tích giữa hộp dự đoán và hộp Ground Truth",
            "Thuật toán Non-Maximum Suppression (NMS) lọc bỏ hàng chục hộp bao quanh bị trùng lặp trên cùng một vật thể",
            "Cơ chế Anchor Boxes cung cấp các khuôn mẫu tỉ lệ chiều rộng/cao phổ biến của các đối tượng",
            "Hàm mất mát đa thành phần (Multi-part Loss): kết hợp lỗi tọa độ hộp bao, lỗi độ tin cậy và lỗi phân loại lớp"
        ],
        jargon_traps=[
            JargonTrap(
                term="IoU (Intersection over Union)",
                trap="Nhớ công thức nhưng không hình dung được ý nghĩa",
                feynman_translation="Phần diện tích hai chiếc hộp đè lên nhau chia cho tổng diện tích mà cả hai chiếc hộp cùng chiếm chỗ."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Cái liếc mắt của trọng tài bóng đá",
                metaphor="Thay vì soi kính lúp quét từng centimet vuông sân cỏ, trọng tài chỉ cần liếc mắt một lượt toàn cảnh là lập tức chỉ ra vị trí chính xác của quả bóng và 22 cầu thủ cùng lúc.",
                target_audience="Người xem thể thao"
            )
        ],
        prerequisites=["cv-convolution-cnn", "math-gradient-descent"],
        sub_concepts=["cv-anchor-boxes", "cv-nms-filtering"],
        practical_applications=["Camera giao thông phạt nguội vượt đèn đỏ", "Hệ thống giám sát an ninh chống trộm ban đêm", "Drone tự hành theo dõi động vật hoang dã"]
    ),

    TopicDefinition(
        id="cv-sift-harris-corner",
        slug="sift-harris-corner-features",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Trích Xuất Đặc Trưng SIFT và Điểm Góc Harris",
        title_en="Feature Extraction: SIFT & Harris Corner Detector",
        wikipedia_slug="Scale-invariant_feature_transform",
        difficulty="Advanced",
        ground_truth_vi=(
            "Điểm góc (Corner) là điểm ảnh mà khi di chuyển một cửa sổ quan sát nhỏ theo bất kỳ hướng nào thì cường độ sáng cũng thay đổi rõ rệt. "
            "Toán tử Harris Corner (1988) sử dụng ma trận tự tương quan M (Structure Tensor) dựa trên gradient ảnh để tìm các điểm có cả hai trị riêng của M đều lớn. "
            "Thuật toán SIFT (Lowe, 1999) nâng cấp đặc trưng đạt tính bất biến với cả tỷ lệ phóng to/thu nhỏ (Scale Invariance) và góc xoay (Rotation Invariance) "
            "thông qua không gian tỷ lệ Difference of Gaussians (DoG), gán hướng chủ đạo và tạo vector mô tả đặc trưng 128 chiều."
        ),
        core_concepts=[
            "Điểm phẳng (Flat): Không đổi sáng ở mọi hướng; Đường biên (Edge): Chỉ đổi sáng vuông góc với biên; Điểm góc (Corner): Đổi sáng ở mọi hướng",
            "Không gian tỷ lệ (Scale Space) mô phỏng việc nhìn vật thể từ xa lại gần",
            "Vector mô tả đặc trưng (Feature Descriptor 128 chiều) ghi lại phân bố gradient xung quanh điểm đặc trưng",
            "Ghép cặp đặc trưng (Feature Matching) và thuật toán RANSAC loại bỏ các điểm ghép sai"
        ],
        jargon_traps=[
            JargonTrap(
                term="Scale Invariant (Bất biến tỷ lệ)",
                trap="Từ ngữ kỹ thuật khó hiểu",
                feynman_translation="Dù bạn chụp bức ảnh ở cự ly 1 mét hay 100 mét thì thuật toán vẫn nhận ra đó là cùng một góc tháp chuông."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Dấu vân tay của các góc công trình",
                metaphor="Mỗi góc ngọn tháp hay góc cửa sổ có một 'dấu vân tay' toán học độc nhất. Dù bức ảnh chụp nghiêng hay bị chụp từ xa, ta vẫn so dấu vân tay để ghép nối hai bức ảnh lại với nhau.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["math-eigenvalues-eigenvectors", "cv-edge-detection-canny-sobel"],
        sub_concepts=["cv-ransac", "cv-image-stitching"],
        practical_applications=["Ghép ảnh Panorama toàn cảnh trên điện thoại", "Dựng mô hình 3D từ hàng trăm bức ảnh 2D (Photogrammetry)", "Định vị robot hút bụi trong nhà bằng camera Visual SLAM"]
    ),

    TopicDefinition(
        id="cv-hough-transform",
        slug="hough-transform",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Phép Biến Đổi Hough (Hough Transform)",
        title_en="Hough Transform for Lines and Circles",
        wikipedia_slug="Hough_transform",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Phép biến đổi Hough là kỹ thuật trích xuất đặc trưng dùng để phát hiện các hình dạng hình học biểu diễn được dưới dạng tham số "
            "(đường thẳng, đường tròn, elip) ngay cả khi hình ảnh bị đứt đoạn hoặc có nhiều nhiễu hạt. "
            "Thay vì dùng phương trình y = mx + c (gặp lỗi vô cực khi đường thẳng thẳng đứng), đường thẳng được biểu diễn trong không gian tham số cực Hesse: "
            "ρ = x cos θ + y sin θ. Mỗi điểm ảnh biên cạnh trong không gian ảnh (x, y) sẽ tạo thành một đường cong hình sin trong không gian Hough (ρ, θ). "
            "Giao điểm của nhiều đường cong hình sin tích lũy số phiếu bầu (accumulator array) cao nhất chính là đường thẳng đi qua các điểm đó."
        ),
        core_concepts=[
            "Chuyển đổi bài toán nhận diện toàn cục thành cơ chế bỏ phiếu tích lũy (Voting Scheme)",
            "Một điểm trong không gian ảnh biến thành một đường cong trong không gian tham số Hough",
            "Giao điểm của các đường cong trong không gian Hough chỉ ra tham số đường thẳng chung",
            "Khả năng chống nhiễu cực cao: vẫn phát hiện được đường thẳng dù các nét vẽ bị đứt khúc gãy đoạn"
        ],
        jargon_traps=[
            JargonTrap(
                term="Accumulator Array (Mảng tích lũy)",
                trap="Khó hình dung cấu trúc dữ liệu",
                feynman_translation="Một thùng phiếu có chia sẵn các ô. Mỗi điểm ảnh bỏ một lá phiếu vào ô tham số mà nó nghi ngờ là đường thẳng đi qua nó."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hội chứng 'Ba người cùng nhìn thấy một ngôi sao'",
                metaphor="Nhiều người đứng ở các góc khác nhau cùng chỉ tay về một hướng. Nơi mà các tia chỉ tay cắt nhau nhiều nhất chắc chắn là vị trí của mục tiêu cần tìm.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cv-edge-detection-canny-sobel"],
        sub_concepts=["cv-generalized-hough"],
        practical_applications=["Hệ thống cảnh báo chệch làn đường Lane Departure Warning của ô tô", "Đếm số lượng tế bào hình tròn trong mẫu xét nghiệm máu", "Phát hiện vết nứt trên đường băng sân bay"]
    ),

    TopicDefinition(
        id="cv-resnet-skip-connections",
        slug="resnet-deep-residual-learning",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Kiến Trúc ResNet & Đường Nối Tắt Skip Connection",
        title_en="ResNet: Deep Residual Learning & Skip Connections",
        wikipedia_slug="Residual_neural_network",
        difficulty="Advanced",
        ground_truth_vi=(
            "Khi mạng nơ-ron tích chập ngày càng sâu (hàng chục đến hàng trăm tầng), việc huấn luyện bị suy thoái (Degradation Problem) "
            "do triệt tiêu gradient (Vanishing Gradient). ResNet (He et al., Microsoft Research 2015) giải quyết triệt để vấn đề này "
            "bằng khối phần dư (Residual Block) tích hợp kết nối tắt (Skip / Shortcut Connection): y = F(x, {W_i}) + x. "
            "Thay vì ép các lớp nơ-ron học trực tiếp ánh xạ mục tiêu H(x), mạng chỉ cần học phần dư sai số F(x) = H(x) - x. "
            "Nếu việc học thêm tầng là dư thừa, mạng chỉ cần đặt F(x) = 0 để bảo toàn ánh xạ đồng nhất (Identity Mapping)."
        ),
        core_concepts=[
            "Hiện tượng suy thoái mạng sâu: Thêm tầng làm tăng lỗi huấn luyện chứ không phải do Overfitting",
            "Kết nối tắt đồng nhất (Identity Shortcut) cho phép gradient truyền ngược thẳng về các tầng đầu mà không bị suy giảm theo cấp số nhân",
            "Cơ chế Residual giúp huấn luyện thành công các mạng nơ-ron sâu kỷ lục (ResNet-50, ResNet-101, ResNet-152 tầng)",
            "ResNet đã chiến thắng tuyệt đối cả 5 hạng mục thi đấu ImageNet và COCO năm 2015"
        ],
        jargon_traps=[
            JargonTrap(
                term="Vanishing Gradient (Triệt tiêu độ dốc)",
                trap="Nghĩ là máy tính bị mất dữ liệu",
                feynman_translation="Lời thì thầm truyền qua 100 người: đến người thứ 100 thì tiếng nói đã nhỏ đến mức như con muỗi kêu và không ai còn nghe thấy gì để sửa sai nữa."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Lối đi cao tốc vượt qua các chốt đèn đỏ",
                metaphor="Thay vì bắt chiếc xe cứu thương phải dừng qua 50 ngã tư đèn đỏ trong phố, ta xây một cây cầu cạn vượt thẳng từ điểm xuất phát tới đích.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cv-convolution-cnn", "math-gradient-descent"],
        sub_concepts=["cv-bottleneck-blocks", "cv-densenet"],
        practical_applications=["Trụ cột backbone cho mọi hệ thống Computer Vision hiện đại (YOLOv8, Mask R-CNN)", "Nhận diện khuôn mặt với độ chính xác 99.8%", "Phân tích ảnh chụp vệ tinh địa lý"]
    ),

    TopicDefinition(
        id="cv-unet-semantic-segmentation",
        slug="unet-semantic-segmentation",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Phân Vùng Ảnh U-Net & Kiến Trúc Encoder-Decoder",
        title_en="U-Net: Semantic Segmentation & Encoder-Decoder",
        wikipedia_slug="U-Net",
        difficulty="Advanced",
        ground_truth_vi=(
            "Phân vùng ảnh ngữ nghĩa (Semantic Segmentation) là bài toán gán nhãn phân loại cho từng điểm ảnh đơn lẻ (Pixel-level classification). "
            "U-Net (Ronneberger et al., 2015) sở hữu kiến trúc hình chữ U đối xứng gồm hai nhánh: "
            "1) Nhánh co (Encoder / Contracting path): Sử dụng các lớp tích chập và pooling liên tiếp để bắt ngữ cảnh trừu tượng (Context); "
            "2) Nhánh giãn (Decoder / Expansive path): Sử dụng chuyển vị tích chập (Transposed Convolution / Upsampling) để khôi phục độ phân giải không gian. "
            "Điểm đột phá là các đường nối tắt (Skip Connections) sao chép trực tiếp bản đồ đặc trưng độ phân giải cao từ Encoder sang Decoder để giữ trọn vẹn chi tiết mép viền."
        ),
        core_concepts=[
            "Phân loại từng pixel thay vì chỉ vẽ một hộp chữ nhật bao quanh vật thể",
            "Encoder trả lời câu hỏi 'Cái gì xuất hiện trong ảnh?' (ngữ cảnh ngữ nghĩa cao cấp)",
            "Decoder trả lời câu hỏi 'Vật thể đó nằm chính xác ở vị trí tọa độ nào?' (chi tiết không gian chính xác)",
            "Skip Connections khắc phục tình trạng mất mát thông tin tọa độ do các phép Max-pooling gây ra",
            "Hàm mất mát Dice Loss / Focal Loss giải quyết mất cân bằng lớp điểm ảnh nền và vật thể"
        ],
        jargon_traps=[
            JargonTrap(
                term="Upsampling / Transposed Convolution",
                trap="Tưởng là phóng to ảnh thông thường như Photoshop",
                feynman_translation="Một phép toán nơ-ron học cách 'vẽ lại chi tiết' từ một bản tóm tắt thu nhỏ."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Tô màu sách tranh phác thảo",
                metaphor="Encoder nhìn bức tranh để hiểu đây là con mèo. Decoder cầm cọ tô màu chuẩn từng sợi lông mèo mà không để màu bị lem ra ngoài viền nền cỏ.",
                target_audience="Học sinh"
            )
        ],
        prerequisites=["cv-convolution-cnn", "cv-resnet-skip-connections"],
        sub_concepts=["cv-dice-loss", "cv-transposed-convolution"],
        practical_applications=["Phân đoạn khối u não và ranh giới tim phổi trong ảnh y tế MRI", "Xóa phông nền chân dung trực tiếp trong cuộc gọi Google Meet / Zoom", "Xác định vùng ngập lụt từ ảnh radar vệ tinh"]
    ),

    TopicDefinition(
        id="cv-optical-flow-lucas-kanade",
        slug="optical-flow-lucas-kanade",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Dòng Quang Học Lucas-Kanade (Optical Flow)",
        title_en="Optical Flow & Lucas-Kanade Algorithm",
        wikipedia_slug="Optical_flow",
        difficulty="Advanced",
        ground_truth_vi=(
            "Dòng quang học (Optical Flow) là hình ảnh biểu diễn chuyển động biểu kiến của các điểm ảnh giữa hai khung hình liên tiếp trong video "
            "do sự chuyển dịch của vật thể hoặc camera. Giả định bảo toàn độ sáng (Brightness Constancy): I(x, y, t) = I(x + dx, y + dy, t + dt). "
            "Khai triển Taylor dẫn tới phương trình cơ bản: I_x * u + I_y * v + I_t = 0 (1 phương trình với 2 ẩn u = dx/dt, v = dy/dt - Vấn đề Aperture). "
            "Thuật toán Lucas-Kanade (1981) giải quyết bằng giả định các điểm lân cận trong cửa sổ nhỏ có cùng vận tốc chuyển động, "
            "tạo hệ phương trình giải bằng phương pháp bình phương tối thiểu Least Squares."
        ),
        core_concepts=[
            "Giả định bảo toàn độ sáng: Điểm ảnh chuyển động giữ nguyên độ sáng giữa 2 khung hình",
            "Vector trường chuyển động (Motion Vector Field) chỉ rõ hướng và vận tốc di chuyển của từng điểm ảnh",
            "Vấn đề khẩu độ (Aperture Problem): Nhìn qua một lỗ nhỏ chỉ thấy chuyển động vuông góc với cạnh, không thấy chuyển động song song",
            "Kim tự tháp ảnh (Image Pyramid) giúp thuật toán Lucas-Kanade bắt được cả những chuyển động nhanh và lớn"
        ],
        jargon_traps=[
            JargonTrap(
                term="Aperture Problem (Vấn đề khẩu độ)",
                trap="Tưởng là lỗi ống kính máy ảnh bị hỏng",
                feynman_translation="Nhìn qua khe cửa hẹp thấy một sợi dây trơn tuột đang di chuyển, bạn không thể biết sợi dây đang chạy sang ngang hay đang chuyển động tịnh tiến."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Vết bụi bay trước kính chắn gió ô tô",
                metaphor="Khi xe chạy ban đêm, bạn thấy các vệt sáng của hạt bụi bay xéo tạt sang hai bên. Góc nghiêng và độ dài của vệt sáng cho biết xe bạn đang chạy nhanh hay chậm và đang rẽ về hướng nào.",
                target_audience="Người lái xe"
            )
        ],
        prerequisites=["math-partial-derivatives", "math-taylor-series"],
        sub_concepts=["cv-horn-schunck", "cv-pyramidal-lk"],
        practical_applications=["Hệ thống chống rung quang học và điện tử video EIS", "Cảm biến quang học đo tốc độ di chuyển dưới đáy chuột máy tính", "Nén video chuẩn MPEG/H.264/H.265 (Motion Estimation)"]
    ),

    TopicDefinition(
        id="cv-vision-transformers-vit",
        slug="vision-transformers-vit",
        domain_id="cv",
        domain_name="Thị Giác Máy Tính",
        title_vi="Vision Transformer (ViT) & Cơ Chế Tự Chú Ý",
        title_en="Vision Transformer (ViT) & Self-Attention",
        wikipedia_slug="Vision_transformer",
        difficulty="Advanced",
        ground_truth_vi=(
            "Vision Transformer (Dosovitskiy et al., Google Research 2020) chứng minh rằng kiến trúc Transformer chuẩn trong xử lý ngôn ngữ tự nhiên (NLP) "
            "hoàn toàn có thể áp dụng trực tiếp lên hình ảnh mà không cần các lớp tích chập CNN truyền thống. "
            "Thuật toán cắt bức ảnh thành lưới các mảnh nhỏ cố định (Patches kích thước 16x16 pixel), trải phẳng thành các vector 1D, "
            "chiếu tuyến tính thành chuỗi Patch Embeddings, cộng thêm Positional Embeddings và đưa vào khối Transformer Encoder chuẩn. "
            "Cơ chế Multi-Head Self-Attention tính toán mối tương quan giữa mọi cặp mảnh ảnh ngay từ tầng đầu tiên, cho phép bắt ngữ cảnh toàn cục (Global Context)."
        ),
        core_concepts=[
            "Ảnh được đối xử tương đương như một câu văn (Mỗi mảnh ảnh 16x16 là một từ 'token')",
            "Không có giả định thiên vị quy nạp (Inductive Bias) về tính cục bộ như phép tích chập CNN",
            "Cần tập dữ liệu huấn luyện khổng lồ (JFT-300M, ImageNet-21k) để vượt trội hoàn toàn so với ResNet",
            "Vector vị trí (Positional Embedding) là tối quan trọng để mô hình biết mảnh ảnh nào nằm ở góc nào",
            "Token đặc biệt [CLS] tổng hợp thông tin toàn ảnh để đưa vào đầu phân loại"
        ],
        jargon_traps=[
            JargonTrap(
                term="Inductive Bias (Thiên vị quy nạp)",
                trap="Nghĩ là mô hình bị định kiến sai lệch xã hội",
                feynman_translation="Giả định dựng sẵn trong đầu: CNN sinh ra đã tin rằng các điểm ảnh cạnh nhau thì quan trọng hơn các điểm ở xa; còn ViT thì hoàn toàn 'đầu óc trống rỗng' và tự học tất cả từ dữ liệu."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Xếp hình mảnh ghép Jigsaw Puzzle",
                metaphor="Cắt bức tranh phong cảnh thành 100 miếng ghép nhỏ. Bạn nhấc từng miếng lên và so sánh trực tiếp nó với toàn bộ 99 miếng còn lại để hiểu xem miếng nào thuộc về bầu trời, miếng nào thuộc về con thuyền.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cv-convolution-cnn", "cv-resnet-skip-connections"],
        sub_concepts=["cv-swin-transformer", "cv-masked-autoencoders"],
        practical_applications=["Mô hình đa phương thức hiện đại Gemini, GPT-4V, Claude 3.5 Sonnet", "Tạo ảnh từ văn bản Stable Diffusion và Midjourney", "Xe tự lái Tesla FSD (Full Self-Driving) giải mã toàn cảnh đường phố"]
    ),

    # =========================================================================
    # 4. KHOA HỌC MÁY TÍNH & HỆ THỐNG (10 Topics)
    # =========================================================================
    TopicDefinition(
        id="cs-pointers-memory-management",
        slug="pointers-memory-management",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Quản Lý Bộ Nhớ C/C++ & Con Trỏ (Pointers)",
        title_en="Memory Management & Pointers in C/C++",
        wikipedia_slug="Pointer_(computer_programming)",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Con trỏ (Pointer) trong C/C++ là một biến lưu trữ địa chỉ ô nhớ trong bộ nhớ RAM nơi biến khác đang cư ngụ. "
            "Toán tử & lấy địa chỉ ô nhớ, toán tử * (Dereference) truy xuất nội dung tại địa chỉ mà con trỏ chỉ tới. "
            "Không gian bộ nhớ của tiến trình được chia thành các phân vùng chính: Phân vùng mã lệnh (Text/Code), Dữ liệu toàn cục (Data/BSS), "
            "Ngăn xếp (Stack - cấp phát tự động, cấu trúc LIFO nhanh chóng cho biến cục bộ), "
            "và Vùng nhớ động (Heap - cấp phát thủ công qua malloc/new, tự chịu trách nhiệm giải phóng qua free/delete). "
            "Lỗi quản lý bộ nhớ dẫn tới rò rỉ bộ nhớ (Memory Leak), con trỏ lơ lửng (Dangling Pointer) và lỗi truy cập trái phép (Segmentation Fault)."
        ),
        core_concepts=[
            "Bộ nhớ RAM là một dãy các ô nhớ có đánh số thứ tự địa chỉ byte liên tục từ 0 đến 2^64 - 1",
            "Stack: Cực nhanh, kích thước cố định, biến tự hủy khi hàm kết thúc (Stack Overflow khi đệ quy sâu)",
            "Heap: Dung lượng lớn, phân mảnh, yêu cầu lập trình viên quản lý vòng đời cẩn thận",
            "Con trỏ lơ lửng (Dangling pointer) và Double Free là nguồn gốc hàng đầu của các lỗ hổng bảo mật",
            "Con trỏ thông minh hiện đại (Smart Pointers trong C++11: unique_ptr, shared_ptr) dựa trên cơ chế RAII"
        ],
        jargon_traps=[
            JargonTrap(
                term="Segmentation Fault (Segfault)",
                trap="Hoảng loạn không biết máy tính bị gì",
                feynman_translation="Bảo vệ ngân hàng tóm cổ bạn vì bạn cầm chìa khóa phòng số 5 nhưng lại cố tình xông vào cạy cửa két sắt phòng số 99."
            ),
            JargonTrap(
                term="Dereferencing",
                trap="Khó hiểu thuật ngữ dịch thuật",
                feynman_translation="Lần theo mảnh giấy ghi địa chỉ nhà để đến tận nơi gõ cửa xem bên trong có ai."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Tấm giấy ghi số phòng khách sạn",
                metaphor="Một biến bình thường là căn phòng khách sạn chứa quần áo. Một biến con trỏ chỉ là mảnh giấy nhỏ ghi con số 'Phòng 402'. Bạn cầm mảnh giấy chứ không cầm cả căn phòng.",
                target_audience="Người mới học lập trình"
            )
        ],
        prerequisites=[],
        sub_concepts=["cs-stack-vs-heap", "cs-smart-pointers"],
        practical_applications=["Lập trình hệ điều hành Linux Kernel và Driver phần cứng", "Tối ưu hóa game engine 3D Unreal Engine đạt 120 FPS", "Lập trình hệ thống nhúng vi điều khiển trong máy bay, ô tô"]
    ),

    TopicDefinition(
        id="cs-docker-containers-namespaces",
        slug="docker-containers-namespaces",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Công Nghệ Đóng Gói Docker, Namespaces & Cgroups",
        title_en="Docker Containers, Linux Namespaces & Cgroups",
        wikipedia_slug="Docker_(software)",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Docker Container là công nghệ ảo hóa ở cấp độ hệ điều hành (OS-level Virtualization) cho phép đóng gói ứng dụng "
            "cùng toàn bộ thư viện phụ thuộc thành một đơn vị chuẩn hóa có thể chạy nhất quán trên mọi môi trường. "
            "Khác với máy ảo (Virtual Machine - VM) yêu cầu cả một hệ điều hành khách (Guest OS) cồng kềnh chạy trên Hypervisor, "
            "Container dùng chung Kernel của máy chủ chủ (Host Kernel) và được cách ly bằng hai tính năng cốt lõi của Linux Kernel: "
            "1) Linux Namespaces (cách ly tầm nhìn: PID, Network, Mount, IPC, UTS, User); "
            "2) Control Groups (cgroups - giới hạn và giám sát tài nguyên phần cứng: CPU, RAM, Disk I/O); "
            "kết hợp hệ thống tập tin nhiều lớp Union File System (Overlay2) cho phép tái sử dụng image layers cực nhẹ."
        ),
        core_concepts=[
            "Container chỉ là một tiến trình thông thường của Linux được khoác lên chiếc áo giáp cách ly",
            "Namespaces quyết định: 'Tiến trình được nhìn thấy những gì?'",
            "Cgroups quyết định: 'Tiến trình được phép ngốn bao nhiêu CPU và RAM?'",
            "Hệ thống tệp nhiều lớp (Layered Filesystem): Các layer chỉ đọc (Read-only) xếp chồng lên nhau, tiết kiệm dung lượng đĩa",
            "Thời gian khởi động tính bằng mili-giây so với hàng phút của máy ảo VM"
        ],
        jargon_traps=[
            JargonTrap(
                term="Container (Thùng chứa)",
                trap="Tưởng là nó mô phỏng lại cả phần cứng máy tính như VirtualBox/VMware",
                feynman_translation="Một căn phòng chung cư có vách ngăn cách âm: mọi người dùng chung móng nhà và đường ống nước của tòa nhà nhưng không ai nhìn thấy phòng ai."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Khách sạn chung cư vs Xây từng ngôi nhà riêng",
                metaphor="Máy ảo VM giống như xây từng căn nhà biệt lập có đầy đủ móng, mái, cột riêng (nặng nề). Docker giống như tòa nhà chung cư: các phòng ngăn cách riêng biệt nhưng dùng chung móng và hệ thống điện nước của tòa nhà (nhẹ nhàng).",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cs-pointers-memory-management"],
        sub_concepts=["cs-cgroups", "cs-kubernetes-orchestration"],
        practical_applications=["Triển khai ứng dụng Microservices trên Kubernetes", "Quy trình tích hợp và phân phối liên tục CI/CD DevOps", "Môi trường thử nghiệm đồng nhất giữa máy lập trình viên và Cloud"]
    ),

    TopicDefinition(
        id="cs-process-vs-thread-concurrency",
        slug="process-vs-thread-concurrency",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Tiến Trình vs Luồng & Lập Trình Đồng Thời",
        title_en="Process vs Thread & Concurrency",
        wikipedia_slug="Thread_(computing)",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Tiến trình (Process) là một chương trình đang trong trạng thái thực thi, sở hữu không gian địa chỉ bộ nhớ độc lập, "
            "bảng mô tả tệp tin riêng biệt và khối điều khiển tiến trình (PCB - Process Control Block). "
            "Luồng (Thread) là đơn vị nhỏ nhất được CPU lên lịch thực thi (LWP - Light-Weight Process) nằm bên trong tiến trình. "
            "Các luồng trong cùng tiến trình dùng chung mã lệnh, dữ liệu toàn cục và vùng nhớ Heap, nhưng mỗi luồng có ngăn xếp (Stack) và thanh ghi riêng. "
            "Chạy đồng thời nhiều luồng gây ra xung đột truy cập tài nguyên (Race Condition), đòi hỏi các cơ chế đồng bộ hóa: Mutex, Semaphore, Spinlock."
        ),
        core_concepts=[
            "Tiến trình cách ly an toàn: Một tiến trình sập không làm sập tiến trình khác; Chuyển ngữ cảnh (Context Switch) tốn kém",
            "Luồng chia sẻ bộ nhớ nhanh chóng: Giao tiếp cực nhanh nhưng một luồng làm hỏng bộ nhớ sẽ làm sập cả ứng dụng",
            "Điều kiện tương tranh (Race Condition): Kết quả phụ thuộc vào thứ tự ngẫu nhiên của các luồng khi ghi đè dữ liệu",
            "Khóa tương hỗ Mutex (Mutual Exclusion) đảm bảo chỉ đúng 1 luồng được vào vùng nguy hiểm (Critical Section) tại một thời điểm",
            "Semaphore đếm: Quản lý số lượng tài nguyên có hạn (ví dụ tối đa 10 kết nối cùng lúc)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Deadlock vs Livelock",
                trap="Nhầm lẫn hai trạng thái tắc nghẽn",
                feynman_translation="Deadlock là hai chiếc xe đối đầu nhau đứng yên chờ đối phương nhường; Livelock là hai người đi ngược chiều trên vỉa hè cùng lùi sang trái rồi cùng bước sang phải nhường nhau liên tục mà không ai đi qua được."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Nhà hàng ẩm thực",
                metaphor="Mỗi nhà hàng độc lập là một tiến trình (có bếp, tủ lạnh riêng). Các đầu bếp phụ làm việc chung trong một gian bếp là các luồng (dùng chung tủ lạnh và gia vị, nếu không phân công rõ sẽ giành nhau chiếc chảo duy nhất).",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cs-pointers-memory-management"],
        sub_concepts=["cs-mutex-semaphore", "cs-race-conditions"],
        practical_applications=["Trình duyệt Chrome mở mỗi tab là một tiến trình độc lập để tab này đơ không ảnh hưởng tab kia", "Máy chủ web Nginx / Node.js xử lý hàng chục nghìn kết nối đồng thời", "Game 3D xử lý luồng render hình ảnh riêng và luồng tính toán vật lý riêng"]
    ),

    TopicDefinition(
        id="cs-deadlock-coffman-conditions",
        slug="deadlock-coffman-conditions",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Bế Tắc Hệ Thống (Deadlock) & 4 Điều Kiện Coffman",
        title_en="Deadlock & Coffman Conditions",
        wikipedia_slug="Deadlock",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Bế tắc (Deadlock) là tình trạng một tập hợp các tiến trình bị phong tỏa vĩnh viễn vì mỗi tiến trình đều đang giữ một tài nguyên "
            "và chờ đợi tài nguyên khác đang bị một tiến trình khác trong tập hợp chiếm giữ. "
            "Edward G. Coffman (1971) đã chứng minh Deadlock xảy ra khi và chỉ khi 4 điều kiện sau đồng thời thỏa mãn: "
            "1) Loại trừ tương hỗ (Mutual Exclusion): Tài nguyên không thể chia sẻ đồng thời; "
            "2) Giữ và chờ (Hold and Wait): Tiến trình đang giữ ít nhất 1 tài nguyên và chờ cấp phát thêm; "
            "3) Không thể tước đoạt (No Preemption): Tài nguyên chỉ được giải phóng tự nguyện bởi tiến trình nắm giữ; "
            "4) Chờ đợi vòng tròn (Circular Wait): Tồn tại chu trình chuỗi P_0 -> P_1 -> ... -> P_n -> P_0. "
            "Thuật toán Banker của Dijkstra được dùng để phòng tránh Deadlock."
        ),
        core_concepts=[
            "Chỉ cần phá vỡ 1 trong 4 điều kiện Coffman là hệ thống hoàn toàn miễn nhiễm với Deadlock",
            "Cách phòng chống Circular Wait phổ biến nhất: Đánh số thứ tự toàn cầu cho mọi tài nguyên và bắt buộc mọi luồng phải khóa theo thứ tự tăng dần",
            "Đồ thị cấp phát tài nguyên (Resource Allocation Graph - RAG) phát hiện chu trình bế tắc",
            "Chiến lược Đà điểu (Ostrich Algorithm): Giả vờ như Deadlock không tồn tại và khởi động lại dịch vụ nếu tần suất xảy ra cực hiếm"
        ],
        jargon_traps=[
            JargonTrap(
                term="Hold and Wait (Giữ và Chờ)",
                trap="Nghĩ là tiến trình đang ngủ",
                feynman_translation="Tay trái cầm khư khư chiếc dĩa không chịu buông, trong khi tay phải đứng chờ người bên cạnh ăn xong để mượn chiếc thìa."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Bốn chiếc xe kẹt cứng tại ngã tư",
                metaphor="Bốn chiếc xe cùng lao vào ngã tư từ 4 hướng và chắn đầu nhau. Xe nào cũng muốn xe phía trước lùi trước thì mình mới đi được. Kết quả là cả 4 xe cùng bất động giữa trưa nắng.",
                target_audience="Tài xế"
            )
        ],
        prerequisites=["cs-process-vs-thread-concurrency"],
        sub_concepts=["cs-banker-algorithm"],
        practical_applications=["Quản lý khóa giao dịch trong cơ sở dữ liệu SQL (Row Locking)", "Điều phối lưu lượng tàu hỏa trên đường ray đơn giao nhau", "Thiết kế nhân hệ điều hành chống treo cứng máy (Kernel Hang)"]
    ),

    TopicDefinition(
        id="cs-virtual-memory-paging",
        slug="virtual-memory-paging",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Bộ Nhớ Ảo, Phân Trang & Bảng Trang (TLB)",
        title_en="Virtual Memory, Paging & TLB",
        wikipedia_slug="Virtual_memory",
        difficulty="Advanced",
        ground_truth_vi=(
            "Bộ nhớ ảo (Virtual Memory) là kỹ thuật quản lý bộ nhớ của hệ điều hành cung cấp cho mỗi tiến trình một ảo giác rằng nó đang sở hữu "
            "toàn bộ một không gian địa chỉ liên tục và khổng lồ, độc lập hoàn toàn với bộ nhớ vật lý thực tế. "
            "Kỹ thuật Phân trang (Paging) chia không gian địa chỉ ảo thành các Trang (Pages - thường là 4KB) và bộ nhớ RAM vật lý thành các Khung trang (Page Frames). "
            "Bộ quản lý bộ nhớ phần cứng (MMU) chuyển đổi địa chỉ ảo thành địa chỉ vật lý thông qua Bảng trang (Page Table). "
            "Bộ đệm chuyển đổi Translation Lookaside Buffer (TLB) đóng vai trò cache phần cứng cực nhanh cho các bản dịch gần nhất. "
            "Khi trang yêu cầu chưa có trong RAM, ngắt lỗi trang (Page Fault) được kích hoạt để nạp trang từ ổ đĩa (Swap)."
        ),
        core_concepts=[
            "Tách biệt địa chỉ ảo của chương trình khỏi vị trí thực sự trong thanh RAM vật lý",
            "Bảo vệ bộ nhớ: Tiến trình này không thể đọc hay ghi đè vào trang nhớ của tiến trình khác",
            "Page Fault: Khi trang bị thiếu trong RAM, hệ điều hành nạp từ SSD vào RAM và cập nhật bảng trang",
            "Thuật toán thay thế trang (Page Replacement): LRU (Least Recently Used), FIFO, Clock algorithm",
            "Hiện tượng Thrashing: Khi RAM quá đầy, máy tính dành 99% thời gian để swap ổ đĩa khiến máy đơ cứng"
        ],
        jargon_traps=[
            JargonTrap(
                term="Page Fault (Lỗi trang)",
                trap="Tưởng là máy tính bị hỏng hay ứng dụng bị crash",
                feynman_translation="Một tiếng chuông nhắc nhở bình thường của thủ thư thư viện: 'Cuốn sách này đang để dưới kho lưu trữ, chờ tôi 1 giây xuống cầu thang lấy lên bàn đọc'."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Bàn làm việc nhỏ và chiếc tủ sách lớn",
                metaphor="Mặt bàn bạn ngồi chỉ để được 5 cuốn sách (RAM). Tủ sách phía sau chứa hàng trăm cuốn (Ổ cứng SSD). Cuốn nào đang đọc thì bày lên bàn, cuốn nào lâu không đọc thì cất lại vào tủ. Nếu cần cuốn chưa có trên bàn thì quay ra tủ lấy.",
                target_audience="Học sinh"
            )
        ],
        prerequisites=["cs-pointers-memory-management"],
        sub_concepts=["cs-tlb-caching", "cs-page-replacement-algorithms"],
        practical_applications=["Cho phép máy tính 8GB RAM mở cùng lúc game nặng 30GB và Photoshop", "Bảo mật phần mềm: Ngăn chặn phần mềm độc hại đọc trộm mật khẩu", "Tính năng chia sẻ bộ nhớ Copy-On-Write (COW) khi gọi lệnh fork() trong Linux"]
    ),

    TopicDefinition(
        id="cs-tcp-3way-handshake",
        slug="tcp-3way-handshake",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Giao Thức Bắt Tay 3 Bước TCP (3-Way Handshake)",
        title_en="TCP 3-Way Handshake & Connection Lifecycle",
        wikipedia_slug="Transmission_Control_Protocol",
        difficulty="Intermediate",
        ground_truth_vi=(
            "TCP (Transmission Control Protocol) là giao thức tầng truyền vận hướng kết nối, tin cậy, đảm bảo dữ liệu đến đúng thứ tự "
            "và không bị mất mát trên môi trường mạng Internet không tin cậy. Trước khi truyền dữ liệu, kết nối bắt buộc phải được thiết lập "
            "thông qua quy trình bắt tay 3 bước (Three-way Handshake): "
            "1) Client gửi cờ SYN với số thứ tự khởi tạo ngẫu nhiên ISN(c); "
            "2) Server phản hồi cờ SYN-ACK với ISN(s) của server và ACK = ISN(c) + 1; "
            "3) Client gửi cờ ACK = ISN(s) + 1 xác nhận. "
            "Sau 3 bước này, cả hai bên đều đồng bộ hóa số thứ tự (Sequence Numbers) và sẵn sàng truyền luồng dữ liệu song công (Full-duplex)."
        ),
        core_concepts=[
            "Tại sao phải là 3 bước mà không phải 2 bước? Để ngăn chặn các gói tin cũ bị kẹt trên mạng gây ra kết nối ma giả mạo",
            "Số thứ tự (Sequence Number) được tạo ngẫu nhiên để chống lại cuộc tấn công chiếm quyền điều khiển TCP Sequence Prediction",
            "Cơ chế cửa sổ trượt (Sliding Window) điều khiển luồng (Flow Control) chống làm ngợp bên nhận",
            "Thuật toán chống nghẽn mạng (Congestion Control): Slow Start, Congestion Avoidance, Fast Retransmit",
            "Đóng kết nối bằng 4 bước bắt tay (FIN, ACK, FIN, ACK) và trạng thái chờ TIME_WAIT"
        ],
        jargon_traps=[
            JargonTrap(
                term="SYN Flood Attack",
                trap="Khó hình dung cơ chế tấn công từ chối dịch vụ",
                feynman_translation="Kẻ phá hoại bấm chuông cửa rồi bỏ chạy liên tục, khiến chủ nhà phải ra mở cửa đứng đợi cho đến khi kiệt sức."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hai người nói chuyện qua bộ đàm bộ đội",
                metaphor="1) 'Alo, đại bàng nghe rõ chim ưng không, trả lời? (SYN)'; 2) 'Nghe rất rõ chim ưng, chim ưng có nghe rõ đại bàng không? (SYN-ACK)'; 3) 'Nghe rõ đại bàng, bắt đầu truyền mệnh lệnh! (ACK)'.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=[],
        sub_concepts=["cs-tcp-congestion-control", "cs-udp-vs-tcp"],
        practical_applications=["Truy cập duyệt web an toàn HTTPS và API RESTful", "Gửi email chuẩn xác qua SMTP/IMAP không bao giờ rụng chữ", "Tải tệp tin dung lượng lớn qua giao thức FTP/BitTorrent"]
    ),

    TopicDefinition(
        id="cs-cap-theorem-distributed-systems",
        slug="cap-theorem-distributed-systems",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Định Lý CAP & Thiết Kế Hệ Thống Phân Tán",
        title_en="CAP Theorem & Distributed System Design",
        wikipedia_slug="CAP_theorem",
        difficulty="Advanced",
        ground_truth_vi=(
            "Định lý CAP (Eric Brewer, 2000; chứng minh hình thức bởi Gilbert & Lynch, 2002) phát biểu rằng một hệ thống dữ liệu phân tán "
            "chỉ có thể đảm bảo tối đa hai trong ba thuộc tính sau tại cùng một thời điểm: "
            "1) Tính nhất quán (Consistency - Mọi thao tác đọc đều nhận được dữ liệu được ghi mới nhất hoặc báo lỗi); "
            "2) Tính sẵn sàng (Availability - Mọi yêu cầu không bị lỗi đều nhận được phản hồi không có lỗi, dù có thể không phải dữ liệu mới nhất); "
            "3) Khả năng chịu lỗi phân vùng mạng (Partition Tolerance - Hệ thống vẫn tiếp tục hoạt động dù mạng bị đứt cáp chia cắt các máy chủ). "
            "Vì phân vùng mạng (P) trong thế giới vật lý là không thể tránh khỏi, kiến trúc sư chỉ được quyền chọn lựa giữa CP (Ưu tiên nhất quán) hoặc AP (Ưu tiên sẵn sàng)."
        ),
        core_concepts=[
            "Phân vùng mạng (Network Partition) là hiện tượng các máy chủ không thể gửi tin nhắn cho nhau do đứt cáp quang hoặc nghẽn router",
            "Hệ thống CP (ví dụ Google Spanner, MongoDB, ZooKeeper): Nếu mạng bị đứt, thà từ chối phục vụ để bảo vệ tính toàn vẹn dữ liệu tài khoản ngân hàng",
            "Hệ thống AP (ví dụ Amazon DynamoDB, Cassandra, DNS): Chấp nhận hiển thị dữ liệu hơi cũ nhưng hệ sinh thái không bao giờ được phép sập",
            "Tính nhất quán cuối cùng (Eventual Consistency): Nếu không có thêm bản ghi mới, theo thời gian các bản sao sẽ dần hội tụ về cùng một giá trị",
            "Mô hình ACID (CSDL quan hệ) so sánh với BASE (Basically Available, Soft state, Eventual consistency)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Partition Tolerance (Chịu lỗi phân vùng)",
                trap="Tưởng là chia ổ cứng thành ổ C và ổ D",
                feynman_translation="Hệ thống vẫn giữ được mạng sống dù đường truyền cáp quang ngầm giữa trung tâm dữ liệu Hà Nội và Sài Gòn bị đứt lìa."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hai chi nhánh ngân hàng bị đứt cáp điện thoại",
                metaphor="Bạn gửi 10 triệu vào chi nhánh A. Chi nhánh B bị đứt dây điện thoại không biết tin. Nếu bạn sang chi nhánh B rút tiền: 1) Hoặc B từ chối cho rút để tránh mất tiền (CP); 2) Hoặc B cứ cho rút đại để bạn vui lòng nhưng chấp nhận nguy cơ tài khoản bị âm tiền (AP).",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=[],
        sub_concepts=["cs-eventual-consistency", "cs-paxos-raft-consensus"],
        practical_applications=["Kiến trúc giỏ hàng mua sắm của Amazon (AP để không bỏ lỡ khách mua hàng)", "Hệ thống số dư thẻ tín dụng Visa/Mastercard (CP để chống gian lận tiền bạc)", "Hệ sinh thái lưu trữ video khổng lồ của YouTube và Netflix"]
    ),

    TopicDefinition(
        id="cs-btree-database-indexing",
        slug="btree-database-indexing",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Chỉ Mục Cơ Sở Dữ Liệu B-Tree & B+Tree",
        title_en="B-Tree & B+Tree Database Indexing",
        wikipedia_slug="B-tree",
        difficulty="Intermediate",
        ground_truth_vi=(
            "B-Tree (Bayer & McCreight, 1972) là cấu trúc dữ liệu cây tìm kiếm tự cân bằng nhiều nhánh (Self-balancing m-way search tree) "
            "được thiết kế đặc biệt tối ưu cho hệ thống lưu trữ khối trên đĩa từ (HDD) và ổ cứng thể rắn (SSD). "
            "Khác với cây nhị phân (AVL, Red-Black) chỉ có 2 nhánh con khiến chiều cao cây rất lớn, B-Tree cho phép mỗi nút chứa hàng trăm khóa (Keys) "
            "và hàng trăm con trỏ nhánh con, giữ cho chiều cao cây cực kỳ thấp (thường chỉ từ 3 đến 4 tầng cho hàng triệu bản ghi). "
            "Biến thể B+Tree lưu toàn bộ dữ liệu thực tế tại các nút lá (Leaf nodes) và nối các lá bằng danh sách liên kết đôi (Doubly Linked List), "
            "cho phép thực hiện các truy vấn quét dải (Range Scan: SELECT * WHERE age BETWEEN 20 AND 30) với tốc độ tức thì."
        ),
        core_concepts=[
            "Nút thắt cổ chai lớn nhất của cơ sở dữ liệu là số lần đọc đĩa (Disk I/O), chậm hơn hàng nghìn lần so với đọc RAM",
            "Mỗi nút B-Tree được định kích thước đúng bằng 1 block đĩa (thường là 4KB đến 16KB) để đọc 1 lần lấy được hàng trăm khóa",
            "Cây luôn tự cân bằng hoàn hảo: Tất cả các nút lá luôn nằm trên cùng một độ sâu chính xác",
            "Độ phức tạp tìm kiếm, chèn và xóa luôn đảm bảo O(log_m N), trong đó m là bậc phân nhánh (Branching Factor)",
            "Chỉ mục (Index) tăng tốc độ đọc dữ liệu lên hàng nghìn lần nhưng làm chậm nhẹ thao tác ghi (INSERT/UPDATE/DELETE)"
        ],
        jargon_traps=[
            JargonTrap(
                term="Full Table Scan (Quét toàn bộ bảng)",
                trap="Tưởng là máy tính quét kỹ thì càng tốt",
                feynman_translation="Lật từng trang một từ đầu đến cuối một cuốn từ điển dày 2.000 trang chỉ để tìm xem chữ 'Zebra' nằm ở đâu."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Mục lục tra cứu ở cuối cuốn bách khoa toàn thư",
                metaphor="Thay vì đọc từng trang từ trang 1 đến trang 1000, bạn mở phần mục lục xếp theo thứ tự bảng chữ cái A-Z ở trang cuối, nhìn thấy từ cần tìm và lật ngay đến đúng trang đó trong 2 giây.",
                target_audience="Học sinh"
            )
        ],
        prerequisites=["discrete-dijkstra-algorithm"],
        sub_concepts=["cs-lsm-trees", "cs-clustered-index"],
        practical_applications=["Bộ máy lưu trữ InnoDB của MySQL và PostgreSQL", "Hệ thống tập tin phân cấp NTFS của Windows và ext4 của Linux", "Chỉ mục tìm kiếm tài liệu của SQLite trong điện thoại iPhone/Android"]
    ),

    TopicDefinition(
        id="cs-message-queues-event-driven",
        slug="message-queues-event-driven-architecture",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Hàng Đợi Thông Điệp & Kiến Trúc Hướng Sự Kiện",
        title_en="Message Queues & Event-Driven Architecture",
        wikipedia_slug="Message_queue",
        difficulty="Intermediate",
        ground_truth_vi=(
            "Kiến trúc hướng sự kiện (Event-Driven Architecture) là mô hình thiết kế phần mềm trong đó các dịch vụ giao tiếp với nhau bất đồng bộ "
            "thông qua việc phát sinh, phát hiện và tiêu thụ các Sự kiện (Events). "
            "Hàng đợi thông điệp (Message Queue như RabbitMQ, Apache Kafka, AWS SQS) đóng vai trò bộ đệm trung gian (Message Broker) "
            "thực hiện giải phóng liên kết (Decoupling) giữa bên sản xuất (Producer) và bên tiêu thụ (Consumer). "
            "Hệ thống cung cấp các mô hình phân phối: Điểm - Điểm (Point-to-Point) và Xuất bản - Đăng ký (Pub/Sub). "
            "Các cơ chế đảm bảo truyền tin: Tối đa một lần (At-most-once), Ít nhất một lần (At-least-once), và Đúng một lần (Exactly-once)."
        ),
        core_concepts=[
            "Giải phóng liên kết thời gian (Temporal Decoupling): Producer có thể gửi thư ngay cả khi Consumer đang tắt máy bảo trì",
            "Cân bằng tải và san phẳng xung đột tải (Load Leveling / Peak Shaving): Tránh sập máy chủ trong các đợt flash sale",
            "Mô hình Pub/Sub: Một sự kiện phát ra có thể kích hoạt đồng thời 5 dịch vụ khác nhau xử lý song song",
            "Đảm bảo tính lũy thừa (Idempotency): Consumer nhận trùng một thông điệp 2 lần thì kết quả trong cơ sở dữ liệu vẫn không bị nhân đôi",
            "Hàng đợi thư chết (Dead Letter Queue - DLQ): Chứa các thông điệp lỗi để kỹ sư kiểm tra nguyên nhân"
        ],
        jargon_traps=[
            JargonTrap(
                term="Idempotency (Tính lũy thừa)",
                trap="Từ ngữ toán học khó hiểu",
                feynman_translation="Chiếc nút bấm thang máy: bạn bấm 1 lần hay bấm liên tục 10 lần thì thang máy cũng chỉ chạy đến tầng đó đúng 1 lần duy nhất."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Hòm thư bưu điện đầu ngõ",
                metaphor="Người gửi thả lá thư vào thùng thư rồi thảnh thơi đi về nhà làm việc khác. Người nhận khi rảnh rỗi sẽ ra thùng thư nhặt thư về đọc. Hai người không cần phải đứng đối mặt chờ đợi nhau.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["cs-process-vs-thread-concurrency"],
        sub_concepts=["cs-kafka-distributed-commit-log", "cs-cqrs-event-sourcing"],
        practical_applications=["Hệ thống xử lý đơn hàng Shopee/Lazada trong ngày siêu sale 11/11", "Hệ thống thông báo đẩy thông báo ứng dụng Grab thông báo tài xế nhận cuốc", "Đồng bộ hóa hàng tỷ dòng dữ liệu thời gian thực giữa các vi dịch vụ Microservices"]
    ),

    TopicDefinition(
        id="cs-hash-tables-collision-resolution",
        slug="hash-tables-collision-resolution",
        domain_id="cs",
        domain_name="Khoa Học Máy Tính & Hệ Thống",
        title_vi="Bảng Băm & Thuật Toán Giải Quyết Đụng Độ",
        title_en="Hash Tables & Collision Resolution",
        wikipedia_slug="Hash_table",
        difficulty="Beginner",
        ground_truth_vi=(
            "Bảng băm (Hash Table) là cấu trúc dữ liệu mảng kết hợp (Associative Array) ánh xạ các Khóa (Keys) sang Giá trị (Values) "
            "với thời gian tìm kiếm, chèn và xóa trung bình đạt tốc độ lý tưởng O(1). "
            "Hàm băm h(k) chuyển đổi một khóa có độ dài bất kỳ (ví dụ chuỗi văn bản) thành một chỉ số số nguyên nằm trong phạm vi mảng [0, m-1]. "
            "Do nguyên lý chuồng bồ câu Dirichlet, đụng độ băm (Hash Collision: h(k_1) = h(k_2) với k_1 ≠ k_2) là điều chắc chắn xảy ra. "
            "Hai chiến lược giải quyết đụng độ chính: "
            "1) Băm riêng biệt (Separate Chaining: mỗi ô mảng là một danh sách liên kết chứa các phần tử đụng độ); "
            "2) Địa chỉ mở (Open Addressing: dò tuyến tính Linear Probing, dò bậc hai, hoặc băm kép để tìm ô trống tiếp theo trong mảng)."
        ),
        core_concepts=[
            "Hàm băm lý tưởng phân bổ đều các khóa ngẫu nhiên trên toàn bộ không gian mảng (Uniform Hashing)",
            "Hệ số tải (Load Factor α = n / m): Tỷ lệ số phần tử trên kích thước mảng; khi α > 0.75 bảng băm tự động mở rộng gấp đôi kích thước (Resizing / Rehashing)",
            "Độ phức tạp: Trung bình O(1), nhưng trường hợp xấu nhất (tất cả các khóa bị đụng độ vào 1 ô) suy thoái thành O(n)",
            "Ứng dụng hàm băm mật mã (SHA-256) bảo vệ mật khẩu một chiều"
        ],
        jargon_traps=[
            JargonTrap(
                term="Load Factor (Hệ số tải)",
                trap="Tưởng là trọng tải xe tải",
                feynman_translation="Tỷ lệ lấp đầy phòng khách sạn: nếu khách sạn 100 phòng mà đã ở kín 75 phòng thì phải xây thêm tầng mới để tránh khách mới đến phải đứng chờ xếp hàng."
            )
        ],
        analogy_hints=[
            AnalogyHint(
                title="Tủ gửi đồ cá nhân ở siêu thị",
                metaphor="Bạn cầm chiếc vé xe, nhân viên siêu thị nhìn số cuối của vé xe và xếp giỏ đồ của bạn vào ngăn tủ số đó. Khi ra về, bạn chỉ cần đọc số là lấy được ngay đồ của mình trong 1 giây mà không cần lục tìm cả kho.",
                target_audience="Đại chúng"
            )
        ],
        prerequisites=["discrete-pigeonhole-principle"],
        sub_concepts=["cs-cuckoo-hashing", "cs-consistent-hashing"],
        practical_applications=["Cấu trúc kiểu dữ liệu Dictionary trong Python, Map trong JavaScript/Java", "Bộ nhớ đệm siêu tốc Redis / Memcached lưu session đăng nhập người dùng", "Kiểm tra lỗi trùng lặp dữ liệu tức thì trong Big Data"]
    )
]

# ---------------------------------------------------------------------------
# Wikipedia API Enrichment Service
# ---------------------------------------------------------------------------

def fetch_wikipedia_metadata(client: httpx.Client, topic: TopicDefinition) -> None:
    """Fetches summary, canonical page URL, and thumbnail from Wikipedia REST API."""
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic.wikipedia_slug}"
    headers = {"User-Agent": "TheodoreFeynmanAcademic/1.0 (academic-enrichment@theodore.edu)"}
    try:
        response = client.get(url, headers=headers, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            topic.wikipedia_summary = data.get("extract", "")
            topic.wikipedia_url = data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{topic.wikipedia_slug}")
            thumbnail = data.get("thumbnail")
            if thumbnail and "source" in thumbnail:
                topic.thumbnail_url = thumbnail["source"]
            print(f"  [OK] Fetched Wikipedia metadata for: {topic.title_en}")
        else:
            print(f"  [WARN] Wikipedia returned {response.status_code} for {topic.wikipedia_slug}")
            topic.wikipedia_url = f"https://en.wikipedia.org/wiki/{topic.wikipedia_slug}"
    except Exception as e:
        print(f"  [ERR] Failed Wikipedia lookup for {topic.wikipedia_slug}: {e}")
        topic.wikipedia_url = f"https://en.wikipedia.org/wiki/{topic.wikipedia_slug}"

# ---------------------------------------------------------------------------
# Knowledge Graph Topology Generator
# ---------------------------------------------------------------------------

def generate_graph_topology(topics: List[TopicDefinition]) -> (List[dict], List[dict]):
    """Constructs 40+ coordinate-mapped nodes and directional edges."""
    nodes = []
    edges = []

    domain_colors = {
        "math": "#3b82f6",
        "discrete": "#10b981",
        "cv": "#8b5cf6",
        "cs": "#f59e0b"
    }

    domain_categories = {
        "math": "Toán Cao Cấp",
        "discrete": "Toán Rời Rạc",
        "cv": "Thị Giác Máy Tính",
        "cs": "Khoa Học Máy Tính"
    }

    domain_counts = {"math": 0, "discrete": 0, "cv": 0, "cs": 0}

    # Layout: 10 topics per domain. Let's arrange each domain in 2 rows of 5
    for topic in topics:
        d = topic.domain_id
        idx = domain_counts[d]
        domain_counts[d] += 1

        row = idx // 5  # 0 or 1
        col = idx % 5   # 0 to 4

        # Calculate percentages
        x_pct = 12 + col * 19  # 12%, 31%, 50%, 69%, 88%

        domain_base_y = {
            "math": 8,
            "discrete": 32,
            "cv": 56,
            "cs": 80
        }
        y_pct = domain_base_y[d] + row * 11  # e.g. 8% and 19%

        mastery = 85 if topic.difficulty == "Beginner" else (70 if topic.difficulty == "Intermediate" else 50)
        clean_label = topic.title_vi.split(" (")[0]

        nodes.append({
            "id": topic.id,
            "topicId": topic.id,
            "label": clean_label,
            "domainId": topic.domain_id,
            "domain": topic.domain_id,
            "category": domain_categories[d],
            "level": topic.difficulty,
            "score": mastery,
            "masteryScore": mastery,
            "x": f"{x_pct}%",
            "y": f"{y_pct}%",
            "color": domain_colors[d],
            "difficulty": 1 if topic.difficulty == "Beginner" else (3 if topic.difficulty == "Intermediate" else 5),
            "prerequisites": topic.prerequisites
        })

        for prereq in topic.prerequisites:
            edges.append({
                "id": f"edge-{prereq}-{topic.id}",
                "source": prereq,
                "target": topic.id,
                "relationType": "PREREQUISITE",
                "relationship": "PREREQUISITE"
            })

        for sub in topic.sub_concepts:
            edges.append({
                "id": f"edge-{topic.id}-{sub}",
                "source": topic.id,
                "target": sub,
                "relationType": "SUB_CONCEPT",
                "relationship": "SUB_CONCEPT"
            })

    # Cross-domain bridges
    bridges = [
        ("math-gradient-descent", "cv-convolution-cnn", "RELATED"),
        ("math-linear-transformations", "cv-sift-harris-corner", "RELATED"),
        ("discrete-pigeonhole-principle", "cs-hash-tables-collision-resolution", "RELATED"),
        ("discrete-dijkstra-algorithm", "cs-btree-database-indexing", "RELATED"),
        ("discrete-propositional-logic-boolean", "cs-process-vs-thread-concurrency", "RELATED"),
        ("cv-resnet-skip-connections", "cv-vision-transformers-vit", "PREREQUISITE"),
        ("cs-process-vs-thread-concurrency", "cs-deadlock-coffman-conditions", "PREREQUISITE"),
        ("cs-pointers-memory-management", "cs-virtual-memory-paging", "PREREQUISITE")
    ]
    for s, t, rel in bridges:
        if not any(e["source"] == s and e["target"] == t for e in edges):
            edges.append({
                "id": f"bridge-{s}-{t}",
                "source": s,
                "target": t,
                "relationType": rel,
                "relationship": rel
            })

    return nodes, edges

# ---------------------------------------------------------------------------
# Code Generators (TypeScript Stores, PostgreSQL SQL Seed, Prisma Seed)
# ---------------------------------------------------------------------------

def write_typescript_catalog(topics: List[TopicDefinition], filepath: str) -> None:
    """Emits production-grade TypeScript file for frontend state and SSR."""
    ts_content = [
        "/**",
        " * File: src/data/academic-catalog.data.ts",
        " * Purpose: Comprehensive academic catalog of 40+ rigorous topics across 4 domains",
        " * (Toán Cao Cấp, Toán Rời Rạc, Thị Giác Máy Tính, Khoa Học Máy Tính).",
        " * Includes verified Ground Truths, Core Concept Checklists, Jargon Traps, and Analogies.",
        " * Auto-generated by scripts/enrich_academic_catalog.py with Wikipedia REST API validation.",
        " */",
        "",
        'import { DomainCategory, CatalogTopic } from "../types/catalog.types";',
        "",
        "export const ACADEMIC_DOMAINS: DomainCategory[] = [",
        "  {",
        '    id: "math",',
        '    slug: "advanced-mathematics",',
        '    name: "Toán Cao Cấp & Đại Số",',
        '    description: "Giải tích nhiều biến, Đại số tuyến tính, Tối ưu hóa vi phân và Phân tích ma trận.",',
        '    iconName: "Sigma",',
        '    icon: "Sigma",',
        '    color: "#3b82f6",',
        '    colorHex: "#3b82f6",',
        '    accentBg: "bg-blue-500/10",',
        "    topicCount: 10,",
        "    topics: []",
        "  },",
        "  {",
        '    id: "discrete",',
        '    slug: "discrete-mathematics",',
        '    name: "Toán Rời Rạc & Đồ Thị",',
        '    description: "Lý thuyết đồ thị, Logic mệnh đề, Tổ hợp chỉnh hợp và Cây bao trùm tối thiểu.",',
        '    iconName: "Network",',
        '    icon: "Network",',
        '    color: "#10b981",',
        '    colorHex: "#10b981",',
        '    accentBg: "bg-emerald-500/10",',
        "    topicCount: 10,",
        "    topics: []",
        "  },",
        "  {",
        '    id: "cv",',
        '    slug: "computer-vision",',
        '    name: "Thị Giác Máy Tính",',
        '    description: "Mạng tích chập CNN, Phát hiện biên cạnh, Nhận diện YOLO, và Vision Transformers.",',
        '    iconName: "Eye",',
        '    icon: "Eye",',
        '    color: "#8b5cf6",',
        '    colorHex: "#8b5cf6",',
        '    accentBg: "bg-purple-500/10",',
        "    topicCount: 10,",
        "    topics: []",
        "  },",
        "  {",
        '    id: "cs",',
        '    slug: "computer-science-systems",',
        '    name: "Khoa Học Máy Tính & Hệ Thống",',
        '    description: "Quản lý bộ nhớ con trỏ, Docker containers, Deadlock, B-Tree và Hệ thống phân tán CAP.",',
        '    iconName: "Cpu",',
        '    icon: "Cpu",',
        '    color: "#f59e0b",',
        '    colorHex: "#f59e0b",',
        '    accentBg: "bg-amber-500/10",',
        "    topicCount: 10,",
        "    topics: []",
        "  }",
        "];",
        "",
        "export const DOMAINS_CATALOG = ACADEMIC_DOMAINS;",
        "",
        "export const ACADEMIC_TOPICS: CatalogTopic[] = ["
    ]

    for topic in topics:
        clean_title = topic.title_vi.split(" (")[0]
        diff_level = 1 if topic.difficulty == "Beginner" else (3 if topic.difficulty == "Intermediate" else 5)

        ts_content.append("  {")
        ts_content.append(f'    id: "{topic.id}",')
        ts_content.append(f'    domainId: "{topic.domain_id}",')
        ts_content.append(f'    domainName: "{topic.domain_name}",')
        ts_content.append(f'    title: {json.dumps(clean_title, ensure_ascii=False)},')
        ts_content.append(f'    titleVi: {json.dumps(topic.title_vi, ensure_ascii=False)},')
        ts_content.append(f'    titleEn: "{topic.title_en}",')
        ts_content.append(f'    slug: "{topic.slug}",')
        ts_content.append(f'    summary: {json.dumps(topic.ground_truth_vi, ensure_ascii=False)},')
        ts_content.append(f'    groundTruthVi: {json.dumps(topic.ground_truth_vi, ensure_ascii=False)},')
        ts_content.append(f'    difficulty: "{topic.difficulty}",')
        ts_content.append(f'    difficultyLevel: {diff_level},')
        ts_content.append(f'    estimatedReadingMinutes: 8,')
        
        # Required concepts & core concepts
        ts_content.append('    requiredConcepts: [')
        for c in topic.core_concepts:
            ts_content.append(f'      {json.dumps(c, ensure_ascii=False)},')
        ts_content.append('    ],')
        ts_content.append('    coreConcepts: [')
        for c in topic.core_concepts:
            ts_content.append(f'      {json.dumps(c, ensure_ascii=False)},')
        ts_content.append('    ],')
        
        # Jargon traps array
        ts_content.append('    jargonTraps: [')
        for j in topic.jargon_traps:
            ts_content.append('      {')
            ts_content.append(f'        term: {json.dumps(j.term, ensure_ascii=False)},')
            ts_content.append(f'        trap: {json.dumps(j.trap, ensure_ascii=False)},')
            ts_content.append(f'        explanation: {json.dumps(j.trap, ensure_ascii=False)},')
            ts_content.append(f'        feynmanTranslation: {json.dumps(j.feynman_translation, ensure_ascii=False)},')
            ts_content.append(f'        recommendedAnalogy: {json.dumps(j.feynman_translation, ensure_ascii=False)}')
            ts_content.append('      },')
        ts_content.append('    ],')

        # Starter analogies array
        ts_content.append('    starterAnalogies: [')
        for a in topic.analogy_hints:
            ts_content.append('      {')
            ts_content.append(f'        title: {json.dumps(a.title, ensure_ascii=False)},')
            ts_content.append(f'        metaphor: {json.dumps(a.metaphor, ensure_ascii=False)},')
            ts_content.append(f'        applicableAudience: "{a.target_audience}",')
            ts_content.append(f'        targetAudience: "{a.target_audience}"')
            ts_content.append('      },')
        ts_content.append('    ],')

        ts_content.append(f'    prerequisites: {json.dumps(topic.prerequisites)},')
        ts_content.append(f'    prerequisiteIds: {json.dumps(topic.prerequisites)},')
        ts_content.append(f'    subConcepts: {json.dumps(topic.sub_concepts)},')
        ts_content.append(f'    practicalApplications: {json.dumps(topic.practical_applications, ensure_ascii=False)},')
        
        if topic.wikipedia_url:
            ts_content.append(f'    wikipediaUrl: "{topic.wikipedia_url}",')
        if topic.wikipedia_summary:
            ts_content.append(f'    wikipediaSummary: {json.dumps(topic.wikipedia_summary, ensure_ascii=False)},')
        if topic.thumbnail_url:
            ts_content.append(f'    thumbnailUrl: "{topic.thumbnail_url}",')

        ts_content.append("  },")

    ts_content.extend([
        "];",
        "",
        "export const TOPICS_CATALOG = ACADEMIC_TOPICS;",
        "",
        "// Map topics to their respective domains",
        "ACADEMIC_DOMAINS.forEach(domain => {",
        "  domain.topics = ACADEMIC_TOPICS.filter(t => t.domainId === domain.id);",
        "  domain.topicCount = domain.topics.length;",
        "});",
        "",
        "export function getCatalogTopics(): CatalogTopic[] {",
        "  return ACADEMIC_TOPICS;",
        "}",
        "",
        "export function getTopicById(id: string): CatalogTopic | undefined {",
        "  return ACADEMIC_TOPICS.find(t => t.id === id);",
        "}",
        "",
        "export function getTopicsByDomain(domainId: string): CatalogTopic[] {",
        "  return ACADEMIC_TOPICS.filter(t => t.domainId === domainId);",
        "}"
    ])

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_content) + "\n")
    print(f"[Generated] TypeScript catalog: {filepath} ({len(topics)} topics)")

def write_typescript_graph(nodes: List[dict], edges: List[dict], filepath: str) -> None:
    """Emits knowledge graph topology TypeScript file."""
    lines = [
        "/**",
        " * File: src/data/knowledge-graph.data.ts",
        " * Purpose: Comprehensive knowledge graph topology with 40+ nodes and directional edges",
        " * Auto-generated by scripts/enrich_academic_catalog.py",
        " */",
        "",
        'import { GraphNode, GraphEdge } from "../types/catalog.types";',
        "",
        "export const GRAPH_NODES: GraphNode[] = ["
    ]

    for n in nodes:
        lines.append("  {")
        lines.append(f'    id: "{n["id"]}",')
        lines.append(f'    topicId: "{n["topicId"]}",')
        lines.append(f'    label: {json.dumps(n["label"], ensure_ascii=False)},')
        lines.append(f'    domainId: "{n["domainId"]}",')
        lines.append(f'    domain: "{n["domain"]}",')
        lines.append(f'    category: "{n["category"]}",')
        lines.append(f'    level: "{n["level"]}",')
        lines.append(f'    score: {n["score"]},')
        lines.append(f'    masteryScore: {n["masteryScore"]},')
        lines.append(f'    x: "{n["x"]}",')
        lines.append(f'    y: "{n["y"]}",')
        lines.append(f'    color: "{n["color"]}",')
        lines.append(f'    difficulty: {n["difficulty"]},')
        lines.append(f'    prerequisites: {json.dumps(n["prerequisites"])}')
        lines.append("  },")

    lines.extend([
        "];",
        "",
        "export const KNOWLEDGE_GRAPH_NODES = GRAPH_NODES;",
        "",
        "export const GRAPH_EDGES: GraphEdge[] = ["
    ])

    for e in edges:
        lines.append(f'  {{ id: "{e["id"]}", source: "{e["source"]}", target: "{e["target"]}", relationType: "{e["relationType"]}", relationship: "{e["relationship"]}" }},')

    lines.extend([
        "];",
        "",
        "export const KNOWLEDGE_GRAPH_EDGES = GRAPH_EDGES;",
        "",
        "export function getKnowledgeGraph() {",
        "  return {",
        "    nodes: GRAPH_NODES,",
        "    edges: GRAPH_EDGES",
        "  };",
        "}"
    ])

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[Generated] Knowledge graph: {filepath} ({len(nodes)} nodes, {len(edges)} edges)")

def write_sql_seed(topics: List[TopicDefinition], edges: List[GraphEdge], filepath: str) -> None:
    """Emits clean idempotent SQL seed script for PostgreSQL and Supabase."""
    sql_lines = [
        "-- ============================================================================",
        "-- Supabase PostgreSQL Production Academic Seed Script",
        "-- Auto-generated by scripts/enrich_academic_catalog.py",
        "-- Covers 4 Domains, 40 Academic Topics, and Knowledge Graph Directional Edges",
        "-- ============================================================================",
        "",
        "-- 1. Domains Table",
        "INSERT INTO public.domains (id, slug, name, description, icon, color_hex) VALUES",
        "  ('math', 'advanced-mathematics', 'Toán Cao Cấp & Đại Số', 'Giải tích nhiều biến, Đại số tuyến tính, Tối ưu hóa vi phân', 'Sigma', '#3b82f6'),",
        "  ('discrete', 'discrete-mathematics', 'Toán Rời Rạc & Đồ Thị', 'Lý thuyết đồ thị, Logic mệnh đề, Cây bao trùm', 'Network', '#10b981'),",
        "  ('cv', 'computer-vision', 'Thị Giác Máy Tính', 'Mạng tích chập CNN, Phát hiện biên cạnh, YOLO, Vision Transformers', 'Eye', '#8b5cf6'),",
        "  ('cs', 'computer-science-systems', 'Khoa Học Máy Tính & Hệ Thống', 'Quản lý bộ nhớ con trỏ, Docker, Deadlock, B-Tree, Định lý CAP', 'Cpu', '#f59e0b')",
        "ON CONFLICT (id) DO UPDATE SET",
        "  name = EXCLUDED.name,",
        "  description = EXCLUDED.description,",
        "  icon = EXCLUDED.icon,",
        "  color_hex = EXCLUDED.color_hex;",
        "",
        "-- 2. Academic Topics Table",
        "INSERT INTO public.topics (id, domain_id, slug, title, description, difficulty, estimated_duration_minutes) VALUES"
    ]

    topic_values = []
    for t in topics:
        clean_desc = t.ground_truth_vi.replace("'", "''")
        clean_title = t.title_vi.replace("'", "''")
        topic_values.append(f"  ('{t.id}', '{t.domain_id}', '{t.slug}', '{clean_title}', '{clean_desc}', '{t.difficulty}', 45)")
    sql_lines.append(",\n".join(topic_values))
    sql_lines.extend([
        "ON CONFLICT (id) DO UPDATE SET",
        "  title = EXCLUDED.title,",
        "  description = EXCLUDED.description,",
        "  difficulty = EXCLUDED.difficulty;",
        "",
        "-- 3. Knowledge Graph Directional Edges Table",
        "INSERT INTO public.topic_graph_edges (source_topic_id, target_topic_id, relationship_type) VALUES"
    ])

    edge_values = []
    for e in edges:
        source = e["source"] if isinstance(e, dict) else e.source
        target = e["target"] if isinstance(e, dict) else e.target
        rel = e["relationship"] if isinstance(e, dict) else e.relationship
        edge_values.append(f"  ('{source}', '{target}', '{rel}')")
    sql_lines.append(",\n".join(edge_values))
    sql_lines.extend([
        "ON CONFLICT (source_topic_id, target_topic_id, relationship_type) DO NOTHING;",
        "",
        "-- Verification Query",
        "SELECT d.name as domain, COUNT(t.id) as topic_count",
        "FROM public.domains d",
        "LEFT JOIN public.topics t ON d.id = t.domain_id",
        "GROUP BY d.id, d.name;",
        ""
    ])

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"[Generated] PostgreSQL SQL Seed: {filepath}")

# ---------------------------------------------------------------------------
# Main Pipeline Entrypoint
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("Starting Academic Data Enrichment Pipeline...")
    print("=" * 70)

    # 1. Enrich with Wikipedia live REST API
    print(f"Connecting to Wikipedia REST API to verify {len(RAW_TOPICS)} academic topics...")
    with httpx.Client() as client:
        for idx, topic in enumerate(RAW_TOPICS, 1):
            print(f"[{idx:02d}/{len(RAW_TOPICS):02d}] Verifying {topic.title_en}...")
            fetch_wikipedia_metadata(client, topic)
            time.sleep(0.05)  # Respect API rate limits

    # 2. Generate Graph Topology
    print("\nComputing Knowledge Graph topology coordinates and edges...")
    nodes, edges = generate_graph_topology(RAW_TOPICS)

    # 3. Output paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ts_catalog_path = os.path.join(base_dir, "src", "data", "academic-catalog.data.ts")
    ts_graph_path = os.path.join(base_dir, "src", "data", "knowledge-graph.data.ts")
    sql_seed_path = os.path.join(base_dir, "supabase", "seed.sql")

    # 4. Write artifacts
    print("\nWriting production-ready data artifacts...")
    write_typescript_catalog(RAW_TOPICS, ts_catalog_path)
    write_typescript_graph(nodes, edges, ts_graph_path)
    write_sql_seed(RAW_TOPICS, edges, sql_seed_path)

    print("\n" + "=" * 70)
    print("Academic Data Enrichment Pipeline COMPLETED SUCCESSFULLY!")
    print(f"  • Total Topics: {len(RAW_TOPICS)} across 4 domains")
    print(f"  • Graph Nodes: {len(nodes)} | Edges: {len(edges)}")
    print(f"  • TypeScript Catalog: {ts_catalog_path}")
    print(f"  • Knowledge Graph: {ts_graph_path}")
    print(f"  • Database Seed: {sql_seed_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
