import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import {
  appendLedger,
  buildPointBalance,
  createOrderFromCart,
  createUserRecord,
  DEMO_EMAIL_CODE,
  getUserByEmail,
  getUserById,
  resetCart,
  state,
  updatePointBalance,
} from './data.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function success(data, meta) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

function fail(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

function getCurrentUser(req) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return fail(res, 401, 'AUTH_REQUIRED', '로그인이 필요합니다.');
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return fail(res, 401, 'AUTH_REQUIRED', '로그인이 필요합니다.');
  }

  if (!user.roles.includes('admin')) {
    return fail(res, 403, 'FORBIDDEN', '관리자 권한이 필요합니다.');
  }

  req.user = user;
  next();
}

function paginate(items, page = 1, size = 20) {
  return {
    items,
    meta: {
      page,
      size,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
    },
  };
}

app.get('/api/health', (req, res) => {
  res.json(success({ ok: true }));
});

app.post('/api/v1/auth/email-code', (req, res) => {
  const { email, purpose } = req.body ?? {};

  if (!email || !String(email).includes('@')) {
    return fail(res, 400, 'INVALID_EMAIL', '올바른 이메일 주소를 입력해주세요.');
  }

  if (purpose === 'login' && !getUserByEmail(email)) {
    return fail(res, 404, 'USER_NOT_FOUND', '가입된 이메일이 아닙니다.');
  }

  const requestId = `req_${crypto.randomUUID()}`;
  state.authRequests.set(requestId, {
    email: String(email).toLowerCase(),
    purpose,
    code: DEMO_EMAIL_CODE,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  res.json(
    success({
      requestId,
      expiresInSeconds: 300,
      debugCode: DEMO_EMAIL_CODE,
    }),
  );
});

app.post('/api/v1/auth/signup', (req, res) => {
  const { name, email, code } = req.body ?? {};

  if (!name || !email || !code) {
    return fail(res, 400, 'INVALID_INPUT', '이름, 이메일, 인증 코드를 모두 입력해주세요.');
  }

  if (code !== DEMO_EMAIL_CODE) {
    return fail(res, 400, 'INVALID_CODE', '인증 코드가 올바르지 않습니다.');
  }

  if (getUserByEmail(email)) {
    return fail(res, 409, 'EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.');
  }

  const user = createUserRecord({ name: String(name).trim(), email: String(email).trim() });
  res.json(success(user));
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, code } = req.body ?? {};

  if (!email || !code) {
    return fail(res, 400, 'INVALID_INPUT', '이메일과 인증 코드를 입력해주세요.');
  }

  if (code !== DEMO_EMAIL_CODE) {
    return fail(res, 400, 'INVALID_CODE', '인증 코드가 올바르지 않습니다.');
  }

  const user = getUserByEmail(email);
  if (!user) {
    return fail(res, 404, 'USER_NOT_FOUND', '가입된 이메일이 아닙니다.');
  }

  if (user.status !== 'active') {
    return fail(res, 403, 'USER_NOT_ACTIVE', '현재 사용할 수 없는 계정입니다.');
  }

  if (!user.emailVerified) {
    return fail(res, 403, 'EMAIL_NOT_VERIFIED', '이메일 인증이 완료되지 않았습니다.');
  }

  res.json(success(user));
});

app.get('/api/v1/me', requireAuth, (req, res) => {
  res.json(success(req.user));
});

app.get('/api/v1/me/points/balance', requireAuth, (req, res) => {
  res.json(success(buildPointBalance()));
});

app.get('/api/v1/me/points/ledgers', requireAuth, (req, res) => {
  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 20);
  const type = req.query.type ? String(req.query.type) : null;
  const items = type
    ? state.pointLedgers.filter((ledger) => type.split(',').includes(ledger.type))
    : state.pointLedgers;

  res.json(success(paginate(items, page, size)));
});

