import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Request() req, @Body() createNoteDto: CreateNoteDto) {
    const note = await this.notesService.create(req.user.userId, createNoteDto);
    return { ok: true, data: note };
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('subject') subject?: string,
    @Query('hasReminder') hasReminder?: string,
    @Query('isPinned') isPinned?: string,
    @Query('isArchived') isArchived?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (subject) filters.subject = subject;
    if (hasReminder !== undefined) filters.hasReminder = hasReminder === 'true';
    if (isPinned !== undefined) filters.isPinned = isPinned === 'true';
    if (isArchived !== undefined) filters.isArchived = isArchived === 'true';
    if (search) filters.search = search;

    const notes = await this.notesService.findAll(req.user.userId, filters);
    return { ok: true, data: notes };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const note = await this.notesService.findOne(id, req.user.userId);
    if (!note) {
      return { ok: false, message: 'Note not found' };
    }
    return { ok: true, data: note };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    const note = await this.notesService.update(id, req.user.userId, updateNoteDto);
    if (!note) {
      return { ok: false, message: 'Note not found' };
    }
    return { ok: true, data: note };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Request() req, @Param('id') id: string) {
    const note = await this.notesService.delete(id, req.user.userId);
    if (!note) {
      return { ok: false, message: 'Note not found' };
    }
    return { ok: true, message: 'Note deleted successfully' };
  }

  @Put(':id/pin')
  async togglePin(@Request() req, @Param('id') id: string) {
    const note = await this.notesService.togglePin(id, req.user.userId);
    if (!note) {
      return { ok: false, message: 'Note not found' };
    }
    return { ok: true, data: note };
  }

  @Put(':id/archive')
  async toggleArchive(@Request() req, @Param('id') id: string) {
    const note = await this.notesService.toggleArchive(id, req.user.userId);
    if (!note) {
      return { ok: false, message: 'Note not found' };
    }
    return { ok: true, data: note };
  }

  @Put(':id/snooze')
  async snoozeReminder(
    @Request() req,
    @Param('id') id: string,
    @Body('minutes') minutes: number,
  ) {
    const note = await this.notesService.snoozeReminder(
      id,
      req.user.userId,
      minutes || 10,
    );
    if (!note) {
      return { ok: false, message: 'Note not found or no reminder set' };
    }
    return { ok: true, data: note };
  }

  @Get('reminders/active')
  async getActiveReminders(@Request() req) {
    const notes = await this.notesService.findAll(req.user.userId, {
      hasReminder: true,
      isArchived: false,
    });
    return { ok: true, data: notes };
  }
}
