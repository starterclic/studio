/**
 * RBAC (Role-Based Access Control) System
 *
 * Defines permissions for each user role:
 * - SUPER_ADMIN: Platform admin (all permissions)
 * - AGENCY_ADMIN: Agency owner (full agency control)
 * - AGENCY_DEVELOPER: Agency developer (code access)
 * - CLIENT_EDITOR: Client user (no-code only)
 */

import { type UserRole } from '@prisma/client';

/**
 * All available permissions in the system
 */
export enum Permission {
  // === WORKSPACE PANELS ===
  VIEW_CONTENT_PANEL = 'workspace:view_content',
  VIEW_DESIGN_PANEL = 'workspace:view_design',
  VIEW_CODE_PANEL = 'workspace:view_code',
  VIEW_PREVIEW_PANEL = 'workspace:view_preview',
  VIEW_AI_PANEL = 'workspace:view_ai',

  // === PROJECT MANAGEMENT ===
  CREATE_PROJECT = 'project:create',
  READ_PROJECT = 'project:read',
  UPDATE_PROJECT = 'project:update',
  DELETE_PROJECT = 'project:delete',
  DEPLOY_PROJECT = 'project:deploy',

  // === FILE MANAGEMENT ===
  CREATE_FILE = 'file:create',
  READ_FILE = 'file:read',
  UPDATE_FILE = 'file:update',
  DELETE_FILE = 'file:delete',

  // === VISUAL BUILDER ===
  USE_VISUAL_BUILDER = 'builder:use',
  CREATE_COMPONENT = 'builder:create_component',
  UPDATE_COMPONENT = 'builder:update_component',
  DELETE_COMPONENT = 'builder:delete_component',
  PUBLISH_PAGE = 'builder:publish_page',

  // === CODE EDITING ===
  EDIT_CODE = 'code:edit',
  VIEW_CODE = 'code:view',
  RUN_TERMINAL = 'code:terminal',
  INSTALL_PACKAGES = 'code:install_packages',

  // === AI FEATURES ===
  USE_AI_ASSISTANT = 'ai:use_assistant',
  USE_AI_COMPLETION = 'ai:use_completion',
  USE_AI_GENERATION = 'ai:use_generation',

  // === COMPONENT LIBRARY ===
  VIEW_COMPONENTS = 'components:view',
  CREATE_CUSTOM_COMPONENT = 'components:create_custom',
  MANAGE_TEMPLATES = 'components:manage_templates',

  // === ASSET MANAGEMENT ===
  UPLOAD_ASSET = 'assets:upload',
  DELETE_ASSET = 'assets:delete',
  MANAGE_MEDIA_LIBRARY = 'assets:manage',

  // === ANALYTICS ===
  VIEW_ANALYTICS = 'analytics:view',
  EXPORT_ANALYTICS = 'analytics:export',

  // === AGENCY MANAGEMENT ===
  MANAGE_AGENCY = 'agency:manage',
  INVITE_USER = 'agency:invite_user',
  MANAGE_USERS = 'agency:manage_users',
  MANAGE_CLIENTS = 'agency:manage_clients',
  VIEW_BILLING = 'agency:view_billing',
  MANAGE_BILLING = 'agency:manage_billing',

  // === ADMIN (Super Admin only) ===
  MANAGE_PLATFORM = 'admin:manage_platform',
  VIEW_ALL_AGENCIES = 'admin:view_all_agencies',
  IMPERSONATE_USER = 'admin:impersonate',
}

