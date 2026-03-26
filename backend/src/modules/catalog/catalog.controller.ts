import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { requireUser } from '../../common/auth';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  async getCategories(@Req() req: Request) {
    requireUser(req);
    return { success: true, data: await this.catalogService.getCategories() };
  }

  @Get('products/recommendations')
  async getRecommendations(@Req() req: Request) {
    requireUser(req);
    return { success: true, data: await this.catalogService.getRecommendations() };
  }

  @Get('products')
  async getProducts(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
    @Query('query') query?: string,
    @Query('sort') sort = 'popular',
    @Query('page') page = '1',
    @Query('size') size = '20',
  ) {
    requireUser(req);
    return {
      success: true,
      data: await this.catalogService.getProducts(
        categoryId,
        query,
        sort,
        Number(page),
        Number(size),
      ),
    };
  }

  @Get('products/:productId')
  async getProductDetail(@Req() req: Request, @Param('productId') productId: string) {
    requireUser(req);
    return { success: true, data: await this.catalogService.getProductDetail(productId) };
  }
}
