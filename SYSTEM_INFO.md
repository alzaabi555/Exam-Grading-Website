# Exam Grading System - Documentation

## Overview
A comprehensive web-based exam grading system built with React, TypeScript, and TailwindCSS. This system allows educators to efficiently grade exam papers with a structured, ID-based approach.

## Core Features

### 1. **Paper Upload System**
- Upload complete exam papers as PDF files
- Divide answers into individual images by question and part
- Assign maximum scores to each answer part
- Automatic unique ID generation for all components

### 2. **Hierarchical ID Structure**
```
Paper (paper-{timestamp})
├── Question 1 (q1-paper-{timestamp})
│   ├── Part 1 (p1-q1-paper-{timestamp})
│   ├── Part 2 (p2-q1-paper-{timestamp})
│   └── Part 3 (p3-q1-paper-{timestamp})
├── Question 2 (q2-paper-{timestamp})
│   ├── Part 1 (p1-q2-paper-{timestamp})
│   └── Part 2 (p2-q2-paper-{timestamp})
└── Question 3 (q3-paper-{timestamp})
    └── Part 1 (p1-q3-paper-{timestamp})
```

Each component has a unique ID that maintains the relationship:
- **Paper ID**: Links to the entire exam submission
- **Question ID**: Links to specific question within a paper
- **Part ID**: Links to answer part within question and paper

### 3. **Grading Interface**
- Side-by-side view of PDF and answer images
- Scoring dialog with customizable mark distribution (e.g., 0-1-2-3 or any range)
- Navigation between papers with Next/Previous buttons
- Progress tracking for each paper
- Auto-save and session persistence
- Keyboard shortcuts for faster grading:
  - Number keys (0-9): Assign scores
  - Right Arrow: Next answer
  - Left Arrow: Previous answer

### 4. **Dashboard**
- Overview statistics (Total, Pending, In Progress, Completed)
- Complete paper listing with status badges
- Filter by exam status
- Quick access to grading and results
- Paper management (view, grade, delete)

### 5. **Student Results**
- Detailed score breakdown by question and part
- Visual representation with progress bars
- Letter grades and percentages
- Question-by-question analysis
- Color-coded performance indicators:
  - Green: Excellent (≥90%)
  - Blue: Good (70-89%)
  - Yellow: Average (50-69%)
  - Red: Below average (<50%)

### 6. **Mark Distribution Manager**
- Create reusable templates for recurring exams
- Define question structure and mark allocation
- Load templates when uploading new papers
- View and edit existing distributions

## Technical Architecture

### Data Structure
```typescript
interface ExamPaper {
  id: string;
  studentName: string;
  studentId: string;
  examName: string;
  pdfUrl: string;
  uploadDate: string;
  questions: Question[];
  totalMaxScore: number;
  totalScore?: number;
  gradedDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface Question {
  id: string;
  paperId: string;
  questionNumber: number;
  parts: AnswerPart[];
  totalMaxScore: number;
}

interface AnswerPart {
  id: string;
  questionId: string;
  paperId: string;
  partNumber: number;
  imageUrl: string;
  maxScore: number;
  score?: number;
}
```

### Storage
- **Local Storage**: Browser-based persistence (demo mode)
- **Sample Data**: Pre-loaded examples for demonstration
- **Session Management**: Auto-save grading progress

### Routing
- `/` - Upload Papers
- `/dashboard` - Main Dashboard
- `/grade` - Grading Interface
- `/results/:paperId` - Student Results
- `/mark-distribution` - Mark Distribution Manager

## Key Benefits

1. **Traceability**: Every component has a unique ID linked to its parent
2. **Efficiency**: Keyboard shortcuts and auto-advance reduce grading time
3. **Accuracy**: Structured scoring prevents errors
4. **Progress Tracking**: Visual indicators show completion status
5. **Reusability**: Templates reduce setup time for recurring exams
6. **Data Integrity**: Hierarchical structure maintains relationships

## Workflow

1. **Setup**: Create mark distribution template (optional)
2. **Upload**: Add student papers with PDFs and answer images
3. **Grade**: Use grading interface to score each answer part
4. **Review**: Check dashboard for progress and statistics
5. **Results**: View detailed student performance reports

## ID Linking Example

For a paper with ID `paper-1709123456789`:
- Question 1, Part 1 ID: `p1-q1-paper-1709123456789`
- Question 1, Part 2 ID: `p2-q1-paper-1709123456789`
- Question 2, Part 1 ID: `p1-q2-paper-1709123456789`

This naming convention ensures:
- **Unique identification** of every answer part
- **Traceable relationship** to parent question and paper
- **Easy sorting** and filtering by paper or question
- **Automated score compilation** at paper level

## Future Enhancements (for production)

1. **Backend Integration**: Replace localStorage with database (e.g., Supabase)
2. **PDF Rendering**: Integrate react-pdf for actual PDF display
3. **Bulk Upload**: Process multiple papers simultaneously
4. **Export Options**: Generate reports in PDF/CSV format
5. **Authentication**: Multi-user support with role-based access
6. **Analytics**: Advanced statistics and performance insights
7. **Rubric Support**: Detailed grading criteria per part
8. **Comments**: Add feedback notes to each answer part

---

**Built with**: React 18, TypeScript, TailwindCSS v4, React Router v7, Radix UI
**Status**: Demo/Prototype - Frontend Only Implementation
