import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { SendResetPasswordEmailDto } from './dto/send-reset-password-email.dto';
import { OAuthLoginRequest } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterRequestDto): Promise<{ email: string }> {
    return await this.authService.register(dto);
  }

  @Post('register-web')
  @Public()
  async registerWeb(
    @Body() dto: RegisterRequestDto,
  ): Promise<{ email: string }> {
    return await this.authService.registerWeb(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.authService.login(dto);
    return new LoginResponseDto(result.access_token);
  }

  @Post('verify')
  @Public()
  async verify(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('send-reset-password-email')
  @Public()
  async sendResetPasswordEmail(@Body() dto: SendResetPasswordEmailDto) {
    return this.authService.sendResetPasswordEmail(dto.email, dto.frontendUrl);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('resend-verification-email')
  @Public()
  async resendVerification(
    @Body() body: { email: string; frontendUrl: string },
  ) {
    return this.authService.resendVerificationEmail(
      body.email,
      body.frontendUrl,
    );
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const oauthReq = req as Request & {
      query: { error?: string };
      user?: OAuthLoginRequest;
    };
    const redirectUrl = await this.authService.handleOAuthCallback(
      oauthReq.query.error,
      oauthReq.user,
      'EMAIL_REQUIRED_FROM_GOOGLE',
    );
    return res.redirect(redirectUrl);
  }

  @Get('facebook')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() {}

  @Get('facebook/callback')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const oauthReq = req as Request & {
      query: { error?: string };
      user?: OAuthLoginRequest;
    };
    const redirectUrl = await this.authService.handleOAuthCallback(
      oauthReq.query.error,
      oauthReq.user,
      'EMAIL_REQUIRED_FROM_FACEBOOK',
    );
    return res.redirect(redirectUrl);
  }
}
