/**
 * FIXED: Enhanced Email Service for User and Partner Invitations
 *
 * This service addresses invitation email delivery issues by:
 * 1. Adding email delivery validation and retry mechanisms
 * 2. Providing fallback email methods
 * 3. Implementing email status tracking
 * 4. Adding proper error handling for email service failures
 */

export interface EmailDeliveryStatus {
  sent: boolean;
  messageId?: string;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  method: 'keycloak' | 'smtp' | 'sendgrid' | 'manual';
}

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  invitationType: 'user' | 'business_partner';
  resetPasswordUrl?: string;
  organizationInviteUrl?: string;
  customMessage?: string;
  expiryHours?: number;
}

export interface EmailServiceConfig {
  keycloakEnabled: boolean;
  smtpEnabled: boolean;
  sendgridEnabled: boolean;
  maxRetries: number;
  retryDelayMs: number;
}

class EnhancedEmailService {
  private config: EmailServiceConfig = {
    keycloakEnabled: true,
    smtpEnabled: true,
    sendgridEnabled: false,
    maxRetries: 3,
    retryDelayMs: 2000,
  };

  private emailQueue: Map<string, InvitationEmailData> = new Map();
  private deliveryStatus: Map<string, EmailDeliveryStatus> = new Map();

  /**
   * FIXED: Send invitation email with multiple delivery methods and retry logic
   */
  async sendInvitationEmail(
    emailData: InvitationEmailData,
    organizationId?: string
  ): Promise<EmailDeliveryStatus> {
    const emailKey = `${emailData.recipientEmail}-${Date.now()}`;
    this.emailQueue.set(emailKey, emailData);

    let lastError: Error | null = null;

    const deliveryMethods = this.getAvailableDeliveryMethods();

    for (const method of deliveryMethods) {
      try {
        console.log(`Attempting email delivery via ${method} for ${emailData.recipientEmail}`);

        const result = await this.attemptEmailDelivery(emailData, method, organizationId);

        if (result.sent) {
          console.log(`Email successfully sent via ${method}:`, result);
          this.deliveryStatus.set(emailKey, result);
          this.emailQueue.delete(emailKey);
          return result;
        }
      } catch (error: any) {
        console.warn(`Email delivery via ${method} failed:`, error.message);
        lastError = error;

        await this.delay(this.config.retryDelayMs);
      }
    }

    const failureStatus: EmailDeliveryStatus = {
      sent: false,
      error: lastError?.message || 'All email delivery methods failed',
      retryCount: deliveryMethods.length,
      method: 'manual',
    };

    this.deliveryStatus.set(emailKey, failureStatus);

    await this.scheduleManualNotification(emailData, failureStatus.error!);

    return failureStatus;
  }

  /**
   * Check email delivery status
   */
  async checkDeliveryStatus(recipientEmail: string): Promise<EmailDeliveryStatus | null> {
    for (const [key, status] of this.deliveryStatus.entries()) {
      if (key.includes(recipientEmail)) {
        return status;
      }
    }

    return null;
  }

  /**
   * Retry failed email delivery
   */
  async retryEmailDelivery(
    recipientEmail: string,
    organizationId?: string
  ): Promise<EmailDeliveryStatus> {
    const queuedEmail = Array.from(this.emailQueue.entries()).find(([key, _]) =>
      key.includes(recipientEmail)
    );

    if (!queuedEmail) {
      throw new Error(`No queued email found for ${recipientEmail}`);
    }

    const [key, emailData] = queuedEmail;
    this.emailQueue.delete(key);

    return this.sendInvitationEmail(emailData, organizationId);
  }

