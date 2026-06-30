import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from './admin.schema';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // In-memory cache for admin list (changes rarely)
  private adminCache: AdminDocument[] | null = null;
  private adminCacheTime = 0;
  private readonly CACHE_TTL = 60_000; // 60 seconds

  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.adminModel.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
      const { password, ...result } = admin.toObject();
      return result;
    }
    return null;
  }

  async login(admin: any) {
    const payload = { 
      email: admin.email, 
      sub: admin._id, 
      name: admin.name, 
      role: admin.role || 'admin',
      schoolId: admin.schoolId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      admin: payload
    };
  }

  async register(adminDto: { 
    name: string; 
    email: string; 
    password: string;
    role?: string;
    schoolId?: string;
  }) {
    const existing = await this.adminModel.findOne({ email: adminDto.email });
    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminDto.password, salt);
    
    const newAdmin = new this.adminModel({
      name: adminDto.name,
      email: adminDto.email,
      password: hashedPassword,
      role: adminDto.role || 'admin',
      schoolId: adminDto.schoolId,
    });

    const saved = await newAdmin.save();
    this.invalidateCache(); // Clear cache when new admin is created
    return this.login(saved);
  }

  /** Invalidate the admin list cache */
  private invalidateCache() {
    this.adminCache = null;
    this.adminCacheTime = 0;
  }

  /** Cached findAll — returns admin list from cache if fresh, otherwise queries DB */
  async findAll(): Promise<AdminDocument[]> {
    const now = Date.now();
    if (this.adminCache && (now - this.adminCacheTime) < this.CACHE_TTL) {
      return this.adminCache;
    }

    const admins = await this.adminModel.find().select('-password').lean().exec();
    this.adminCache = admins as unknown as AdminDocument[];
    this.adminCacheTime = now;
    return this.adminCache;
  }

  /** Find a single admin by ID (avoids loading all admins) */
  async findById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).select('-password').lean().exec() as Promise<AdminDocument | null>;
  }

  /** Get dashboard stats using MongoDB aggregation (avoids loading all documents) */
  async getDashboardStats(): Promise<{
    totalAdmins: number;
    adminsByRole: Record<string, number>;
  }> {
    const [total, byRole] = await Promise.all([
      this.adminModel.countDocuments(),
      this.adminModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const adminsByRole = byRole.reduce(
      (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
      { super_admin: 0, admin: 0, content_moderator: 0, school_admin: 0 },
    );

    return { totalAdmins: total, adminsByRole };
  }

  /** Get admin count only (for overview endpoint) */
  async getAdminCount(): Promise<number> {
    return this.adminModel.countDocuments();
  }

  /** Find admins by role using an indexed query */
  async findByRole(role: string): Promise<AdminDocument[]> {
    return this.adminModel.find({ role }).select('-password').lean().exec() as unknown as Promise<AdminDocument[]>;
  }
}
