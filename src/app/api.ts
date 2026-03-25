// Mock API Service Layer
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
  ApiResponse,
  PaginatedResponse,
} from './types';
import {
  mockCurrentUser,
  mockPointBalance,
  mockPointLedgers,
  mockCategories,
  mockProducts,
  mockProductDetails,
  mockCart,
  mockOrders,
  mockShippingAddresses,
  mockAdminDashboard,
  mockUsers,
} from './mockData';

// 지연 시뮬레이션 유틸리티
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 사용자 API
export const userApi = {
  async getMe(): Promise<ApiResponse<User>> {
    await delay();
    return { success: true, data: mockCurrentUser };
  },
};

// 포인트 API
export const pointApi = {
  async getBalance(): Promise<ApiResponse<PointBalance>> {
    await delay();
    return { success: true, data: mockPointBalance };
  },

  async getLedgers(params?: {
    page?: number;
    size?: number;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<PointLedger>>> {
    await delay();
    return {
      success: true,
      data: {
        items: mockPointLedgers,
        meta: {
          page: params?.page || 1,
          size: params?.size || 20,
          total: mockPointLedgers.length,
          totalPages: 1,
        },
      },
    };
  },

  async requestRecharge(amount: number, paymentMethod: string): Promise<ApiResponse<any>> {
    await delay(500);
    return {
      success: true,
      data: {
        rechargeOrderId: 'rch_' + Date.now(),
        status: 'pending',
        paymentRedirectUrl: '/points',
      },
    };
  },
};

// 카테고리 API
export const categoryApi = {
  async getAll(): Promise<ApiResponse<Category[]>> {
    await delay();
    return { success: true, data: mockCategories };
  },
};

// 상품 API
export const productApi = {
  async getList(params?: {
    categoryId?: string;
    query?: string;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    await delay();
    let filtered = [...mockProducts];

    if (params?.categoryId) {
      filtered = filtered.filter(p => p.categoryId === params.categoryId);
    }

    if (params?.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    return {
      success: true,
      data: {
        items: filtered,
        meta: {
          page: params?.page || 1,
          size: params?.size || 20,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / (params?.size || 20)),
        },
      },
    };
  },

  async getDetail(productId: string): Promise<ApiResponse<ProductDetail>> {
    await delay();
    const detail = mockProductDetails[productId];
    if (detail) {
      return { success: true, data: detail };
    }

    // 상세 정보가 없으면 기본 정보로 생성
    const product = mockProducts.find(p => p.productId === productId);
    if (product) {
      return {
        success: true,
        data: {
          ...product,
          description: `${product.name}에 대한 상세 설명입니다.`,
          images: [product.thumbnailUrl],
          deliveryInfo: '주문 후 2-3일 이내 배송',
        },
      };
    }

    throw new Error('상품을 찾을 수 없습니다.');
  },

  async getRecommendations(): Promise<ApiResponse<Product[]>> {
    await delay();
    return { success: true, data: mockProducts.slice(0, 4) };
  },
};

// 장바구니 API
export const cartApi = {
  async get(): Promise<ApiResponse<Cart>> {
    await delay();
    return { success: true, data: mockCart };
  },

  async addItem(productId: string, variantId?: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    await delay(500);
    // 실제로는 서버에서 장바구니를 업데이트하고 반환
    return { success: true, data: mockCart };
  },

  async updateQuantity(cartItemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    await delay(500);
    return { success: true, data: mockCart };
  },

  async removeItem(cartItemId: string): Promise<ApiResponse<Cart>> {
    await delay(500);
    return { success: true, data: mockCart };
  },
};

// 주문 API
export const orderApi = {
  async checkout(data: {
    cartItemIds: string[];
    shippingAddressId: string;
    agreePolicy: boolean;
  }): Promise<ApiResponse<Order>> {
    await delay(1000);
    return {
      success: true,
      data: {
        ...mockOrders[0],
        orderId: 'ord_' + Date.now(),
        orderNo: new Date().toISOString().split('T')[0].replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000),
        status: 'paid',
      },
    };
  },

  async getList(params?: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    await delay();
    return {
      success: true,
      data: {
        items: mockOrders,
        meta: {
          page: params?.page || 1,
          size: params?.size || 20,
          total: mockOrders.length,
          totalPages: 1,
        },
      },
    };
  },

  async getDetail(orderId: string): Promise<ApiResponse<Order>> {
    await delay();
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return { success: true, data: order };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async requestCancel(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: { ...order, status: 'cancel_requested' },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async requestReturn(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: { ...order, status: 'return_requested' },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },
};

// 배송지 API
export const shippingAddressApi = {
  async getList(): Promise<ApiResponse<ShippingAddress[]>> {
    await delay();
    return { success: true, data: mockShippingAddresses };
  },

  async create(data: Omit<ShippingAddress, 'addressId'>): Promise<ApiResponse<ShippingAddress>> {
    await delay(500);
    return {
      success: true,
      data: {
        ...data,
        addressId: 'addr_' + Date.now(),
      },
    };
  },

  async update(addressId: string, data: Partial<ShippingAddress>): Promise<ApiResponse<ShippingAddress>> {
    await delay(500);
    const address = mockShippingAddresses.find(a => a.addressId === addressId);
    if (address) {
      return {
        success: true,
        data: { ...address, ...data },
      };
    }
    throw new Error('배송지를 찾을 수 없습니다.');
  },

  async delete(addressId: string): Promise<ApiResponse<{ success: boolean }>> {
    await delay(500);
    return { success: true, data: { success: true } };
  },
};

// 관리자 API
export const adminApi = {
  async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
    await delay();
    return { success: true, data: mockAdminDashboard };
  },

  async getUsers(params?: {
    query?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    await delay();
    let filtered = [...mockUsers];

    if (params?.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.employeeNo.toLowerCase().includes(query)
      );
    }

    if (params?.status) {
      filtered = filtered.filter(u => u.status === params.status);
    }

    return {
      success: true,
      data: {
        items: filtered,
        meta: {
          page: params?.page || 1,
          size: params?.size || 20,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / (params?.size || 20)),
        },
      },
    };
  },

  async getUserDetail(userId: string): Promise<ApiResponse<User & { pointBalance: PointBalance }>> {
    await delay();
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      return {
        success: true,
        data: {
          ...user,
          pointBalance: mockPointBalance,
        },
      };
    }
    throw new Error('사용자를 찾을 수 없습니다.');
  },

  async createProduct(data: any): Promise<ApiResponse<Product>> {
    await delay(500);
    return {
      success: true,
      data: {
        productId: 'prd_' + Date.now(),
        ...data,
        status: 'draft',
        stockStatus: 'in_stock',
      },
    };
  },

  async updateProduct(productId: string, data: any): Promise<ApiResponse<Product>> {
    await delay(500);
    const product = mockProducts.find(p => p.productId === productId);
    if (product) {
      return {
        success: true,
        data: { ...product, ...data },
      };
    }
    throw new Error('상품을 찾을 수 없습니다.');
  },

  async updateProductStatus(productId: string, status: string): Promise<ApiResponse<Product>> {
    await delay(500);
    const product = mockProducts.find(p => p.productId === productId);
    if (product) {
      return {
        success: true,
        data: { ...product, status: status as any },
      };
    }
    throw new Error('상품을 찾을 수 없습니다.');
  },

  async adjustInventory(productId: string, variantId: string, delta: number, reason: string): Promise<ApiResponse<any>> {
    await delay(500);
    return { success: true, data: { success: true } };
  },

  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: { ...order, status: status as any },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async addShipment(orderId: string, data: { carrier: string; trackingNo: string }): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: {
          ...order,
          shipment: { ...data, shippedAt: new Date().toISOString() },
          status: 'shipped',
        },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async approveCancelRequest(orderId: string): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: { ...order, status: 'cancelled' },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async rejectCancelRequest(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    await delay(500);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (order) {
      return {
        success: true,
        data: { ...order, status: 'paid' },
      };
    }
    throw new Error('주문을 찾을 수 없습니다.');
  },

  async grantPoints(data: {
    batchKey: string;
    amount: number;
    targetStatus: string;
    expiresAt: string;
    description: string;
  }): Promise<ApiResponse<any>> {
    await delay(1000);
    return { success: true, data: { batchId: 'batch_' + Date.now(), processedCount: mockUsers.length } };
  },

  async adjustUserPoints(userId: string, data: {
    type: 'adjust_add' | 'adjust_sub';
    amount: number;
    reason: string;
  }): Promise<ApiResponse<PointLedger>> {
    await delay(500);
    return {
      success: true,
      data: {
        ledgerId: 'led_' + Date.now(),
        type: data.type,
        amount: data.type === 'adjust_add' ? data.amount : -data.amount,
        balanceAfter: mockPointBalance.availablePoint + (data.type === 'adjust_add' ? data.amount : -data.amount),
        description: data.reason,
        createdAt: new Date().toISOString(),
      },
    };
  },
};
