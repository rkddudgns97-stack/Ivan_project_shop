import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapShippingAddress } from '../../common/mappers';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAddresses(userId: string) {
    const addresses = await this.prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map(mapShippingAddress);
  }

  async createAddress(
    userId: string,
    payload: {
      recipientName: string;
      phone: string;
      zipCode: string;
      address1: string;
      address2: string;
      isDefault: boolean;
    },
  ) {
    if (payload.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.shippingAddress.create({
      data: {
        userId,
        ...payload,
      },
    });

    return mapShippingAddress(address);
  }

  async updateAddress(userId: string, addressId: string, payload: Partial<{
    recipientName: string;
    phone: string;
    zipCode: string;
    address1: string;
    address2: string;
    isDefault: boolean;
  }>) {
    if (payload.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.shippingAddress.update({
      where: { id: addressId },
      data: payload,
    });

    return mapShippingAddress(address);
  }

  async deleteAddress(addressId: string) {
    await this.prisma.shippingAddress.delete({
      where: { id: addressId },
    });

    return { success: true };
  }
}
