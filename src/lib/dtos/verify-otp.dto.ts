import { IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  identifier!: string;

  @IsNotEmpty()
  otp!: string;
}