  /**
   * Test email service configuration
   */
  async testEmailService(): Promise<{
    keycloak: boolean;
    smtp: boolean;
    sendgrid: boolean;
    errors: string[];
  }> {
    const results = {
      keycloak: false,
      smtp: false,
      sendgrid: false,
      errors: [] as string[],
    };

    try {
      const response = await fetch('/api/keycloak/test-email', { method: 'POST' });
      results.keycloak = response.ok;
      if (!response.ok) {
        results.errors.push(`Keycloak: ${response.statusText}`);
      }
    } catch (error: any) {
      results.errors.push(`Keycloak: ${error.message}`);
    }

    try {
      const response = await fetch('/api/email/test', { method: 'POST' });
      results.smtp = response.ok;
      if (!response.ok) {
        results.errors.push(`SMTP: ${response.statusText}`);
      }
    } catch (error: any) {
      results.errors.push(`SMTP: ${error.message}`);
    }

    try {
      const response = await fetch('/api/email/sendgrid/test', { method: 'POST' });
      results.sendgrid = response.ok;
      if (!response.ok) {
        results.errors.push(`SendGrid: ${response.statusText}`);
      }
    } catch (error: any) {
      results.errors.push(`SendGrid: ${error.message}`);
    }

    return results;
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<EmailServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current service configuration
   */
  getConfig(): EmailServiceConfig {
    return { ...this.config };
  }

  /**
   * Clear delivery status cache
   */
  clearDeliveryStatus(): void {
    this.deliveryStatus.clear();
  }

  /**
   * Get available email delivery methods based on configuration
   */
  private getAvailableDeliveryMethods(): ('keycloak' | 'smtp' | 'sendgrid')[] {
    const methods: ('keycloak' | 'smtp' | 'sendgrid')[] = [];

    if (this.config.keycloakEnabled) methods.push('keycloak');
    if (this.config.smtpEnabled) methods.push('smtp');
    if (this.config.sendgridEnabled) methods.push('sendgrid');

    return methods;
  }

  /**
   * FIXED: Attempt email delivery using specific method
   */
  private async attemptEmailDelivery(
    emailData: InvitationEmailData,
    method: 'keycloak' | 'smtp' | 'sendgrid',
    organizationId?: string
  ): Promise<EmailDeliveryStatus> {
    switch (method) {
      case 'keycloak':
        return this.sendViaKeycloak(emailData, organizationId);
      case 'smtp':
        return this.sendViaSmtp(emailData);
      case 'sendgrid':
        return this.sendViaSendGrid(emailData);
      default:
        throw new Error(`Unknown email delivery method: ${method}`);
    }
  }

  /**
   * FIXED: Send invitation via Keycloak (preferred method)
   */
  private async sendViaKeycloak(
    emailData: InvitationEmailData,
    organizationId?: string
  ): Promise<EmailDeliveryStatus> {
    try {
      const endpoint =
        emailData.invitationType === 'business_partner'
          ? `/api/keycloak/organizations/${organizationId}/partners`
          : `/api/keycloak/organizations/${organizationId}/members`;

      const payload = {
        email: emailData.recipientEmail,
        firstName: emailData.recipientName.split(' ')[0],
        lastName: emailData.recipientName.split(' ').slice(1).join(' '),
        sendWelcomeEmail: true,
        sendPasswordReset: true,
        invitationNote: emailData.customMessage,
        redirectUri: emailData.resetPasswordUrl,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Keycloak invitation failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        sent: true,
        messageId: result.invitationId || 'keycloak-invitation',
        deliveredAt: new Date(),
        retryCount: 0,
        method: 'keycloak',
      };
    } catch (error: any) {
      console.error('Keycloak email delivery failed:', error);
      throw new Error(`Keycloak delivery failed: ${error.message}`);
    }
  }

  /**
   * FIXED: Send invitation via SMTP (backup method)
   */
  private async sendViaSmtp(emailData: InvitationEmailData): Promise<EmailDeliveryStatus> {
    try {
      const emailTemplate = this.generateEmailTemplate(emailData);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.recipientEmail,
          subject: `Invitation to join ${emailData.organizationName}`,
          html: emailTemplate.html,
          text: emailTemplate.text,
          from: emailData.inviterEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SMTP send failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        sent: true,
        messageId: result.messageId,
        deliveredAt: new Date(),
        retryCount: 0,
        method: 'smtp',
      };
    } catch (error: any) {
      console.error('SMTP email delivery failed:', error);
      throw new Error(`SMTP delivery failed: ${error.message}`);
    }
  }

