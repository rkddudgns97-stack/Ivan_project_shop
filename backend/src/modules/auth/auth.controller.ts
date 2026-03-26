import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email-code')
  async requestEmailCode(
    @Body() body: { email: string; purpose: 'signup' | 'login' },
  ) {
    return {
      success: true,
      data: await this.authService.requestEmailCode(body.email, body.purpose),
    };
  }

  @Post('signup')
  async signup(@Body() body: { name: string; email: string; code: string }) {
    return {
      success: true,
      data: await this.authService.signup(body.name, body.email, body.code),
    };
  }

  @Post('login')
  async login(@Body() body: { email: string; code: string }) {
    return {
      success: true,
      data: await this.authService.login(body.email, body.code),
    };
  }
}
