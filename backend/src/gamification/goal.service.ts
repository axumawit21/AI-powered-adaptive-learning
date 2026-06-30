import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal } from './schemas/gamification.schema';

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(
    @InjectModel(Goal.name) private goalModel: Model<Goal>,
  ) {}

  /**
   * Create a new goal for a student
   */
  async createGoal(studentId: string, goalData: Partial<Goal>) {
    this.logger.log(`Creating goal for student ${studentId}: ${goalData.title}`);
    
    const startDate = new Date();
    let endDate = new Date();

    // specific end date calculation logic
    switch (goalData.timeframe) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setDate(endDate.getDate() + 7); // Default to weekly
    }

    try {
      const newGoal = await this.goalModel.create({
        ...goalData,
        studentId: studentId.toString(), // Ensure string
        startDate,
        endDate,
        currentValue: 0,
        status: 'active',
      });
      return newGoal;
    } catch (error) {
      this.logger.error(`Failed to create goal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all goals for a student, optionally filtered
   */
  async getStudentGoals(studentId: string, filters?: { timeframe?: string; status?: string }) {
    const query: any = { studentId: studentId.toString() };

    if (filters?.timeframe) query.timeframe = filters.timeframe;
    if (filters?.status) query.status = filters.status;

    return this.goalModel.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update progress for a specific goal type
   * This is the CORE method for gamification updates
   */
  async updateProgressByType(studentId: string, type: string, amount: number = 1, subjectId?: string) {
    this.logger.log(`Updating goal progress: Student=${studentId}, Type=${type}, Amount=${amount}, Subject=${subjectId}`);
    
    // Find all ACTIVE goals for this user and type
    const query: any = {
      studentId: studentId.toString(),
      status: 'active',
      type: type,
    };

    const goals = await this.goalModel.find(query);
    const now = new Date();
    // Add 1-hour buffer to avoid minor clock drift issues marking goals as expired prematurely
    const bufferTime = new Date(now.getTime() - 60 * 60 * 1000); 

    const updates: Promise<any>[] = [];
    let updatedCount = 0;

    for (const goal of goals) {
      // 1. Check expiration (with buffer)
      if (goal.endDate && goal.endDate < bufferTime) {
        continue;
      }

      // 2. Check Subject matching if goal is subject-specific
      if (goal.subjectId && subjectId) {
          // If goal has a subject, only update if it matches the activity subject
          if (goal.subjectId.toString() !== subjectId.toString()) {
              continue;
          }
      } else if (goal.subjectId && !subjectId) {
          // If goal requires a subject but none was provided, skip it
          continue;
      }

      goal.currentValue += amount;
      updatedCount++;

      // Check for completion
      if (goal.currentValue >= goal.targetValue) {
        goal.status = 'completed';
        this.logger.log(`Goal Completed! "${goal.title}"`);
      }

      updates.push(goal.save());
    }

    await Promise.all(updates);
    return updatedCount;
  }

  // --- Standard CRUD Methods ---

  async updateGoalProgress(goalId: string, studentId: string, increment: number) {
      const goal = await this.getGoal(goalId, studentId);
      goal.currentValue += increment;
      if (goal.currentValue >= goal.targetValue && goal.status === 'active') {
          goal.status = 'completed';
      }
      return goal.save();
  }

  async getGoal(goalId: string, studentId: string) {
    const goal = await this.goalModel.findOne({ _id: goalId, studentId: studentId.toString() });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async updateGoal(goalId: string, studentId: string, updates: Partial<Goal>) {
    const goal = await this.getGoal(goalId, studentId);
    Object.assign(goal, updates);
    return goal.save();
  }

  async deleteGoal(goalId: string, studentId: string) {
    return this.goalModel.findOneAndDelete({ _id: goalId, studentId: studentId.toString() });
  }

  /**
   * Aggregated progress for the frontend dashboard
   */
  async getGoalProgress(studentId: string) {
    const goals = await this.getStudentGoals(studentId);
    
    // Initialize structure matching frontend expectation
    const progress = {
      daily: { total: 0, completed: 0, inProgress: 0 },
      weekly: { total: 0, completed: 0, inProgress: 0 },
      monthly: { total: 0, completed: 0, inProgress: 0 },
      yearly: { total: 0, completed: 0, inProgress: 0 },
    };

    goals.forEach(goal => {
      const tf = goal.timeframe as keyof typeof progress;
      if (progress[tf]) {
        progress[tf].total++;
        if (goal.status === 'completed') progress[tf].completed++;
        else if (goal.status === 'active' && goal.currentValue > 0) progress[tf].inProgress++;
      }
    });

    return progress;
  }

  async getGoalSuggestions(studentId: string) {
    return [
      { title: 'Complete 3 quizzes this week', timeframe: 'weekly', type: 'quizzes', targetValue: 3 },
      { title: 'Study for 60 minutes today', timeframe: 'daily', type: 'study_time', targetValue: 60 },
      { title: 'Complete 1 Unit Exam', timeframe: 'monthly', type: 'exams', targetValue: 1 },
      { title: 'Finish 2 Units', timeframe: 'monthly', type: 'units', targetValue: 2 },
    ];
  }
}
