import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleFeature, RoleFeatureDocument, DEFAULT_ROLE_FEATURES } from './role-feature.schema';

@Injectable()
export class RoleFeaturesService implements OnModuleInit {
  constructor(
    @InjectModel(RoleFeature.name)
    private roleFeatureModel: Model<RoleFeatureDocument>,
  ) {}

  /**
   * Initialize default role features on module startup if they don't exist
   */
  async onModuleInit() {
    await this.syncDefaultFeatures();
  }

  /**
   * Sync default features into the database (only creates missing roles)
   */
  async syncDefaultFeatures(): Promise<void> {
    for (const [role, config] of Object.entries(DEFAULT_ROLE_FEATURES)) {
      const existing = await this.roleFeatureModel.findOne({ role });
      if (!existing) {
        await this.roleFeatureModel.create({
          role,
          features: config.features,
          permissions: config.permissions,
          description: config.description,
          isActive: true,
        });
        console.log(`[RoleFeaturesService] Created default features for role: ${role}`);
      }
    }
  }

  /**
   * Get all role-feature mappings
   */
  async getAllRoleFeatures(): Promise<RoleFeatureDocument[]> {
    return this.roleFeatureModel.find({ isActive: true }).exec();
  }

  /**
   * Get features for a specific role
   */
  async getFeaturesByRole(role: string): Promise<RoleFeatureDocument | null> {
    return this.roleFeatureModel.findOne({ role, isActive: true }).exec();
  }

  /**
   * Get permissions for a specific role (returns string array)
   */
  async getPermissionsByRole(role: string): Promise<string[]> {
    const roleFeature = await this.roleFeatureModel.findOne({ role, isActive: true }).exec();
    if (!roleFeature) {
      // Fall back to defaults
      return DEFAULT_ROLE_FEATURES[role]?.permissions || [];
    }
    return roleFeature.permissions;
  }

  /**
   * Update all features for a role
   */
  async updateFeaturesForRole(
    role: string,
    features: string[],
    permissions?: string[],
  ): Promise<RoleFeatureDocument> {
    const update: any = { features };
    if (permissions) {
      update.permissions = permissions;
    }

    const roleFeature = await this.roleFeatureModel.findOneAndUpdate(
      { role },
      { $set: update },
      { new: true, upsert: true },
    );

    return roleFeature;
  }

  /**
   * Add a single feature to a role
   */
  async addFeatureToRole(role: string, feature: string): Promise<RoleFeatureDocument> {
    const roleFeature = await this.roleFeatureModel.findOneAndUpdate(
      { role },
      { $addToSet: { features: feature } },
      { new: true, upsert: true },
    );

    return roleFeature;
  }

  /**
   * Remove a single feature from a role
   */
  async removeFeatureFromRole(role: string, feature: string): Promise<RoleFeatureDocument> {
    const roleFeature = await this.roleFeatureModel.findOneAndUpdate(
      { role },
      { $pull: { features: feature } },
      { new: true },
    );

    if (!roleFeature) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    return roleFeature;
  }

  /**
   * Add a permission to a role
   */
  async addPermissionToRole(role: string, permission: string): Promise<RoleFeatureDocument> {
    const roleFeature = await this.roleFeatureModel.findOneAndUpdate(
      { role },
      { $addToSet: { permissions: permission } },
      { new: true, upsert: true },
    );

    return roleFeature;
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(role: string, permission: string): Promise<RoleFeatureDocument> {
    const roleFeature = await this.roleFeatureModel.findOneAndUpdate(
      { role },
      { $pull: { permissions: permission } },
      { new: true },
    );

    if (!roleFeature) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    return roleFeature;
  }

  /**
   * Check if a role has a specific feature
   */
  async hasFeature(role: string, feature: string): Promise<boolean> {
    const roleFeature = await this.getFeaturesByRole(role);
    if (!roleFeature) return false;
    if (roleFeature.features.includes('*')) return true;
    return roleFeature.features.includes(feature);
  }

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(role: string, permission: string): Promise<boolean> {
    const permissions = await this.getPermissionsByRole(role);
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  /**
   * Reset a role to its default features
   */
  async resetToDefaults(role: string): Promise<RoleFeatureDocument | null> {
    const defaults = DEFAULT_ROLE_FEATURES[role];
    if (!defaults) {
      throw new NotFoundException(`No default features found for role: ${role}`);
    }

    return this.roleFeatureModel.findOneAndUpdate(
      { role },
      {
        $set: {
          features: defaults.features,
          permissions: defaults.permissions,
          description: defaults.description,
        },
      },
      { new: true, upsert: true },
    );
  }
}
