import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RoleFeaturesService } from './role-features.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './admin.guard';

// DTOs
class UpdateRoleFeaturesDto {
  features?: string[];
  permissions?: string[];
}

class FeatureOperationDto {
  feature?: string;
  permission?: string;
}

@ApiTags('Role Features')
@Controller('role-features')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class RoleFeaturesController {
  constructor(private readonly roleFeaturesService: RoleFeaturesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all role-feature mappings', description: 'Returns features for all roles (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of role-feature mappings' })
  async getAllRoleFeatures() {
    const features = await this.roleFeaturesService.getAllRoleFeatures();
    return { ok: true, data: features };
  }

  @Get(':role')
  @ApiOperation({ summary: 'Get features for a specific role' })
  @ApiResponse({ status: 200, description: 'Role features' })
  async getRoleFeatures(@Param('role') role: string) {
    const features = await this.roleFeaturesService.getFeaturesByRole(role);
    return { ok: true, data: features };
  }

  @Put(':role')
  @ApiOperation({ summary: 'Update features for a role', description: 'Replace all features/permissions for a role' })
  @ApiBody({ type: UpdateRoleFeaturesDto })
  @ApiResponse({ status: 200, description: 'Role features updated' })
  async updateRoleFeatures(
    @Param('role') role: string,
    @Body() dto: UpdateRoleFeaturesDto,
  ) {
    const updated = await this.roleFeaturesService.updateFeaturesForRole(
      role,
      dto.features || [],
      dto.permissions,
    );
    return { ok: true, data: updated, message: `Features updated for role: ${role}` };
  }

  @Post(':role/add-feature')
  @ApiOperation({ summary: 'Add a feature to a role' })
  @ApiBody({ type: FeatureOperationDto })
  @ApiResponse({ status: 200, description: 'Feature added' })
  async addFeature(
    @Param('role') role: string,
    @Body() dto: FeatureOperationDto,
  ) {
    if (!dto.feature) {
      return { ok: false, message: 'Feature is required' };
    }
    const updated = await this.roleFeaturesService.addFeatureToRole(role, dto.feature);
    return { ok: true, data: updated, message: `Feature '${dto.feature}' added to role: ${role}` };
  }

  @Post(':role/remove-feature')
  @ApiOperation({ summary: 'Remove a feature from a role' })
  @ApiBody({ type: FeatureOperationDto })
  @ApiResponse({ status: 200, description: 'Feature removed' })
  async removeFeature(
    @Param('role') role: string,
    @Body() dto: FeatureOperationDto,
  ) {
    if (!dto.feature) {
      return { ok: false, message: 'Feature is required' };
    }
    const updated = await this.roleFeaturesService.removeFeatureFromRole(role, dto.feature);
    return { ok: true, data: updated, message: `Feature '${dto.feature}' removed from role: ${role}` };
  }

  @Post(':role/add-permission')
  @ApiOperation({ summary: 'Add a permission to a role' })
  @ApiBody({ type: FeatureOperationDto })
  @ApiResponse({ status: 200, description: 'Permission added' })
  async addPermission(
    @Param('role') role: string,
    @Body() dto: FeatureOperationDto,
  ) {
    if (!dto.permission) {
      return { ok: false, message: 'Permission is required' };
    }
    const updated = await this.roleFeaturesService.addPermissionToRole(role, dto.permission);
    return { ok: true, data: updated, message: `Permission '${dto.permission}' added to role: ${role}` };
  }

  @Post(':role/remove-permission')
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiBody({ type: FeatureOperationDto })
  @ApiResponse({ status: 200, description: 'Permission removed' })
  async removePermission(
    @Param('role') role: string,
    @Body() dto: FeatureOperationDto,
  ) {
    if (!dto.permission) {
      return { ok: false, message: 'Permission is required' };
    }
    const updated = await this.roleFeaturesService.removePermissionFromRole(role, dto.permission);
    return { ok: true, data: updated, message: `Permission '${dto.permission}' removed from role: ${role}` };
  }

  @Post(':role/reset')
  @ApiOperation({ summary: 'Reset a role to default features' })
  @ApiResponse({ status: 200, description: 'Role reset to defaults' })
  async resetToDefaults(@Param('role') role: string) {
    const updated = await this.roleFeaturesService.resetToDefaults(role);
    return { ok: true, data: updated, message: `Role '${role}' reset to defaults` };
  }
}