/**
 * Permission matrix: maps roles to their allowed permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  /**
   * SUPER_ADMIN: Platform administrator
   * Full access to everything including platform-wide management
   */
  SUPER_ADMIN: Object.values(Permission),

  /**
   * AGENCY_ADMIN: Agency owner
   * Full control over their agency, projects, users, and billing
   */
  AGENCY_ADMIN: [
    // Workspace
    Permission.VIEW_CONTENT_PANEL,
    Permission.VIEW_DESIGN_PANEL,
    Permission.VIEW_CODE_PANEL,
    Permission.VIEW_PREVIEW_PANEL,
    Permission.VIEW_AI_PANEL,
    // Project
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.DEPLOY_PROJECT,
    // Files
    Permission.CREATE_FILE,
    Permission.READ_FILE,
    Permission.UPDATE_FILE,
    Permission.DELETE_FILE,
    // Builder
    Permission.USE_VISUAL_BUILDER,
    Permission.CREATE_COMPONENT,
    Permission.UPDATE_COMPONENT,
    Permission.DELETE_COMPONENT,
    Permission.PUBLISH_PAGE,
    // Code
    Permission.EDIT_CODE,
    Permission.VIEW_CODE,
    Permission.RUN_TERMINAL,
    Permission.INSTALL_PACKAGES,
    // AI
    Permission.USE_AI_ASSISTANT,
    Permission.USE_AI_COMPLETION,
    Permission.USE_AI_GENERATION,
    // Components
    Permission.VIEW_COMPONENTS,
    Permission.CREATE_CUSTOM_COMPONENT,
    Permission.MANAGE_TEMPLATES,
    // Assets
    Permission.UPLOAD_ASSET,
    Permission.DELETE_ASSET,
    Permission.MANAGE_MEDIA_LIBRARY,
    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    // Agency
    Permission.MANAGE_AGENCY,
    Permission.INVITE_USER,
    Permission.MANAGE_USERS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_BILLING,
    Permission.MANAGE_BILLING,
  ],

  /**
   * AGENCY_DEVELOPER: Agency developer
   * Full development access (code, terminal, AI) but limited agency management
   */
  AGENCY_DEVELOPER: [
    // Workspace
    Permission.VIEW_CONTENT_PANEL,
    Permission.VIEW_DESIGN_PANEL,
    Permission.VIEW_CODE_PANEL,
    Permission.VIEW_PREVIEW_PANEL,
    Permission.VIEW_AI_PANEL,
    // Project
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DEPLOY_PROJECT,
    // Files
    Permission.CREATE_FILE,
    Permission.READ_FILE,
    Permission.UPDATE_FILE,
    Permission.DELETE_FILE,
    // Builder
    Permission.USE_VISUAL_BUILDER,
    Permission.CREATE_COMPONENT,
    Permission.UPDATE_COMPONENT,
    Permission.DELETE_COMPONENT,
    Permission.PUBLISH_PAGE,
    // Code
    Permission.EDIT_CODE,
    Permission.VIEW_CODE,
    Permission.RUN_TERMINAL,
    Permission.INSTALL_PACKAGES,
    // AI
    Permission.USE_AI_ASSISTANT,
    Permission.USE_AI_COMPLETION,
    Permission.USE_AI_GENERATION,
    // Components
    Permission.VIEW_COMPONENTS,
    Permission.CREATE_CUSTOM_COMPONENT,
    // Assets
    Permission.UPLOAD_ASSET,
    Permission.DELETE_ASSET,
    Permission.MANAGE_MEDIA_LIBRARY,
    // Analytics
    Permission.VIEW_ANALYTICS,
  ],

  /**
   * CLIENT_EDITOR: Client user (final customer)
   * No-code only: visual builder, content editing, basic AI
   * NO access to code, terminal, or agency management
   */
  CLIENT_EDITOR: [
    // Workspace (NO CODE PANEL!)
    Permission.VIEW_CONTENT_PANEL,
    Permission.VIEW_DESIGN_PANEL,
    Permission.VIEW_PREVIEW_PANEL,
    Permission.VIEW_AI_PANEL,
    // Project (read-only)
    Permission.READ_PROJECT,
    // Files (limited)
    Permission.READ_FILE,
    Permission.UPDATE_FILE,
    // Builder (no delete)
    Permission.USE_VISUAL_BUILDER,
    Permission.UPDATE_COMPONENT,
    Permission.PUBLISH_PAGE,
    // AI (assistant only, no code generation)
    Permission.USE_AI_ASSISTANT,
    // Components (view only)
    Permission.VIEW_COMPONENTS,
    // Assets
    Permission.UPLOAD_ASSET,
    Permission.MANAGE_MEDIA_LIBRARY,
    // Analytics (view only)
    Permission.VIEW_ANALYTICS,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a user role has ALL of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a user role has ANY of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if role can access workspace panel
 */
export function canAccessPanel(
  role: UserRole,
  panel: 'content' | 'design' | 'code' | 'preview' | 'ai'
): boolean {
  const panelPermissions = {
    content: Permission.VIEW_CONTENT_PANEL,
    design: Permission.VIEW_DESIGN_PANEL,
    code: Permission.VIEW_CODE_PANEL,
    preview: Permission.VIEW_PREVIEW_PANEL,
    ai: Permission.VIEW_AI_PANEL,
  };

  return hasPermission(role, panelPermissions[panel]);
}

/**
 * Get UI mode based on role
 */
export function getUIMode(role: UserRole): 'dev' | 'agency' | 'client' {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'dev';
    case 'AGENCY_ADMIN':
      return 'agency';
    case 'AGENCY_DEVELOPER':
      return 'dev';
    case 'CLIENT_EDITOR':
      return 'client';
    default:
      return 'client';
  }
}
