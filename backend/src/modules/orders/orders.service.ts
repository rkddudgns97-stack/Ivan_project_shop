import { Injectable } from '@nestjs/common';
import { OrderStatus, PointLedgerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mapOrder } from '../../common/mappers';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(
    userId: string,
    payload: { shippingAddressId: string; paymentMethod?: string; cashAmount?: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUniqueOrThrow({
        where: { userId },
        include: { items: true },
      });

      const wallet = await tx.pointWallet.findUniqueOrThrow({ where: { userId } });
      const totalPointAmount = cart.items.reduce(
        (sum, item) => sum + item.pointPriceSnapshot * item.quantity,
        0,
      );
      const usedPointAmount = Math.min(wallet.availablePoint, totalPointAmount);
      const requiredCashAmount = Math.max(0, totalPointAmount - usedPointAmount);
      const totalCashAmount = Math.max(0, Number(payload.cashAmount ?? requiredCashAmount));

      const order = await tx.order.create({
        data: {
          orderNo: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
          userId,
          status: OrderStatus.PAID,
          usedPoint: usedPointAmount,
          additionalCashAmount: totalCashAmount,
          paymentMethod: (payload.paymentMethod ?? (totalCashAmount > 0 ? 'CARD' : 'POINT_ONLY')).toUpperCase(),
          paymentStatus: totalCashAmount > 0 ? 'READY' : 'PAID',
          cancelAvailable: true,
          returnAvailable: false,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.productNameSnapshot,
              thumbnailUrl: item.thumbnailUrlSnapshot,
              variantName: item.variantNameSnapshot,
              quantity: item.quantity,
              pointPrice: item.pointPriceSnapshot,
              cashPrice: 0,
            })),
          },
          statuses: {
            create: [{ status: OrderStatus.PAID }],
          },
        },
        include: {
          items: true,
          statuses: { orderBy: { timestamp: 'desc' } },
        },
      });

      await tx.pointWallet.update({
        where: { userId },
        data: {
          availablePoint: wallet.availablePoint - usedPointAmount,
          reservedPoint: 0,
        },
      });

      if (usedPointAmount > 0) {
        await tx.pointLedger.create({
          data: {
            userId,
            type: PointLedgerType.USE,
            amount: -usedPointAmount,
            balanceAfter: wallet.availablePoint - usedPointAmount,
            relatedOrderId: order.id,
            description:
              totalCashAmount > 0
                ? `Order checkout (point ${usedPointAmount}, cash ${totalCashAmount})`
                : 'Order checkout',
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return {
        ...mapOrder(order),
        paymentMethod: (payload.paymentMethod ?? (totalCashAmount > 0 ? 'card' : 'point_only')).toLowerCase(),
        paymentStatus: totalCashAmount > 0 ? 'ready' : 'paid',
        additionalCashAmount: totalCashAmount,
        paymentSummary: {
          requiredPointAmount: totalPointAmount,
          availablePointAmount: wallet.availablePoint,
          shortfallCashAmount: totalCashAmount,
          itemPointAmount: totalPointAmount,
          itemCashAmount: totalCashAmount,
          shippingFeeCashAmount: 0,
          discountCashAmount: 0,
          finalPointAmount: usedPointAmount,
          finalCashAmount: totalCashAmount,
        },
      };
    });
  }

  async getOrders(userId: string, page: number, size: number, status?: string) {
    const statuses = status ? status.split(',').map((item) => item.toUpperCase()) : undefined;
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        ...(statuses?.length ? { status: { in: statuses as any } } : {}),
      },
      include: {
        items: true,
        statuses: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });

    const total = await this.prisma.order.count({
      where: {
        userId,
        ...(statuses?.length ? { status: { in: statuses as any } } : {}),
      },
    });

    return {
      items: orders.map(mapOrder),
      meta: {
        page,
        size,
        total,
        totalPages: Math.max(1, Math.ceil(total / size)),
      },
    };
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: true,
        statuses: { orderBy: { timestamp: 'desc' } },
      },
    });

    return mapOrder(order);
  }

  async requestCancel(orderId: string, reason?: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCEL_REQUESTED,
        cancelAvailable: false,
        statuses: {
          create: [{ status: OrderStatus.CANCEL_REQUESTED, note: reason }],
        },
      },
      include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
    });

    return mapOrder(order);
  }

  async requestReturn(orderId: string, reason?: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.RETURN_REQUESTED,
        returnAvailable: false,
        statuses: {
          create: [{ status: OrderStatus.RETURN_REQUESTED, note: reason }],
        },
      },
      include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
    });

    return mapOrder(order);
  }
}
