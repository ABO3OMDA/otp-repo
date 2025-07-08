import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@monorepo/config';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly _config = ConfigService.get();
  private readonly oAuth2Client: any;

  constructor() {
    // Initialize OAuth2 client
    this.oAuth2Client = new google.auth.OAuth2(
      this._config.emailService.clientId,
      this._config.emailService.clientSecret,
      this._config.emailService.redirectUri,
    );
  }

  /**
   * Generates the OAuth 2.0 authorization URL for Gmail API access.
   * @returns The authorization URL to visit for user consent.
   */
  generateAuthUrl(): string {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      scope: ['https://www.googleapis.com/auth/gmail.send'],
    });
    this.logger.log(`Generated OAuth authorization URL: ${authUrl}`);
    return authUrl;
  }

  /**
   * Exchanges the authorization code for tokens and returns the refresh token.
   * @param code The authorization code from the OAuth redirect.
   * @returns The refresh token.
   */
  async getRefreshToken(code: string): Promise<string> {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      if (!tokens.refresh_token) {
        this.logger.warn('No refresh token received in response');
        throw new Error('Failed to obtain refresh token');
      }
      this.logger.log(`Refresh token obtained: ${tokens.refresh_token}`);
      return tokens.refresh_token;
    } catch (error: any) {
      this.logger.error(
        `Error exchanging code for tokens: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
