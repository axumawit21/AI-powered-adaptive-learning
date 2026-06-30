import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationService } from './gamification.service';
import { GoalService } from './goal.service';
import { GamificationController } from './gamification.controller';
import {
  StudentAchievement,
  StudentAchievementSchema,
  StudentStats,
  StudentStatsSchema,
  Goal,
  GoalSchema,
} from './schemas/gamification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentAchievement.name, schema: StudentAchievementSchema },
      { name: StudentStats.name, schema: StudentStatsSchema },
      { name: Goal.name, schema: GoalSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, GoalService],
  exports: [GamificationService, GoalService],
})
export class GamificationModule {}
