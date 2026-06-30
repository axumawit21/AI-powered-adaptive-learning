import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentAchievement, StudentStats, Goal } from './schemas/gamification.schema';

const ACHIEVEMENTS = {
  FIRST_QUIZ: { id: 'first_quiz', title: 'First Steps', icon: '🎯', points: 10, category: 'quiz', description: 'Complete your first quiz' },
  QUIZ_MASTER_10: { id: 'quiz_10', title: 'Quiz Master', icon: '📚', points: 50, category: 'quiz', description: 'Complete 10 quizzes' },
  QUIZ_MASTER_50: { id: 'quiz_50', title: 'Quiz Legend', icon: '👑', points: 200, category: 'quiz', description: 'Complete 50 quizzes' },
  STREAK_3: { id: 'streak_3', title: '3-Day Streak', icon: '🔥', points: 25, category: 'streak', description: 'Study for 3 days in a row' },
  STREAK_7: { id: 'streak_7', title: '7-Day Warrior', icon: '⚡', points: 100, category: 'streak', description: 'Study for 7 days in a row' },
  STREAK_30: { id: 'streak_30', title: 'Monthly Champion', icon: '👑', points: 500, category: 'streak', description: 'Study for 30 days in a row' },
  EXAM_ACE: { id: 'exam_first', title: 'Exam Ace', icon: '⭐', points: 50, category: 'exam', description: 'Complete your first exam' },
  EXAM_MASTER: { id: 'exam_10', title: 'Exam Master', icon: '🏆', points: 200, category: 'exam', description: 'Complete 10 exams' },
  STUDY_1H: { id: 'study_1h', title: 'Getting Started', icon: '📖', points: 20, category: 'time', description: 'Study for 1 hour total' },
  STUDY_5H: { id: 'study_5h', title: 'Dedicated Learner', icon: '⏰', points: 75, category: 'time', description: 'Study for 5 hours total' },
  STUDY_20H: { id: 'study_20h', title: 'Study Champion', icon: '💪', points: 300, category: 'time', description: 'Study for 20 hours total' },
  PERFECT_QUIZ: { id: 'perfect_quiz', title: 'Perfect Score', icon: '💯', points: 100, category: 'quiz', description: 'Get 100% on a quiz' },
  LEVEL_5: { id: 'level_5', title: 'Rising Star', icon: '🌟', points: 0, category: 'level', description: 'Reach level 5' },
  LEVEL_10: { id: 'level_10', title: 'Expert Learner', icon: '🎓', points: 0, category: 'level', description: 'Reach level 10' },
};