app.post('/api/v1/me/point-recharges', requireAuth, (req, res) => {
  const { amount } = req.body ?? {};
  const nextBalance = state.pointBalance.availablePoint + Number(amount || 0);

  updatePointBalance({ availablePoint: nextBalance });
  appendLedger({
    ledgerId: `led_${crypto.randomUUID()}`,
    type: 'recharge',
    amount: Number(amount || 0),
    balanceAfter: nextBalance,
    description: 'Point recharge',
    createdAt: new Date().toISOString(),
  });

  res.json(
    success({
      rechargeOrderId: `rch_${crypto.randomUUID()}`,
      status: 'pending',
      paymentRedirectUrl: '/points',
    }),
  );
});

app.get('/api/v1/categories', requireAuth, (req, res) => {
  res.json(success(state.categories));
});

app.get('/api/v1/products/recommendations', requireAuth, (req, res) => {
  res.json(success(state.products.slice(0, 4)));
});

app.get('/api/v1/products', requireAuth, (req, res) => {
  let items = [...state.products];
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;
  const query = req.query.query ? String(req.query.query).toLowerCase() : null;
  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 20);

  if (categoryId) {
    items = items.filter((product) => product.categoryId === categoryId);
  }

  if (query) {
    items = items.filter((product) => product.name.toLowerCase().includes(query));
  }

  res.json(success(paginate(items, page, size)));
});

app.get('/api/v1/products/:productId', requireAuth, (req, res) => {
  const detail = state.productDetails[req.params.productId];
  if (detail) {
    return res.json(success(detail));
  }

  const product = state.products.find((item) => item.productId === req.params.productId);
  if (!product) {
    return fail(res, 404, 'PRODUCT_NOT_FOUND', '상품을 찾을 수 없습니다.');
  }

  return res.json(
    success({
      ...product,
      description: `${product.name} detail information`,
      images: [product.thumbnailUrl],
      deliveryInfo: 'Ships within 2-3 business days',
    }),
  );
});

app.get('/api/v1/cart', requireAuth, (req, res) => {
  res.json(success(state.cart));
});

app.post('/api/v1/cart/items', requireAuth, (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body ?? {};
  const product = state.products.find((item) => item.productId === productId);
  if (!product) {
    return fail(res, 404, 'PRODUCT_NOT_FOUND', '상품을 찾을 수 없습니다.');
  }

  state.cart.items.push({
    cartItemId: `ci_${crypto.randomUUID()}`,
    productId: product.productId,
    productName: product.name,
    thumbnailUrl: product.thumbnailUrl,
    variantId,
    variantName: variantId ?? undefined,
    quantity: Number(quantity),
    pointPrice: product.pointPrice,
  });
  state.cart.totalPointAmount = state.cart.items.reduce((sum, item) => sum + item.pointPrice * item.quantity, 0);

  res.json(success(state.cart));
});

app.patch('/api/v1/cart/items/:cartItemId', requireAuth, (req, res) => {
  const item = state.cart.items.find((cartItem) => cartItem.cartItemId === req.params.cartItemId);
  if (!item) {
    return fail(res, 404, 'CART_ITEM_NOT_FOUND', '장바구니 항목을 찾을 수 없습니다.');
  }

  item.quantity = Number(req.body?.quantity ?? item.quantity);
  state.cart.totalPointAmount = state.cart.items.reduce((sum, cartItem) => sum + cartItem.pointPrice * cartItem.quantity, 0);
  res.json(success(state.cart));
});

app.delete('/api/v1/cart/items/:cartItemId', requireAuth, (req, res) => {
  state.cart.items = state.cart.items.filter((item) => item.cartItemId !== req.params.cartItemId);
  state.cart.totalPointAmount = state.cart.items.reduce((sum, item) => sum + item.pointPrice * item.quantity, 0);
  res.json(success(state.cart));
});

