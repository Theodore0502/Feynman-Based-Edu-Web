# PROJECT SPECIFICATION & IMPLEMENTATION PLAN: "Feynman Technique Stage" (Fast-MVP)

## 1. Project Overview
Build a full-stack web application called **"Feynman Technique Stage"**—an interactive learning platform where users learn deeply by explaining concepts to an AI Agent. Instead of giving answers, the AI acts as a curious novice persona (e.g., a 10-year-old child, a non-tech career switcher, or a pragmatic farmer) and uses the Socratic method to expose jargon and logic gaps in the user's explanation.

## 2. Tech Stack & Architecture
- **Framework:** Next.js 14+ (App Router), TypeScript.
- **Styling & UI:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **AI & Agent Orchestration:** Vercel AI SDK (`ai`, `@ai-sdk/openai` or compatible provider) using `streamText` and structured output (`generateObject` / `tool` calling).
- **Voice Input (Optional/Fast-MVP):** Browser native `Web Speech API` (`webkitSpeechRecognition`) for zero-latency Speech-to-Text.
- **Database & ORM:** PostgreSQL with Prisma ORM (or SQLite for rapid local prototyping).

## 3. Database Schema (`prisma/schema.prisma`)
Create a clean schema with the following models:
- `Session`:
  - `id` (String, UUID/CUID)
  - `topic` (String) - The concept being explained (e.g., "Docker Containers", "Inflation").
  - `persona` (String) - Selected AI role (`child_10yo`, `non_tech`, `farmer`).
  - `status` (String) - `ACTIVE` | `COMPLETED`.
  - `createdAt` (DateTime)
  - `messages` (Relation to `Message[]`)
  - `report` (Relation to `EvaluationReport?`)
- `Message`:
  - `id` (String)
  - `sessionId` (String)
  - `role` (String) - `user` | `assistant`
  - `content` (String)
  - `analysisMetadata` (Json, Nullable) - Stores hidden output from background analytical tools (`jargonDetected`, `logicGaps`, `clarityScore`).
  - `createdAt` (DateTime)
- `EvaluationReport` (Feynman Mastery Card):
  - `id` (String)
  - `sessionId` (String, Unique)
  - `clarityScore` (Int) - 0 to 100
  - `logicCompleteness` (Int) - 0 to 100
  - `bestAnalogy` (String)
  - `knowledgeGaps` (Json) - Array of strings detailing weak points
  - `summaryFeedback` (String)

## 4. Agent Architecture (Level 2/3 Tool-Augmented Pipeline)
Every time the user submits an explanation turn, the backend API (`/api/chat`) must execute a 2-layer pipeline:

### Layer 1: Background Analytical Engine (Structured Output / Tool Call)
Before generating the conversational reply, analyze the user's message and conversation history to return a structured JSON object:
1. `JargonDetector`: List technical/academic terms used by the user that have NOT been explained in plain language yet (`[{ term: string, isExplainedSimply: boolean }]`).
2. `LogicGapFinder`: Identify any leap in logic where "Step A leads to Step B" without explaining "How/Why" (`missingLink: string | null`).
3. `ClarityEvaluator`: Current turn clarity score (0-100) and boolean `isReadyToComplete` (true if user has explained the core concept clearly across 3-5 turns without unresolved jargon).

### Layer 2: Persona Response Generator (Streaming Text)
Pass the output from Layer 1 dynamically into the System Prompt of the Persona Generator:
- **Rules for Persona:**
  1. Never pretend to understand unclarified jargon flagged by `JargonDetector`. Ask what it means using everyday objects.
  2. Probe the exact `missingLink` flagged by `LogicGapFinder`.
  3. Ask a MAXIMUM of 1-2 short, punchy questions per turn. Never lecture or give away the definition.
  4. Stay strictly in character (`child_10yo`: uses toy/school/cartoon analogies; `non_tech`: focuses on practical real-world utility; `farmer`: uses nature/crop/harvest analogies).

### On-Demand Tool: `AnalogySuggester` (`/api/hint`)
When the user clicks "I'm stuck / Give me an analogy hint":
- Input: Current `topic`, `persona`, and the specific `jargon` or concept the user is struggling with.
- Output: 2 relatable, everyday metaphors tailored to the active persona so the user can borrow them to continue teaching.

### Session Finisher: `MasteryCardGenerator` (`/api/session/[id]/complete`)
Triggered after 3-5 turns or when the user clicks "Finish & Evaluate":
- Analyzes the entire transcript and generates the `EvaluationReport` (Clarity Score, Logic Completeness, Best Analogy used by the user, and 1-2 Knowledge Gaps to review).

## 5. UI/UX Requirements
1. **Onboarding / Setup View (`/`)**:
   - Topic input field with quick-select badges (e.g., "How Docker Works", "QuickSort Algorithm", "Economic Inflation", "REST API").
   - Persona selector cards with distinct avatars and descriptions.
2. **Stage View (`/session/[id]`)**:
   - **Left/Main Panel (The Stage):** Chat interface with voice dictation toggle button (Web Speech API mic button) + text input.
   - **Right Side Panel (Real-time Analyzer Inspector):** Live feedback showing detected Jargon Badges (Red = Unexplained, Green = Explained Simply) and a live "Clarity Meter" progress bar.
   - **Bottom Action Bar:** "Need an Analogy Hint" button and "End Stage & Get Mastery Card" button.
3. **Summary View (Modal or `/session/[id]/report`)**:
   - Displays the **"Feynman Mastery Card"** with radial progress charts for Clarity & Logic scores, highlighted quote of the user's Best Analogy, and actionable bullet points for gaps to review.

## 6. Step-by-Step Execution Plan for Agent
Please build this application iteratively in the following order:
- **Step 1:** Initialize Next.js project with Tailwind, Shadcn UI components, and Prisma schema (use SQLite `file:./dev.db` for immediate zero-config testing).
- **Step 2:** Create the Prompt & Agent Service (`src/lib/agent/feynman-engine.ts`) implementing the 2-layer analysis (`JargonDetector` + `LogicGapFinder`), Persona System Prompts, `AnalogySuggester`, and `MasteryCardGenerator`.
- **Step 3:** Build API routes (`/api/session`, `/api/chat`, `/api/hint`, `/api/complete`).
- **Step 4:** Build the Frontend UI (Topic/Persona Selector, Split-screen Stage View with live Jargon tracker, Web Speech API hook, and Mastery Card Report view).
- **Step 5:** Seed 1 sample completed session so the UI and Mastery Card can be previewed immediately.