import { toClientEnum } from './auth';

const CATEGORY_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  'Food & Drink': {
    name: '\uC2DD\uC74C\uB8CC',
    description: '\uCEE4\uD53C, \uCC28, \uAC74\uAC15 \uAC04\uC2DD',
  },
  Living: {
    name: '\uB9AC\uBE59',
    description: '\uC9D1\uACFC \uCC45\uC0C1, \uC77C\uC0C1\uC6A9\uD488',
  },
  Digital: {
    name: '\uB514\uC9C0\uD138',
    description: '\uC624\uB514\uC624, \uC561\uC138\uC11C\uB9AC, \uBAA8\uBC14\uC77C \uAE30\uAE30',
  },
  Fashion: {
    name: '\uD328\uC158',
    description: '\uAC00\uBC29, \uC758\uB958, \uC624\uD53C\uC2A4 \uC2A4\uD0C0\uC77C',
  },
  'Book & Stationery': {
    name: '\uB3C4\uC11C\u00B7\uBB38\uAD6C',
    description: '\uB3C4\uC11C, \uB178\uD2B8, \uD544\uAE30\uAD6C',
  },
  'Health & Sports': {
    name: '\uD5EC\uC2A4\u00B7\uC2A4\uD3EC\uCE20',
    description: '\uC6B4\uB3D9 \uBC0F \uC6F0\uB2C8\uC2A4 \uC0C1\uD488',
  },
};

export function mapUser(user: any) {
  return {
    id: user.id,
    employeeNo: user.employeeNo,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    status: toClientEnum(user.status),
    roles: (user.roles ?? []).map((role: any) => toClientEnum(role.role)),
  };
}

export function mapPointWallet(wallet: any) {
  return {
    availablePoint: wallet?.availablePoint ?? 0,
    reservedPoint: wallet?.reservedPoint ?? 0,
    expiringPoint: wallet?.expiringPoint ?? 0,
    expiringAt: wallet?.expiringAt ?? null,
  };
}

export function mapPointLedger(ledger: any) {
  return {
    ledgerId: ledger.id,
    type: toClientEnum(ledger.type),
    amount: ledger.amount,
    balanceAfter: ledger.balanceAfter,
    relatedOrderId: ledger.relatedOrderId ?? undefined,
    description: ledger.description,
    createdAt: ledger.createdAt,
  };
}

export function mapCategory(category: any) {
  const translated = CATEGORY_TRANSLATIONS[category.name];

  return {
    id: category.id,
    name: translated?.name ?? category.name,
    description: translated?.description ?? category.description ?? undefined,
    imageUrl: category.imageUrl ?? undefined,
  };
}

export function mapProduct(product: any) {
  const stockQuantity = Array.isArray(product.variants)
    ? product.variants.reduce((sum: number, variant: any) => sum + (variant.stock ?? 0), 0)
    : undefined;

  return {
    productId: product.id,
    name: product.name,
    thumbnailUrl: product.thumbnailUrl,
    pointPrice: product.pointPrice,
    cashPrice: product.cashPrice ?? 0,
    stockQuantity,
    status: toClientEnum(product.status),
    stockStatus: toClientEnum(product.stockStatus),
    badge: product.badge ?? undefined,
    categoryId: product.categoryId,
  };
}

export function mapProductDetail(product: any) {
  return {
    ...mapProduct(product),
    description: product.description ?? '',
    images: (product.images ?? []).map((image: any) => image.url),
    deliveryInfo: product.deliveryInfo ?? '',
    purchaseLimit: product.purchaseLimit ?? undefined,
    variants: (product.variants ?? []).map((variant: any) => ({
      variantId: variant.id,
      name: variant.name,
      pointPrice: variant.pointPrice,
      cashPrice: variant.cashPrice ?? 0,
      stock: variant.stock,
    })),
  };
}

export function mapCart(cart: any, availablePoint = 0) {
  const items = (cart.items ?? []).map((item: any) => ({
    cartItemId: item.id,
    productId: item.productId,
    productName: item.productNameSnapshot,
    thumbnailUrl: item.thumbnailUrlSnapshot,
    variantId: item.variantId ?? undefined,
    variantName: item.variantNameSnapshot ?? undefined,
    quantity: item.quantity,
    pointPrice: item.pointPriceSnapshot,
    cashPrice: 0,
  }));
  const totalPointAmount = items.reduce((sum: number, item: any) => sum + item.pointPrice * item.quantity, 0);
  const usablePointAmount = Math.min(availablePoint, totalPointAmount);
  const shortfallCashAmount = Math.max(0, totalPointAmount - usablePointAmount);

  return {
    cartId: cart.id,
    items,
    totalPointAmount,
    totalCashAmount: shortfallCashAmount,
    paymentSummary: {
      requiredPointAmount: totalPointAmount,
      availablePointAmount: availablePoint,
      shortfallCashAmount,
      itemPointAmount: totalPointAmount,
      itemCashAmount: shortfallCashAmount,
      shippingFeeCashAmount: 0,
      discountCashAmount: 0,
      finalPointAmount: usablePointAmount,
      finalCashAmount: shortfallCashAmount,
    },
  };
}

export function mapOrder(order: any) {
  const items = (order.items ?? []).map((item: any) => ({
    orderItemId: item.id,
    productId: item.productId ?? undefined,
    productName: item.productName,
    thumbnailUrl: item.thumbnailUrl,
    variantName: item.variantName ?? undefined,
    quantity: item.quantity,
    pointPrice: item.pointPrice,
    cashPrice: item.cashPrice ?? 0,
  }));
  const itemPointAmount = items.reduce((sum: number, item: any) => sum + item.pointPrice * item.quantity, 0);
  const shippingFeeCashAmount = order.shippingFeeCashAmount ?? 0;
  const discountCashAmount = order.discountCashAmount ?? 0;
  const finalCashAmount = Math.max(0, (order.additionalCashAmount ?? 0) + shippingFeeCashAmount - discountCashAmount);
  const requiredPointAmount = order.requiredPointAmount ?? order.usedPoint + finalCashAmount;

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    status: toClientEnum(order.status),
    items,
    usedPoint: order.usedPoint,
    additionalCashAmount: order.additionalCashAmount ?? finalCashAmount,
    paymentMethod: toClientEnum(order.paymentMethod ?? 'POINT_ONLY'),
    paymentStatus: toClientEnum(order.paymentStatus ?? 'PAID'),
    paymentSummary: {
      requiredPointAmount,
      availablePointAmount: undefined,
      shortfallCashAmount: order.additionalCashAmount ?? finalCashAmount,
      itemPointAmount: requiredPointAmount,
      itemCashAmount: order.additionalCashAmount ?? finalCashAmount,
      shippingFeeCashAmount,
      discountCashAmount,
      finalPointAmount: order.usedPoint,
      finalCashAmount,
    },
    shipment: order.shipmentCarrier
      ? {
          carrier: order.shipmentCarrier,
          trackingNo: order.trackingNo,
          shippedAt: order.shippedAt ?? undefined,
        }
      : undefined,
    statusHistories: (order.statuses ?? []).map((status: any) => ({
      status: toClientEnum(status.status),
      timestamp: status.timestamp,
      note: status.note ?? undefined,
    })),
    cancelAvailable: order.cancelAvailable,
    returnAvailable: order.returnAvailable,
    createdAt: order.createdAt,
  };
}

export function mapShippingAddress(address: any) {
  return {
    addressId: address.id,
    recipientName: address.recipientName,
    phone: address.phone,
    zipCode: address.zipCode,
    address1: address.address1,
    address2: address.address2,
    isDefault: address.isDefault,
  };
}
