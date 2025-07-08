import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpRepository {
  private otpStore = new Map<
    string,
    { otp: string; expiresAt: Date; channel: string }
  >();

  async storeOtp(
    identifier: string,
    otp: string,
    channel: 'email' | 'sms' | 'password-reset',
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes
    this.otpStore.set(identifier, { otp, expiresAt, channel });
  }

  async getRecentOtpChannel(identifier: string): Promise<undefined | string> {
    const record = this.otpStore.get(identifier);
    if (!record) return undefined;

    const isExpired = new Date() > record.expiresAt;
    return isExpired ? undefined : record.channel;
  }

  async validateOtp(identifier: string, otp: string): Promise<boolean> {
    const record = this.otpStore.get(identifier);
    if (!record) return false;

    const isExpired = new Date() > record.expiresAt;
    return !isExpired && record.otp === otp;
  }

  async removeOtp(identifier: string): Promise<void> {
    this.otpStore.delete(identifier);
  }
}
