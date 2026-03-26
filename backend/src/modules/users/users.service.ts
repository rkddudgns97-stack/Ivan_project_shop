import { Injectable } from '@nestjs/common';
import { PointLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mapPointLedger, mapPointWallet, mapUser } from '../../common/mappers';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });

    return mapUser(user);
  }

  async getPointBalance(userId: string) {
    const wallet = await this.prisma.pointWallet.findUniqueOrThrow({
      where: { userId },
    });

    return mapPointWallet(wallet);
  }

  async getPointLedgers(userId: string, page: number, size: number, type?: string) {
    const types = type ? type.split(',').map((item) => item.toUpperCase()) : undefined;
    const ledgers = await this.prisma.pointLedger.findMany({
      where: {
        userId,
        ...(types?.length ? { type: { in: types as any } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });

    const total = await this.prisma.pointLedger.count({
      where: {
        userId,
        ...(types?.length ? { type: { in: types as any } } : {}),
      },
    });

    return {
      items: ledgers.map(mapPointLedger),
      meta: {
        page,
        size,
        total,
        totalPages: Math.max(1, Math.ceil(total / size)),
      },
    };
  }

  async requestRecharge(userId: string, amount: number) {
    const wallet = await this.prisma.pointWallet.findUniqueOrThrow({
      where: { userId },
    });

    const balanceAfter = wallet.availablePoint + amount;

    await this.prisma.pointWallet.update({
      where: { userId },
      data: { availablePoint: balanceAfter },
    });

    await this.prisma.pointLedger.create({
      data: {
        userId,
        type: PointLedgerType.RECHARGE,
        amount,
        balanceAfter,
        description: 'Point recharge',
      },
    });

    return {
      rechargeOrderId: `rch_${Date.now()}`,
      status: 'pending',
      paymentRedirectUrl: '/points',
    };
  }
}
