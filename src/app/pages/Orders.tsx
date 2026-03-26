import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { adminApi, orderApi } from '../api';
import type { Order } from '../types';

const TEXT = {
  adminTitle: '\uC804\uCCB4 \uC8FC\uBB38 \uAD00\uB9AC',
  userTitle: '\uC8FC\uBB38 \uB0B4\uC5ED',
  adminDescription: '\uBCF5\uC9C0\uBAB0 \uC804\uCCB4 \uC8FC\uBB38 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694.',
  userDescription: '\uB0B4 \uC8FC\uBB38\uACFC \uBC30\uC1A1 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694.',
  loading: '\uC8FC\uBB38 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
  all: '\uC804\uCCB4',
  paid: '\uACB0\uC81C \uC644\uB8CC',
  shipped: '\uBC30\uC1A1 \uC911',
  delivered: '\uBC30\uC1A1 \uC644\uB8CC',
  cancelRequested: '\uCDE8\uC18C \uC694\uCCAD',
  emptyAdmin: '\uC870\uD68C\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  emptyUser: '\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  goProducts: '\uC0C1\uD488 \uBCF4\uB7EC \uAC00\uAE30',
  orderNo: '\uC8FC\uBB38\uBC88\uD638',
  totalPoint: '\uCD1D \uACB0\uC81C \uD3EC\uC778\uD2B8',
  created: '\uC8FC\uBB38 \uC0DD\uC131',
  preparing: '\uBC30\uC1A1 \uC900\uBE44 \uC911',
  cancelled: '\uCDE8\uC18C \uC644\uB8CC',
  returnRequested: '\uBC18\uD488 \uC694\uCCAD',
  returned: '\uBC18\uD488 \uC644\uB8CC',
} as const;

const STATUS_LABELS: Record<Order['status'], string> = {
  created: TEXT.created,
  paid: TEXT.paid,
  preparing: TEXT.preparing,
  shipped: TEXT.shipped,
  delivered: TEXT.delivered,
  cancel_requested: TEXT.cancelRequested,
  cancelled: TEXT.cancelled,
  return_requested: TEXT.returnRequested,
  returned: TEXT.returned,
};

const STATUS_COLORS: Record<Order['status'], string> = {
  created: 'bg-muted/30 text-foreground/70',
  paid: 'bg-[var(--info-soft)] text-info',
  preparing: 'bg-[var(--warning-soft)] text-warning',
  shipped: 'bg-[var(--warning-soft)] text-warning',
  delivered: 'bg-[var(--success-soft)] text-success',
  cancel_requested: 'bg-[var(--danger-soft)] text-danger',
  cancelled: 'bg-[var(--danger-soft)] text-danger',
  return_requested: 'bg-[var(--danger-soft)] text-danger',
  returned: 'bg-[var(--danger-soft)] text-danger',
};

const FILTER_OPTIONS = [
  { value: 'all', label: TEXT.all },
  { value: 'paid', label: TEXT.paid },
  { value: 'shipped', label: TEXT.shipped },
  { value: 'delivered', label: TEXT.delivered },
  { value: 'cancel_requested', label: TEXT.cancelRequested },
];

export function OrdersPage() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin/');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const response = isAdminView
          ? await adminApi.getOrders({
              status: statusFilter === 'all' ? undefined : statusFilter,
            })
          : await orderApi.getList({
              status: statusFilter === 'all' ? undefined : statusFilter,
            });

        setOrders(response.data.items);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [isAdminView, statusFilter]);

  const detailBasePath = isAdminView ? '/admin/orders' : '/orders';

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">{TEXT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1>{isAdminView ? TEXT.adminTitle : TEXT.userTitle}</h1>
        <p className="mt-1 text-muted-foreground">{isAdminView ? TEXT.adminDescription : TEXT.userDescription}</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`shrink-0 whitespace-nowrap rounded-[var(--radius-button)] px-4 py-2 text-sm transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground/75 hover:bg-muted/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card text-center">
          <ClipboardList className="mb-4 size-16 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-muted-foreground">{isAdminView ? TEXT.emptyAdmin : TEXT.emptyUser}</p>
          {!isAdminView ? (
            <Link
              to="/products"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
            >
              {TEXT.goProducts}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              to={`${detailBasePath}/${order.orderId}`}
              className="block rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-[var(--elevation-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--elevation-hover)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {TEXT.orderNo} {order.orderNo}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex gap-4">
                    <img src={item.thumbnailUrl} alt={item.productName} className="size-16 rounded-[var(--radius-sm)] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium text-foreground">{item.productName}</p>
                      {item.variantName ? <p className="mt-1 text-sm text-muted-foreground">{item.variantName}</p> : null}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.pointPrice.toLocaleString()}P x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{TEXT.totalPoint}</span>
                  <span className="text-lg font-semibold text-primary">{order.usedPoint.toLocaleString()}P</span>
                </div>
                {order.shipment ? (
                  <p className="mt-3 rounded-[var(--radius-sm)] bg-background px-3 py-2 text-sm text-muted-foreground">
                    {order.shipment.carrier} / {order.shipment.trackingNo}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
