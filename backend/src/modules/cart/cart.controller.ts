import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUser } from '../../common/auth';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: Request) {
    const user = requireUser(req);
    return { success: true, data: await this.cartService.getCart(user.id) };
  }

  @Post('items')
  async addItem(
    @Req() req: Request,
    @Body() body: { productId: string; variantId?: string; quantity?: number },
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.cartService.addItem(
        user.id,
        body.productId,
        body.variantId,
        body.quantity ?? 1,
      ),
    };
  }

  @Patch('items/:cartItemId')
  async updateQuantity(
    @Req() req: Request,
    @Param('cartItemId') cartItemId: string,
    @Body() body: { quantity: number },
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.cartService.updateQuantity(user.id, cartItemId, body.quantity),
    };
  }

  @Delete('items/:cartItemId')
  async removeItem(@Req() req: Request, @Param('cartItemId') cartItemId: string) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.cartService.removeItem(user.id, cartItemId),
    };
  }
}
