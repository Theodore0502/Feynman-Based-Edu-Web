/**
 * File: src/lib/services/ontology-projector.ts
 * Mục đích: Chiếu xạ Tài liệu Học thuật vào Master Knowledge Graph của Môn học trên Supabase.
 * Giải quyết bài toán:
 *   - Các tài liệu khác nhau có trật tự sư phạm khác nhau (tác giả này xếp Đồ thị trước, tác giả kia xếp Cây trước).
 *   - OntologyProjector đối soát thực thể trong tài liệu với Cây Tri Thức Chuẩn (Master Graph)
 *     để tự động định vị độ khó, kiến thức tiên quyết và vị trí bài học trong lộ trình học tập.
 */

import { CurriculumService } from "@/lib/services/curriculum-service";
import { CatalogTopic } from "@/types/catalog.types";

export interface OntologyProjectionResult {
  subjectId: string;
  subjectName: string;
  matchedMasterTopics: Array<{
    id: string;
    title: string;
    orderIndex: number;
    difficultyLevel: number;
    matchScore: number;
  }>;
  prerequisiteTopics: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
  reinforcedTopics: string[];
  novelConcepts: string[];
  calculatedDifficulty: number; // 1 - 5
  suggestedRoadmapPosition: string; // Vị trí trong lộ trình học
}

export const OntologyProjector = {
  /**
   * Chiếu xạ tài liệu vào Đồ thị Tri thức Môn học trên Supabase
   */
  async projectToMasterGraph(params: {
    subjectId: string;
    documentTitle: string;
    extractedConcepts: string[];
    rawTextSnippet: string;
  }): Promise<OntologyProjectionResult> {
    const { subjectId, documentTitle, extractedConcepts, rawTextSnippet } = params;

    // 1. Truy vấn các bài học chuẩn của Môn học này từ Supabase
    let masterTopics: CatalogTopic[] = [];
    let subjectName = "Môn học";

    try {
      const allGraph = await CurriculumService.getAllCurriculumGraphData();
      const subject = allGraph.subjects.find((s) => s.id === subjectId);
      if (subject) {
        subjectName = subject.name;
      }
      masterTopics = allGraph.topics.filter((t) => t.subjectId === subjectId);
    } catch (e) {
      console.warn("Lỗi truy vấn Master Graph từ Supabase, dùng fallback:", e);
    }

    const docCombined = `${documentTitle} ${extractedConcepts.join(" ")} ${rawTextSnippet}`.toLowerCase();

    // 2. So khớp từng bài học trong Master Graph với nội dung tài liệu
    const scoredTopics = masterTopics.map((mt) => {
      let score = 0;
      const tLower = mt.title.toLowerCase();

      // Khớp tên bài học
      if (docCombined.includes(tLower)) {
        score += 40;
      }

      // Khớp các từ khóa của tên bài học
      const titleTokens = tLower.split(/\s+/).filter((w) => w.length >= 3);
      for (const tok of titleTokens) {
        if (docCombined.includes(tok)) {
          score += 6;
        }
      }

      // Khớp các required concepts của bài học chuẩn
      for (const c of mt.requiredConcepts) {
        if (docCombined.includes(c.toLowerCase())) {
          score += 15;
        }
      }

      return {
        id: mt.id,
        title: mt.title,
        orderIndex: mt.orderIndex || 1,
        difficultyLevel: mt.difficultyLevel || 2,
        matchScore: score,
      };
    });

    // Sắp xếp theo độ khớp
    scoredTopics.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scoredTopics.filter((t) => t.matchScore > 10).slice(0, 4);

    // 3. Xác định Kiến Thức Tiên Quyết (Prerequisites)
    // Nếu tài liệu khớp với bài học có order_index > 1, các bài học trước đó trong Master Graph là tiên quyết
    const prerequisiteTopics: Array<{ id: string; title: string; reason: string }> = [];
    let calculatedDifficulty = 2;

    if (topMatches.length > 0 && topMatches[0].matchScore >= 20) {
      const primaryMatch = topMatches[0];
      calculatedDifficulty = primaryMatch.difficultyLevel;

      if ((primaryMatch.orderIndex || 1) > 1) {
        // Tìm các bài học đứng trước trong Master Graph của môn này
        const priorTopics = masterTopics
          .filter((t) => (t.orderIndex || 1) < primaryMatch.orderIndex)
          .slice(-2); // Lấy 1-2 bài liền kề trước đó

        for (const pt of priorTopics) {
          prerequisiteTopics.push({
            id: pt.id,
            title: pt.title,
            reason: `Nền tảng tiên quyết về [${pt.title}] trước khi tiếp thu [${primaryMatch.title}].`,
          });
        }
      } else {
        prerequisiteTopics.push({
          id: "prereq-foundation",
          title: "Không yêu cầu tiên quyết",
          reason: `Đây là bài giảng khởi đầu nền tảng số 1 của môn [${subjectName}].`,
        });
      }
    } else {
      // Trường hợp tài liệu mới hoàn toàn chưa có trong Master Graph hoặc match score thấp
      calculatedDifficulty = Math.min(5, Math.max(1, Math.round(extractedConcepts.length / 2) || 2));
    }

    // 4. Xác định các bài học được củng cố (Reinforced Topics)
    const reinforcedTopics = topMatches.map((t) => t.title);

    // 5. Xác định các khái niệm mới bổ sung (Novel Concepts)
    const existingMasterConcepts = new Set(
      masterTopics.flatMap((t) => t.requiredConcepts.map((c) => c.toLowerCase()))
    );

    const novelConcepts = extractedConcepts.filter(
      (c) => !existingMasterConcepts.has(c.toLowerCase())
    );

    // 6. Gợi ý vị trí trong lộ trình học (Roadmap Position)
    let suggestedRoadmapPosition = "Bài học nền tảng khởi đầu môn học";
    if (topMatches.length > 0) {
      const best = topMatches[0];
      suggestedRoadmapPosition = `Thuộc chặng ${best.orderIndex}/${masterTopics.length || 15} của môn ${subjectName} (Khớp với bài giảng [${best.title}])`;
    }

    return {
      subjectId,
      subjectName,
      matchedMasterTopics: topMatches,
      prerequisiteTopics,
      reinforcedTopics,
      novelConcepts,
      calculatedDifficulty,
      suggestedRoadmapPosition,
    };
  },
};

