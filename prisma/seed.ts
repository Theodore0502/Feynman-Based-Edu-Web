/**
 * File: prisma/seed.ts
 * Mục đích: Nạp dữ liệu mẫu khởi tạo (Database Seeding) cho toàn bộ 12 bảng của Feynman Technique Stage, tập trung vào Toán Cao Cấp, Toán Rời Rạc, Thị Giác Máy Tính và KHMT.
 * Các phân hệ được nạp dữ liệu:
 *   1. Profiles & UserAiConfigs (Người dùng & Cấu hình AI)
 *   2. AcademicDomains, AcademicTopics, TopicEdges, AcademicMaterials (Đồ thị Tri thức & RAG)
 *   3. Personas, LearningSessions, SessionMessages, AgentAnalysisLogs (AI Personas & Phiên học Live)
 *   4. EvaluationReports, JargonVaultCards (Thẻ điểm Feynman & Kho ôn tập SM-2)
 */

import { PrismaClient } from "@prisma/client";
import { DOMAINS_CATALOG, TOPICS_CATALOG } from "../src/data/academic-catalog.data";
import { GRAPH_EDGES } from "../src/data/knowledge-graph.data";

const prisma = new PrismaClient();

// Các ID cố định chuẩn UUID để bảo đảm tính nhất quán của quan hệ
const USER_1_ID = "a0000000-0000-0000-0000-000000000001";
const USER_2_ID = "a0000000-0000-0000-0000-000000000002";

const PERSONA_CHILD_ID = "d0000000-0000-0000-0000-000000000001";
const PERSONA_NONTECH_ID = "d0000000-0000-0000-0000-000000000002";
const PERSONA_FARMER_ID = "d0000000-0000-0000-0000-000000000003";

