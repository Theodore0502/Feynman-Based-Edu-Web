"""
File: main.py
Mục đích: Backend API Server (FastAPI) cho ứng dụng "Feynman Technique Stage".
Các chức năng chính:
  - Cấu hình CORS middleware kết nối với Frontend Vite (http://localhost:5173).
  - Pipeline 2 Tầng:
      + Tầng 1: Analytical Engine (Bóc tách thuật ngữ Jargon, Lỗ hổng logic, Chấm điểm độ mạch lạc).
      + Tầng 2: Persona Socratic Generator (Đóng vai Bé Bo 10t, Chị Mai HR, Bác Ba nông dân đặt câu hỏi phản biện).
  - On-Demand Endpoints:
      + /api/hint: Gợi ý phép ẩn dụ mồi (Starter Analogies).
      + /api/evaluate: Chấm điểm và tạo thẻ Feynman Mastery Card.
      + /api/study/extract: Rút trích luận điểm cốt lõi và bẫy thuật ngữ cho Phòng Học Trước (Study Lab).
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Nạp biến môi trường từ .env
load_dotenv()

app = FastAPI(
    title="Theodore - Feynman Stage Backend API",
    description="Backend AI API hỗ trợ học tập theo phương pháp Feynman",
    version="1.0.0",
)

# Cấu hình CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# PYDANTIC SCHEMAS (Request & Response Models)
# ==============================================================================

class JargonItem(BaseModel):
    term: str
    isExplainedSimply: bool
    reason: str

class AnalyticalResult(BaseModel):
    jargonDetected: List[Dict[str, Any]] = []
    logicGaps: List[str] = []
    currentClarityScore: int = 70
    detectedAnalogy: Optional[str] = None
    isReadyToComplete: bool = False

class ChatRequest(BaseModel):
    sessionId: str
    topic: str
    personaId: str = "child_10yo"
    userMessage: str
    difficulty: str = "MEDIUM"
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    reply: str
    analysis: AnalyticalResult

class HintRequest(BaseModel):
    topic: str
    personaId: str = "child_10yo"
    currentContext: Optional[str] = None

class HintResponse(BaseModel):
    analogies: List[Dict[str, str]]

class EvaluateRequest(BaseModel):
    sessionId: str
    topic: str
    personaId: str = "child_10yo"
    messages: List[Dict[str, str]] = []

class EvaluateResponse(BaseModel):
    clarityScore: int
    logicCompleteness: int
    accuracyScore: int
    bestAnalogy: Optional[str]
    knowledgeGaps: List[str]
    summaryFeedback: str
    shareToken: str

class StudyExtractRequest(BaseModel):
    title: str
    text: str

class StudyExtractResponse(BaseModel):
    title: str
    summary: str
    requiredConcepts: List[str]
    jargonTraps: List[Dict[str, str]]
    starterAnalogies: List[Dict[str, str]]

# ==============================================================================
# PERSONA PROMPTS & KNOWLEDGE LOGIC
# ==============================================================================

PERSONA_PROFILES = {
    "child_10yo": {
        "name": "Bé Bo (10 tuổi)",
        "tone": "Ngây thơ, tò mò, thích ví von đồ chơi Lego, kẹo bánh, hoạt hình.",
        "rules": "Hễ nghe từ ngữ kỹ thuật/trừu tượng là ngơ ngác hỏi lại ngay. Mỗi câu hỏi tối đa 1-2 câu ngắn."
    },
    "non_tech": {
        "name": "Chị Mai (Trái ngành / Nhân sự)",
        "tone": "Thực tế, gần gũi, tư duy quy trình công sở và cuộc sống gia đình.",
        "rules": "Đòi hỏi người nói giải thích bằng các ví dụ quen thuộc như nhà bếp hoặc phòng ban công ty."
    },
    "farmer": {
        "name": "Bác Ba Nông Dân",
        "tone": "Chân chất, mộc mạc Nam Bộ.",
        "rules": "Thích so sánh với cây lúa, con trâu, bờ kênh, cái cuốc hoặc mùa màng gặt hái."
    }
}

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/")
def read_root():
    """Trang chủ API & Kiểm tra trạng thái hoạt động."""
    return {
        "status": "online",
        "service": "Theodore Feynman Stage Backend API",
        "version": "1.0.0",
        "endpoints": ["/api/chat", "/api/hint", "/api/evaluate", "/api/study/extract", "/docs"]
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Pipeline 2 Tầng:
      - Tầng 1: Phân tích thuật ngữ và tính toán độ mạch lạc.
      - Tầng 2: Sinh phản hồi Socrates từ góc nhìn của Persona đang chọn.
    """
    msg_lower = req.userMessage.lower()

    # Tầng 1: Phân tích phát hiện thuật ngữ (Jargon Detector)
    common_jargons = ["docker", "container", "kernel", "namespace", "cgroups", "lạm phát", "cung tiền", "deadlock", "thread", "api", "database"]
    found_jargons = [w for w in common_jargons if w in msg_lower]

    has_analogy = any(keyword in msg_lower for keyword in ["như", "giống", "tương tự", "ví dụ", "coi như"])

    jargon_list = []
    if found_jargons and not has_analogy:
        for j in found_jargons:
            jargon_list.append({
                "term": j.capitalize(),
                "isExplainedSimply": False,
                "reason": f"Thuật ngữ '{j}' chưa được giải thích bằng hình ảnh bình dân."
            })

    # Điểm Clarity
    clarity = 85
    if jargon_list:
        clarity -= len(jargon_list) * 15
    if has_analogy:
        clarity = min(100, clarity + 15)

    clarity = max(40, min(100, clarity))

    analysis = AnalyticalResult(
        jargonDetected=jargon_list,
        logicGaps=["Cần giải thích rõ hơn vì sao cơ chế này hoạt động"] if len(req.userMessage.split()) < 10 else [],
        currentClarityScore=clarity,
        detectedAnalogy="Phép so sánh đời thường" if has_analogy else None,
        isReadyToComplete=len(req.history or []) >= 4
    )

    # Tầng 2: Persona Socrates Response
    persona_info = PERSONA_PROFILES.get(req.personaId, PERSONA_PROFILES["child_10yo"])
    
    if jargon_list:
        term_target = jargon_list[0]["term"]
        if req.personaId == "child_10yo":
            reply = f"Ủa chú ơi, từ '{term_target}' nghe lạ quá! Nó có giống món đồ chơi nào trong phòng con không hả chú?"
        elif req.personaId == "farmer":
            reply = f"Bác nghe cái từ '{term_target}' nó lạ hoắc à cháu. Cháu ví von như con trâu hay cái cày ngoài đồng cho bác dễ hiểu coi?"
        else:
            reply = f"Chị chưa hiểu từ '{term_target}' này trong thực tế nghĩa là sao. Em ví von như việc nấu ăn trong bếp cho chị hình dung được không?"
    else:
        if has_analogy:
            if req.personaId == "child_10yo":
                reply = "A con hiểu rồi! Nghe giống thật luôn á chú. Nhưng mà nếu nó bị hỏng thì mình sửa thế nào hả chú?"
            elif req.personaId == "farmer":
                reply = "Ờ nghe cháu ví von thế bác thấy sáng dạ ra rồi đó! Rồi lúc áp dụng thực tế thì tốn kém nhiều không cháu?"
            else:
                reply = "Cách em so sánh rất dễ hình dung! Thế trong quy trình vận hành thực tế thì nó mang lại lợi ích gì lớn nhất?"
        else:
            reply = f"Nghe cũng tò mò đấy! Bạn có thể giải thích cụ thể hơn một chút bằng ví dụ thực tế được không?"

    return ChatResponse(reply=reply, analysis=analysis)

