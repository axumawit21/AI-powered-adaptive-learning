import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { StudentsService } from '../students/students.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let studentsService: jest.Mocked<StudentsService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedpassword', // bcrypt hash
    role: 'student',
    toObject: () => ({
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$hashedpassword',
      role: 'student',
    }),
  };

  beforeEach(async () => {
    const mockStudentsService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: StudentsService, useValue: mockStudentsService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    studentsService = module.get(StudentsService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      studentsService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      studentsService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      studentsService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user payload', async () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      studentsService.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('invalidId', 'current', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      studentsService.findOne.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.changePassword('user123', 'wrongpassword', 'newpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update password when credentials are valid', async () => {
      studentsService.findOne.mockResolvedValue(mockUser as any);
      studentsService.update.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('newhash'));

      const result = await service.changePassword('user123', 'currentpass', 'newpass');

      expect(result.message).toBe('Password changed successfully');
      expect(studentsService.update).toHaveBeenCalledWith('user123', { password: 'newhash' });
    });
  });

  describe('register', () => {
    it('should only allow student and teacher roles', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'admin', // Should be rejected
      };

      studentsService.create.mockResolvedValue({
        ...mockUser,
        role: 'student', // Should be downgraded to student
      } as any);

      await service.register(newUser);

      // Verify role was changed to student
      expect(studentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'student' }),
      );
    });

    it('should hash password before storing', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedpassword'));
      
      studentsService.create.mockResolvedValue(mockUser as any);

      await service.register({
        name: 'Test',
        email: 'test@test.com',
        password: 'plaintext',
      });

      expect(studentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashedpassword' }),
      );
    });
  });
});
