import type {
  User,
  PointBalance,
  PointLedger,
  Category,
  Product,
  ProductDetail,
  Cart,
  Order,
  ShippingAddress,
  AdminDashboard,
} from './types';

// 현재 로그인한 사용자
export const mockCurrentUser: User = {
  id: 'usr_001',
  employeeNo: 'E240001',
  name: '홍길동',
  email: 'hong@example.com',
  status: 'active',
  roles: ['employee', 'admin'], // 데모를 위해 두 역할 모두 부여
};

// 포인트 잔액
export const mockPointBalance: PointBalance = {
  availablePoint: 285000,
  reservedPoint: 15000,
  expiringPoint: 50000,
  expiringAt: '2026-12-31T14:59:59Z',
};

// 포인트 이력
export const mockPointLedgers: PointLedger[] = [
  {
    ledgerId: 'led_001',
    type: 'grant',
    amount: 300000,
    balanceAfter: 300000,
    description: '2026 연간 복지 포인트 지급',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    ledgerId: 'led_002',
    type: 'use',
    amount: -15000,
    balanceAfter: 285000,
    relatedOrderId: 'ord_001',
    description: '상품 구매',
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    ledgerId: 'led_003',
    type: 'recharge',
    amount: 50000,
    balanceAfter: 335000,
    description: '포인트 충전',
    createdAt: '2026-02-10T14:20:00Z',
  },
];

// 카테고리
export const mockCategories: Category[] = [
  { id: 'cat_001', name: '식품/음료', description: '커피, 차, 건강식품 등' },
  { id: 'cat_002', name: '생활용품', description: '주방용품, 욕실용품 등' },
  { id: 'cat_003', name: '디지털/가전', description: '이어폰, 충전기 등' },
  { id: 'cat_004', name: '패션/잡화', description: '의류, 가방, 액세서리' },
  { id: 'cat_005', name: '도서/문구', description: '책, 노트, 필기구' },
  { id: 'cat_006', name: '레저/스포츠', description: '운동용품, 여행용품' },
];

// 상품 목록
export const mockProducts: Product[] = [
  {
    productId: 'prd_001',
    name: '프리미엄 커피 원두 세트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    pointPrice: 35000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: '인기',
    categoryId: 'cat_001',
  },
  {
    productId: 'prd_002',
    name: '무선 블루투스 이어폰',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    pointPrice: 89000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: '신상',
    categoryId: 'cat_003',
  },
  {
    productId: 'prd_003',
    name: '스테인리스 텀블러',
    thumbnailUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    pointPrice: 25000,
    status: 'active',
    stockStatus: 'low_stock',
    categoryId: 'cat_002',
  },
  {
    productId: 'prd_004',
    name: '비즈니스 캐주얼 백팩',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    pointPrice: 65000,
    status: 'active',
    stockStatus: 'in_stock',
    categoryId: 'cat_004',
  },
  {
    productId: 'prd_005',
    name: '베스트셀러 도서 세트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    pointPrice: 45000,
    status: 'active',
    stockStatus: 'in_stock',
    categoryId: 'cat_005',
  },
  {
    productId: 'prd_006',
    name: '요가 매트 + 스트랩 세트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    pointPrice: 55000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: '추천',
    categoryId: 'cat_006',
  },
];

// 상품 상세 정보
export const mockProductDetails: Record<string, ProductDetail> = {
  prd_001: {
    ...mockProducts[0],
    description: '엄선된 원두 3종으로 구성된 프리미엄 커피 세트입니다. 매일 아침 신선한 커피로 하루를 시작하세요.',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
    ],
    deliveryInfo: '주문 후 2-3일 이내 배송',
    purchaseLimit: 2,
    variants: [
      { variantId: 'var_001', name: '원두 (200g x 3)', pointPrice: 35000, stock: 50 },
      { variantId: 'var_002', name: '원두 (500g x 3)', pointPrice: 75000, stock: 30 },
    ],
  },
  prd_002: {
    ...mockProducts[1],
    description: '액티브 노이즈 캔슬링 기능을 갖춘 프리미엄 무선 이어폰입니다. 최대 24시간 재생 가능.',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
      'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
    ],
    deliveryInfo: '주문 후 1-2일 이내 배송',
    purchaseLimit: 1,
  },
};

