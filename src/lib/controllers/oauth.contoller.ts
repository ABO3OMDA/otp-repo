import { Controller, Get, Query } from '@nestjs/common';
import { OAuthService } from '../services/oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oAuthService: OAuthService) {}

  @Get('auth-url')
  getAuthUrl() {
    return { url: this.oAuthService.generateAuthUrl() };
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string) {
    const refreshToken = await this.oAuthService.getRefreshToken(code);
    return { refreshToken };
  }
}
