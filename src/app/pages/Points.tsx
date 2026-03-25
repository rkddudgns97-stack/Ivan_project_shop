import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Coins, ArrowUpCircle, ArrowDownCircle, CirclePlus, CircleMinus, RotateCw } from 'lucide-react';
import type { PointBalance, PointLedger } from '../types';
import { pointApi } from '../api';

const ledgerTypeLabels: Record<PointLedger['type'], string> = {
  grant: '지급',
  recharge: '충전',
  reserved: '예약',
  use: '사용',
  refund: '환불',
  adjust_add: '관리자 추가',
  adjust_sub: '관리자 차감',
  expire: '만료',
};

const ledgerTypeIcons: Record<PointLedger['type'], React.ReactNode> = {
  grant: <CirclePlus className="size-4" strokeWidth={1.5} />,
  recharge: <CirclePlus className="size-4" strokeWidth={1.5} />,
  reserved: <CircleMinus className="size-4" strokeWidth={1.5} />,
  use: <CircleMinus className="size-4" strokeWidth={1.5} />,
  refund: <CirclePlus className="size-4" strokeWidth={1.5} />,
  adjust_add: <CirclePlus className="size-4" strokeWidth={1.5} />,
  adjust_sub: <CircleMinus className="size-4" strokeWidth={1.5} />,
  expire: <CircleMinus className="size-4" strokeWidth={1.5} />,
};

export function PointsPage() {
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [ledgers, setLedgers] = useState<PointLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [balanceRes, ledgersRes] = await Promise.all([
          pointApi.getBalance(),
          pointApi.getLedgers(),
        ]);
        setBalance(balanceRes.data);
        setLedgers(ledgersRes.data.items);
      } catch (error) {
        console.error('Failed to load point data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <h1>포인트 관리</h1>

      {/* 포인트 잔액 카드 */}
      <div className="bg-primary rounded-[var(--radius-card)] p-8 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <p style={{ fontSize: 'var(--text-sm)' }} className="opacity-90">사용 가능한 포인트</p>
            <p style={{ fontSize: '2.25rem', fontWeight: 'var(--font-weight-semibold)' }}>
              {balance?.availablePoint.toLocaleString()}P
            </p>
          </div>
          <Coins className="size-16 opacity-80" strokeWidth={1.5} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-foreground/10 rounded-[var(--radius)] p-4">
            <p style={{ fontSize: 'var(--text-sm)' }} className="opacity-75 mb-1">예약된 포인트</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>{balance?.reservedPoint.toLocaleString()}P</p>
          </div>
          {balance?.expiringPoint && balance.expiringPoint > 0 && (
            <div className="bg-primary-foreground/10 rounded-[var(--radius)] p-4">
              <p style={{ fontSize: 'var(--text-sm)' }} className="opacity-75 mb-1">만료 예정</p>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>{balance.expiringPoint.toLocaleString()}P</p>
              <p style={{ fontSize: 'var(--text-xs)' }} className="opacity-75 mt-1">
                {new Date(balance.expiringAt!).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <Link
          to="/points/recharge"
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-foreground text-primary rounded-[var(--radius)] hover:opacity-90 transition-colors"
        >
          <CirclePlus className="size-5" strokeWidth={1.5} />
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>포인트 충전</span>
        </Link>
      </div>

      {/* 포인트 사용 내역 */}
      <div className="bg-card rounded-[var(--radius-card)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2>포인트 내역</h2>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground" style={{ fontSize: 'var(--text-sm)' }}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            <span>새로고침</span>
          </button>
        </div>

        {ledgers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">포인트 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {ledgers.map((ledger) => {
              const isPositive = ['grant', 'recharge', 'refund', 'adjust_add'].includes(ledger.type);
              
              return (
                <div
                  key={ledger.ledgerId}
                  className="flex items-center justify-between py-4 border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 size-10 rounded-full flex items-center justify-center ${
                      isPositive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                    }`}>
                      {ledgerTypeIcons[ledger.type]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">
                        {ledgerTypeLabels[ledger.type]}
                      </p>
                      <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-1">
                        {ledger.description}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)' }} className="text-muted mt-1">
                        {new Date(ledger.createdAt).toLocaleString('ko-KR')}
                      </p>
                      {ledger.relatedOrderId && (
                        <Link
                          to={`/orders/${ledger.relatedOrderId}`}
                          className="text-primary hover:text-primary/80 mt-1 inline-block"
                          style={{ fontSize: 'var(--text-xs)' }}
                        >
                          주문 보기 →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={isPositive ? 'text-success' : 'text-danger'} style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {isPositive ? '+' : ''}{ledger.amount.toLocaleString()}P
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground mt-1">
                      잔액 {ledger.balanceAfter.toLocaleString()}P
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}