import { readStoredAuthUser } from './auth/session';
import type {
  AdminDashboard,
  ApiResponse,
  Cart,
  Category,
  EmailCodeRequest,
  EmailCodeResponse,
  LoginPayload,
  Order,
  PaginatedResponse,
  PointBalance,
  PointLedger,
  Product,
  ProductDetail,
  ShippingAddress,
  SignupPayload,
  User,
} from './types';

type AdminProductPayload = Partial<Product> & {
  imageUrls?: string[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const storedUser = readStoredAuthUser();
  const headers = new Headers(init?.headers);

  headers.set('Content-Type', 'application/json');

  if (storedUser?.id) {
    headers.set('x-user-id', storedUser.id);
  }

  if (storedUser?.email) {
    headers.set('x-user-email', storedUser.email);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body?.message || body?.error?.message || '요청 처리에 실패했습니다.');
  }

  return body as ApiResponse<T>;
}

async function uploadForm<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const storedUser = readStoredAuthUser();
  const headers = new Headers();

  if (storedUser?.id) {
    headers.set('x-user-id', storedUser.id);
  }

  if (storedUser?.email) {
    headers.set('x-user-email', storedUser.email);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body?.message || body?.error?.message || '업로드 처리에 실패했습니다.');
  }

  return body as ApiResponse<T>;
}

export const authApi = {
  requestEmailCode(payload: EmailCodeRequest) {
    return request<EmailCodeResponse>('/api/v1/auth/email-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  signupWithEmail(payload: SignupPayload) {
    return request<User>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  loginWithEmail(payload: LoginPayload) {
    return request<User>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const userApi = {
  getMe() {
    return request<User>('/api/v1/me');
  },
};

export const pointApi = {
  getBalance() {
    return request<PointBalance>('/api/v1/me/points/balance');
  },

  getLedgers(params?: {
    page?: number;
    size?: number;
    type?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));
    if (params?.type) search.set('type', params.type);

    return request<PaginatedResponse<PointLedger>>(
      `/api/v1/me/points/ledgers${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  requestRecharge(amount: number, paymentMethod: string) {
    return request<{ rechargeOrderId: string; status: string; paymentRedirectUrl: string }>(
      '/api/v1/me/point-recharges',
      {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      },
    );
  },
};

export const categoryApi = {
  getAll() {
    return request<Category[]>('/api/v1/categories');
  },
};

export const productApi = {
  getList(params?: {
    categoryId?: string;
    query?: string;
    sort?: string;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.categoryId) search.set('categoryId', params.categoryId);
    if (params?.query) search.set('query', params.query);
    if (params?.sort) search.set('sort', params.sort);
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));

    return request<PaginatedResponse<Product>>(
      `/api/v1/products${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  getDetail(productId: string) {
    return request<ProductDetail>(`/api/v1/products/${productId}`);
  },

  getRecommendations() {
    return request<Product[]>('/api/v1/products/recommendations');
  },
};

export const cartApi = {
  get() {
    return request<Cart>('/api/v1/cart');
  },

  addItem(productId: string, variantId?: string, quantity: number = 1) {
    return request<Cart>('/api/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
    });
  },

  updateQuantity(cartItemId: string, quantity: number) {
    return request<Cart>(`/api/v1/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem(cartItemId: string) {
    return request<Cart>(`/api/v1/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
  },
};

export const orderApi = {
  checkout(data: {
    cartItemIds: string[];
    shippingAddressId: string;
    agreePolicy: boolean;
    paymentMethod?: string;
    cashAmount?: number;
  }) {
    return request<Order>('/api/v1/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getList(params?: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));

    return request<PaginatedResponse<Order>>(
      `/api/v1/orders${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  getDetail(orderId: string) {
    return request<Order>(`/api/v1/orders/${orderId}`);
  },

  requestCancel(orderId: string, reason: string) {
    return request<Order>(`/api/v1/orders/${orderId}/cancel-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  requestReturn(orderId: string, reason: string) {
    return request<Order>(`/api/v1/orders/${orderId}/return-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

export const shippingAddressApi = {
  getList() {
    return request<ShippingAddress[]>('/api/v1/me/shipping-addresses');
  },

  create(data: Omit<ShippingAddress, 'addressId'>) {
    return request<ShippingAddress>('/api/v1/me/shipping-addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(addressId: string, data: Partial<ShippingAddress>) {
    return request<ShippingAddress>(`/api/v1/me/shipping-addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(addressId: string) {
    return request<{ success: boolean }>(`/api/v1/me/shipping-addresses/${addressId}`, {
      method: 'DELETE',
    });
  },
};

export const adminApi = {
  getDashboard() {
    return request<AdminDashboard>('/api/v1/admin/dashboard');
  },

  getProducts(params?: {
    query?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.status) search.set('status', params.status);
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));

    return request<PaginatedResponse<Product>>(
      `/api/v1/admin/products${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  getOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));

    return request<PaginatedResponse<Order>>(
      `/api/v1/admin/orders${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  getOrderDetail(orderId: string) {
    return request<Order>(`/api/v1/admin/orders/${orderId}`);
  },

  getUsers(params?: {
    query?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.status) search.set('status', params.status);
    if (params?.page) search.set('page', String(params.page));
    if (params?.size) search.set('size', String(params.size));

    return request<PaginatedResponse<User>>(
      `/api/v1/admin/users${search.toString() ? `?${search.toString()}` : ''}`,
    );
  },

  getUserDetail(userId: string) {
    return request<User & { pointBalance: PointBalance }>(`/api/v1/admin/users/${userId}`);
  },

  createProduct(data: AdminProductPayload) {
    return request<Product>('/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct(productId: string, data: AdminProductPayload) {
    return request<Product>(`/api/v1/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return uploadForm<{
      url: string;
      publicId: string;
      width?: number;
      height?: number;
      resourceType: string;
    }>('/api/v1/admin/uploads/image', formData);
  },

  updateProductStatus(productId: string, status: string) {
    return request<Product>(`/api/v1/admin/products/${productId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  adjustInventory(productId: string, variantId: string, delta: number, reason: string) {
    return request<{ success: boolean }>(
      `/api/v1/admin/products/${productId}/inventory-adjustments`,
      {
        method: 'POST',
        body: JSON.stringify({ variantId, delta, reason }),
      },
    );
  },

  updateOrderStatus(orderId: string, status: string) {
    return request<Order>(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  addShipment(orderId: string, data: { carrier: string; trackingNo: string }) {
    return request<Order>(`/api/v1/admin/orders/${orderId}/shipment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveCancelRequest(orderId: string) {
    return request<Order>(`/api/v1/admin/orders/${orderId}/cancel-approve`, {
      method: 'POST',
    });
  },

  rejectCancelRequest(orderId: string, reason: string) {
    return request<Order>(`/api/v1/admin/orders/${orderId}/cancel-reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  grantPoints(data: {
    batchKey: string;
    amount: number;
    targetStatus: string;
    expiresAt: string;
    description: string;
  }) {
    return request<{ batchId: string; processedCount: number }>(
      '/api/v1/admin/point-grant-batches',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },

  adjustUserPoints(
    userId: string,
    data: {
      type: 'adjust_add' | 'adjust_sub';
      amount: number;
      reason: string;
    },
  ) {
    return request<PointLedger>(`/api/v1/admin/users/${userId}/point-adjustments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
