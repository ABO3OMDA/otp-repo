import { Module } from '@nestjs/common';
import { OtpController } from './controllers/otp.controller';
import { OtpService } from './services/otp.service';
import { OtpRepository } from './repositories/otp.repository';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { KeycloakAdminModule } from '@monorepo/shared';
import { OAuthController } from './controllers/oauth.contoller';
import { OAuthService } from './services/oauth.service';
import { ConfigModule } from '@monorepo/config';

@Module({
  imports: [KeycloakAdminModule, ConfigModule],
  controllers: [OtpController, OAuthController],
  providers: [
    OtpService,
    OAuthService,
    OtpRepository,
    EmailService,
    SmsService,
  ],
  exports: [OtpService, OAuthService, EmailService, SmsService, OtpRepository],
})
export class OtpModule {}
