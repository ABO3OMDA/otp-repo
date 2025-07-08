import { KeycloakAdminService } from '@monorepo/shared';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { GenerateOtpDto } from '../dtos/generate-otp.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { OtpRepository } from '../repositories/otp.repository';

@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly keycloakService: KeycloakAdminService,
  ) {}

  async generateOtp(dto: GenerateOtpDto): Promise<string> {
    const otp = Math.random().toString(10).substring(2, 8); // Generate a 6-digit OTP
    await this.otpRepository.storeOtp(dto.identifier, otp, dto.channel);
    return otp;
  }

  async verifyOtp(dto: VerifyOtpDto, user: JwtPayload): Promise<boolean> {
    const isValid = await this.otpRepository.validateOtp(
      dto.identifier,
      dto.otp,
    );
    if (isValid) {
      try {
        const channel = await this.otpRepository.getRecentOtpChannel(
          dto.identifier,
        );
        if (channel === 'email') {
          await this.keycloakService.verifyEmail(user);
        } else if (channel === 'password-reset') {
          return true;
        } else if (channel === 'sms') {
          await this.keycloakService.verifyPhone(user);
        } else {
          throw new HttpException('Invalid channel', HttpStatus.BAD_REQUEST);
        }
      } catch (error) {
        throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
      }
      await this.otpRepository.removeOtp(dto.identifier);
    }
    return isValid;
  }
}
