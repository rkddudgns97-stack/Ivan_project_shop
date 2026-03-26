// 사용자 관련 타입
export interface User {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  emailVerified: boolean;
  authProvider: 'email';
  status: 'active' | 'inactive' | 'leave';
  roles: ('employee' | 'admin')[];
}

export interface EmailCodeRequest {
  email: string;
  purpose: 'signup' | 'login';
}

export interface EmailCodeResponse {
  requestId: string;
  expiresInSeconds: number;
}

export interface SignupPayload {
  name: string;
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  code: string;
}

// 포인트 관련 타입
export interface PointBalance {
  availablePoint: number;
  reservedPoint: number;
  expiringPoint: number;
  expiringAt: string | null;
}

export interface PointLedger {
  ledgerId: string;
  type: 'grant' | 'recharge' | 'reserved' | 'use' | 'refund' | 'adjust_add' | 'adjust_sub' | 'expire';
  amount: number;
  balanceAfter: number;
  relatedOrderId?: string;
  description: string;
  createdAt: string;
}

export type PaymentMethod = 'point_only' | 'card' | 'kakao_pay' | 'naver_pay' | 'tosspay';
export type PaymentStatus = 'pending' | 'ready' | 'paid' | 'cancelled' | 'refunded';

export interface PaymentSummary {
  itemPointAmount: number;
  itemCashAmount: number;
  shippingFeeCashAmount: number;
  discountCashAmount: number;
  finalPointAmount: number;
  finalCashAmount: number;
}

// 카테고리 관련 타입
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// 상품 관련 타입
export interface Product {
  productId: string;
  name: string;
  thumbnailUrl: string;
  pointPrice: number;
  cashPrice: number;
  status: 'draft' | 'active' | 'inactive' | 'sold_out';
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  badge?: string;
  categoryId: string;
}

export interface ProductDetail extends Product {
  description: string;
  images: string[];
  variants?: ProductVariant[];
  deliveryInfo: string;
  purchaseLimit?: number;
}

export interface ProductVariant {
  variantId: string;
  name: string;
  pointPrice: number;
  cashPrice: number;
  stock: number;
}

// 장바구니 관련 타입
export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  thumbnailUrl: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  pointPrice: number;
  cashPrice: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  totalPointAmount: number;
  totalCashAmount: number;
  paymentSummary: PaymentSummary;
}

// 주문 관련 타입
export interface Order {
  orderId: string;
  orderNo: string;
  status: 'created' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancel_requested' | 'cancelled' | 'return_requested' | 'returned';
  items: OrderItem[];
  usedPoint: number;
  additionalCashAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentSummary: PaymentSummary;
  shipment?: Shipment;
  statusHistories: StatusHistory[];
  cancelAvailable: boolean;
  returnAvailable: boolean;
  createdAt: string;
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  thumbnailUrl: string;
  variantName?: string;
  quantity: number;
  pointPrice: number;
  cashPrice: number;
}

export interface Shipment {
  carrier: string;
  trackingNo: string;
  shippedAt?: string;
}

export interface StatusHistory {
  status: string;
  timestamp: string;
  note?: string;
}

// 배송지 관련 타입
export interface ShippingAddress {
  addressId: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
}

// 관리자 관련 타입
export interface AdminDashboard {
  userCount: number;
  activeProductCount: number;
  todayOrderCount: number;
  todayUsedPoint: number;
  pendingCancelCount: number;
  lowStockCount: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 페이지네이션 타입
export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
