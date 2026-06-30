import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotesService } from '../notes/notes.service';
import { NotificationsGateway } from './notifications.gateway';
import { NoteDocument } from '../notes/schemas/note.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notesService: NotesService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkReminders() {
    try {
      const dueNotes = await this.notesService.findDueReminders();

      if (dueNotes.length === 0) {
        return;
      }

      this.logger.log(`Found ${dueNotes.length} due reminder(s)`);

      for (const note of dueNotes) {
        // Cast to NoteDocument to access _id
        const noteDoc = note as unknown as NoteDocument;
        
        // Send notification via WebSocket
        this.notificationsGateway.sendNotification(noteDoc.studentId.toString(), {
          type: 'reminder',
          noteId: noteDoc._id.toString(),
          title: noteDoc.title,
          content: noteDoc.content,
          subject: noteDoc.subject,
          reminderDate: noteDoc.reminder?.date,
          recurring: noteDoc.reminder?.recurring,
        });

        // Mark as notified
        await this.notesService.markReminderNotified(noteDoc._id.toString());

        // If recurring, schedule next occurrence
        if (noteDoc.reminder?.recurring) {
          await this.notesService.updateRecurringReminder(noteDoc._id.toString());
          this.logger.log(`Updated recurring reminder for note: ${noteDoc.title}`);
        }
      }
    } catch (error) {
      this.logger.error('Error checking reminders:', error);
    }
  }

  // Manual trigger for testing
  async triggerReminderCheck() {
    await this.checkReminders();
  }
}
