import { Body, Controller, GoneException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email-code')
  async requestEmailCode() {
    throw new GoneException('이메일 인증 방식은 종료되었습니다.');
  }

  @Post('signup')
  async signup(@Body() body: { name: string; email: string; password: string }) {
    return {
      success: true,
      data: await this.authService.signup(body.name, body.email, body.password),
    };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return {
      success: true,
      data: await this.authService.login(body.email, body.password),
    };
  }
}
