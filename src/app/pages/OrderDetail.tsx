import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BoxIcon, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, orderApi } from '../api';
import type { Order } from '../types';

const STATUS_LABELS: Record<Order['status'], string> = {
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

const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  point_only: '포인트만 사용',
  card: '카드 결제',
  kakao_pay: '카카오페이',
  naver_pay: '네이버페이',
  tosspay: '토스페이',
};

const PAYMENT_STATUS_LABELS: Record<Order['paymentStatus'], string> = {
  pending: '결제 대기',
  ready: '결제 준비',
  paid: '결제 완료',
  cancelled: '결제 취소',
  refunded: '환불 완료',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminView = location.pathname.startsWith('/admin/');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = isAdminView
          ? await adminApi.getOrderDetail(id)
          : await orderApi.getDetail(id);
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('주문 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id, isAdminView]);

  const handleCancelRequest = async () => {
    if (!order || !window.confirm('이 주문의 취소를 요청하시겠습니까?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await orderApi.requestCancel(order.orderId, '사용자 취소 요청');
      setOrder(response.data);
      toast.success('취소 요청이 접수되었습니다.');
    } catch (error) {
      console.error('Failed to request cancel:', error);
      toast.error('취소 요청에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!order || !window.confirm('이 주문의 반품을 요청하시겠습니까?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await orderApi.requestReturn(order.orderId, '사용자 반품 요청');
      setOrder(response.data);
      toast.success('반품 요청이 접수되었습니다.');
    } catch (error) {
      console.error('Failed to request return:', error);
      toast.error('반품 요청에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">주문 상세를 불러오고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card py-16 text-center">
        <p className="text-muted-foreground">주문 정보를 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate(isAdminView ? '/admin/orders' : '/orders')}
          className="mt-4 text-sm font-medium text-primary hover:text-[var(--primary-hover)]"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const payment = order.paymentSummary;
  const requiredPointAmount = payment.requiredPointAmount ?? payment.itemPointAmount;
  const shortfallCashAmount = payment.shortfallCashAmount ?? payment.finalCashAmount;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(isAdminView ? '/admin/orders' : '/orders')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        {isAdminView ? '전체 주문 목록' : '주문 목록'}
      </button>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1>{isAdminView ? '주문 관리 상세' : '주문 상세'}</h1>
            <p className="mt-1 text-muted-foreground">주문번호 {order.orderNo}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
          <div className="rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground">
            {STATUS_LABELS[order.status]}
          </div>
        </div>
      </section>

      {order.shipment ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Truck className="size-5 text-primary" strokeWidth={1.5} />
            <h2>배송 정보</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">택배사</span>
              <span>{order.shipment.carrier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">송장번호</span>
              <span className="font-mono">{order.shipment.trackingNo}</span>
            </div>
            {order.shipment.shippedAt ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">출고 시각</span>
                <span>{new Date(order.shipment.shippedAt).toLocaleString('ko-KR')}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BoxIcon className="size-5 text-primary" strokeWidth={1.5} />
          <h2>주문 상품</h2>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.orderItemId}
              className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <img
                src={item.thumbnailUrl}
                alt={item.productName}
                className="size-20 rounded-[var(--radius-sm)] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.productName}</p>
                {item.variantName ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.variantName}</p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.pointPrice.toLocaleString()}P x {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {(item.pointPrice * item.quantity).toLocaleString()}P
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">총 필요 포인트</span>
            <span className="font-semibold text-foreground">{requiredPointAmount.toLocaleString()}P</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">실제 사용 포인트</span>
            <span className="text-lg font-semibold text-primary">
              {payment.finalPointAmount.toLocaleString()}P
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">부족분 현금 결제</span>
            <span className="font-semibold text-foreground">
              {shortfallCashAmount.toLocaleString()}원
            </span>
          </div>
          {shortfallCashAmount > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">결제 수단</span>
                <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">결제 상태</span>
                <span>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {order.statusHistories.length ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
          <h2 className="mb-4">진행 이력</h2>
          <div className="space-y-4">
            {order.statusHistories.map((history, index) => (
              <div key={`${history.timestamp}-${index}`} className="flex items-start gap-4">
                <div className="mt-2 size-2 rounded-full bg-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {STATUS_LABELS[history.status as Order['status']] ?? history.status}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(history.timestamp).toLocaleString('ko-KR')}
                  </p>
                  {history.note ? (
                    <p className="mt-1 text-sm text-muted-foreground">{history.note}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!isAdminView ? (
        <div className="flex gap-3">
          {order.cancelAvailable ? (
            <button
              type="button"
              onClick={() => {
                void handleCancelRequest();
              }}
              disabled={processing}
              className="flex-1 rounded-[var(--radius)] border border-destructive px-6 py-3 text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              주문 취소 요청
            </button>
          ) : null}
          {order.returnAvailable ? (
            <button
              type="button"
              onClick={() => {
                void handleReturnRequest();
              }}
              disabled={processing}
              className="flex-1 rounded-[var(--radius)] border border-warning px-6 py-3 text-warning transition-colors hover:bg-[var(--warning-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              반품 요청
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
