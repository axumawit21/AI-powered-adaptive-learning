# Product Requirements Specification (PRS)

## Adaptive Learning Platform - Feature Enhancement

**Version:** 1.0  
**Date:** December 5, 2024  
**Status:** Draft

---

## Executive Summary

This document outlines requirements for 6 major features to enhance the adaptive learning platform, focusing on intelligent content retrieval, interactive learning tools, and comprehensive progress tracking.

---

## Feature 1: Enhanced Book Preprocessing

### 1.1 Overview

Restructure preprocessing to store **grade ID** and **subject ID** with each chunk, enabling cross-book queries (e.g., "all Biology content from Grade 9-12").

### 1.2 Requirements

#### Data Structure

| Field           | Type     | Description               |
| --------------- | -------- | ------------------------- |
| `bookId`        | ObjectId | Reference to Book         |
| `gradeId`       | ObjectId | Reference to Grade        |
| `subjectId`     | ObjectId | Reference to Subject      |
| `unitNumber`    | Number   | e.g., `1`, `2`, `3`       |
| `unitTitle`     | String   | e.g., "Cell Biology"      |
| `subunitNumber` | String   | e.g., `1.1`, `1.2`, `2.1` |
| `subunitTitle`  | String   | e.g., "Cell Structure"    |
| `chunkIndex`    | Number   | Order within subunit      |
| `text`          | String   | Chunk content             |

#### Flexible Query Support

Students can search using any of these formats:

```
✅ Unit 1                    → unitNumber = 1
✅ "Cell Biology"            → unitTitle LIKE '%Cell Biology%'
✅ 1.1                       → subunitNumber = '1.1'
✅ "Cell Structure"          → subunitTitle LIKE '%Cell Structure%'
✅ Grade 9-12, Biology       → gradeId IN [...] AND subjectId = '...'
```

#### Qdrant Payload Structure

```json
{
  "bookId": "...",
  "gradeId": "...",
  "subjectId": "...",
  "gradeNumber": 10,
  "subjectTitle": "Biology",
  "unitNumber": 1,
  "unitTitle": "Cell Biology",
  "subunitNumber": "1.2",
  "subunitTitle": "Cell Membrane",
  "chunkIndex": 3,
  "text": "The cell membrane is..."
}
```

### 1.3 API Changes

| Endpoint                   | Method | Description                        |
| -------------------------- | ------ | ---------------------------------- |
| `POST /preprocess/:bookId` | POST   | Preprocess with new structure      |
| `GET /chunks/search`       | GET    | Query chunks with flexible filters |

---

## Feature 2: Smart Summary Generation

### 2.1 Overview

Generate AI summaries for selected units/subunits with multiple selection methods.

### 2.2 Requirements

#### Selection Methods

1. **Dropdown Selection**: Select unit from book structure
2. **Text Input**: Type unit number (`1`, `1.1`) or title ("Cell Biology")
3. **Persist Selection**: Remember selected unit for subsequent actions

#### Summary Output

- **Title**: Unit/subunit name
- **Key Points**: Bullet list (5-8 items)
- **Summary**: 2-3 paragraph narrative
- **Visual Elements**: Diagrams/tables when relevant

#### UI Flow

```
[Select Grade] → [Select Subject] → [Select Unit/Subunit OR Type in textarea]
                                              ↓
                                    [Click "Generate Summary"]
                                              ↓
                                    [Display Formatted Summary]
```

### 2.3 API

| Endpoint                 | Method | Body                                                |
| ------------------------ | ------ | --------------------------------------------------- | ------------ |
| `POST /summary/generate` | POST   | `{ gradeId, subjectId, unitIdentifier, type: 'unit' | 'subunit' }` |

**unitIdentifier**: Can be number (`1`), subunit (`1.1`), or title string.

---

## Feature 3: Interactive Quiz System

### 3.1 Overview

Generate quizzes with configurable question count, hint system, and motivational feedback.

### 3.2 Requirements

#### Quiz Configuration

| Setting              | Default | Description                            |
| -------------------- | ------- | -------------------------------------- |
| Question Count       | 5       | Student can input custom number        |
| Options per Question | 4       | Fixed A, B, C, D                       |
| Max Attempts         | 2       | Hint after 1st wrong, answer after 2nd |