// 장바구니
export const mockCart: Cart = {
  cartId: 'cart_001',
  items: [
    {
      cartItemId: 'ci_001',
      productId: 'prd_001',
      productName: '프리미엄 커피 원두 세트',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      variantId: 'var_001',
      variantName: '원두 (200g x 3)',
      quantity: 1,
      pointPrice: 35000,
    },
    {
      cartItemId: 'ci_002',
      productId: 'prd_003',
      productName: '스테인리스 텀블러',
      thumbnailUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
      quantity: 2,
      pointPrice: 25000,
    },
  ],
  totalPointAmount: 85000,
};

// 주문 목록
export const mockOrders: Order[] = [
  {
    orderId: 'ord_001',
    orderNo: '20260315-001',
    status: 'delivered',
    items: [
      {
        orderItemId: 'oi_001',
        productId: 'prd_002',
        productName: '무선 블루투스 이어폰',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
        quantity: 1,
        pointPrice: 89000,
      },
    ],
    usedPoint: 89000,
    shipment: {
      carrier: 'CJ대한통운',
      trackingNo: '1234567890',
      shippedAt: '2026-03-16T10:00:00Z',
    },
    statusHistories: [
      { status: 'paid', timestamp: '2026-03-15T10:30:00Z' },
      { status: 'preparing', timestamp: '2026-03-15T14:00:00Z' },
      { status: 'shipped', timestamp: '2026-03-16T10:00:00Z' },
      { status: 'delivered', timestamp: '2026-03-18T15:30:00Z' },
    ],
    cancelAvailable: false,
    returnAvailable: true,
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    orderId: 'ord_002',
    orderNo: '20260320-002',
    status: 'shipped',
    items: [
      {
        orderItemId: 'oi_002',
        productId: 'prd_004',
        productName: '비즈니스 캐주얼 백팩',
        thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        quantity: 1,
        pointPrice: 65000,
      },
    ],
    usedPoint: 65000,
    shipment: {
      carrier: '로젠택배',
      trackingNo: '9876543210',
      shippedAt: '2026-03-21T09:00:00Z',
    },
    statusHistories: [
      { status: 'paid', timestamp: '2026-03-20T11:00:00Z' },
      { status: 'preparing', timestamp: '2026-03-20T15:00:00Z' },
      { status: 'shipped', timestamp: '2026-03-21T09:00:00Z' },
    ],
    cancelAvailable: false,
    returnAvailable: false,
    createdAt: '2026-03-20T11:00:00Z',
  },
];

// 배송지
export const mockShippingAddresses: ShippingAddress[] = [
  {
    addressId: 'addr_001',
    recipientName: '홍길동',
    phone: '010-1234-5678',
    zipCode: '06234',
    address1: '서울시 강남구 테헤란로 123',
    address2: '101동 1201호',
    isDefault: true,
  },
  {
    addressId: 'addr_002',
    recipientName: '홍길동',
    phone: '010-1234-5678',
    zipCode: '13494',
    address1: '경기도 성남시 분당구 판교역로 235',
    address2: '회사',
    isDefault: false,
  },
];

// 관리자 대시보드
export const mockAdminDashboard: AdminDashboard = {
  userCount: 1243,
  activeProductCount: 156,
  todayOrderCount: 28,
  todayUsedPoint: 2450000,
  pendingCancelCount: 3,
  lowStockCount: 12,
};

// 임직원 목록 (관리자용)
export const mockUsers: User[] = [
  {
    id: 'usr_001',
    employeeNo: 'E240001',
    name: '홍길동',
    email: 'hong@example.com',
    status: 'active',
    roles: ['employee', 'admin'],
  },
  {
    id: 'usr_002',
    employeeNo: 'E240002',
    name: '김철수',
    email: 'kim@example.com',
    status: 'active',
    roles: ['employee'],
  },
  {
    id: 'usr_003',
    employeeNo: 'E240003',
    name: '이영희',
    email: 'lee@example.com',
    status: 'active',
    roles: ['employee'],
  },
  {
    id: 'usr_004',
    employeeNo: 'E240004',
    name: '박민수',
    email: 'park@example.com',
    status: 'inactive',
    roles: ['employee'],
  },
];
