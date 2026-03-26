import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUser } from '../../common/auth';
import { ShippingService } from './shipping.service';

@Controller('me/shipping-addresses')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  async getAddresses(@Req() req: Request) {
    const user = requireUser(req);
    return { success: true, data: await this.shippingService.getAddresses(user.id) };
  }

  @Post()
  async createAddress(
    @Req() req: Request,
    @Body()
    body: {
      recipientName: string;
      phone: string;
      zipCode: string;
      address1: string;
      address2: string;
      isDefault: boolean;
    },
  ) {
    const user = requireUser(req);
    return { success: true, data: await this.shippingService.createAddress(user.id, body) };
  }

  @Patch(':addressId')
  async updateAddress(
    @Req() req: Request,
    @Param('addressId') addressId: string,
    @Body()
    body: Partial<{
      recipientName: string;
      phone: string;
      zipCode: string;
      address1: string;
      address2: string;
      isDefault: boolean;
    }>,
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.shippingService.updateAddress(user.id, addressId, body),
    };
  }

  @Delete(':addressId')
  async deleteAddress(@Req() req: Request, @Param('addressId') addressId: string) {
    requireUser(req);
    return { success: true, data: await this.shippingService.deleteAddress(addressId) };
  }
}
