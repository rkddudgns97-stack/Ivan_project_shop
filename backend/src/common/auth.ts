import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export type RequestUser = {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  emailVerified: boolean;
  authProvider: string;
  status: string;
  roles: { role: string }[];
  pointWallet?: {
    availablePoint: number;
    reservedPoint: number;
    expiringPoint: number;
    expiringAt: Date | null;
  } | null;
};

export function getCurrentUser(req: Request): RequestUser | null {
  return ((req as Request & { currentUser?: RequestUser }).currentUser ?? null);
}

export function requireUser(req: Request): RequestUser {
  const user = getCurrentUser(req);
  if (!user) {
    throw new UnauthorizedException('로그인이 필요합니다.');
  }
  return user;
}

export function requireAdmin(req: Request): RequestUser {
  const user = requireUser(req);
  if (!user.roles.some((role) => role.role === 'ADMIN')) {
    throw new ForbiddenException('관리자 권한이 필요합니다.');
  }
  return user;
}

export function toClientEnum(value: string) {
  return value.toLowerCase();
}
