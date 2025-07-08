import { IsEnum, IsNotEmpty } from 'class-validator';

export class GenerateOtpDto {
  @IsNotEmpty()
  identifier!: string; // Email or phone number

  @IsEnum(['email', 'sms', 'password-reset'])
  channel!: 'email' | 'sms' | 'password-reset';
}