app.post('/api/v1/orders/checkout', requireAuth, (req, res) => {
  const usedPoint = state.cart.totalPointAmount;
  const nextBalance = Math.max(0, state.pointBalance.availablePoint - usedPoint);
  updatePointBalance({ availablePoint: nextBalance, reservedPoint: 0 });
  appendLedger({
    ledgerId: `led_${crypto.randomUUID()}`,
    type: 'use',
    amount: -usedPoint,
    balanceAfter: nextBalance,
    description: 'Order checkout',
    createdAt: new Date().toISOString(),
  });

  const order = createOrderFromCart();
  resetCart();
  res.json(success(order));
});

app.get('/api/v1/orders', requireAuth, (req, res) => {
  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 20);
  const status = req.query.status ? String(req.query.status).split(',') : null;
  const items = status ? state.orders.filter((order) => status.includes(order.status)) : state.orders;
  res.json(success(paginate(items, page, size)));
});

app.get('/api/v1/orders/:orderId', requireAuth, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  res.json(success(order));
});

app.post('/api/v1/orders/:orderId/cancel-request', requireAuth, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.status = 'cancel_requested';
  order.cancelAvailable = false;
  order.statusHistories.unshift({ status: 'cancel_requested', timestamp: new Date().toISOString(), note: req.body?.reason });
  res.json(success(order));
});

app.post('/api/v1/orders/:orderId/return-request', requireAuth, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.status = 'return_requested';
  order.returnAvailable = false;
  order.statusHistories.unshift({ status: 'return_requested', timestamp: new Date().toISOString(), note: req.body?.reason });
  res.json(success(order));
});

app.get('/api/v1/me/shipping-addresses', requireAuth, (req, res) => {
  res.json(success(state.shippingAddresses));
});

app.post('/api/v1/me/shipping-addresses', requireAuth, (req, res) => {
  const address = {
    addressId: `addr_${crypto.randomUUID()}`,
    ...req.body,
  };
  state.shippingAddresses.unshift(address);
  res.json(success(address));
});

app.patch('/api/v1/me/shipping-addresses/:addressId', requireAuth, (req, res) => {
  const address = state.shippingAddresses.find((item) => item.addressId === req.params.addressId);
  if (!address) {
    return fail(res, 404, 'ADDRESS_NOT_FOUND', '배송지를 찾을 수 없습니다.');
  }
  Object.assign(address, req.body ?? {});
  res.json(success(address));
});

app.delete('/api/v1/me/shipping-addresses/:addressId', requireAuth, (req, res) => {
  state.shippingAddresses = state.shippingAddresses.filter((item) => item.addressId !== req.params.addressId);
  res.json(success({ success: true }));
});

app.get('/api/v1/admin/dashboard', requireAdmin, (req, res) => {
  res.json(success(state.adminDashboard));
});

app.get('/api/v1/admin/users', requireAdmin, (req, res) => {
  const query = req.query.query ? String(req.query.query).toLowerCase() : null;
  const status = req.query.status ? String(req.query.status) : null;
  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 20);
  let items = [...state.users];

  if (query) {
    items = items.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.employeeNo.toLowerCase().includes(query),
    );
  }

  if (status) {
    items = items.filter((user) => user.status === status);
  }

  res.json(success(paginate(items, page, size)));
});