#### Answer Flow

```
[Student Answers]
       ↓
   Correct? ──Yes──→ ✅ "🎉 Great job! Amazing work!"
       ↓ No
   [Show Hint] + "💡 Try again, you're close!"
       ↓
[Student Answers Again]
       ↓
   Correct? ──Yes──→ ✅ "👏 You got it on the second try!"
       ↓ No
   [Show Correct Answer + Explanation]
   "📚 The answer is B. Here's why: ..."
   "💪 Don't worry, keep learning!"
```

#### Motivational Messages (Examples)

- Correct 1st try: "🌟 Brilliant! You're a fast learner!"
- Correct 2nd try: "✨ Persistence pays off! Well done!"
- Wrong: "📖 Every mistake is a lesson. Keep going!"
- Quiz Complete: "🏆 Quiz complete! You scored X/Y. You're improving!"

#### Selection Methods

Same as Summary: dropdown OR text input for unit/subunit.

### 3.3 API

| Endpoint                    | Method | Description                                                                |
| --------------------------- | ------ | -------------------------------------------------------------------------- |
| `POST /quiz/generate`       | POST   | Generate quiz with `{ gradeId, subjectId, unitIdentifier, numQuestions? }` |
| `POST /quiz-session/start`  | POST   | Start interactive session                                                  |
| `POST /quiz-session/answer` | POST   | Submit answer, get hint/result                                             |
| `POST /quiz-session/next`   | POST   | Get next question                                                          |

---

## Feature 4: Chat History Sidebar

### 4.1 Overview

Persist and display chat conversations in a sidebar for easy reference.

### 4.2 Requirements

#### Data Model

```typescript
interface ChatSession {
  _id: ObjectId;
  studentId: ObjectId;
  title: string; // Auto-generated from first message
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    // Optional learning context
    gradeId?: ObjectId;
    subjectId?: ObjectId;
    unitNumber?: number;
  };
}
```

#### UI Components

- **Sidebar List**: Shows recent chats (title + date)
- **Search**: Filter chats by keyword
- **Actions**: New chat, delete chat, rename chat
- **Auto-title**: First user message becomes title (truncated to 50 chars)

### 4.3 API

| Endpoint                        | Method | Description                  |
| ------------------------------- | ------ | ---------------------------- |
| `GET /chat/history`             | GET    | List student's chat sessions |
| `GET /chat/:sessionId`          | GET    | Get single session messages  |
| `POST /chat/session`            | POST   | Create new session           |
| `POST /chat/:sessionId/message` | POST   | Add message to session       |
| `DELETE /chat/:sessionId`       | DELETE | Delete session               |

---

## Feature 5: Progress Tracking Dashboard

### 5.1 Overview

Track and display student learning progress: time spent, quiz results, by book/subject/unit.

### 5.2 Requirements

#### Metrics Tracked

| Metric          | Granularity           | Storage                 |
| --------------- | --------------------- | ----------------------- |
| Time Spent      | Per book, per session | Aggregated daily        |
| Quiz Scores     | Per quiz attempt      | All attempts stored     |
| Units Completed | Per book              | Based on quiz pass rate |

#### Data Model

```typescript
interface StudentProgress {
  studentId: ObjectId;
  bookId: ObjectId;
  gradeId: ObjectId;
  subjectId: ObjectId;

  timeSpent: {
    total: number; // Total minutes
    daily: DailyTime[]; // { date, minutes }
  };

  quizResults: QuizResult[]; // All attempts

  unitsProgress: {
    unitNumber: number;
    unitTitle: string;
    status: 'not_started' | 'in_progress' | 'completed';
    bestScore: number;
  }[];
}

interface QuizResult {
  quizId: ObjectId;
  unitNumber: number;
  score: number;
  totalQuestions: number;
  attemptDate: Date;
  answers: { questionIndex: number; correct: boolean }[];
}
```

#### Sidebar Display

```
📚 Progress Dashboard
├── 📖 Biology (Grade 10)
│   ├── ⏱️ Time: 4h 30m
│   ├── 📊 Quizzes: 8/10 passed
│   └── 📈 Units: 5/8 completed
├── 📖 Chemistry (Grade 10)
│   └── ...
```

