import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { mapCategory, mapProduct, mapProductDetail } from '../../common/mappers';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map(mapCategory);
  }

  async getRecommendations() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        variants: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 4,
    });

    return products.map(mapProduct);
  }

  async getProducts(
    categoryId?: string,
    query?: string,
    sort = 'popular',
    page = 1,
    size = 20,
  ) {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(categoryId ? { categoryId } : {}),
      ...(query ? { name: { contains: query } } : {}),
    };

    const orderBy = this.getSortOrder(sort);

    const products = await this.prisma.product.findMany({
      where,
      include: {
        variants: true,
      },
      orderBy,
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

  async getProductDetail(productId: string) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });

    return mapProductDetail(product);
  }

  private getSortOrder(sort: string): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_low':
        return [{ pointPrice: 'asc' }, { createdAt: 'desc' }];
      case 'price_high':
        return [{ pointPrice: 'desc' }, { createdAt: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'popular':
      default:
        return [
          { badge: 'desc' },
          { createdAt: 'desc' },
        ];
    }
  }
}
