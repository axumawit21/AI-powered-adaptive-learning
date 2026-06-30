import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './progress.schema';

import { LlmService } from '../llm/llm.service';
import { GamificationService } from '../gamification/gamification.service';
import { ExamSession } from '../exam/schemas/exam-session.schema';
import { BooksService } from '../books/books.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);
  // Dashboard cache
  private dashboardCache = new Map<string, { data: any; timestamp: number }>();
  private readonly DASHBOARD_CACHE_TTL = 60_000; // 60 seconds

  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(ExamSession.name) private examSessionModel: Model<ExamSession>,
    private readonly llmService: LlmService,
    private readonly gamificationService: GamificationService,
    private readonly booksService: BooksService,
  ) {}

  async addTime(studentId: string, bookId: string, minutes: number, gradeId?: string, subjectId?: string, gradeTitle?: string, subjectTitle?: string) {
    const today = new Date().toISOString().split('T')[0];
    const progress = await this.progressModel.findOne({ studentId, bookId });

    if (progress) {
      const todayEntry = progress.dailyTime.find(d => d.date === today);
      if (todayEntry) todayEntry.minutes += minutes;
      else progress.dailyTime.push({ date: today, minutes });
      
      if (gradeId) progress.gradeId = gradeId;
      if (subjectId) progress.subjectId = subjectId;
      if (gradeTitle) progress.gradeTitle = gradeTitle;
      if (subjectTitle) progress.subjectTitle = subjectTitle;
      
      progress.lastUpdated = new Date();
      await progress.save();
    } else {
      await this.progressModel.create({
        studentId,
        bookId,
        gradeId,
        subjectId,
        gradeTitle,
        subjectTitle,
        dailyTime: [{ date: today, minutes }],
      });
    }

    // Record gamification activity
    try {
      await this.gamificationService.recordActivity(studentId, 'study_time', { minutes });
    } catch (error) {
      console.error('Failed to record gamification activity:', error);
    }

    return progress;
  }



  async addQuizResult(studentId: string, data: any) {

    this.logger.log(`addQuizResult called for student: ${studentId}`);

    let { bookId, unitNumber, score, totalQuestions, answers, gradeId, subjectId, subjectTitle, gradeTitle, unitTitle: incomingUnitTitle } = data;

    // Convert unitNumber to number if it's a string (e.g., "Unit 1" or "1")
    let unitNumberParsed: number = 1; // Default
    let unitTitle: string = incomingUnitTitle || 'Unit 1';
    if (typeof unitNumber === 'string') {
        // Try to extract number from string like "Unit 1: Introduction" or just "1"
        const match = unitNumber.match(/\d+/);
        if (match) {
            unitNumberParsed = parseInt(match[0], 10);
        }
        unitTitle = unitNumber; // Store original as title
        this.logger.log(`Parsed unitNumber: "${unitNumber}" -> ${unitNumberParsed}`);
    } else if (typeof unitNumber === 'number') {
        unitNumberParsed = unitNumber;
        unitTitle = `Unit ${unitNumber}`;
    }
    // Replace unitNumber with parsed value
    unitNumber = unitNumberParsed;

    // Generate fallback bookId if missing
    if (!bookId) {
        if (gradeId && subjectId) {
            bookId = `${subjectId}_${gradeId}`;
        } else {
             // Absolute fallback to avoid validation error
            bookId = `general_${subjectId || 'unknown'}`;
        }
        this.logger.log(`Generated fallback bookId: ${bookId}`);
    }
    
    // Try to find progress by bookId OR subjectId
    let query: any = { studentId };
    if (bookId) query.bookId = bookId;
    else if (subjectId) query.subjectId = subjectId;
    
    let progress = await this.progressModel.findOne(query);
    
    try {
        if (!progress) {
          this.logger.log("No existing progress found. Creating new.");
          progress = await this.progressModel.create({
            studentId,
            bookId, 
            gradeId,
            subjectId,
            subjectTitle,
            gradeTitle,
            dailyTime: [],
            quizResults: [],
            unitsProgress: []
          });
        } else {
            this.logger.log(`Found existing progress: ${progress._id}`);
            // Update metadata if missing
            if (!progress.subjectId && subjectId) progress.subjectId = subjectId;
            if (!progress.gradeId && gradeId) progress.gradeId = gradeId;
            if (!progress.subjectTitle && subjectTitle) progress.subjectTitle = subjectTitle;
            if (!progress.gradeTitle && gradeTitle) progress.gradeTitle = gradeTitle;
        }
    } catch (err) {
        this.logger.error(`Error creating/updating progress doc: ${err.message}`);
        throw err;
    }

    // Add quiz result
    progress.quizResults.push({
      quizId: new Date().getTime().toString(), // simple ID generation
      unitNumber,
      score,
      totalQuestions,
      attemptDate: new Date(),
      answers
    });

    // Update Unit Progress
    const existingUnit = progress.unitsProgress.find(u => u.unitNumber === unitNumber);
    const passed = (score / totalQuestions) >= 0.6; // 60% pass
    
    if (existingUnit) {
      if (score > existingUnit.bestScore) existingUnit.bestScore = score;
      if (passed && existingUnit.status !== 'completed') existingUnit.status = 'completed';
      else if (!passed && existingUnit.status === 'not_started') existingUnit.status = 'in_progress';
    } else {
      progress.unitsProgress.push({
        unitNumber,
        unitTitle, // Use the parsed/original title
        status: passed ? 'completed' : 'in_progress',
        bestScore: score
      });
    }

    progress.lastUpdated = new Date();
    await progress.save();
    
    // Record gamification activity
    try {
      await this.gamificationService.recordActivity(studentId, 'quiz', { 
        score, 
        totalQuestions,
        subjectId: subjectId 
      });
    } catch (error) {
      // Gamification recording failure shouldn't break quiz result saving
    }
    
    return progress;
  }

  async addExamResult(studentId: string, data: any) {
    this.logger.log(`Adding exam result for student: ${studentId}`);
    const { bookId, gradeId, subjectId, score, totalQuestions } = data;

    // 1. Ensure Progress document exists
    try {
      let progress = await this.progressModel.findOne({ studentId, bookId });
      
      if (!progress) {
        // If not found by bookId, try finding by subjectId if available to avoid duplicates if bookId format differs
        // But Progress is unique by bookId typically.
        // Let's just create if missing, matching addQuizResult behavior.
        progress = await this.progressModel.create({
          studentId,
          bookId,
          gradeId,
          subjectId,
          dailyTime: [],
          quizResults: [],
          unitsProgress: []
        });
      } else {
         // Update metadata if missing
         if (!progress.subjectId && subjectId) progress.subjectId = subjectId;
         if (!progress.gradeId && gradeId) progress.gradeId = gradeId;
      }
      
      progress.lastUpdated = new Date();
      await progress.save();
    } catch (err) {
      console.error("Failed to update progress for exam:", err);
    }

    // 2. Record Gamification Activity
    try {
      await this.gamificationService.recordActivity(studentId, 'exam', { 
        score, 
        totalQuestions,
        subjectId: subjectId
      });
    } catch (error) {
      console.error('Failed to record exam gamification activity:', error);
    }
  }

  // ... (rest of the file)


  async getOverview(studentId: string) {
    return this.progressModel.find({ studentId }).lean().exec();
  }

  async getSubjectProgress(studentId: string, subjectId: string) {
    return this.progressModel.find({ studentId, subjectId });
  }

  async getWeeklyProgress(studentId: string, bookId: string) {
    const progress = await this.progressModel.findOne({ studentId, bookId });
    if (!progress) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = progress.dailyTime.find(dt => dt.date === dateStr);
      return { date: dateStr, minutes: entry ? entry.minutes : 0 };
    }).reverse();

    return last7Days;
  }

  async getGlobalHistory(studentId: string, days: number = 7) {
    const allProgress = await this.progressModel.find({ studentId });
    
    // Create a map of date -> minutes
    const dateMap = new Map<string, number>();
    
    // Initialize last N days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Aggregate
    allProgress.forEach(p => {
      p.dailyTime.forEach(dt => {
        if (dateMap.has(dt.date)) {
          dateMap.set(dt.date, (dateMap.get(dt.date) || 0) + dt.minutes);
        }
      });
    });

    // Convert to array and reverse (oldest first)
    const result = Array.from(dateMap.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending

    return result;
  }

  async getMonthlyProgress(studentId: string, bookId: string) {
    const progress = await this.progressModel.findOne({ studentId, bookId });
    if (!progress) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = progress.dailyTime.find(dt => dt.date === dateStr);
      return { date: dateStr, minutes: entry ? entry.minutes : 0 };
    }).reverse();

    return last30Days;
  }

  async getDailyProgress(studentId: string, bookId: string) {
    const today = new Date().toISOString().split('T')[0];
    const progress = await this.progressModel.findOne({ studentId, bookId });
    const todayEntry = progress?.dailyTime.find(dt => dt.date === today);
    return [{ date: today, minutes: todayEntry ? todayEntry.minutes : 0 }];
  }

  private calculateSubjectMastery(progress: Progress): number {
    if (!progress.unitsProgress || progress.unitsProgress.length === 0) return 0;
    
    // Weighted: 70% from scores, 30% from completion rate
    const totalScore = progress.unitsProgress.reduce((sum, u) => sum + (u.bestScore || 0), 0);
    const averageScore = totalScore / progress.unitsProgress.length;
    return Math.round(averageScore);
  }

  private calculateStreak(allProgress: Progress[]): number {
    // 1. Collect all dates with activity
    const activeDates = new Set<string>();
    allProgress.forEach(p => {
      p.dailyTime.forEach(dt => {
        if (dt.minutes > 0) activeDates.add(dt.date);
      });

      // Also count quiz attempts as activity
      p.quizResults?.forEach(q => {
          if (q.attemptDate) {
              const dateStr = new Date(q.attemptDate).toISOString().split('T')[0];
              activeDates.add(dateStr);
          }
      });
    });

    if (activeDates.size === 0) return 0;

    // 2. Sort dates
    const sortedDates = Array.from(activeDates).sort().reverse(); // Newest first
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 3. Check if streak is active (activity today or yesterday)
    if (!activeDates.has(today) && !activeDates.has(yesterday)) return 0;

    let streak = 0;
    let checkDate = new Date();
    
    // If no activity today, start checking from yesterday
    if (!activeDates.has(today)) {
       checkDate.setDate(checkDate.getDate() - 1);
    }

    // 4. Count backwards
    while (true) {
       const dateStr = checkDate.toISOString().split('T')[0];
       if (activeDates.has(dateStr)) {
         streak++;
         checkDate.setDate(checkDate.getDate() - 1);
       } else {
         break;
       }
    }
    return streak;
  }

  async getDashboardOverview(studentId: string) {
    // Check cache first
    const cached = this.dashboardCache.get(studentId);
    if (cached && (Date.now() - cached.timestamp) < this.DASHBOARD_CACHE_TTL) {
      return cached.data;
    }

    // Run all 3 DB queries in PARALLEL with .lean()
    const [allProgress, allBooks, allExams] = await Promise.all([
      this.progressModel.find({ studentId }).lean().exec(),
      this.booksService.findAll(),
      this.examSessionModel.find({ studentId, completed: true }).lean().exec(),
    ]);
    
    // Create a map of subjectId -> totalUnits AND subjectId -> subjectTitle for resolution
    const subjectUnitsMap = new Map<string, number>();
    const subjectTitleMap = new Map<string, string>();
    
    allBooks.forEach(book => {
      const sId = book.subject ? (book.subject as any)._id?.toString() || book.subject.toString() : '';
      const sTitle = book.subject ? (book.subject as any).title || '' : '';
      
      if (sId && book.units) {
        const current = subjectUnitsMap.get(sId) || 0;
        subjectUnitsMap.set(sId, current + book.units.length);
      }
      if (sId && sTitle && !subjectTitleMap.has(sId)) {
        subjectTitleMap.set(sId, sTitle);
      }
    });

    // Aggregate by Subject ID (or Title if ID missing)
    const subjectMap = new Map<string, any>();

    for (const p of allProgress) {
        const key = p.subjectId || p.subjectTitle || "Unknown";
        
        let resolvedSubjectTitle = p.subjectTitle;
        if (!resolvedSubjectTitle && p.subjectId && subjectTitleMap.has(p.subjectId)) {
            resolvedSubjectTitle = subjectTitleMap.get(p.subjectId) || '';
        }
        
        if (!subjectMap.has(key)) {
            subjectMap.set(key, {
                subjectId: p.subjectId,
                subjectTitle: resolvedSubjectTitle,
                gradeTitle: p.gradeTitle,
                gradeId: p.gradeId,
                unitsCompleted: 0,
                totalStudyTime: 0,
                quizResults: [],
                lastActive: p.lastUpdated,
                unitsProgress: [] 
            });
        }
        
        const entry = subjectMap.get(key);

        entry.totalStudyTime += p.dailyTime.reduce((sum, d) => sum + d.minutes, 0);
        
        if (new Date(p.lastUpdated) > new Date(entry.lastActive)) {
            entry.lastActive = p.lastUpdated;
        }

        if (p.quizResults && p.quizResults.length > 0) {
            entry.quizResults.push(...p.quizResults);
        }

        p.unitsProgress.forEach(u => {
            const existingU = entry.unitsProgress.find(eu => eu.unitNumber === u.unitNumber);
            if (existingU) {
                if (u.bestScore > existingU.bestScore) existingU.bestScore = u.bestScore;
                if (u.status === 'completed') existingU.status = 'completed';
            } else {
                entry.unitsProgress.push({ ...u });
                if (u.status === 'completed') entry.unitsCompleted++;
            }
        });
    }

    const overview = Array.from(subjectMap.values())
        .filter(entry => entry.subjectTitle && entry.subjectTitle !== 'Unknown Subject' && entry.subjectTitle !== 'Unknown')
        .map(entry => {
        const sId = entry.subjectId ? entry.subjectId.toString() : 'unknown';
        const sTitleNorm = entry.subjectTitle ? entry.subjectTitle.toLowerCase().trim() : '';
        
        const totalUnits = subjectUnitsMap.get(sId) || 0;
        const unitsAttempted = entry.unitsProgress.length;
        const quizzesDone = entry.quizResults.length;
        
        let avgQuizScore = 0;
        if (quizzesDone > 0) {
            const totalQuizPercent = entry.quizResults.reduce((sum, q) => {
                const percent = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
                return sum + percent;
            }, 0);
            avgQuizScore = Math.round(totalQuizPercent / quizzesDone);
        }
        
        const subjectExams = allExams.filter(exam => {
            const examSId = exam.subjectId ? exam.subjectId.toString() : '';
            const examSTitleNorm = (exam as any).subjectTitle ? (exam as any).subjectTitle.toLowerCase().trim() : '';
            if (sId !== 'unknown' && examSId === sId) return true;
            if (sTitleNorm) {
                if (examSId.toLowerCase().trim() === sTitleNorm) return true;
                if (examSTitleNorm === sTitleNorm) return true;
            }
            return false;
        });
        
        const examsDone = subjectExams.length;
        
        let avgExamScore = 0;
        if (examsDone > 0) {
            const totalExamPercent = subjectExams.reduce((sum, e) => {
                const percent = e.totalQuestions > 0 ? (e.score / e.totalQuestions) * 100 : 0;
                return sum + percent;
            }, 0);
            avgExamScore = Math.round(totalExamPercent / examsDone);
        }

        const unitCompletionRate = totalUnits > 0 ? (unitsAttempted / totalUnits) * 100 : 0;
        
        let learningProgress = 0;
        if (totalUnits > 0 || quizzesDone > 0 || examsDone > 0) {
            const unitWeight = 0.4;
            const quizWeight = 0.3;
            const examWeight = 0.3;
            const effectiveExamWeight = examsDone > 0 ? examWeight : 0;
            const effectiveQuizWeight = examsDone > 0 ? quizWeight : quizWeight + examWeight;
            
            learningProgress = Math.round(
                (unitCompletionRate * unitWeight) +
                (avgQuizScore * effectiveQuizWeight) +
                (avgExamScore * effectiveExamWeight)
            );
        }
        
        const allUnitsAttempted = totalUnits > 0 && unitsAttempted >= totalUnits;
        const hasMinimumMastery = avgQuizScore >= 60 && (examsDone === 0 || avgExamScore >= 60);
        const canBeComplete = allUnitsAttempted && hasMinimumMastery;
        
        if (learningProgress >= 100 && !canBeComplete) {
            learningProgress = 99;
        }
        
        const units = entry.unitsProgress;
        let mastery = 0;
        if (units.length > 0) {
            const totalScorePercent = units.reduce((sum, u) => {
                const percent = Math.min(100, (u.bestScore || 0) * 10);
                return sum + percent;
            }, 0);
            mastery = Math.round(totalScorePercent / units.length);
        }
        
        const hasActivity = entry.totalStudyTime > 0 || unitsAttempted > 0 || examsDone > 0 || quizzesDone > 0;
        
        return {
            subjectId: entry.subjectId,
            subjectTitle: entry.subjectTitle,
            gradeTitle: entry.gradeTitle,
            quizzesDone,
            examsDone,
            unitsAttempted,
            totalUnits,
            avgQuizScore,
            avgExamScore,
            learningProgress,
            mastery,
            unitsCompleted: entry.unitsCompleted,
            examsCompleted: examsDone,
            totalStudyTime: entry.totalStudyTime,
            lastActive: entry.lastActive,
            hasActivity
        };
    });

    // Calculate aggregated stats
    const totalStudyTime = overview.reduce((sum, o) => sum + o.totalStudyTime, 0);
    const totalQuizzes = overview.reduce((sum, o) => sum + o.quizzesDone, 0);
    const totalExams = overview.reduce((sum, o) => sum + o.examsDone, 0);
    const avgMastery = overview.length > 0 
      ? Math.round(overview.reduce((sum, o) => sum + o.learningProgress, 0) / overview.length) 
      : 0;

    const streak = this.calculateStreak(allProgress as any[]);

    const result = {
      subjects: overview,
      totalStudyTime,
      totalQuizzes,
      totalExams,
      avgMastery,
      streak
    };

    // Cache the result
    this.dashboardCache.set(studentId, { data: result, timestamp: Date.now() });

    return result;
  }

  async generateRecommendations(studentId: string, subjectId: string) {
    // Query ALL progress records for this subject (robust matching like dashboard)
    const allProgress = await this.progressModel.find({ studentId });
    
    // Find matching progress records by subjectId OR subjectTitle (EXACT match only)
    const matchingProgress = allProgress.filter(p => {
      const pSubjectId = p.subjectId ? p.subjectId.toString() : '';
      const pSubjectTitle = p.subjectTitle ? p.subjectTitle.toLowerCase().trim() : '';
      const targetId = subjectId.toLowerCase().trim();
      
      // Exact match only - no partial matching
      return pSubjectId === subjectId || 
             pSubjectId.toLowerCase() === targetId ||
             pSubjectTitle === targetId;
    });
    
    console.log(`[COACH] Found ${matchingProgress.length} progress records for subjectId: ${subjectId}. Matched by exact ID or title.`);
    matchingProgress.forEach((p, i) => {
      console.log(`[COACH]   Record ${i}: subjectId=${p.subjectId}, title=${p.subjectTitle}, quizzes=${p.quizResults?.length || 0}`);
    });
    
    if (matchingProgress.length === 0) {
      return { 
        content: "Not enough data yet. Take a quiz to unlock insights!", 
        weakAreas: [], 
        strongAreas: [],
        suggestedFocus: ["Take your first quiz", "Start studying any unit"],
        insufficientData: true
      };
    }
    
    // Use the first matching record for basic info, aggregate quiz data from all
    const progress = matchingProgress[0];
    
    // Aggregate quiz results from ALL matching progress records
    const allQuizResults = matchingProgress.flatMap(p => p.quizResults || []);
    const allUnitsProgress: any[] = [];
    const seenUnits = new Set<number>();
    
    matchingProgress.forEach(p => {
      (p.unitsProgress || []).forEach(u => {
        if (!seenUnits.has(u.unitNumber)) {
          seenUnits.add(u.unitNumber);
          allUnitsProgress.push(u);
        } else {
          // Merge: keep best score
          const existing = allUnitsProgress.find(eu => eu.unitNumber === u.unitNumber);
          if (existing && u.bestScore > existing.bestScore) {
            existing.bestScore = u.bestScore;
          }
        }
      });
    });
    
    const totalQuizzes = allQuizResults.length;
    const units = allUnitsProgress;
    
    console.log(`[COACH] ===== QUIZ COUNT DEBUG =====`);
    console.log(`[COACH] Total aggregated quizzes: ${totalQuizzes}`);
    console.log(`[COACH] Total units with progress: ${units.length}`);
    console.log(`[COACH] From ${matchingProgress.length} matching progress records`);
    
    // Check for INSUFFICIENT DATA
    if (totalQuizzes === 0 && units.length === 0) {
      return { 
        content: "Not enough data yet. Take a quiz to unlock insights!", 
        weakAreas: [], 
        strongAreas: [],
        suggestedFocus: ["Take your first quiz in this subject"],
        insufficientData: true
      };
    }

    // Fetch book to get total units and identify unattempted ones
    const allBooks = await this.booksService.findAll();
    const subjectBook = allBooks.find(b => {
      const bookSubjectId = b.subject ? (b.subject as any)._id?.toString() || b.subject.toString() : '';
      return bookSubjectId === subjectId || bookSubjectId === progress.subjectId;
    });
    
    const totalUnitsInBook = subjectBook?.units?.length || 0;
    const bookUnits = subjectBook?.units || [];

    // NOTE: Using aggregated allQuizResults and units from above (not progress.quizResults)
    // totalQuizzes and units are already defined from aggregation

    // Fetch exams (robustly)
    const allExams = await this.examSessionModel.find({ 
        studentId, 
        completed: true 
    });
    
    const sId = progress.subjectId ? progress.subjectId.toString() : 'unknown';
    const sTitleNorm = progress.subjectTitle ? progress.subjectTitle.toLowerCase().trim() : '';
    
    const subjectExams = allExams.filter(exam => {
        const examSId = exam.subjectId ? exam.subjectId.toString() : '';
        const examSTitleNorm = (exam as any).subjectTitle ? (exam as any).subjectTitle.toLowerCase().trim() : '';
        if (sId !== 'unknown' && examSId === sId) return true;
        if (sTitleNorm) {
            if (examSId.toLowerCase().trim() === sTitleNorm) return true;
            if (examSTitleNorm === sTitleNorm) return true;
        }
        return false;
    });
    const totalExams = subjectExams.length;
    
    // Calculate average exam score
    let avgExamScore = 0;
    if (totalExams > 0) {
        avgExamScore = Math.round(
            subjectExams.reduce((sum, e) => sum + (e.totalQuestions > 0 ? (e.score / e.totalQuestions) * 100 : 0), 0) / totalExams
        );
    }
    
    // Detailed analysis of units with PROPER PERCENTAGE SCORES
    const analysisInfo = units.map(u => {
      // Use aggregated allQuizResults instead of progress.quizResults
      const qRes = allQuizResults.filter(q => q.unitNumber === u.unitNumber);
      const attempts = qRes.length;
      
      // Calculate percentage score properly
      let bestScorePercent = 0;
      if (attempts > 0) {
        // Find the quiz result with the best percentage score
        const bestQuizResult = qRes.reduce((best, q) => {
          const pct = q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0;
          return pct > (best.pct || 0) ? { ...q, pct } : best;
        }, { pct: 0 });
        bestScorePercent = Math.round(bestQuizResult.pct);
      }
      
      const recentScores = qRes.slice(-3).map(q => 
        q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0
      );
      
      return {
        unit: u.unitTitle || `Unit ${u.unitNumber}`,
        unitNumber: u.unitNumber,
        bestScorePercent,
        attempts,
        recentScores,
        status: u.status
      };
    });

    // Identify UNATTEMPTED units
    const attemptedUnitNumbers = new Set(units.map(u => u.unitNumber));
    const unattemptedUnits = bookUnits
      .filter(bu => !attemptedUnitNumbers.has(bu.unitNumber))
      .map(bu => bu.title || `Unit ${bu.unitNumber}`);

    // Categorize units: Strong (≥70%), Weak (<60%), Needs Work (60-69%)
    const strongUnits = analysisInfo
      .filter(u => u.bestScorePercent >= 70)
      .sort((a, b) => b.bestScorePercent - a.bestScorePercent)
      .slice(0, 3)
      .map(u => `${u.unit} (${u.bestScorePercent}%)`);
    
    const weakUnits = analysisInfo
      .filter(u => u.bestScorePercent < 60 && u.attempts > 0)
      .sort((a, b) => a.bestScorePercent - b.bestScorePercent)
      .slice(0, 3)
      .map(u => `${u.unit} (${u.bestScorePercent}%)`);

    console.log(`[COACH] Data for ${progress.subjectTitle}: Quizzes: ${totalQuizzes}, Exams: ${totalExams}, Units Attempted: ${units.length}/${totalUnitsInBook}, Strong: ${strongUnits.length}, Weak: ${weakUnits.length}, Unattempted: ${unattemptedUnits.length}`);

    // Build detailed unit breakdown for LLM
    const unitBreakdown = analysisInfo.length > 0 
      ? analysisInfo.map(a => `- ${a.unit}: Score ${a.bestScorePercent}%, Attempts: ${a.attempts}, Recent: [${a.recentScores.join(', ')}%]`).join('\n        ')
      : 'No units attempted yet';
    
    const unattemptedBreakdown = unattemptedUnits.length > 0
      ? `\n      UNATTEMPTED UNITS (${unattemptedUnits.length}): ${unattemptedUnits.slice(0, 5).join(', ')}${unattemptedUnits.length > 5 ? '...' : ''}`
      : '';

    const prompt = `
      You are Lumi, a professional AI Learning Coach. 
      Analyze the student's detailed performance in ${progress.subjectTitle}:
      
      STUDENT PERFORMANCE DATA:
      - Total Study Time: ${progress.dailyTime.reduce((sum, d) => sum + d.minutes, 0)} minutes
      - Total Quizzes Completed: ${totalQuizzes}
      - Total Exams Completed: ${totalExams} (Avg Score: ${avgExamScore}%)
      - Units Attempted: ${units.length} of ${totalUnitsInBook} total
      
      UNIT-LEVEL BREAKDOWN:
        ${unitBreakdown}
      ${unattemptedBreakdown}

      ANALYSIS RULES:
      1. Start with exact stats: "You've completed ${totalQuizzes} quizzes and ${totalExams} exams in ${progress.subjectTitle}."
      2. STRONG UNITS (Score ≥70%): ${strongUnits.length > 0 ? strongUnits.join(', ') : 'None yet'}
         → Say "You are doing great in [unit name]" and EXPLAIN WHY (e.g., "High quiz accuracy of X%")
      3. WEAK UNITS (Score <60%): ${weakUnits.length > 0 ? weakUnits.join(', ') : 'None identified'}
         → Say "You need to improve in [unit name]" and EXPLAIN WHY (e.g., "Low quiz accuracy of X%")
      4. UNATTEMPTED UNITS: ${unattemptedUnits.length > 0 ? unattemptedUnits.slice(0, 3).join(', ') : 'All units attempted!'}
         → Recommend starting these if any exist
      5. Be SPECIFIC and DATA-DRIVEN. NO generic advice. Always include percentages.
      6. Tone: Encouraging but analytical.

      Return JSON EXACTLY as:
      {
        "content": "Personal analysis with exact quiz/exam counts. Example: You've completed 4 quizzes and 11 exams. You are doing great in Unit 1 (85% accuracy). You need to improve in Unit 3 (low accuracy at 45%).",
        "strongAreas": ["Unit X - High quiz accuracy (85%)", ...],
        "weakAreas": ["Unit Y - Low quiz accuracy (45%)", ...],
        "suggestedFocus": ["Review Unit Y summary", "Take Unit Z quiz", ...]
      }
    `;

    try {
      console.log("[COACH] Calling LLM...");
      const res = await this.llmService.generate(prompt, { format: 'json' });
      console.log("[COACH] LLM Response received");
      const result = JSON.parse(res.text);
      
      progress.recommendations = {
        content: result.content,
        generatedAt: new Date(),
        strongAreas: result.strongAreas || strongUnits,
        weakAreas: result.weakAreas || weakUnits,
        suggestedFocus: result.suggestedFocus || []
      } as any;

      await progress.save();
      return progress.recommendations;

    } catch (error) {
      console.error("[COACH] LLM Generation failed:", error);
      
      // Enhanced fallback with specific unit mentions and WHY explanations
      const bestUnit = analysisInfo.length > 0 
        ? analysisInfo.reduce((best, u) => u.bestScorePercent > (best?.bestScorePercent || 0) ? u : best, analysisInfo[0])
        : null;
      const worstUnit = analysisInfo.length > 0
        ? analysisInfo.reduce((worst, u) => u.bestScorePercent < (worst?.bestScorePercent || 100) ? u : worst, analysisInfo[0])
        : null;
      
      const contentParts: string[] = [`Analyzing your progress in ${progress.subjectTitle}, you've completed ${totalQuizzes} quizzes and ${totalExams} exams.`];
      
      if (bestUnit && bestUnit.bestScorePercent >= 70) {
        contentParts.push(`You are doing great in ${bestUnit.unit} with a score of ${bestUnit.bestScorePercent}%!`);
      }
      if (worstUnit && worstUnit.bestScorePercent < 60) {
        contentParts.push(`You need to improve in ${worstUnit.unit} (currently at ${worstUnit.bestScorePercent}%).`);
      }
      if (unattemptedUnits.length > 0) {
        contentParts.push(`You haven't started ${unattemptedUnits.length} unit(s) yet. Consider exploring ${unattemptedUnits[0]}.`);
      }
      
      // Build suggested focus with proper types
      const suggestedFocus: string[] = [];
      if (worstUnit) suggestedFocus.push(`Review ${worstUnit.unit} summary`);
      if (unattemptedUnits.length > 0) suggestedFocus.push(`Start ${unattemptedUnits[0]}`);
      suggestedFocus.push(totalExams === 0 ? "Take your first subject exam" : "Take a practice quiz");
      
      // Build strong/weak areas with explicit WHY explanations
      const strongAreasWithWhy = analysisInfo
        .filter(u => u.bestScorePercent >= 70)
        .slice(0, 3)
        .map(u => `${u.unit} - High quiz accuracy (${u.bestScorePercent}%)`);
      
      const weakAreasWithWhy = analysisInfo
        .filter(u => u.bestScorePercent < 60 && u.attempts > 0)
        .slice(0, 3)
        .map(u => `${u.unit} - Low quiz accuracy (${u.bestScorePercent}%)`);
      
      // Add unattempted units to weak areas if no weak performers
      const finalWeakAreas = weakAreasWithWhy.length > 0 
        ? weakAreasWithWhy 
        : (unattemptedUnits.length > 0 
            ? unattemptedUnits.slice(0, 2).map(u => `${u} - Not yet attempted`) 
            : ["No weak areas identified yet"]);
      
      return {
        content: contentParts.join(' '),
        strongAreas: strongAreasWithWhy.length > 0 ? strongAreasWithWhy : ["Keep working on more quizzes to identify your strengths"],
        weakAreas: finalWeakAreas,
        suggestedFocus
      };
    }
  }

  async calculateRecentActivity(studentId: string, type: string, timeframe: string) {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    if (type === 'exams') {
      const count = await this.examSessionModel.countDocuments({
        studentId,
        completed: true,
        endTime: { $gte: startDate }
      });
      return count;
    }

    if (type === 'quizzes') {
      const allProgress = await this.progressModel.find({ studentId });
      let count = 0;
      allProgress.forEach(p => {
        p.quizResults?.forEach(q => {
          if (new Date(q.attemptDate) >= startDate) {
            count++;
          }
        });
      });
      return count;
    }

    if (type === 'study_time') {
      // Need to sum minutes from dailyTime where date >= startDate
      // dailyTime stores date as "YYYY-MM-DD" string
      const allProgress = await this.progressModel.find({ studentId });
      let totalMinutes = 0;
      const startDateStr = startDate.toISOString().split('T')[0];
      
      allProgress.forEach(p => {
        p.dailyTime?.forEach(d => {
           if (d.date >= startDateStr) {
             totalMinutes += d.minutes;
           }
        });
      });
      return totalMinutes;
    }

    if (type === 'units') {
       // We don't track unit completion date explicitly, so we'll use passed quizzes as a proxy
       // or simply return 0 with a warning, but user wants data.
       // Let's count "passed quizzes" in this timeframe as a proxy for unit progress
       const allProgress = await this.progressModel.find({ studentId });
       let count = 0;
       allProgress.forEach(p => {
        p.quizResults?.forEach(q => {
          // Assuming 60% is pass
          if (new Date(q.attemptDate) >= startDate && (q.score / q.totalQuestions) >= 0.6) {
            count++;
          }
        });
      });
      return count;
    }

    return 0;
  }
}
