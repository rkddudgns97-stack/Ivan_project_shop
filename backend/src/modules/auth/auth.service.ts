import crypto from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { mapUser } from '../../common/mappers';
import { PrismaService } from '../../prisma/prisma.service';

const ALLOWED_SIGNUP_DOMAINS = ['aeonlab.kr', 'finble.io', 'finbleventures.com', 'zerokleek.com'] as const;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(name: string, email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.ensureValidEmail(normalizedEmail);
    this.ensureAllowedSignupEmail(normalizedEmail);
    this.ensureValidPassword(password);

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const count = await this.prisma.user.count();
    const employeeNo = `E${String(240001 + count).padStart(6, '0')}`;
    const passwordHash = this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        employeeNo,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        emailVerified: true,
        authProvider: 'password',
        status: UserStatus.INACTIVE,
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
        cart: {
          create: {},
        },
      },
      include: {
        roles: true,
      },
    });

    return {
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
      user: mapUser(user),
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.ensureValidEmail(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException('가입된 이메일 계정을 찾을 수 없습니다.');
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestException('관리자 승인 대기 중인 계정입니다.');
    }

    if (user.status === UserStatus.LEAVE) {
      throw new BadRequestException('이용이 중지된 계정입니다.');
    }

    return mapUser(user);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private ensureValidEmail(email: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('올바른 이메일 주소를 입력해 주세요.');
    }
  }

  private ensureValidPassword(password: string) {
    if (password.trim().length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상 입력해 주세요.');
    }
  }

  private ensureAllowedSignupEmail(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain || !ALLOWED_SIGNUP_DOMAINS.includes(domain as (typeof ALLOWED_SIGNUP_DOMAINS)[number])) {
      throw new BadRequestException(
        `회원가입은 회사 이메일만 가능합니다. 허용 도메인: ${ALLOWED_SIGNUP_DOMAINS.map((item) => `@${item}`).join(', ')}`,
      );
    }
  }

  private hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  }
}
