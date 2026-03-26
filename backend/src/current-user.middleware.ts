import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = req.header('x-user-id');
    const userEmail = req.header('x-user-email')?.trim().toLowerCase();

    if (!userId && !userEmail) {
      return next();
    }

    const include = {
      roles: true,
      pointWallet: true,
    } as const;

    const user =
      (userId
        ? await this.prisma.user.findUnique({
            where: { id: userId },
            include,
          })
        : null) ??
      (userEmail
        ? await this.prisma.user.findUnique({
            where: { email: userEmail },
            include,
          })
        : null);

    if (user) {
      (req as Request & { currentUser?: unknown }).currentUser = user;
    }

    next();
  }
}
