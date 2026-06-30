import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private readonly noteModel: Model<NoteDocument>,
  ) {}

  async create(studentId: string, createNoteDto: CreateNoteDto): Promise<Note> {
    const note = await this.noteModel.create({
      ...createNoteDto,
      studentId,
    });
    return note;
  }

  async findAll(
    studentId: string,
    filters?: {
      subject?: string;
      hasReminder?: boolean;
      isPinned?: boolean;
      isArchived?: boolean;
      search?: string;
    },
  ): Promise<Note[]> {
    const query: any = { studentId };

    if (filters) {
      if (filters.subject) query.subject = filters.subject;
      if (filters.hasReminder !== undefined) {
        query.reminder = filters.hasReminder ? { $ne: null } : null;
      }
      if (filters.isPinned !== undefined) query.isPinned = filters.isPinned;
      if (filters.isArchived !== undefined) query.isArchived = filters.isArchived;
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
    }

    return this.noteModel
      .find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
  }

  async findOne(id: string, studentId: string): Promise<Note | null> {
    return this.noteModel.findOne({ _id: id, studentId }).exec();
  }

  async update(
    id: string,
    studentId: string,
    updateNoteDto: UpdateNoteDto,
  ): Promise<Note | null> {
    return this.noteModel
      .findOneAndUpdate({ _id: id, studentId }, updateNoteDto, { new: true })
      .exec();
  }

  async delete(id: string, studentId: string): Promise<Note | null> {
    return this.noteModel.findOneAndDelete({ _id: id, studentId }).exec();
  }

  async togglePin(id: string, studentId: string): Promise<Note | null> {
    const note = await this.noteModel.findOne({ _id: id, studentId });
    if (!note) return null;
    note.isPinned = !note.isPinned;
    return note.save();
  }

  async toggleArchive(id: string, studentId: string): Promise<Note | null> {
    const note = await this.noteModel.findOne({ _id: id, studentId });
    if (!note) return null;
    note.isArchived = !note.isArchived;
    return note.save();
  }

  async snoozeReminder(
    id: string,
    studentId: string,
    snoozeMinutes: number,
  ): Promise<Note | null> {
    const note = await this.noteModel.findOne({ _id: id, studentId });
    if (!note || !note.reminder) return null;

    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + snoozeMinutes);

    note.reminder.snoozedUntil = snoozedUntil;
    note.reminder.notified = false;
    return note.save();
  }

  // For reminder system
  async findDueReminders(): Promise<Note[]> {
    const now = new Date();
    return this.noteModel
      .find({
        'reminder.date': { $lte: now },
        'reminder.notified': false,
        $or: [
          { 'reminder.snoozedUntil': null },
          { 'reminder.snoozedUntil': { $lte: now } },
        ],
      })
      .exec();
  }

  async markReminderNotified(id: string): Promise<Note | null> {
    return this.noteModel
      .findByIdAndUpdate(
        id,
        { 'reminder.notified': true },
        { new: true },
      )
      .exec();
  }

  async updateRecurringReminder(id: string): Promise<Note | null> {
    const note = await this.noteModel.findById(id);
    if (!note || !note.reminder || !note.reminder.recurring) return null;

    const nextDate = new Date(note.reminder.date);
    switch (note.reminder.recurring) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    note.reminder.date = nextDate;
    note.reminder.notified = false;
    note.reminder.snoozedUntil = null;
    return note.save();
  }
}
