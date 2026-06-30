import { Controller, Post, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('test')
  async testReminders() {
    await this.notificationsService.checkReminders();
    return { ok: true, message: 'Reminder check triggered' };
  }
}
