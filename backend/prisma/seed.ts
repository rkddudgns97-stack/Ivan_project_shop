import crypto from 'node:crypto';
import {
  OrderStatus,
  PointLedgerType,
  PrismaClient,
  ProductStatus,
  Role,
  StockStatus,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

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

  const adminPassword = 'Admin1234!';
  const employeePassword = 'Welcome123!';

  const admin = await prisma.user.create({
    data: {
      employeeNo: 'E240001',
      name: '관리자',
      email: 'admin@welfaremall.co.kr',
      passwordHash: hashPassword(adminPassword),
      emailVerified: true,
      authProvider: 'password',
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
            recipientName: '관리자',
            phone: '010-1234-5678',
            zipCode: '06234',
            address1: '서울특별시 강남구 테헤란로 123',
            address2: '101동 1201호',
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
      ['E240002', '김민수', 'kim@example.com', UserStatus.ACTIVE],
      ['E240003', '이서연', 'lee@example.com', UserStatus.ACTIVE],
      ['E240004', '박준호', 'park@example.com', UserStatus.INACTIVE],
    ].map(([employeeNo, name, email, status]) =>
      prisma.user.create({
        data: {
          employeeNo,
          name,
          email,
          passwordHash: hashPassword(employeePassword),
          emailVerified: true,
          authProvider: 'password',
          status: status as UserStatus,
          roles: { create: [{ role: Role.EMPLOYEE }] },
          pointWallet: {
            create: {
              availablePoint: status === UserStatus.ACTIVE ? 300000 : 0,
              reservedPoint: 0,
              expiringPoint: status === UserStatus.ACTIVE ? 300000 : 0,
              expiringAt: status === UserStatus.ACTIVE ? new Date('2026-12-31T14:59:59Z') : null,
            },
          },
          cart: { create: {} },
        },
      }),
    ),
  );

  const melatoProduct = await prisma.product.create({
    data: {
      name: '리포좀 멜라토프로',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
      pointPrice: 49000,
      cashPrice: 0,
      status: ProductStatus.ACTIVE,
      stockStatus: StockStatus.IN_STOCK,
      badge: 'Popular',
      categoryId: categories[5].id,
      description: '저녁 루틴에 맞춘 수면 밸런스 웰니스 상품입니다.',
      deliveryInfo: '해당 제품은 최초배송비가 무료이며, 단순 변심 반품 시 왕복택배비 8,000원이 부과됩니다.',
      purchaseLimit: 3,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900', sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=900', sortOrder: 1 },
        ],
      },
      variants: {
        create: [
          { name: '1박스', pointPrice: 49000, cashPrice: 0, stock: 60 },
          { name: '3박스', pointPrice: 129000, cashPrice: 0, stock: 24 },
        ],
      },
    },
  });

  const appleProduct = await prisma.product.create({
    data: {
      name: '풋사과 낙산균',
      thumbnailUrl: 'https://images.unsplash.com/photo-1615485737451-8e5f0c2ad44b?w=400',
      pointPrice: 39000,
      cashPrice: 5900,
      status: ProductStatus.ACTIVE,
      stockStatus: StockStatus.IN_STOCK,
      badge: 'New',
      categoryId: categories[5].id,
      description: '하루 시작을 가볍게 돕는 풋사과 낙산균 스틱 제품입니다.',
      deliveryInfo: '사전예약 기간 종료 이후 순차적으로 발송됩니다.',
      purchaseLimit: 3,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1615485737451-8e5f0c2ad44b?w=900', sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=900', sortOrder: 1 },
        ],
      },
      variants: {
        create: [
          { name: '1박스', pointPrice: 39000, cashPrice: 5900, stock: 80 },
          { name: '2박스', pointPrice: 74000, cashPrice: 9900, stock: 35 },
        ],
      },
    },
  });

  const routineSetProduct = await prisma.product.create({
    data: {
      name: '모닝·나이트 루틴 3세트',
      thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
      pointPrice: 129000,
      cashPrice: 19000,
      status: ProductStatus.ACTIVE,
      stockStatus: StockStatus.LOW_STOCK,
      badge: 'Popular',
      categoryId: categories[5].id,
      description: '아침용 풋사과 낙산균과 저녁용 리포좀 멜라토프로를 함께 담은 루틴 구성입니다.',
      deliveryInfo: '세트 상품은 사전예약 종료 후 순차 발송되며, 반품 시 왕복 택배비 정책이 적용됩니다.',
      purchaseLimit: 1,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900', sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900', sortOrder: 1 },
        ],
      },
      variants: {
        create: [{ name: '3세트 구성', pointPrice: 129000, cashPrice: 19000, stock: 12 }],
      },
    },
  });

  await prisma.cartItem.createMany({
    data: [
      {
        cartId: admin.cart!.id,
        productId: melatoProduct.id,
        quantity: 1,
        pointPriceSnapshot: 49000,
        cashPriceSnapshot: 0,
        productNameSnapshot: melatoProduct.name,
        thumbnailUrlSnapshot: melatoProduct.thumbnailUrl,
        variantNameSnapshot: '1박스',
      },
      {
        cartId: admin.cart!.id,
        productId: appleProduct.id,
        quantity: 1,
        pointPriceSnapshot: 39000,
        cashPriceSnapshot: 5900,
        productNameSnapshot: appleProduct.name,
        thumbnailUrlSnapshot: appleProduct.thumbnailUrl,
        variantNameSnapshot: '1박스',
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
        description: '2026 연도 복지포인트 지급',
      },
      {
        userId: admin.id,
        type: PointLedgerType.USE,
        amount: -15000,
        balanceAfter: 285000,
        description: '상품 구매',
      },
      {
        userId: admin.id,
        type: PointLedgerType.RECHARGE,
        amount: 50000,
        balanceAfter: 335000,
        description: '포인트 충전',
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
      shipmentCarrier: 'CJ대한통운',
      trackingNo: '1234567890',
      shippedAt: new Date('2026-03-16T10:00:00Z'),
      cancelAvailable: false,
      returnAvailable: true,
      createdAt: new Date('2026-03-15T10:30:00Z'),
      items: {
        create: [
          {
            productId: melatoProduct.id,
            productName: melatoProduct.name,
            thumbnailUrl: melatoProduct.thumbnailUrl,
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
      shipmentCarrier: '롯데택배',
      trackingNo: '9876543210',
      shippedAt: new Date('2026-03-21T09:00:00Z'),
      cancelAvailable: false,
      returnAvailable: false,
      createdAt: new Date('2026-03-20T11:00:00Z'),
      items: {
        create: [
          {
            productId: routineSetProduct.id,
            productName: routineSetProduct.name,
            thumbnailUrl: routineSetProduct.thumbnailUrl,
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

  console.log('Seed complete:', {
    adminId: admin.id,
    deliveredOrderId: deliveredOrder.id,
    userCount: users.length + 1,
    adminLogin: { email: admin.email, password: adminPassword },
    employeeLogin: { password: employeePassword },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
