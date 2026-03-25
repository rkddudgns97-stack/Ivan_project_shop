import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Truck, BoxIcon } from 'lucide-react';
import type { Order } from '../types';
import { orderApi } from '../api';
import { toast } from 'sonner';

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

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const res = await orderApi.getDetail(id);
        setOrder(res.data);
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('주문 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleCancelRequest = async () => {
    if (!order || !confirm('주문을 취소하시겠습니까?')) return;

    setProcessing(true);
    try {
      const res = await orderApi.requestCancel(order.orderId, '단순 변심');
      setOrder(res.data);
      toast.success('취소 요청이 접수되었습니다.');
    } catch (error) {
      toast.error('취소 요청에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!order || !confirm('반품을 요청하시겠습니까?')) return;

    setProcessing(true);
    try {
      const res = await orderApi.requestReturn(order.orderId, '상품 하자');
      setOrder(res.data);
      toast.success('반품 요청이 접수되었습니다.');
    } catch (error) {
      toast.error('반품 요청에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

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

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground">주문을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 text-primary hover:text-primary/80"
        >
          주문 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 뒤로 가기 */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        <span>주문 목록</span>
      </button>

      {/* 주문 정보 */}
      <div className="bg-card rounded-[var(--radius-card)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1>주문 상세</h1>
            <p className="mt-1 text-muted-foreground">주문번호: {order.orderNo}</p>
            <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">{new Date(order.createdAt).toLocaleString('ko-KR')}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mb-1">주문 상태</p>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>{statusLabels[order.status]}</p>
          </div>
        </div>
      </div>

      {/* 배송 정보 */}
      {order.shipment && (
        <div className="bg-card rounded-[var(--radius-card)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="size-6 text-primary" strokeWidth={1.5} />
            <h2>배송 정보</h2>
          </div>
          <div className="space-y-2" style={{ fontSize: 'var(--text-sm)' }}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">택배사</span>
              <span>{order.shipment.carrier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">운송장 번호</span>
              <span className="font-mono">{order.shipment.trackingNo}</span>
            </div>
            {order.shipment.shippedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">발송 일시</span>
                <span>{new Date(order.shipment.shippedAt).toLocaleString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 주문 상품 */}
      <div className="bg-card rounded-[var(--radius-card)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <BoxIcon className="size-6 text-primary" strokeWidth={1.5} />
          <h2>주문 상품</h2>
        </div>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.orderItemId} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <img
                src={item.thumbnailUrl}
                alt={item.productName}
                className="size-20 object-cover rounded-[var(--radius-sm)]"
              />
              <div className="flex-1">
                <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">{item.productName}</p>
                {item.variantName && (
                  <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-1">{item.variantName}</p>
                )}
                <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-2">
                  {item.pointPrice.toLocaleString()}P × {item.quantity}개
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontWeight: 'var(--font-weight-semibold)' }} className="text-primary">
                  {(item.pointPrice * item.quantity).toLocaleString()}P
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>총 결제 금액</span>
            <span className="text-primary" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              {order.usedPoint.toLocaleString()}P
            </span>
          </div>
        </div>
      </div>

      {/* 주문 상태 이력 */}
      {order.statusHistories && order.statusHistories.length > 0 && (
        <div className="bg-card rounded-[var(--radius-card)] p-6">
          <h2 className="mb-4">주문 진행 상태</h2>
          <div className="space-y-3">
            {order.statusHistories.map((history, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="flex-shrink-0 size-2 mt-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <p style={{ fontWeight: 'var(--font-weight-medium)' }}>{statusLabels[history.status as Order['status']]}</p>
                  <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">
                    {new Date(history.timestamp).toLocaleString('ko-KR')}
                  </p>
                  {history.note && (
                    <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-1">{history.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        {order.cancelAvailable && (
          <button
            onClick={handleCancelRequest}
            disabled={processing}
            className="flex-1 px-6 py-3 border border-destructive text-destructive rounded-[var(--radius)] hover:bg-destructive/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            주문 취소
          </button>
        )}
        {order.returnAvailable && (
          <button
            onClick={handleReturnRequest}
            disabled={processing}
            className="flex-1 px-6 py-3 border border-warning text-warning rounded-[var(--radius)] hover:bg-warning-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            반품 요청
          </button>
        )}
      </div>
    </div>
  );
}