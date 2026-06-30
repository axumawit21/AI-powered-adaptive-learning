import { Body, Controller, Post, Get, Delete, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AskDto, AskResponseDto } from './dto/chat.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chat history', description: 'Get list of chat sessions for a student' })
  async getHistory(@Request() req) {
    return this.chatService.getStudentSessions(req.user.userId);
  }

  @Get(':sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session messages', description: 'Get all messages for a specific session' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.chatService.getSession(sessionId);
  }

  @Post('session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new session', description: 'Start a new chat session' })
  @ApiBody({ schema: { type: 'object', properties: { firstMessage: { type: 'string' }, grade: { type: 'string' }, subject: { type: 'string' } } } })
  async createSession(@Request() req, @Body() body: { firstMessage?: string; grade?: string; subject?: string }) {
    return this.chatService.createSession(req.user.userId, body.firstMessage, { grade: body.grade, subject: body.subject });
  }

  @Delete(':sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete session', description: 'Delete a chat session' })
  async deleteSession(@Param('sessionId') sessionId: string) {
    return this.chatService.deleteSession(sessionId);
  }

  @Patch(':sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename session', description: 'Update chat session title' })
  @ApiBody({ schema: { type: 'object', properties: { title: { type: 'string' } } } })
  async renameSession(@Param('sessionId') sessionId: string, @Body() body: { title: string }) {
    return this.chatService.updateSessionTitle(sessionId, body.title);
  }

  @Post(':sessionId/message')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add message', description: 'Manually add a message to the session' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string' }, context: { type: 'object' } } } })
  async addMessage(@Param('sessionId') sessionId: string, @Body() body: { role: 'user' | 'assistant', content: string, context?: any }) {
    return this.chatService.addMessage(sessionId, body.role, body.content, body.context);
  }

  @Post('ask')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ask a question', description: 'Ask an AI-powered question about a specific grade and subject' })
  @ApiBody({ type: AskDto })
  @ApiResponse({ status: 200, description: 'Question answered successfully', type: AskResponseDto })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  async ask(@Request() req, @Body() body: AskDto) {
    const { grade, subject, question, sessionId, selectedUnit, selectedSubunit, unitTitle, subunitTitle } = body;
    const studentId = req.user.userId;

    if (!grade || !subject || !question) {
      return { ok: false, message: 'Please provide grade, subject, and question' };
    }

    try {
      return await this.chatService.askByGradeSubject(
        grade, 
        subject, 
        question, 
        sessionId, 
        studentId, 
        selectedUnit, 
        selectedSubunit,
        unitTitle,
        subunitTitle
      );
    } catch (err: any) {
      console.error('Chat API Error:', err.message);
      return { ok: false, message: 'Error answering question', error: err.message };
    }
  }
}
