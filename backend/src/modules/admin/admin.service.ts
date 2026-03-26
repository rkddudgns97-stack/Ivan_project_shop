import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PointLedgerType, ProductStatus, StockStatus, UserStatus } from '@prisma/client';
import { mapOrder, mapPointLedger, mapProduct, mapUser } from '../../common/mappers';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [userCount, activeProductCount, todayOrderCount, lowStockCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.product.count({ where: { stockStatus: StockStatus.LOW_STOCK } }),
    ]);

    const pendingCancelCount = await this.prisma.order.count({
      where: { status: OrderStatus.CANCEL_REQUESTED },
    });

    const todayUsed = await this.prisma.pointLedger.aggregate({
      _sum: { amount: true },
      where: {
        type: PointLedgerType.USE,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      userCount,
      activeProductCount,
      todayOrderCount,
      todayUsedPoint: Math.abs(todayUsed._sum.amount ?? 0),
      pendingCancelCount,
      lowStockCount,
    };
  }

  async getUsers(query?: string, status?: string, page = 1, size = 20) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { employeeNo: { contains: query } },
              ],
            }
          : {}),
        ...(status ? { status: status.toUpperCase() as UserStatus } : {}),
      },
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });

    const total = await this.prisma.user.count({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { employeeNo: { contains: query } },
              ],
            }
          : {}),
        ...(status ? { status: status.toUpperCase() as UserStatus } : {}),
      },
    });

    return {
      items: users.map(mapUser),
      meta: {
        page,
        size,
        total,
        totalPages: Math.max(1, Math.ceil(total / size)),
      },
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true, pointWallet: true },
    });

    return {
      ...mapUser(user),
      pointBalance: {
        availablePoint: user.pointWallet?.availablePoint ?? 0,
        reservedPoint: user.pointWallet?.reservedPoint ?? 0,
        expiringPoint: user.pointWallet?.expiringPoint ?? 0,
        expiringAt: user.pointWallet?.expiringAt ?? null,
      },
    };
  }

  async getProducts(query?: string, status?: string, page = 1, size = 20) {
    const where = {
      ...(query ? { name: { contains: query } } : {}),
      ...(status ? { status: status.toUpperCase() as ProductStatus } : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });

    const total = await this.prisma.product.count({ where });

    return {
      items: products.map(mapProduct),
      meta: {
        page,
        size,
        total,
        totalPages: Math.max(1, Math.ceil(total / size)),
      },
    };
  }

  async getOrders(page = 1, size = 20, status?: string) {
    const statuses = status ? status.split(',').map((item) => item.toUpperCase()) : undefined;
    const where = {
      ...(statuses?.length ? { status: { in: statuses as OrderStatus[] } } : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
        statuses: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });

    const total = await this.prisma.order.count({ where });

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

  async getOrderDetail(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: true,
        statuses: { orderBy: { timestamp: 'desc' } },
      },
    });

    return mapOrder(order);
  }

  async createProduct(payload: any) {
    const { imageUrls, ...normalizedPayload } = this.normalizeProductPayload(payload);

    if (!normalizedPayload.categoryId) {
      throw new BadRequestException('카테고리는 필수입니다.');
    }

    const product = await this.prisma.product.create({
      data: {
        name: normalizedPayload.name ?? 'Untitled product',
        thumbnailUrl: normalizedPayload.thumbnailUrl ?? '',
        pointPrice: normalizedPayload.pointPrice ?? 0,
        cashPrice: normalizedPayload.cashPrice ?? 0,
        status: normalizedPayload.status ?? ProductStatus.DRAFT,
        stockStatus: normalizedPayload.stockStatus ?? StockStatus.IN_STOCK,
        badge: normalizedPayload.badge ?? null,
        categoryId: normalizedPayload.categoryId,
        description: normalizedPayload.description ?? null,
        deliveryInfo: normalizedPayload.deliveryInfo ?? null,
        purchaseLimit: normalizedPayload.purchaseLimit ?? null,
        ...(imageUrls?.length
          ? {
              images: {
                create: imageUrls.map((url: string, index: number) => ({
                  url,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
    });

    return mapProduct(product);
  }

  async updateProduct(productId: string, payload: any) {
    const { imageUrls, ...normalizedPayload } = this.normalizeProductPayload(payload);

    const product = await this.prisma.$transaction(async (tx) => {
      if (imageUrls) {
        await tx.productImage.deleteMany({
          where: { productId },
        });
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          ...normalizedPayload,
          ...(imageUrls
            ? {
                images: {
                  create: imageUrls.map((url: string, index: number) => ({
                    url,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
      });
    });

    return mapProduct(product);
  }

  async updateProductStatus(productId: string, status: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { status: status.toUpperCase() as ProductStatus },
    });

    return mapProduct(product);
  }

  async adjustInventory(productId: string, payload: { variantId?: string; delta: number; reason: string }) {
    if (payload.variantId) {
      const variant = await this.prisma.productVariant.findUniqueOrThrow({
        where: { id: payload.variantId },
      });

      await this.prisma.productVariant.update({
        where: { id: payload.variantId },
        data: { stock: variant.stock + payload.delta },
      });
    }

    await this.prisma.inventoryAdjustment.create({
      data: {
        productId,
        variantId: payload.variantId ?? null,
        delta: payload.delta,
        reason: payload.reason,
      },
    });

    return { success: true };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status.toUpperCase() as OrderStatus,
        statuses: {
          create: [{ status: status.toUpperCase() as OrderStatus }],
        },
      },
      include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
    });

    return mapOrder(order);
  }

  async addShipment(orderId: string, payload: { carrier: string; trackingNo: string }) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        shipmentCarrier: payload.carrier,
        trackingNo: payload.trackingNo,
        shippedAt: new Date(),
        status: OrderStatus.SHIPPED,
        statuses: {
          create: [{ status: OrderStatus.SHIPPED }],
        },
      },
      include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
    });

    return mapOrder(order);
  }

  async approveCancelRequest(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const userWallet = await this.prisma.pointWallet.findUniqueOrThrow({ where: { userId: order.userId } });

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelAvailable: false,
          statuses: {
            create: [{ status: OrderStatus.CANCELLED }],
          },
        },
        include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
      });

      await tx.pointWallet.update({
        where: { userId: order.userId },
        data: {
          availablePoint: userWallet.availablePoint + order.usedPoint,
        },
      });

      await tx.pointLedger.create({
        data: {
          userId: order.userId,
          type: PointLedgerType.REFUND,
          amount: order.usedPoint,
          balanceAfter: userWallet.availablePoint + order.usedPoint,
          relatedOrderId: order.id,
          description: 'Order cancel refund',
        },
      });

      return updatedOrder;
    });

    return mapOrder(updated);
  }

  async rejectCancelRequest(orderId: string, reason?: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        cancelAvailable: true,
        statuses: {
          create: [{ status: OrderStatus.PAID, note: reason }],
        },
      },
      include: { items: true, statuses: { orderBy: { timestamp: 'desc' } } },
    });

    return mapOrder(order);
  }

  async grantPoints(payload: {
    batchKey: string;
    amount: number;
    targetStatus: string;
    expiresAt: string;
    description: string;
  }) {
    const targetStatus = payload.targetStatus.toUpperCase() as UserStatus;
    const users = await this.prisma.user.findMany({
      where: { status: targetStatus },
      include: { pointWallet: true },
    });

    await this.prisma.pointGrantBatch.create({
      data: {
        batchKey: payload.batchKey,
        amount: payload.amount,
        targetStatus,
        expiresAt: new Date(payload.expiresAt),
        description: payload.description,
        processedCount: users.length,
      },
    });

    await Promise.all(
      users.map(async (user) => {
        await this.prisma.pointWallet.update({
          where: { userId: user.id },
          data: {
            availablePoint: (user.pointWallet?.availablePoint ?? 0) + payload.amount,
            expiringPoint: payload.amount,
            expiringAt: new Date(payload.expiresAt),
          },
        });

        await this.prisma.pointLedger.create({
          data: {
            userId: user.id,
            type: PointLedgerType.GRANT,
            amount: payload.amount,
            balanceAfter: (user.pointWallet?.availablePoint ?? 0) + payload.amount,
            description: payload.description,
          },
        });
      }),
    );

    return { batchId: payload.batchKey, processedCount: users.length };
  }

  async adjustUserPoints(userId: string, payload: { type: 'adjust_add' | 'adjust_sub'; amount: number; reason: string }) {
    const wallet = await this.prisma.pointWallet.findUniqueOrThrow({ where: { userId } });
    const delta = payload.type === 'adjust_sub' ? -payload.amount : payload.amount;
    const balanceAfter = wallet.availablePoint + delta;

    await this.prisma.pointWallet.update({
      where: { userId },
      data: { availablePoint: balanceAfter },
    });

    const ledger = await this.prisma.pointLedger.create({
      data: {
        userId,
        type: payload.type === 'adjust_sub' ? PointLedgerType.ADJUST_SUB : PointLedgerType.ADJUST_ADD,
        amount: delta,
        balanceAfter,
        description: payload.reason,
      },
    });

    return mapPointLedger(ledger);
  }

  private normalizeProductPayload(payload: any) {
    const normalizedStatus = payload.status
      ? (String(payload.status).toUpperCase() as ProductStatus)
      : undefined;
    const normalizedStockStatus = payload.stockStatus
      ? (String(payload.stockStatus).toUpperCase() as StockStatus)
      : undefined;
    const imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls
          .map((item: unknown) => String(item).trim())
          .filter(Boolean)
      : undefined;

    return {
      ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
      ...(payload.thumbnailUrl !== undefined ? { thumbnailUrl: String(payload.thumbnailUrl) } : {}),
      ...(payload.pointPrice !== undefined ? { pointPrice: Number(payload.pointPrice) } : {}),
      ...(payload.cashPrice !== undefined ? { cashPrice: Number(payload.cashPrice) } : {}),
      ...(payload.badge !== undefined ? { badge: payload.badge ? String(payload.badge) : null } : {}),
      ...(payload.categoryId !== undefined ? { categoryId: String(payload.categoryId) } : {}),
      ...(payload.description !== undefined ? { description: payload.description ? String(payload.description) : null } : {}),
      ...(payload.deliveryInfo !== undefined ? { deliveryInfo: payload.deliveryInfo ? String(payload.deliveryInfo) : null } : {}),
      ...(payload.purchaseLimit !== undefined
        ? {
            purchaseLimit:
              payload.purchaseLimit === null || payload.purchaseLimit === ''
                ? null
                : Number(payload.purchaseLimit),
          }
        : {}),
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedStockStatus ? { stockStatus: normalizedStockStatus } : {}),
      ...(imageUrls !== undefined ? { imageUrls } : {}),
    };
  }
}
