import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { apiKeyContext } from './api-key-context';

/**
 * Middleware that extracts the user's personal Gemini API key from the database
 * and stores it in AsyncLocalStorage for the request lifetime.
 * LlmService reads from this context to use the user's key when available.
 */
@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);

  constructor(
    @InjectModel('Student') private readonly studentModel: Model<any>,
    @InjectModel('TeacherUser') private readonly teacherModel: Model<any>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let userApiKey: string | undefined;

    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // MUST match the same secret used in jwt.strategy.ts and auth.module.ts
        const secret = process.env.JWT_SECRET || 'secretKey';
        const decoded = jwt.verify(token, secret) as any;

        if (decoded?.sub) {
          // Try to find user and their API key
          const role = decoded.role || 'student';
          
          if (role === 'teacher') {
            const teacher = await this.teacherModel
              .findById(decoded.sub)
              .select('geminiApiKey');
            userApiKey = (teacher as any)?.geminiApiKey;
          } else {
            const student = await this.studentModel
              .findById(decoded.sub)
              .select('geminiApiKey');
            userApiKey = (student as any)?.geminiApiKey;
          }

          if (userApiKey) {
            this.logger.log(`🔑 Found personal API key for ${role} ${decoded.sub}`);
          }
        }
      }
    } catch (err) {
      // Silent fail — if we can't get the user key, server keys will be used
    }

    // Run the rest of the request within the AsyncLocalStorage context
    apiKeyContext.run({ userApiKey }, () => {
      next();
    });
  }
}