  /**
   * FIXED: Send invitation via SendGrid (alternative method)
   */
  private async sendViaSendGrid(emailData: InvitationEmailData): Promise<EmailDeliveryStatus> {
    try {
      const emailTemplate = this.generateEmailTemplate(emailData);

      const response = await fetch('/api/email/sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.recipientEmail,
          subject: `Invitation to join ${emailData.organizationName}`,
          html: emailTemplate.html,
          from: emailData.inviterEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SendGrid send failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        sent: true,
        messageId: result.messageId,
        deliveredAt: new Date(),
        retryCount: 0,
        method: 'sendgrid',
      };
    } catch (error: any) {
      console.error('SendGrid email delivery failed:', error);
      throw new Error(`SendGrid delivery failed: ${error.message}`);
    }
  }

  /**
   * Generate email template for invitations
   */
  private generateEmailTemplate(emailData: InvitationEmailData): { html: string; text: string } {
    const actionUrl = emailData.resetPasswordUrl || emailData.organizationInviteUrl || '#';
    const actionText = emailData.resetPasswordUrl ? 'Set Your Password' : 'Accept Invitation';
    const expiryText = emailData.expiryHours
      ? `This invitation expires in ${emailData.expiryHours} hours.`
      : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${emailData.organizationName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; }
            .footer { padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background-color: #0056b3; }
            .custom-message { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>You're Invited!</h1>
            </div>
            <div class="content">
                <h2>Hello ${emailData.recipientName},</h2>
                <p>${emailData.inviterName} has invited you to join <strong>${emailData.organizationName}</strong> as a ${emailData.invitationType === 'business_partner' ? 'Business Partner' : 'Team Member'}.</p>
                
                ${
                  emailData.customMessage
                    ? `
                <div class="custom-message">
                    <h3>Personal Message:</h3>
                    <p>${emailData.customMessage}</p>
                </div>
                `
                    : ''
                }
                
                <p>To get started, click the button below to ${emailData.resetPasswordUrl ? 'set up your account and password' : 'accept the invitation'}:</p>
                
                <div style="text-align: center;">
                    <a href="${actionUrl}" class="button">${actionText}</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">${actionUrl}</p>
                
                ${expiryText ? `<p style="color: #dc3545; font-weight: bold;">${expiryText}</p>` : ''}
                
                <p>If you have any questions, please contact ${emailData.inviterName} at ${emailData.inviterEmail}.</p>
                
                <p>Welcome aboard!</p>
            </div>
            <div class="footer">
                <p>This invitation was sent by ${emailData.inviterName} from ${emailData.organizationName}</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
Hello ${emailData.recipientName},

${emailData.inviterName} has invited you to join ${emailData.organizationName} as a ${emailData.invitationType === 'business_partner' ? 'Business Partner' : 'Team Member'}.

${emailData.customMessage ? `Personal Message: ${emailData.customMessage}\n\n` : ''}

To get started, visit this link to ${emailData.resetPasswordUrl ? 'set up your account and password' : 'accept the invitation'}:
${actionUrl}

${expiryText}

If you have any questions, please contact ${emailData.inviterName} at ${emailData.inviterEmail}.

Welcome aboard!

---
This invitation was sent by ${emailData.inviterName} from ${emailData.organizationName}
If you didn't expect this invitation, you can safely ignore this email.
    `;

    return { html, text };
  }

  /**
   * FIXED: Schedule manual notification when all email methods fail
   */
  private async scheduleManualNotification(
    emailData: InvitationEmailData,
    error: string
  ): Promise<void> {
    try {
      await fetch('/api/notifications/manual-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          inviterEmail: emailData.inviterEmail,
          organizationName: emailData.organizationName,
          invitationType: emailData.invitationType,
          error,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`Manual notification scheduled for ${emailData.recipientEmail}`);
    } catch (notificationError) {
      console.error('Failed to schedule manual notification:', notificationError);
    }
  }

  /**
   * Utility delay function
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const emailService = new EnhancedEmailService();
export default emailService;
