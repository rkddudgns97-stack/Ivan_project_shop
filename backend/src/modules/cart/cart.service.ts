import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapCart } from '../../common/mappers';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const wallet = await this.prisma.pointWallet.findUnique({
      where: { userId },
    });
    return mapCart(cart, wallet?.availablePoint ?? 0);
  }

  async addItem(userId: string, productId: string, variantId?: string, quantity = 1) {
    const cart = await this.ensureCart(userId);
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const variant = variantId
      ? await this.prisma.productVariant.findUnique({ where: { id: variantId } })
      : null;

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        pointPriceSnapshot: variant?.pointPrice ?? product.pointPrice,
        cashPriceSnapshot: 0,
        productNameSnapshot: product.name,
        thumbnailUrlSnapshot: product.thumbnailUrl,
        variantNameSnapshot: variant?.name ?? null,
      },
    });

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getCart(userId);
  }

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }
}
