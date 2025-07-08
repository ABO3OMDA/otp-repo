import { HttpException, Injectable, Logger } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ConfigService } from '@monorepo/config';
import twilio from 'twilio';
import { JwtPayload } from 'jsonwebtoken';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient;
  private readonly graphClient: Client;
  private readonly _config = ConfigService.get();

  constructor(
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Twilio client
    this.twilioClient = twilio(
      this._config.smsService.sid,
      this._config.smsService.token,
    );

    // Initialize Microsoft Graph client for fallback email
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

  async sendSms(user: JwtPayload, userPhone: string): Promise<void> {
    const otp = await this.otpService.generateOtp({
      identifier: userPhone,
      channel: 'sms',
    });

    this.logger.log(`Generated OTP: ${otp}`);

    try {
      await this.twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        from: '+18453939676', // Or use this.configService.get<string>('smsService.from')
        to: userPhone,
      });
    } catch (error) {
      this.logger.error('Error sending SMS, falling back to email', error);

      // fallback to Microsoft Graph email
      const senderEmail = this._config.emailService.user;

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
                address: user['email'],
              },
            },
          ],
        },
      };

      try {
        await this.graphClient
          .api(`/users/${senderEmail}/sendMail`)
          .post(message);
        this.logger.log(`Fallback email sent to ${user['email']}`);
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send fallback email: ${emailError.message}`,
          emailError.stack,
        );
        throw new Error('Failed to send OTP via both SMS and Email');
      }

      throw new HttpException('SMS failed. Fallback email sent.', 500);
    }
  }
}
