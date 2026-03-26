import { PrismaClient, ProductStatus, Role, StockStatus, UserStatus, PointLedgerType, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.pointLedger.deleteMany();
  await prisma.pointWallet.deleteMany();
  await prisma.pointGrantBatch.deleteMany();
  await prisma.authCode.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();

  const categories = await Promise.all(
    [
      ['Food & Drink', 'Coffee, tea, wellness snacks'],
      ['Living', 'Home, desk, daily goods'],
      ['Digital', 'Audio, accessories, mobile gear'],
      ['Fashion', 'Bags, apparel, office style'],
      ['Book & Stationery', 'Books, notes, pens'],
      ['Health & Sports', 'Exercise and wellness items'],
    ].map(([name, description]) =>
      prisma.category.create({
        data: { name, description },
      }),
    ),
  );

  const admin = await prisma.user.create({
    data: {
      employeeNo: 'E240001',
      name: 'Hong Gildong',
      email: 'admin@welfaremall.co.kr',
      emailVerified: true,
      authProvider: 'email',
      status: UserStatus.ACTIVE,
      roles: {
        create: [{ role: Role.EMPLOYEE }, { role: Role.ADMIN }],
      },
      pointWallet: {
        create: {
          availablePoint: 285000,
          reservedPoint: 15000,
          expiringPoint: 50000,
          expiringAt: new Date('2026-12-31T14:59:59Z'),
        },
      },
      shippingAddresses: {
        create: [
          {
            recipientName: 'Hong Gildong',
            phone: '010-1234-5678',
            zipCode: '06234',
            address1: '123 Teheran-ro, Gangnam-gu, Seoul',
            address2: '101-1201',
            isDefault: true,
          },
        ],
      },
      cart: { create: {} },
    },
    include: { cart: true },
  });

  const users = await Promise.all(
    [
      ['E240002', 'Kim Cheolsu', 'kim@example.com'],
      ['E240003', 'Lee Younghee', 'lee@example.com'],
    ].map(([employeeNo, name, email]) =>
      prisma.user.create({
        data: {
          employeeNo,
          name,
          email,
          emailVerified: true,
          authProvider: 'email',
          status: UserStatus.ACTIVE,
          roles: { create: [{ role: Role.EMPLOYEE }] },
          pointWallet: {
            create: {
              availablePoint: 300000,
              reservedPoint: 0,
              expiringPoint: 300000,
              expiringAt: new Date('2026-12-31T14:59:59Z'),
            },
          },
          cart: { create: {} },
        },
      }),
    ),
  );

  await prisma.user.create({
    data: {
      employeeNo: 'E240004',
      name: 'Park Minsu',
      email: 'park@example.com',
      emailVerified: false,
      authProvider: 'email',
      status: UserStatus.INACTIVE,
      roles: { create: [{ role: Role.EMPLOYEE }] },
      pointWallet: { create: {} },
      cart: { create: {} },
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: '\uB9AC\uD3EC\uC880 \uBA5C\uB77C\uD1A0\uD504\uB85C',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        pointPrice: 49000,
        cashPrice: 0,
        status: ProductStatus.ACTIVE,
        stockStatus: StockStatus.IN_STOCK,
        badge: 'Popular',
        categoryId: categories[5].id,
        description:
          '\uC800\uB141 \uB8E8\uD2F4\uC5D0 \uB9DE\uCD98 \uC218\uBA74 \uBC38\uB7F0\uC2A4 \uC6F0\uB2C8\uC2A4 \uC0C1\uD488\uC785\uB2C8\uB2E4.',
        deliveryInfo:
          '\uD574\uB2F9 \uC81C\uD488\uC740 \uCD5C\uCD08 \uBC30\uC1A1\uBE44\uAC00 \uBB34\uB8CC\uC774\uBA70, \uB2E8\uC21C \uBCC0\uC2EC \uBC18\uD488 \uC2DC \uC655\uBCF5\uD0DD\uBC30\uBE44 8,000\uC6D0\uC774 \uBD80\uACFC\uB429\uB2C8\uB2E4.',
        purchaseLimit: 3,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=900', sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            { name: '\u0031\uBC15\uC2A4', pointPrice: 49000, cashPrice: 0, stock: 60 },
            { name: '\u0033\uBC15\uC2A4', pointPrice: 129000, cashPrice: 0, stock: 24 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: '\uD48B\uC0AC\uACFC \uB099\uC0B0\uADE0',
        thumbnailUrl: 'https://images.unsplash.com/photo-1615485737451-8e5f0c2ad44b?w=400',
        pointPrice: 39000,
        cashPrice: 5900,
        status: ProductStatus.ACTIVE,
        stockStatus: StockStatus.IN_STOCK,
        badge: 'New',
        categoryId: categories[5].id,
        description:
          '\uD558\uB8E8 \uC2DC\uC791\uC744 \uAC00\uBCBC\uAC8C \uB3D5\uB294 \uD48B\uC0AC\uACFC \uB099\uC0B0\uADE0 \uC2A4\uD2F1 \uC81C\uD488\uC785\uB2C8\uB2E4.',
        deliveryInfo:
          '\uC0AC\uC804\uC608\uC57D \uAE30\uAC04 \uC885\uB8CC \uC774\uD6C4 \uC21C\uCC28\uC801\uC73C\uB85C \uBC1C\uC1A1\uB429\uB2C8\uB2E4.',
        purchaseLimit: 3,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1615485737451-8e5f0c2ad44b?w=900', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=900', sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            { name: '\u0031\uBC15\uC2A4', pointPrice: 39000, cashPrice: 5900, stock: 80 },
            { name: '\u0032\uBC15\uC2A4', pointPrice: 74000, cashPrice: 9900, stock: 35 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: '\uBAA8\uB2DD\u00B7\uB098\uC774\uD2B8 \uB8E8\uD2F4 \u0033\uC138\uD2B8',
        thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
        pointPrice: 129000,
        cashPrice: 19000,
        status: ProductStatus.ACTIVE,
        stockStatus: StockStatus.LOW_STOCK,
        badge: 'Popular',
        categoryId: categories[5].id,
        description:
          '\uC544\uCE68\uC6A9 \uD48B\uC0AC\uACFC \uB099\uC0B0\uADE0\uACFC \uC800\uB141\uC6A9 \uB9AC\uD3EC\uC880 \uBA5C\uB77C\uD1A0\uD504\uB85C\uB97C \uD568\uAED8 \uB2F4\uC740 \uB8E8\uD2F4 \uAD6C\uC131\uC785\uB2C8\uB2E4.',
        deliveryInfo:
          '\uC138\uD2B8 \uC0C1\uD488\uC740 \uC0AC\uC804\uC608\uC57D \uC885\uB8CC \uD6C4 \uC21C\uCC28 \uBC1C\uC1A1\uB418\uBA70, \uBC18\uD488 \uC2DC \uC655\uBCF5 \uD0DD\uBC30\uBE44 \uC815\uCC45\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4.',
        purchaseLimit: 1,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900', sortOrder: 0 },
            { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900', sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            { name: '\u0033\uC138\uD2B8 \uAD6C\uC131', pointPrice: 129000, cashPrice: 19000, stock: 12 },
          ],
        },
      },
    }),
  ]);

  await prisma.cartItem.createMany({
    data: [
      {
        cartId: admin.cart!.id,
        productId: products[0].id,
        quantity: 1,
        pointPriceSnapshot: 49000,
        cashPriceSnapshot: 0,
        productNameSnapshot: products[0].name,
        thumbnailUrlSnapshot: products[0].thumbnailUrl,
        variantNameSnapshot: '\u0031\uBC15\uC2A4',
      },
      {
        cartId: admin.cart!.id,
        productId: products[1].id,
        quantity: 1,
        pointPriceSnapshot: 39000,
        cashPriceSnapshot: 5900,
        productNameSnapshot: products[1].name,
        thumbnailUrlSnapshot: products[1].thumbnailUrl,
        variantNameSnapshot: '\u0031\uBC15\uC2A4',
      },
    ],
  });

  await prisma.pointLedger.createMany({
    data: [
      {
        userId: admin.id,
        type: PointLedgerType.GRANT,
        amount: 300000,
        balanceAfter: 300000,
        description: '2026 \uB144\uB3C4 \uBCF5\uC9C0\uD3EC\uC778\uD2B8 \uC9C0\uAE09',
      },
      {
        userId: admin.id,
        type: PointLedgerType.USE,
        amount: -15000,
        balanceAfter: 285000,
        description: '\uC0C1\uD488 \uAD6C\uB9E4',
      },
      {
        userId: admin.id,
        type: PointLedgerType.RECHARGE,
        amount: 50000,
        balanceAfter: 335000,
        description: '\uD3EC\uC778\uD2B8 \uCDA9\uC804',
      },
    ],
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      orderNo: '20260315-001',
      userId: admin.id,
      status: OrderStatus.DELIVERED,
      usedPoint: 49000,
      additionalCashAmount: 0,
      paymentMethod: 'POINT_ONLY',
      paymentStatus: 'PAID',
      shipmentCarrier: 'CJ\uB300\uD55C\uD1B5\uC6B4',
      trackingNo: '1234567890',
      shippedAt: new Date('2026-03-16T10:00:00Z'),
      cancelAvailable: false,
      returnAvailable: true,
      createdAt: new Date('2026-03-15T10:30:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            thumbnailUrl: products[0].thumbnailUrl,
            quantity: 1,
            pointPrice: 49000,
            cashPrice: 0,
          },
        ],
      },
      statuses: {
        create: [
          { status: OrderStatus.PAID, timestamp: new Date('2026-03-15T10:30:00Z') },
          { status: OrderStatus.PREPARING, timestamp: new Date('2026-03-15T14:00:00Z') },
          { status: OrderStatus.SHIPPED, timestamp: new Date('2026-03-16T10:00:00Z') },
          { status: OrderStatus.DELIVERED, timestamp: new Date('2026-03-18T15:30:00Z') },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderNo: '20260320-002',
      userId: admin.id,
      status: OrderStatus.SHIPPED,
      usedPoint: 129000,
      additionalCashAmount: 19000,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      shipmentCarrier: '\uB86F\uB370\uD0DD\uBC30',
      trackingNo: '9876543210',
      shippedAt: new Date('2026-03-21T09:00:00Z'),
      cancelAvailable: false,
      returnAvailable: false,
      createdAt: new Date('2026-03-20T11:00:00Z'),
      items: {
        create: [
          {
            productId: products[2].id,
            productName: products[2].name,
            thumbnailUrl: products[2].thumbnailUrl,
            quantity: 1,
            pointPrice: 129000,
            cashPrice: 19000,
          },
        ],
      },
      statuses: {
        create: [
          { status: OrderStatus.PAID, timestamp: new Date('2026-03-20T11:00:00Z') },
          { status: OrderStatus.PREPARING, timestamp: new Date('2026-03-20T15:00:00Z') },
          { status: OrderStatus.SHIPPED, timestamp: new Date('2026-03-21T09:00:00Z') },
        ],
      },
    },
  });

  console.log('Seed complete:', { adminId: admin.id, deliveredOrderId: deliveredOrder.id, userCount: users.length + 2 });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
