import crypto from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthCodePurpose, Role, UserStatus } from '@prisma/client';
import { mapUser } from '../../common/mappers';
import { PrismaService } from '../../prisma/prisma.service';

const DEMO_EMAIL_CODE = '123456';
const ALLOWED_SIGNUP_DOMAINS = ['aeonlab.kr', 'finble.io', 'finbleventures.com', 'zerokleek.com'] as const;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async requestEmailCode(email: string, purpose: 'signup' | 'login') {
    const normalizedEmail = this.normalizeEmail(email);

    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('올바른 이메일 주소를 입력해주세요.');
    }

    if (purpose === 'signup') {
      this.ensureAllowedSignupEmail(normalizedEmail);
    }

    if (purpose === 'login') {
      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!existingUser) {
        throw new NotFoundException('가입된 이메일이 없습니다.');
      }
    }

    const authCode = await this.prisma.authCode.create({
      data: {
        requestId: crypto.randomUUID(),
        email: normalizedEmail,
        purpose: purpose === 'signup' ? AuthCodePurpose.SIGNUP : AuthCodePurpose.LOGIN,
        code: DEMO_EMAIL_CODE,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return {
      requestId: authCode.requestId,
      expiresInSeconds: 300,
      debugCode: DEMO_EMAIL_CODE,
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
      throw new NotFoundException('가입된 이메일이 없습니다.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('현재 사용할 수 없는 계정입니다.');
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
      throw new BadRequestException('인증 코드가 올바르지 않거나 만료되었습니다.');
    }

    await this.prisma.authCode.update({
      where: { id: authCode.id },
      data: { consumedAt: new Date() },
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
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
}