const SESSION_1_ID = "e0000000-0000-0000-0000-000000000001";
const MSG_1_ID = "f0000000-0000-0000-0000-000000000001";
const MSG_2_ID = "f0000000-0000-0000-0000-000000000002";

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu Toán học, Thị giác máy tính & KHMT (12 bảng)...");

  // ==============================================================================
  // 1. ACADEMIC DOMAINS (Lĩnh vực Học thuật: Toán cao cấp, Toán rời rạc, CV, KHMT)
  // ==============================================================================
  const domainMap: Record<string, string> = {};

  for (const dom of DOMAINS_CATALOG) {
    const created = await prisma.academicDomain.upsert({
      where: { slug: dom.slug },
      update: {
        name: dom.name,
        description: dom.description,
        iconName: dom.iconName,
      },
      create: {
        slug: dom.slug,
        name: dom.name,
        description: dom.description,
        iconName: dom.iconName,
      },
    });
    domainMap[dom.id] = created.id;
  }

  console.log(`✅ 1/12 AcademicDomains: Đã nạp ${DOMAINS_CATALOG.length} ngành học thuật.`);

  // ==============================================================================
  // 2. PROFILES (Hồ sơ người dùng)
  // ==============================================================================
  const primaryDomainId = Object.values(domainMap)[0];

  const user1 = await prisma.profile.upsert({
    where: { email: "theodore@feynmanstage.edu" },
    update: {},
    create: {
      id: USER_1_ID,
      email: "theodore@feynmanstage.edu",
      fullName: "Theodore Vũ",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      primaryDomainId,
      streakCount: 7,
      totalXp: 1450,
    },
  });

  const user2 = await prisma.profile.upsert({
    where: { email: "lan.nguyen@example.com" },
    update: {},
    create: {
      id: USER_2_ID,
      email: "lan.nguyen@example.com",
      fullName: "Lan Nguyễn",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      primaryDomainId,
      streakCount: 3,
      totalXp: 520,
    },
  });

  console.log("✅ 2/12 Profiles hoàn tất.");

  // ==============================================================================
  // 3. USER AI CONFIGS (Cấu hình AI cá nhân hóa)
  // ==============================================================================
  await prisma.userAiConfig.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      preferredLanguage: "vi-VN",
      voiceGender: "female",
      speechRate: 1.0,
      defaultDifficulty: "MEDIUM",
      customModelProvider: "gemini",
      customModelName: "gemini-1.5-flash",
    },
  });

  await prisma.userAiConfig.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      preferredLanguage: "vi-VN",
      voiceGender: "male",
      speechRate: 1.1,
      defaultDifficulty: "HARD",
      customModelProvider: "openai",
      customModelName: "gpt-4o-mini",
    },
  });

  console.log("✅ 3/12 UserAiConfigs hoàn tất.");

  // ==============================================================================
  // 4. ACADEMIC TOPICS (Danh mục bài học Toán học & CNTT kèm Ground Truth)
  // ==============================================================================
  const topicMap: Record<string, string> = {};

  for (const topic of TOPICS_CATALOG) {
    const targetDomainId = domainMap[topic.domainId] || primaryDomainId;
    const createdTopic = await prisma.academicTopic.upsert({
      where: { slug: topic.slug },
      update: {
        title: topic.title,
        summary: topic.summary,
        difficultyLevel: topic.difficultyLevel,
        requiredConcepts: topic.requiredConcepts,
        commonJargons: topic.jargonTraps.map((j) => j.term),
      },
      create: {
        domainId: targetDomainId,
        title: topic.title,
        slug: topic.slug,
        summary: topic.summary,
        difficultyLevel: topic.difficultyLevel,
        requiredConcepts: topic.requiredConcepts,
        commonJargons: topic.jargonTraps.map((j) => j.term),
      },
    });
    topicMap[topic.id] = createdTopic.id;
  }

  console.log(`✅ 4/12 AcademicTopics: Đã nạp ${TOPICS_CATALOG.length} bài học chuẩn.`);

  // ==============================================================================
  // 5. TOPIC EDGES (Quan hệ Đồ thị Tri thức: Tiên quyết, Bao hàm)
  // ==============================================================================
  let edgeCount = 0;
  for (const edge of GRAPH_EDGES) {
    // Map từ node ID sang topic slug
    const sourceNodeId = edge.source.replace("node-", "topic-");
    const targetNodeId = edge.target.replace("node-", "topic-");

    const sourceTopicDbId = Object.entries(topicMap).find(([k]) => k.includes(sourceNodeId) || sourceNodeId.includes(k))?.[1];
    const targetTopicDbId = Object.entries(topicMap).find(([k]) => k.includes(targetNodeId) || targetNodeId.includes(k))?.[1];

    if (sourceTopicDbId && targetTopicDbId && sourceTopicDbId !== targetTopicDbId) {
      await prisma.topicEdge.upsert({
        where: {
          uq_topic_edge: {
            sourceTopicId: sourceTopicDbId,
            targetTopicId: targetTopicDbId,
          },
        },
        update: {
          relationType: edge.relationType,
        },
        create: {
          sourceTopicId: sourceTopicDbId,
          targetTopicId: targetTopicDbId,
          relationType: edge.relationType,
        },
      });
      edgeCount++;
    }
  }

  console.log(`✅ 5/12 TopicEdges: Đã nạp ${edgeCount} cạnh nối quan hệ tri thức.`);

  // ==============================================================================
  // 6. ACADEMIC MATERIALS (Tài liệu tham khảo RAG)
  // ==============================================================================
  const firstTopicId = Object.values(topicMap)[0];
  await prisma.academicMaterial.create({
    data: {
      topicId: firstTopicId,
      uploadedById: user1.id,
      title: "Giáo trình Toán Cao Cấp & Gradient Descent Deep Dive",
      sourceType: "TEXT_NOTE",
      extractedText:
        "Đạo hàm riêng và Gradient là chìa khóa của thuật toán tối ưu hóa trong Machine Learning. Thuật toán di chuyển ngược chiều vector đạo hàm riêng để đưa hàm mất mát về điểm cực tiểu toàn cục.",
    },
  });

  console.log("✅ 6/12 AcademicMaterials hoàn tất.");

  // ==============================================================================
  // 7. PERSONAS (Nhân vật AI người nghe)
  // ==============================================================================
  const personaChild = await prisma.persona.upsert({
    where: { slug: "child_10yo" },
    update: {},
    create: {
      id: PERSONA_CHILD_ID,
      slug: "child_10yo",
      name: "Bé Bo (10 tuổi)",
      roleBadge: "Tò mò & Hồn nhiên",
      avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150",
      systemPrompt:
        "Bạn là Bé Bo, một đứa trẻ 10 tuổi tò mò. Bạn không hiểu các từ ngữ phức tạp như 'đạo hàm', 'tích chập', 'ma trận'. Nếu người dùng dùng từ khó, hãy ngây thơ hỏi lại: 'Cái đó là cái gì hả chú? Nó có giống viên bi hay đồ chơi Lego không chú?'.",
      curiosityLevel: 95,
      preferredMetaphors: ["Đồ chơi Lego", "Hộp bút màu", "Sân chơi trường học", "Viên bi"],
      isSystemDefault: true,
    },
  });

  await prisma.persona.upsert({
    where: { slug: "non_tech" },
    update: {},
    create: {
      id: PERSONA_NONTECH_ID,
      slug: "non_tech",
      name: "Chị Mai (Trái ngành / Nhân sự)",
      roleBadge: "Thực tế & Trực quan",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      systemPrompt:
        "Bạn là Chị Mai, nhân sự không rành kỹ thuật. Bạn tư duy logic theo đời sống công sở hàng ngày. Luôn đòi hỏi người học giải thích bằng ví dụ công việc thực tế, căn bếp gia đình hoặc siêu thị.",
      curiosityLevel: 80,
      preferredMetaphors: ["Phòng ban công ty", "Bếp ăn gia đình", "Quy trình làm việc"],
      isSystemDefault: true,
    },
  });

  await prisma.persona.upsert({
    where: { slug: "farmer" },
    update: {},
    create: {
      id: PERSONA_FARMER_ID,
      slug: "farmer",
      name: "Bác Ba Nông Dân",
      roleBadge: "Chân chất & Bình dị",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      systemPrompt:
        "Bạn là Bác Ba, người làm ruộng Nam Bộ. Bạn thích so sánh mọi thứ trừu tượng với cây lúa, con trâu, bờ kênh, cái cuốc hay mùa gặt.",
      curiosityLevel: 85,
      preferredMetaphors: ["Ruộng lúa", "Kênh mương dẫn nước", "Đàn gà", "Cái cày"],
      isSystemDefault: true,
    },
  });

  console.log("✅ 7/12 Personas hoàn tất.");

  // ==============================================================================
  // 8. LEARNING SESSIONS (Phiên học Feynman)
  // ==============================================================================
  const session1 = await prisma.learningSession.upsert({
    where: { id: SESSION_1_ID },
    update: {},
    create: {
      id: SESSION_1_ID,
      userId: user1.id,
      topicId: firstTopicId,
      personaId: personaChild.id,
      customTopicTitle: "Giải thích Gradient Descent cho Bé Bo",
      difficulty: "MEDIUM",
      status: "COMPLETED",
      currentClarity: 88,
      turnCount: 4,
      durationSeconds: 360,
      startedAt: new Date(Date.now() - 3600 * 1000),
      completedAt: new Date(Date.now() - 3240 * 1000),
    },
  });

  console.log("✅ 8/12 LearningSessions hoàn tất.");

  // ==============================================================================
  // 9. SESSION MESSAGES (Lịch sử hội thoại)
  // ==============================================================================
  const msgUser = await prisma.sessionMessage.upsert({
    where: { id: MSG_1_ID },
    update: {},
    create: {
      id: MSG_1_ID,
      sessionId: session1.id,
      role: "user",
      content:
        "Bé Bo ơi, Gradient Descent giống như việc mình bịt mắt đứng trên đỉnh đồi có nhiều sương mù. Muốn đi xuống thung lũng an toàn, mình dùng cây gậy dò xem hướng nào dốc xuống sâu nhất rồi bước một bước ngắn về hướng đó!",
    },
  });

  await prisma.sessionMessage.upsert({
    where: { id: MSG_2_ID },
    update: {},
    create: {
      id: MSG_2_ID,
      sessionId: session1.id,
      role: "assistant",
      content:
        "A con hiểu rồi! Thế nếu chú bước dài quá bị trượt chân lọt xuống cái hố nước ở giữa đồi thì làm sao hả chú?",
    },
  });

  console.log("✅ 9/12 SessionMessages hoàn tất.");

  // ==============================================================================
  // 10. AGENT ANALYSIS LOGS (Phân tích ngầm Tầng 1)
  // ==============================================================================
  await prisma.agentAnalysisLog.upsert({
    where: { messageId: msgUser.id },
    update: {},
    create: {
      messageId: msgUser.id,
      jargonsDetected: [
        { term: "Gradient", isExplainedSimply: true, reason: "Đã so sánh với người dò gậy tìm hướng dốc xuống đồi" },
      ],
      logicGapFound: "Chưa giải thích rõ độ dài bước chân (Learning rate) ảnh hưởng thế nào nếu bước quá dài",
      detectedAnalogy: "Người leo đồi bịt mắt dò gậy tìm hướng dốc xuống thung lũng",
      turnClarityScore: 88,
      conceptsCovered: ["Gradient", "Step size", "Local minima"],
    },
  });

  console.log("✅ 10/12 AgentAnalysisLogs hoàn tất.");

  // ==============================================================================
  // 11. EVALUATION REPORTS (Feynman Mastery Card)
  // ==============================================================================
  await prisma.evaluationReport.upsert({
    where: { sessionId: session1.id },
    update: {},
    create: {
      sessionId: session1.id,
      clarityScore: 88,
      logicCompleteness: 92,
      accuracyScore: 85,
      bestAnalogy:
        "Gradient Descent giống như người leo đồi bịt mắt dùng gậy dò hướng dốc nhất để bước từng bước ngắn xuống thung lũng.",
      knowledgeGaps: [
        "Cần giải thích thêm hiện tượng Learning Rate quá lớn khiến thuật toán nhảy vọt qua điểm tối ưu",
      ],
      summaryFeedback:
        "Bạn đã nắm vững tinh thần Feynman! Khả năng liên tưởng hình ảnh người đi trong sương mù giúp trẻ nhỏ hiểu ngay bản chất của việc tìm cực tiểu hàm số mà không bị choáng ngợp bởi công thức đạo hàm.",
      shareToken: "feynman-gradient-demo-token-88",
    },
  });

  console.log("✅ 11/12 EvaluationReports hoàn tất.");

  // ==============================================================================
  // 12. JARGON VAULT CARDS (Kho thẻ từ vựng & Ôn tập ngắt quãng SM-2)
  // ==============================================================================
  await prisma.jargonVaultCard.createMany({
    data: [
      {
        userId: user1.id,
        topicId: firstTopicId,
        jargonTerm: "Gradient Descent",
        plainExplanation:
          "Thuật toán lặp từng bước nhỏ ngược chiều độ dốc của hàm sai số để tìm điểm đáy cực tiểu thấp nhất.",
        analogyUsed: "Người leo núi bịt mắt dò gậy tìm hướng dốc xuống để đi về thung lũng an toàn.",
        masteryLevel: 4,
        nextReviewAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      },
      {
        userId: user1.id,
        topicId: firstTopicId,
        jargonTerm: "Tích chập (Convolution Kernel)",
        plainExplanation:
          "Thao tác trượt ma trận nhỏ trên ảnh để nhân cộng các điểm ảnh xung quanh, giúp máy tính nhận ra góc cạnh và đường viền.",
        analogyUsed: "Chiếc kính râm có kính lọc đặc biệt chỉ làm sáng rực lên sợi râu và đôi tai của con mèo.",
        masteryLevel: 3,
        nextReviewAt: new Date(Date.now() + 1 * 24 * 3600 * 1000),
      },
      {
        userId: user1.id,
        topicId: firstTopicId,
        jargonTerm: "Đồ thị & Dijkstra",
        plainExplanation:
          "Mô hình mạng lưới gồm các điểm giao lộ và đoạn đường. Thuật toán luôn chọn rẽ vào ngõ có khoảng cách ngắn nhất trước mặt.",
        analogyUsed: "Đợt sóng nước loang tròn từ tâm hồ: điểm nào gần nhất sẽ đón nhận nước trước tiên.",
        masteryLevel: 2,
        nextReviewAt: new Date(Date.now() + 1 * 24 * 3600 * 1000),
      },
    ],
  });

  console.log("✅ 12/12 JargonVaultCards hoàn tất.");
  console.log("🎉 Toàn bộ dữ liệu mẫu 4 ngành học thuật & 12 bảng đã sẵn sàng!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi trong quá trình Seed cơ sở dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
