import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ClipboardList, ChevronRight } from 'lucide-react';
import type { Order } from '../types';
import { orderApi } from '../api';

const statusLabels: Record<Order['status'], string> = {
  created: '주문 생성',
  paid: '결제 완료',
  preparing: '배송 준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancel_requested: '취소 요청',
  cancelled: '취소 완료',
  return_requested: '반품 요청',
  returned: '반품 완료',
};

const statusColors: Record<Order['status'], string> = {
  created: 'bg-muted/30 text-foreground/70',
  paid: 'bg-info-soft text-info',
  preparing: 'bg-warning-soft text-warning',
  shipped: 'bg-warning-soft text-warning',
  delivered: 'bg-success-soft text-success',
  cancel_requested: 'bg-danger-soft text-danger',
  cancelled: 'bg-danger-soft text-danger',
  return_requested: 'bg-danger-soft text-danger',
  returned: 'bg-danger-soft text-danger',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await orderApi.getList({
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setOrders(res.data.items);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1>주문 내역</h1>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: '전체' },
          { value: 'paid', label: '결제 완료' },
          { value: 'shipped', label: '배송 중' },
          { value: 'delivered', label: '배송 완료' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-[var(--radius-button)] whitespace-nowrap transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground/70 hover:bg-muted/30'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-card rounded-[var(--radius-card)] p-12">
          <ClipboardList className="size-16 text-muted mb-4" strokeWidth={1.5} />
          <p className="text-muted-foreground mb-6">주문 내역이 없습니다.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              to={`/orders/${order.orderId}`}
              className="block bg-card rounded-[var(--radius-card)] p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">주문번호: {order.orderNo}</p>
                  <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-[var(--radius-button)] ${statusColors[order.status]}`} style={{ fontSize: 'var(--text-sm)' }}>
                    {statusLabels[order.status]}
                  </span>
                  <ChevronRight className="size-5 text-muted" strokeWidth={1.5} />
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex gap-4">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productName}
                      className="size-16 object-cover rounded-[var(--radius-sm)]"
                    />
                    <div className="flex-1">
                      <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground line-clamp-1">{item.productName}</p>
                      {item.variantName && (
                        <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">{item.variantName}</p>
                      )}
                      <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">
                        {item.pointPrice.toLocaleString()}P × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-muted-foreground">총 결제 금액</span>
                <span className="text-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {order.usedPoint.toLocaleString()}P
                </span>
              </div>

              {order.shipment && (
                <div className="mt-3 p-3 bg-background rounded-[var(--radius-sm)]" style={{ fontSize: 'var(--text-sm)' }}>
                  <p className="text-muted-foreground">
                    {order.shipment.carrier} · {order.shipment.trackingNo}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}