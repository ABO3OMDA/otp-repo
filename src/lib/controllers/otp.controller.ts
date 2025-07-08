import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { GenerateOtpDto } from '../dtos/generate-otp.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Realms,
  RealmsGuard,
} from '@monorepo/shared';
import { JwtPayload } from 'jsonwebtoken';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';

@UseGuards(JwtAuthGuard, RealmsGuard)
@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Realms(['users'])
  @Post('generate')
  async generateOtp(
    @Body() dto: GenerateOtpDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    if (dto.channel === 'email') {
      await this.emailService.sendEmail(dto.identifier);
    } else if (dto.channel === 'sms') {
      await this.smsService.sendSms(user, dto.identifier);
    } else {
      throw new Error('Invalid channel');
    }
    return 'Otp generated : and sent to ' + dto.identifier;
  }

  @Realms(['users'])
  @Post('verify')
  async verifyOtp(
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyOtpDto,
  ): Promise<string> {
    const success = await this.otpService.verifyOtp(dto, user);
    return 'Otp verified : ' + success;
  }
}