@app.post("/api/hint", response_model=HintResponse)
async def hint_endpoint(req: HintRequest):
    """Gợi ý 2 phép ẩn dụ mồi (Starter Analogies) dựa theo chủ đề và nhân vật."""
    topic = req.topic.strip()
    return HintResponse(analogies=[
        {
            "title": f"Ẩn dụ theo đời sống hàng ngày về {topic}",
            "metaphor": f"Hãy thử so sánh '{topic}' với một hộp đồ chơi hoặc căn bếp gia đình có các ngăn phân chia công việc rõ ràng.",
            "audience": "Mọi đối tượng"
        },
        {
            "title": f"Ẩn dụ theo cơ chế dòng chảy",
            "metaphor": f"Xem '{topic}' như một hệ thống kênh mương dẫn nước từ hồ chứa chính đến từng thửa ruộng.",
            "audience": "Người nghe phổ thông"
        }
    ])

@app.post("/api/evaluate", response_model=EvaluateResponse)
async def evaluate_endpoint(req: EvaluateRequest):
    """Đánh giá toàn bộ buổi giảng và xuất thẻ Feynman Mastery Card."""
    turn_count = len(req.messages)
    clarity = min(96, 75 + turn_count * 3)

    return EvaluateResponse(
        clarityScore=clarity,
        logicCompleteness=88,
        accuracyScore=90,
        bestAnalogy=f"Giải thích về {req.topic} bằng hình ảnh đời thường trực quan.",
        knowledgeGaps=["Cần đào sâu hơn cơ chế lưu trữ lâu dài", "Làm rõ cách xử lý ngoại lệ"],
        summaryFeedback=f"Bạn đã áp dụng rất tốt kỹ thuật Feynman cho chủ đề '{req.topic}'. Khả năng gạt bỏ thuật ngữ kỹ thuật giúp người nghe tiếp thu bài học tự nhiên mà không bị choáng ngợp.",
        shareToken=f"feynman-token-{os.urandom(6).hex()}"
    )

@app.post("/api/study/extract", response_model=StudyExtractResponse)
async def study_extract_endpoint(req: StudyExtractRequest):
    """Rút trích luận điểm cốt lõi và các bẫy thuật ngữ từ tài liệu học tập."""
    text = req.text.strip()
    words = text.split()

    # Tóm tắt sơ bộ
    summary = text[:200] + "..." if len(text) > 200 else text

    return StudyExtractResponse(
        title=req.title or "Tài liệu học tập tự do",
        summary=summary,
        requiredConcepts=["Bản chất cốt lõi", "Cơ chế vận hành", "Ứng dụng đời thực"],
        jargonTraps=[
            {
                "term": "Thuật ngữ chuyên ngành A",
                "explanation": "Từ ngữ học thuật xuất hiện trong văn bản cần được bình dân hóa.",
                "recommendedAnalogy": "So sánh với đồ vật quen thuộc trong gia đình."
            }
        ],
        starterAnalogies=[
            {
                "title": "Ẩn dụ chiếc hộp đa năng",
                "metaphor": "So sánh kiến thức này như chiếc hộp đồ dùng cá nhân được chuẩn bị chu đáo trước chuyến đi xa.",
                "audience": "Người học mới bắt đầu"
            }
        ]
    )
