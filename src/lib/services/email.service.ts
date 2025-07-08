import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ConfigService } from '@monorepo/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { resetCodeEmailTemplate } from '@monorepo/shared';
import 'isomorphic-fetch';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly graphClient: Client;
  private readonly _config = ConfigService.get();

  constructor(
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {
    const tenantId = this._config.emailService.tenantId;
    const clientId = this._config.emailService.clientId;
    const clientSecret = this._config.emailService.clientSecret;
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            'https://graph.microsoft.com/.default',
          );
          return token.token;
        },
      },
    });
  }

  async sendEmail(userEmail: string): Promise<void> {
    const senderEmail = this._config.emailService.user;
    const otp = await this.otpService.generateOtp({
      identifier: userEmail,
      channel: 'email',
    });

    const message = {
      message: {
        subject: 'Your OTP Code',
        body: {
          contentType: 'HTML',
          content: `<p>Your OTP is <strong>${otp}</strong></p>`,
        },
        toRecipients: [
          {
            emailAddress: {
              address: userEmail,
            },
          },
        ],
      },
    };

    try {
      await this.graphClient
        .api(`/users/${senderEmail}/sendMail`)
        .post(message);
      this.logger.log(`Email sent to ${userEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${userEmail}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendResetCode(email: string, code: string): Promise<void> {
    const senderEmail = this._config.emailService.user;
    const html = resetCodeEmailTemplate(code);

    const message = {
      message: {
        subject: 'Password Reset Code',
        body: {
          contentType: 'HTML',
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
      },
    };

    try {
      await this.graphClient
        .api(`/users/${senderEmail}/sendMail`)
        .post(message);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to handle in the calling service
    }
  }
}
