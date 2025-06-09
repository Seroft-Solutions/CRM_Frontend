/**
 * User Onboarding Service
 * Comprehensive service for proper user onboarding with password setup
 */

import type { 
  UserInvitationWithGroups, 
  PendingInvitation,
  InvitationActionResult
} from '../types';

export interface OnboardingConfig {
  defaultGroups?: string[]; // Default groups for new users
  defaultPasswordLifespan?: number; // Password reset link lifespan
  defaultRedirectUri?: string; // Post-setup redirect
  requireEmailVerification?: boolean;
  autoAssignUsersGroup?: boolean;
}

export interface OnboardingResult {
  success: boolean;
  userId?: string;
  invitationId?: string;
  emailType: 'password_reset' | 'organization_invite' | 'none';
  message: string;
  errors?: string[];
  groupManagement?: {
    usersGroupAssigned: boolean;
    adminsGroupRemoved: boolean;
    message: string;
  };
}

export class UserOnboardingService {
  private config: OnboardingConfig;

  constructor(config: OnboardingConfig = {}) {
    this.config = {
      defaultPasswordLifespan: 43200, // 12 hours
      autoAssignUsersGroup: true,
      requireEmailVerification: false,
      ...config
    };
  }

  /**
   * Invite business partner with password setup
   */
  async invitePartnerWithPasswordSetup(
    organizationId: string,
    inviteData: Omit<UserInvitationWithGroups, 'selectedGroups'> & {
      invitationNote?: string;
    }
  ): Promise<OnboardingResult> {
    try {
      // Prepare partner invitation data with proper defaults
      const partnerData = {
        ...inviteData,
        sendPasswordReset: inviteData.sendPasswordReset !== false, // Default to true
        sendWelcomeEmail: false, // Prefer password reset over org invite
        redirectUri: inviteData.redirectUri || this.config.defaultRedirectUri,
      };

      // Call the partners API endpoint
      const response = await fetch(`/api/keycloak/organizations/${organizationId}/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerData),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          emailType: 'none',
          message: result.error || 'Failed to invite business partner',
          errors: [result.error]
        };
      }

      const baseMessage = `Business partner invited successfully. ${result.emailType === 'password_reset' ? 'Password setup email sent.' : 'Organization invite sent.'}`;
      const groupMessage = result.groupManagement ? ` ${result.groupManagement.message}` : '';
      
      return {
        success: true,
        userId: result.userId,
        invitationId: result.invitationId,
        emailType: result.emailType || 'password_reset',
        message: baseMessage + groupMessage,
        groupManagement: result.groupManagement
      };

    } catch (error: any) {
      return {
        success: false,
        emailType: 'none',
        message: 'Network error during partner invitation',
        errors: [error.message]
      };
    }
  }

  /**
   * Complete user onboarding with password setup
   */
  async inviteUserWithPasswordSetup(
    organizationId: string,
    inviteData: UserInvitationWithGroups
  ): Promise<OnboardingResult> {
    try {
      // Prepare invitation data with proper defaults
      const onboardingData: UserInvitationWithGroups = {
        ...inviteData,
        sendPasswordReset: inviteData.sendPasswordReset !== false, // Default to true
        sendWelcomeEmail: false, // Prefer password reset over org invite
        redirectUri: inviteData.redirectUri || this.config.defaultRedirectUri,
        selectedGroups: [
          ...(inviteData.selectedGroups || []),
          ...(this.config.defaultGroups || [])
        ]
      };

      // Call the API endpoint
      const response = await fetch(`/api/keycloak/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          emailType: 'none',
          message: result.error || 'Failed to invite user',
          errors: [result.error]
        };
      }

      const baseMessage = `User invited successfully. ${result.emailType === 'password_reset' ? 'Password setup email sent.' : 'Organization invite sent.'}`;
      const groupMessage = result.groupManagement ? ` ${result.groupManagement.message}` : '';
      
      return {
        success: true,
        userId: result.userId,
        invitationId: result.invitationId,
        emailType: result.emailType || 'password_reset',
        message: baseMessage + groupMessage,
        groupManagement: result.groupManagement
      };

    } catch (error: any) {
      return {
        success: false,
        emailType: 'none',
        message: 'Network error during invitation',
        errors: [error.message]
      };
    }
  }

  /**
   * Send password reset email to existing user
   */
  async sendPasswordReset(userId: string, options?: {
    lifespan?: number;
    redirectUri?: string;
  }): Promise<OnboardingResult> {
    try {
      const response = await fetch(`/api/keycloak/users/${userId}/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lifespan: options?.lifespan || this.config.defaultPasswordLifespan,
          redirectUri: options?.redirectUri || this.config.defaultRedirectUri
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          emailType: 'none',
          message: result.error || 'Failed to send password reset',
          errors: [result.error]
        };
      }

      return {
        success: true,
        userId,
        emailType: 'password_reset',
        message: 'Password reset email sent successfully'
      };

    } catch (error: any) {
      return {
        success: false,
        emailType: 'none',
        message: 'Network error sending password reset',
        errors: [error.message]
      };
    }
  }

  /**
   * Bulk user onboarding
   */
  async bulkInviteUsers(
    organizationId: string,
    invitations: UserInvitationWithGroups[]
  ): Promise<OnboardingResult[]> {
    const results: OnboardingResult[] = [];

    for (const invitation of invitations) {
      const result = await this.inviteUserWithPasswordSetup(organizationId, invitation);
      results.push(result);
      
      // Add small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Validate invitation data
   */
  validateInvitation(invitation: UserInvitationWithGroups): string[] {
    const errors: string[] = [];

    if (!invitation.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitation.email)) {
      errors.push('Invalid email format');
    }

    if (!invitation.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!invitation.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!invitation.organizationId) {
      errors.push('Organization ID is required');
    }

    return errors;
  }

  /**
   * Get onboarding status for user
   */
  async getOnboardingStatus(userId: string): Promise<{
    hasPassword: boolean;
    emailVerified: boolean;
    groupsAssigned: number;
    requiresAction: string[];
  }> {
    try {
      const response = await fetch(`/api/keycloak/users/${userId}`);
      const user = await response.json();

      // This would need to be implemented based on your user data structure
      return {
        hasPassword: !user.user?.requiredActions?.includes('UPDATE_PASSWORD'),
        emailVerified: user.user?.emailVerified || false,
        groupsAssigned: user.assignedGroups?.length || 0,
        requiresAction: user.user?.requiredActions || []
      };
    } catch (error) {
      return {
        hasPassword: false,
        emailVerified: false,
        groupsAssigned: 0,
        requiresAction: ['UPDATE_PASSWORD']
      };
    }
  }

  /**
   * Update onboarding configuration
   */
  updateConfig(newConfig: Partial<OnboardingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OnboardingConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const userOnboardingService = new UserOnboardingService();

// Export factory for custom configurations
export const createOnboardingService = (config: OnboardingConfig) => 
  new UserOnboardingService(config);
