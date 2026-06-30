
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { TeacherUserService } from '../teacher/teacher-user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private studentsService: StudentsService,
    private teacherUserService: TeacherUserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // First check students collection
    let user: any = await this.studentsService.findByEmail(email);
    let userType = 'student';
    
    // If not found in students, check teachers collection
    if (!user) {
      user = await this.teacherUserService.findByEmail(email);
      userType = 'teacher';
    }
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const userObj = user.toObject();
      const { password, ...result } = userObj;
      return { ...result, userType };
    }
    return null;
  }

  /**
   * Validate user by role - only checks the specific collection for that role
   * This prevents cross-login (teacher trying to login from student page)
   */
  async validateUserByRole(email: string, pass: string, expectedRole: 'student' | 'teacher'): Promise<any> {
    let user: any;
    
    if (expectedRole === 'student') {
      // Only check students collection
      user = await this.studentsService.findByEmail(email);
    } else {
      // Only check teachers collection
      user = await this.teacherUserService.findByEmail(email);
    }
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const userObj = user.toObject();
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id, 
      name: user.name,
      role: user.role || 'student',
      gradeNumber: user.gradeNumber,
      // Include the appropriate ID based on user type
      ...(user.teacherId && { teacherId: user.teacherId }),
      ...(user.studentId && { studentId: user.studentId }),
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload
    };
  }

  async register(userDto: any) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userDto.password, salt);
    
    // Only allow student and teacher roles during registration (not admin)
    const allowedRoles = ['student', 'teacher'];
    const role = allowedRoles.includes(userDto.role) ? userDto.role : 'student';
    
    let newUser;
    
    if (role === 'teacher') {
      // Create teacher in teachers collection
      newUser = await this.teacherUserService.create({
        ...userDto,
        role: 'teacher',
        password: hashedPassword
      });
    } else {
      // Create student in students collection
      newUser = await this.studentsService.create({
        ...userDto,
        role: 'student',
        password: hashedPassword
      });
    }

    return this.login(newUser);
  }

  /**
   * Register a new teacher with optional grade/subject assignment
   */
  async registerTeacher(teacherDto: any) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(teacherDto.password, salt);
    
    // Convert string IDs to ObjectId for proper MongoDB storage
    const newTeacher = await this.teacherUserService.create({
      name: teacherDto.name,
      email: teacherDto.email,
      password: hashedPassword,
      role: 'teacher',
      gradeId: teacherDto.gradeId ? new Types.ObjectId(teacherDto.gradeId) : undefined,
      subjectId: teacherDto.subjectId ? new Types.ObjectId(teacherDto.subjectId) : undefined,
      schoolId: teacherDto.schoolId ? new Types.ObjectId(teacherDto.schoolId) : undefined,
      geminiApiKey: teacherDto.geminiApiKey || undefined,
    });

    return this.login(newTeacher);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, userRole?: string) {
    // Determine which service to use based on role
    let user;
    let service: StudentsService | TeacherUserService;
    
    if (userRole === 'teacher') {
      user = await this.teacherUserService.findOne(userId);
      service = this.teacherUserService;
    } else {
      user = await this.studentsService.findOne(userId);
      service = this.studentsService;
    }
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await service.update(userId, { password: hashedPassword });
    return { message: 'Password changed successfully' };
  }
}

