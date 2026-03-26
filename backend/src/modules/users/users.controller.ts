import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUser } from '../../common/auth';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = requireUser(req);
    return { success: true, data: await this.usersService.getMe(user.id) };
  }

  @Get('me/points/balance')
  async getPointBalance(@Req() req: Request) {
    const user = requireUser(req);
    return { success: true, data: await this.usersService.getPointBalance(user.id) };
  }

  @Get('me/points/ledgers')
  async getPointLedgers(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('size') size = '20',
    @Query('type') type?: string,
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.usersService.getPointLedgers(
        user.id,
        Number(page),
        Number(size),
        type,
      ),
    };
  }

  @Post('me/point-recharges')
  async requestRecharge(
    @Req() req: Request,
    @Body() body: { amount: number; paymentMethod: string },
  ) {
    const user = requireUser(req);
    return {
      success: true,
      data: await this.usersService.requestRecharge(user.id, Number(body.amount)),
    };
  }
}
