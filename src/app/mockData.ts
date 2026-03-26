import type {
  AdminDashboard,
  Cart,
  Category,
  Order,
  PointBalance,
  PointLedger,
  Product,
  ProductDetail,
  ShippingAddress,
  User,
} from './types';

export const mockCurrentUser: User = {
  id: 'usr_admin_001',
  employeeNo: 'E240001',
  name: 'Hong Gildong',
  email: 'admin@welfaremall.co.kr',
  emailVerified: true,
  authProvider: 'email',
  status: 'active',
  roles: ['employee', 'admin'],
};

export const mockPointBalance: PointBalance = {
  availablePoint: 285000,
  reservedPoint: 15000,
  expiringPoint: 50000,
  expiringAt: '2026-12-31T14:59:59Z',
};

export const mockPointLedgers: PointLedger[] = [
  {
    ledgerId: 'led_001',
    type: 'grant',
    amount: 300000,
    balanceAfter: 300000,
    description: '2026 annual welfare point grant',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    ledgerId: 'led_002',
    type: 'use',
    amount: -15000,
    balanceAfter: 285000,
    relatedOrderId: 'ord_001',
    description: 'Product purchase',
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    ledgerId: 'led_003',
    type: 'recharge',
    amount: 50000,
    balanceAfter: 335000,
    description: 'Point recharge',
    createdAt: '2026-02-10T14:20:00Z',
  },
];

export const mockCategories: Category[] = [
  { id: 'cat_001', name: 'Food & Drink', description: 'Coffee, tea, wellness snacks' },
  { id: 'cat_002', name: 'Living', description: 'Home, desk, daily goods' },
  { id: 'cat_003', name: 'Digital', description: 'Audio, accessories, mobile gear' },
  { id: 'cat_004', name: 'Fashion', description: 'Bags, apparel, office style' },
  { id: 'cat_005', name: 'Book & Stationery', description: 'Books, notes, pens' },
  { id: 'cat_006', name: 'Health & Sports', description: 'Exercise and wellness items' },
];

export const mockProducts: Product[] = [
  {
    productId: 'prd_001',
    name: 'Premium Coffee Bean Set',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    pointPrice: 35000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: 'New',
    categoryId: 'cat_001',
  },
  {
    productId: 'prd_002',
    name: 'Wireless Noise Cancelling Earbuds',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    pointPrice: 89000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: 'Popular',
    categoryId: 'cat_003',
  },
  {
    productId: 'prd_003',
    name: 'Stainless Tumbler',
    thumbnailUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    pointPrice: 25000,
    status: 'active',
    stockStatus: 'low_stock',
    categoryId: 'cat_002',
  },
  {
    productId: 'prd_004',
    name: 'Business Casual Backpack',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    pointPrice: 65000,
    status: 'active',
    stockStatus: 'in_stock',
    categoryId: 'cat_004',
  },
  {
    productId: 'prd_005',
    name: 'Bestseller Book Set',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    pointPrice: 45000,
    status: 'active',
    stockStatus: 'in_stock',
    categoryId: 'cat_005',
  },
  {
    productId: 'prd_006',
    name: 'Yoga Mat Starter Kit',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    pointPrice: 55000,
    status: 'active',
    stockStatus: 'in_stock',
    badge: 'Recommended',
    categoryId: 'cat_006',
  },
];

export const mockProductDetails: Record<string, ProductDetail> = {
  prd_001: {
    ...mockProducts[0],
    description:
      'A curated premium coffee bean set for employees who want a calmer morning routine and a quality break at work.',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
    ],
    deliveryInfo: 'Ships within 2-3 business days',
    purchaseLimit: 2,
    variants: [
      { variantId: 'var_001', name: '200g x 3', pointPrice: 35000, stock: 50 },
      { variantId: 'var_002', name: '500g x 3', pointPrice: 75000, stock: 30 },
    ],
  },
  prd_002: {
    ...mockProducts[1],
    description:
      'Premium wireless earbuds with active noise cancellation for commuting, focus work, and calls.',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
      'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
    ],
    deliveryInfo: 'Ships within 1-2 business days',
    purchaseLimit: 1,
  },
};

export const mockCart: Cart = {
  cartId: 'cart_001',
  items: [
    {
      cartItemId: 'ci_001',
      productId: 'prd_001',
      productName: 'Premium Coffee Bean Set',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      variantId: 'var_001',
      variantName: '200g x 3',
      quantity: 1,
      pointPrice: 35000,
    },
    {
      cartItemId: 'ci_002',
      productId: 'prd_003',
      productName: 'Stainless Tumbler',
      thumbnailUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
      quantity: 2,
      pointPrice: 25000,
    },
  ],
  totalPointAmount: 85000,
};

export const mockOrders: Order[] = [
  {
    orderId: 'ord_001',
    orderNo: '20260315-001',
    status: 'delivered',
    items: [
      {
        orderItemId: 'oi_001',
        productId: 'prd_002',
        productName: 'Wireless Noise Cancelling Earbuds',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
        quantity: 1,
        pointPrice: 89000,
      },
    ],
    usedPoint: 89000,
    shipment: {
      carrier: 'CJ Logistics',
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
        productName: 'Business Casual Backpack',
        thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        quantity: 1,
        pointPrice: 65000,
      },
    ],
    usedPoint: 65000,
    shipment: {
      carrier: 'Lotte Express',
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

export const mockShippingAddresses: ShippingAddress[] = [
  {
    addressId: 'addr_001',
    recipientName: 'Hong Gildong',
    phone: '010-1234-5678',
    zipCode: '06234',
    address1: '123 Teheran-ro, Gangnam-gu, Seoul',
    address2: '101-1201',
    isDefault: true,
  },
  {
    addressId: 'addr_002',
    recipientName: 'Hong Gildong',
    phone: '010-1234-5678',
    zipCode: '13494',
    address1: '235 Pangyo-ro, Bundang-gu, Seongnam-si',
    address2: 'Daou office',
    isDefault: false,
  },
];

export const mockAdminDashboard: AdminDashboard = {
  userCount: 1243,
  activeProductCount: 156,
  todayOrderCount: 28,
  todayUsedPoint: 2450000,
  pendingCancelCount: 3,
  lowStockCount: 12,
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'usr_002',
    employeeNo: 'E240002',
    name: 'Kim Cheolsu',
    email: 'kim@example.com',
    emailVerified: true,
    authProvider: 'email',
    status: 'active',
    roles: ['employee'],
  },
  {
    id: 'usr_003',
    employeeNo: 'E240003',
    name: 'Lee Younghee',
    email: 'lee@example.com',
    emailVerified: true,
    authProvider: 'email',
    status: 'active',
    roles: ['employee'],
  },
  {
    id: 'usr_004',
    employeeNo: 'E240004',
    name: 'Park Minsu',
    email: 'park@example.com',
    emailVerified: false,
    authProvider: 'email',
    status: 'inactive',
    roles: ['employee'],
  },
];
