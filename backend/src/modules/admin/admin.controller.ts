import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { requireAdmin } from '../../common/auth';
import { AdminService } from './admin.service';
import { CloudinaryService } from './cloudinary.service';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
};

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.getDashboard() };
  }

  @Get('users')
  async getUsers(
    @Req() req: Request,
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ) {
    requireAdmin(req);
    return {
      success: true,
      data: await this.adminService.getUsers(query, status, Number(page), Number(size)),
    };
  }

  @Get('users/:userId')
  async getUserDetail(@Req() req: Request, @Param('userId') userId: string) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.getUserDetail(userId) };
  }

  @Get('products')
  async getProducts(
    @Req() req: Request,
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ) {
    requireAdmin(req);
    return {
      success: true,
      data: await this.adminService.getProducts(query, status, Number(page), Number(size)),
    };
  }

  @Get('orders')
  async getOrders(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ) {
    requireAdmin(req);
    return {
      success: true,
      data: await this.adminService.getOrders(Number(page), Number(size), status),
    };
  }

  @Get('orders/:orderId')
  async getOrderDetail(@Req() req: Request, @Param('orderId') orderId: string) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.getOrderDetail(orderId) };
  }

  @Post('point-grant-batches')
  async grantPoints(
    @Req() req: Request,
    @Body()
    body: {
      batchKey: string;
      amount: number;
      targetStatus: string;
      expiresAt: string;
      description: string;
    },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.grantPoints(body) };
  }

  @Post('users/:userId/point-adjustments')
  async adjustUserPoints(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() body: { type: 'adjust_add' | 'adjust_sub'; amount: number; reason: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.adjustUserPoints(userId, body) };
  }

  @Post('products')
  async createProduct(@Req() req: Request, @Body() body: any) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.createProduct(body) };
  }

  @Post('uploads/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Req() req: Request,
    @UploadedFile() file: UploadedImageFile,
  ) {
    requireAdmin(req);
    return {
      success: true,
      data: await this.cloudinaryService.uploadImage(file),
    };
  }

  @Patch('products/:productId')
  async updateProduct(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.updateProduct(productId, body) };
  }

  @Post('products/:productId/status')
  async updateProductStatus(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() body: { status: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.updateProductStatus(productId, body.status) };
  }

  @Post('products/:productId/inventory-adjustments')
  async adjustInventory(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() body: { variantId?: string; delta: number; reason: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.adjustInventory(productId, body) };
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.updateOrderStatus(orderId, body.status) };
  }

  @Post('orders/:orderId/shipment')
  async addShipment(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { carrier: string; trackingNo: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.addShipment(orderId, body) };
  }

  @Post('orders/:orderId/cancel-approve')
  async approveCancelRequest(@Req() req: Request, @Param('orderId') orderId: string) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.approveCancelRequest(orderId) };
  }

  @Post('orders/:orderId/cancel-reject')
  async rejectCancelRequest(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    requireAdmin(req);
    return { success: true, data: await this.adminService.rejectCancelRequest(orderId, body.reason) };
  }
}
