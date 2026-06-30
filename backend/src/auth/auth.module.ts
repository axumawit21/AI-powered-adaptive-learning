
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { StudentsModule } from '../students/students.module';
import { TeacherModule } from '../teacher/teacher.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard, SuperAdminGuard, SchoolAdminGuard, ContentModeratorGuard } from './admin.guard';
import { RolesGuard } from './roles.guard';
import { RoleFeature, RoleFeatureSchema } from './role-feature.schema';
import { RoleFeaturesService } from './role-features.service';
import { RoleFeaturesController } from './role-features.controller';

@Module({
  imports: [
    StudentsModule,
    TeacherModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: RoleFeature.name, schema: RoleFeatureSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '7d' }, // Extended from 60m to 7 days
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    AdminGuard, 
    SuperAdminGuard,
    SchoolAdminGuard,
    ContentModeratorGuard,
    RolesGuard,
    RoleFeaturesService,
  ],
  controllers: [AuthController, RoleFeaturesController],
  exports: [
    AuthService, 
    AdminGuard, 
    SuperAdminGuard,
    SchoolAdminGuard,
    ContentModeratorGuard,
    RolesGuard,
    RoleFeaturesService,
  ],
})
export class AuthModule {}



