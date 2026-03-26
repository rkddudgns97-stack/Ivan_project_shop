import crypto from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthCodePurpose, Role, UserStatus } from '@prisma/client';
import { mapUser } from '../../common/mappers';
import { PrismaService } from '../../prisma/prisma.service';

const ALLOWED_SIGNUP_DOMAINS = ['aeonlab.kr', 'finble.io', 'finbleventures.com', 'zerokleek.com'] as const;
const AUTH_CODE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async requestEmailCode(email: string, purpose: 'signup' | 'login') {
    const normalizedEmail = this.normalizeEmail(email);

    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('올바른 이메일 주소를 입력해 주세요.');
    }

    if (purpose === 'signup') {
      this.ensureAllowedSignupEmail(normalizedEmail);
    }

    if (purpose === 'login') {
      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!existingUser) {
        throw new NotFoundException('가입된 이메일 계정을 찾을 수 없습니다.');
      }
    }

    const requestId = crypto.randomUUID();
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_MS);

    await this.sendVerificationEmail({
      email: normalizedEmail,
      purpose,
      verificationCode,
      expiresInMinutes: 5,
    });

    const authCode = await this.prisma.authCode.create({
      data: {
        requestId,
        email: normalizedEmail,
        purpose: purpose === 'signup' ? AuthCodePurpose.SIGNUP : AuthCodePurpose.LOGIN,
        code: verificationCode,
        expiresAt,
      },
    });

    return {
      requestId: authCode.requestId,
      expiresInSeconds: 300,
    };
  }

  async signup(name: string, email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.ensureAllowedSignupEmail(normalizedEmail);

    await this.consumeCode(normalizedEmail, 'signup', code);

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const count = await this.prisma.user.count();
    const employeeNo = `E${String(240001 + count).padStart(6, '0')}`;

    const user = await this.prisma.user.create({
      data: {
        employeeNo,
        name,
        email: normalizedEmail,
        emailVerified: true,
        authProvider: 'email',
        status: UserStatus.ACTIVE,
        roles: {
          create: [{ role: Role.EMPLOYEE }],
        },
        pointWallet: {
          create: {
            availablePoint: 0,
            reservedPoint: 0,
            expiringPoint: 0,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    return mapUser(user);
  }

  async login(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);

    await this.consumeCode(normalizedEmail, 'login', code);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException('가입된 이메일 계정을 찾을 수 없습니다.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('현재 로그인할 수 없는 계정입니다.');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('이메일 인증이 완료되지 않은 계정입니다.');
    }

    return mapUser(user);
  }

  private async consumeCode(email: string, purpose: 'signup' | 'login', code: string) {
    const authCode = await this.prisma.authCode.findFirst({
      where: {
        email: this.normalizeEmail(email),
        purpose: purpose === 'signup' ? AuthCodePurpose.SIGNUP : AuthCodePurpose.LOGIN,
        code,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!authCode || authCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('인증코드가 올바르지 않거나 만료되었습니다.');
    }

    await this.prisma.authCode.update({
      where: { id: authCode.id },
      data: { consumedAt: new Date() },
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateVerificationCode() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private ensureAllowedSignupEmail(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain || !ALLOWED_SIGNUP_DOMAINS.includes(domain as (typeof ALLOWED_SIGNUP_DOMAINS)[number])) {
      throw new BadRequestException(
        `회원가입은 회사 이메일로만 가능합니다. 허용 도메인: ${ALLOWED_SIGNUP_DOMAINS.map((item) => `@${item}`).join(', ')}`,
      );
    }
  }

  private async sendVerificationEmail(params: {
    email: string;
    purpose: 'signup' | 'login';
    verificationCode: string;
    expiresInMinutes: number;
  }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'Welfare Mall <onboarding@resend.dev>';
    const replyTo = process.env.RESEND_REPLY_TO?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException('이메일 발송 서비스가 아직 설정되지 않았습니다.');
    }

    const subject =
      params.purpose === 'signup'
        ? '[사내 복지몰] 회원가입 인증코드 안내'
        : '[사내 복지몰] 로그인 인증코드 안내';

    const intro =
      params.purpose === 'signup'
        ? '사내 복지몰 회원가입을 위한 인증코드입니다.'
        : '사내 복지몰 로그인을 위한 인증코드입니다.';

    const html = `
      <div style="background:#f7f8fc;padding:32px 16px;font-family:Apple SD Gothic Neo,Malgun Gothic,Segoe UI,sans-serif;color:#1f2a44;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e8ebf3;">
          <div style="font-size:14px;font-weight:700;color:#f2634d;">사내 복지몰</div>
          <h1 style="margin:12px 0 16px;font-size:28px;line-height:1.35;">이메일 인증코드를 확인해 주세요</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#55627a;">${intro} 아래 인증코드를 입력하면 계속 진행할 수 있습니다.</p>
          <div style="margin:0 0 24px;padding:20px;border-radius:16px;background:#fff6f3;border:1px solid #ffd5cc;text-align:center;">
            <div style="font-size:13px;color:#8b5a4a;margin-bottom:8px;">인증코드</div>
            <div style="font-size:36px;letter-spacing:8px;font-weight:800;color:#f2634d;">${params.verificationCode}</div>
          </div>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#55627a;">유효 시간은 <strong>${params.expiresInMinutes}분</strong>입니다.</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#55627a;">본인이 요청하지 않았다면 이 메일은 무시해 주세요.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.email],
        subject,
        html,
        text: `${intro}\n인증코드: ${params.verificationCode}\n유효 시간: ${params.expiresInMinutes}분`,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `인증 메일 발송에 실패했습니다. ${errorText || '메일 서비스 응답을 확인해 주세요.'}`,
      );
    }
  }
}