### 5.3 API

| Endpoint                           | Method | Description                |
| ---------------------------------- | ------ | -------------------------- |
| `GET /progress/overview`           | GET    | Student's overall progress |
| `GET /progress/book/:bookId`       | GET    | Progress for specific book |
| `GET /progress/subject/:subjectId` | GET    | Progress by subject        |
| `PATCH /progress/time`             | PATCH  | Log study time             |

---

## Feature 6: Exam & Skill Level Assessment

### 6.1 Overview

Comprehensive exams per subject/unit with varied question formats and skill level announcements.

### 6.2 Requirements

#### Question Formats

| Format            | Description                     |
| ----------------- | ------------------------------- |
| Multiple Choice   | 4 options, single correct       |
| True/False        | Binary choice                   |
| Fill in the Blank | Text input, keyword matching    |
| Matching          | Connect related items           |
| Short Answer      | Brief text response (AI-graded) |

#### Exam Structure

- **Per Unit**: 10-15 questions, mixed formats
- **Per Subject**: 30-50 questions, covers all units
- **Time Limit**: Optional (default: 1 min/question)

#### Skill Level Classification

| Score Range | Level                | Badge             |
| ----------- | -------------------- | ----------------- |
| 90-100%     | 🏆 Excellent         | "Subject Master"  |
| 80-89%      | ⭐ Clever            | "Quick Learner"   |
| 70-79%      | 📚 Good              | "Steady Progress" |
| 60-69%      | 📖 Fair              | "Keep Practicing" |
| <60%        | 💪 Needs Improvement | "Don't Give Up!"  |

#### Results Display

```
🎓 Exam Results: Biology - Cell Biology

Score: 85% (17/20)
Level: ⭐ CLEVER

📊 Performance Breakdown:
├── Multiple Choice: 90% ✅
├── True/False: 80% ✅
├── Fill in Blank: 75% ⚠️
└── Short Answer: 85% ✅

💡 Recommendation: Review "Cell Membrane Transport"
```

### 6.3 API

| Endpoint                    | Method | Description                                       |
| --------------------------- | ------ | ------------------------------------------------- | ------------ |
| `POST /exam/generate`       | POST   | Generate exam `{ subjectId, unitId?, type: 'unit' | 'subject' }` |
| `POST /exam/start`          | POST   | Start exam session                                |
| `POST /exam/submit`         | POST   | Submit all answers                                |
| `GET /exam/results/:examId` | GET    | Get detailed results                              |
| `GET /exam/history`         | GET    | Student's exam history                            |

---

## Database Schema Summary

### New Collections

1. **ChatSession** - Chat history storage
2. **ExamSession** - Exam attempts and results
3. **StudentProgress** - Enhanced progress tracking

### Modified Collections

1. **Book** - Ensure `gradeId`, `subjectId` refs populated
2. **Qdrant Chunks** - Add gradeId, subjectId, subunitNumber to payload

---

## Frontend Components

### Sidebar Additions

```
📱 Sidebar
├── 💬 Chat History (NEW)
├── 📊 Progress Dashboard (NEW)
├── 📝 Exam Center (NEW)
└── ⚙️ Settings
```

### Main Content Areas

1. **Summary View** - Unit selector + summary display
2. **Quiz View** - Interactive quiz with hints
3. **Exam View** - Timed exam interface
4. **Progress View** - Charts and statistics

---

## Priority & Phases

### Phase 1 (High Priority)

- [ ] Enhanced Preprocessing (gradeId, subjectId, subunits)
- [ ] Smart Summary with unit selection
- [ ] Interactive Quiz with hints

### Phase 2 (Medium Priority)

- [ ] Chat History sidebar
- [ ] Progress Tracking dashboard

### Phase 3 (Lower Priority)

- [ ] Exam system with skill levels

---

## Technical Considerations

1. **Backward Compatibility**: Migrate existing Qdrant data to new schema
2. **Performance**: Index gradeId, subjectId in Qdrant for fast filtering
3. **AI Prompts**: Design prompts for motivational feedback variety
4. **Time Tracking**: Use frontend heartbeat (every 30s) for accuracy