import { GoalService } from './goal.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(StudentAchievement.name) private achievementModel: Model<StudentAchievement>,
    @InjectModel(StudentStats.name) private statsModel: Model<StudentStats>,
    @Inject(forwardRef(() => GoalService)) private readonly goalService: GoalService,
  ) {}

  async getOrCreateStats(studentId: string) {
    let stats = await this.statsModel.findOne({ studentId });
    if (!stats) {
      stats = await this.statsModel.create({ studentId, activityDates: [] });
    }
    return stats;
  }

  async recordActivity(studentId: string, activityType: string, data?: any) {
    const stats = await this.getOrCreateStats(studentId);
    const today = new Date().toISOString().split('T')[0];

    // Update streak
    const lastActivity = stats.lastActivityDate ? new Date(stats.lastActivityDate).toISOString().split('T')[0] : null;
    
    if (lastActivity) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActivity === today) {
        // Already studied today, don't update streak
      } else if (lastActivity === yesterdayStr) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastActivityDate = new Date();

    // Add to activity dates if not already there
    if (!stats.activityDates.includes(today)) {
      stats.activityDates.push(today);
    }

    // Update specific stats
    switch (activityType) {
      case 'quiz':
        stats.quizzesCompleted += 1;
        if (data?.score && data?.totalQuestions && data.score === data.totalQuestions) {
          await this.unlockAchievement(studentId, ACHIEVEMENTS.PERFECT_QUIZ);
        }
        break; // Fixed fallthrough
      case 'exam':
        stats.examsCompleted += 1;
        break;
      case 'study_time':
        stats.totalStudyMinutes += data?.minutes || 0;
        break;
    }

    // Calculate level (100 points per level)
    stats.level = Math.floor(stats.totalPoints / 100) + 1;

    await stats.save();

    // --- Update Goals ---
    try {
        let goalType = '';
        let amount = 1;

        if (activityType === 'quiz') { goalType = 'quizzes'; }
        else if (activityType === 'exam') { goalType = 'exams'; }
        else if (activityType === 'study_time') { 
            goalType = 'study_time'; 
            amount = data?.minutes || 0; 
        }

        if (goalType) {
            await this.goalService.updateProgressByType(studentId, goalType, amount, data?.subjectId);
        }
    } catch (e) {
        console.error('Failed to update goals:', e);
    }

    const newAchievements = await this.checkAchievements(studentId, stats);
    
    return { stats, newAchievements };
  }

  async checkAchievements(studentId: string, stats: StudentStats) {
    const newAchievements: any[] = [];

    // Quiz achievements
    if (stats.quizzesCompleted === 1) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.FIRST_QUIZ);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.FIRST_QUIZ);
    }
    if (stats.quizzesCompleted === 10) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.QUIZ_MASTER_10);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.QUIZ_MASTER_10);
    }
    if (stats.quizzesCompleted === 50) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.QUIZ_MASTER_50);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.QUIZ_MASTER_50);
    }

    // Streak achievements
    if (stats.currentStreak === 3) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STREAK_3);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STREAK_3);
    }
    if (stats.currentStreak === 7) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STREAK_7);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STREAK_7);
    }
    if (stats.currentStreak === 30) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STREAK_30);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STREAK_30);
    }

    // Exam achievements
    if (stats.examsCompleted === 1) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.EXAM_ACE);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.EXAM_ACE);
    }
    if (stats.examsCompleted === 10) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.EXAM_MASTER);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.EXAM_MASTER);
    }

    // Study time achievements
    if (stats.totalStudyMinutes >= 60) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STUDY_1H);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STUDY_1H);
    }
    if (stats.totalStudyMinutes >= 300) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STUDY_5H);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STUDY_5H);
    }
    if (stats.totalStudyMinutes >= 1200) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.STUDY_20H);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.STUDY_20H);
    }

    // Level achievements
    if (stats.level === 5) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.LEVEL_5);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.LEVEL_5);
    }
    if (stats.level === 10) {
      const unlocked = await this.unlockAchievement(studentId, ACHIEVEMENTS.LEVEL_10);
      if (unlocked) newAchievements.push(ACHIEVEMENTS.LEVEL_10);
    }

    return newAchievements;
  }

  async unlockAchievement(studentId: string, achievement: any): Promise<boolean> {
    const existing = await this.achievementModel.findOne({
      studentId,
      achievementId: achievement.id,
    });

    if (!existing) {
      await this.achievementModel.create({
        studentId,
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        points: achievement.points,
      });

      // Add points to stats
      await this.statsModel.findOneAndUpdate(
        { studentId },
        { $inc: { totalPoints: achievement.points } }
      );

      return true;
    }

    return false;
  }

  async getStudentAchievements(studentId: string) {
    return this.achievementModel.find({ studentId }).sort({ unlockedAt: -1 });
  }

  async getAllAchievements() {
    return Object.values(ACHIEVEMENTS);
  }

  // Leaderboard cache — avoid re-sorting the entire collection on every request
  private leaderboardCache: { data: any; timestamp: number } | null = null;
  private readonly LEADERBOARD_CACHE_TTL = 120_000; // 2 minutes

  async getLeaderboard(limit: number = 10) {
    // Serve from cache if fresh
    if (
      this.leaderboardCache &&
      Date.now() - this.leaderboardCache.timestamp < this.LEADERBOARD_CACHE_TTL
    ) {
      return this.leaderboardCache.data.slice(0, limit);
    }

    try {
      const data = await this.statsModel
        .find()
        .sort({ totalPoints: -1 })
        .limit(50) // cache top 50, slice as needed
        .populate('studentId', 'name email')
        .lean()
        .exec();
      this.leaderboardCache = { data, timestamp: Date.now() };
      return data.slice(0, limit);
    } catch (err) {
      // Fallback: return without populate if ObjectId references are invalid
      const data = await this.statsModel
        .find()
        .sort({ totalPoints: -1 })
        .limit(50)
        .lean()
        .exec();
      this.leaderboardCache = { data, timestamp: Date.now() };
      return data.slice(0, limit);
    }
  }
}
