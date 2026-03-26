import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUser } from '../../common/auth';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(
    @Req() req: Request,
    @Body()
    body: {
      cartItemIds: string[];
      shippingAddressId: string;
      agreePolicy: boolean;
      paymentMethod?: string;
      cashAmount?: number;
    },
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.ordersService.checkout(user.id, {
        shippingAddressId: body.shippingAddressId,
        paymentMethod: body.paymentMethod,
        cashAmount: body.cashAmount,
      }),
    };
  }

  @Get()
  async getOrders(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('size') size = '20',
    @Query('status') status?: string,
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.ordersService.getOrders(
        user.id,
        Number(page),
        Number(size),
        status,
      ),
    };
  }

  @Get(':orderId')
  async getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    requireUser(req);
    return { success: true, data: await this.ordersService.getOrder(orderId) };
  }

  @Post(':orderId/cancel-request')
  async requestCancel(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    requireUser(req);
    return { success: true, data: await this.ordersService.requestCancel(orderId, body.reason) };
  }

  @Post(':orderId/return-request')
  async requestReturn(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    requireUser(req);
    return { success: true, data: await this.ordersService.requestReturn(orderId, body.reason) };
  }
}