app.get('/api/v1/admin/users/:userId', requireAdmin, (req, res) => {
  const user = getUserById(req.params.userId);
  if (!user) {
    return fail(res, 404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
  }
  res.json(success({ ...user, pointBalance: buildPointBalance() }));
});

app.post('/api/v1/admin/point-grant-batches', requireAdmin, (req, res) => {
  res.json(success({ batchId: `batch_${crypto.randomUUID()}`, processedCount: state.users.length }));
});

app.post('/api/v1/admin/users/:userId/point-adjustments', requireAdmin, (req, res) => {
  const { type, amount, reason } = req.body ?? {};
  const delta = type === 'adjust_sub' ? -Number(amount) : Number(amount);
  const nextBalance = state.pointBalance.availablePoint + delta;
  updatePointBalance({ availablePoint: nextBalance });

  const ledger = {
    ledgerId: `led_${crypto.randomUUID()}`,
    type,
    amount: delta,
    balanceAfter: nextBalance,
    description: reason,
    createdAt: new Date().toISOString(),
  };

  appendLedger(ledger);
  res.json(success(ledger));
});

app.post('/api/v1/admin/products', requireAdmin, (req, res) => {
  const product = {
    productId: `prd_${crypto.randomUUID()}`,
    name: req.body?.name ?? 'Untitled product',
    thumbnailUrl: req.body?.thumbnailUrl ?? state.products[0].thumbnailUrl,
    pointPrice: Number(req.body?.pointPrice ?? 0),
    status: 'draft',
    stockStatus: 'in_stock',
    badge: req.body?.badge,
    categoryId: req.body?.categoryId ?? state.categories[0].id,
  };
  state.products.unshift(product);
  res.json(success(product));
});

app.patch('/api/v1/admin/products/:productId', requireAdmin, (req, res) => {
  const product = state.products.find((item) => item.productId === req.params.productId);
  if (!product) {
    return fail(res, 404, 'PRODUCT_NOT_FOUND', '상품을 찾을 수 없습니다.');
  }
  Object.assign(product, req.body ?? {});
  res.json(success(product));
});

app.post('/api/v1/admin/products/:productId/status', requireAdmin, (req, res) => {
  const product = state.products.find((item) => item.productId === req.params.productId);
  if (!product) {
    return fail(res, 404, 'PRODUCT_NOT_FOUND', '상품을 찾을 수 없습니다.');
  }
  product.status = req.body?.status ?? product.status;
  res.json(success(product));
});

app.post('/api/v1/admin/products/:productId/inventory-adjustments', requireAdmin, (req, res) => {
  res.json(success({ success: true }));
});

app.patch('/api/v1/admin/orders/:orderId/status', requireAdmin, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.status = req.body?.status ?? order.status;
  order.statusHistories.unshift({ status: order.status, timestamp: new Date().toISOString() });
  res.json(success(order));
});

app.post('/api/v1/admin/orders/:orderId/shipment', requireAdmin, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.shipment = { ...req.body, shippedAt: new Date().toISOString() };
  order.status = 'shipped';
  order.statusHistories.unshift({ status: 'shipped', timestamp: new Date().toISOString() });
  res.json(success(order));
});

app.post('/api/v1/admin/orders/:orderId/cancel-approve', requireAdmin, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.status = 'cancelled';
  order.cancelAvailable = false;
  order.statusHistories.unshift({ status: 'cancelled', timestamp: new Date().toISOString() });
  updatePointBalance({ availablePoint: state.pointBalance.availablePoint + order.usedPoint });
  appendLedger({
    ledgerId: `led_${crypto.randomUUID()}`,
    type: 'refund',
    amount: order.usedPoint,
    balanceAfter: state.pointBalance.availablePoint,
    relatedOrderId: order.orderId,
    description: 'Order cancel refund',
    createdAt: new Date().toISOString(),
  });
  res.json(success(order));
});

app.post('/api/v1/admin/orders/:orderId/cancel-reject', requireAdmin, (req, res) => {
  const order = state.orders.find((item) => item.orderId === req.params.orderId);
  if (!order) {
    return fail(res, 404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  order.status = 'paid';
  order.cancelAvailable = true;
  order.statusHistories.unshift({ status: 'paid', timestamp: new Date().toISOString(), note: req.body?.reason });
  res.json(success(order));
});

app.use((req, res) => {
  fail(res, 404, 'NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.');
});

app.listen(PORT, () => {
  console.log(`Welfare mall mock API listening on http://localhost:${PORT}`);
});
