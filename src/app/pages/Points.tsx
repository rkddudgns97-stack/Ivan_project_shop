import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CircleMinus, CirclePlus, Coins, RotateCw } from 'lucide-react';
import { pointApi } from '../api';
import type { PointBalance, PointLedger } from '../types';

const LEDGER_LABELS: Record<PointLedger['type'], string> = {
  grant: '지급',
  recharge: '충전',
  reserved: '예약',
  use: '사용',
  refund: '환불',
  adjust_add: '관리자 추가',
  adjust_sub: '관리자 차감',
  expire: '만료',
};

function isPositiveLedger(type: PointLedger['type']) {
  return ['grant', 'recharge', 'refund', 'adjust_add'].includes(type);
}

export function PointsPage() {
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [ledgers, setLedgers] = useState<PointLedger[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">포인트 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1>포인트 관리</h1>
        <p className="mt-1 text-muted-foreground">보유 포인트와 사용 내역을 확인하세요.</p>
      </div>

      <section className="rounded-[var(--radius-card)] bg-primary p-8 text-primary-foreground shadow-[var(--elevation-sm)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-primary-foreground/80">사용 가능한 포인트</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {balance?.availablePoint.toLocaleString()}P
            </p>
          </div>
          <Coins className="size-14 opacity-80" strokeWidth={1.5} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius)] bg-white/12 p-4">
            <p className="text-sm text-primary-foreground/75">예약 포인트</p>
            <p className="mt-2 text-xl font-semibold">{balance?.reservedPoint.toLocaleString()}P</p>
          </div>
          <div className="rounded-[var(--radius)] bg-white/12 p-4">
            <p className="text-sm text-primary-foreground/75">만료 예정 포인트</p>
            <p className="mt-2 text-xl font-semibold">{balance?.expiringPoint.toLocaleString()}P</p>
            {balance?.expiringAt ? (
              <p className="mt-1 text-xs text-primary-foreground/75">
                {new Date(balance.expiringAt).toLocaleDateString('ko-KR')} 만료 예정
              </p>
            ) : null}
          </div>
        </div>

        <Link
          to="/points/recharge"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-white px-5 text-sm font-medium text-primary transition-colors hover:bg-white/90"
        >
          포인트 충전하기
        </Link>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2>포인트 이력</h2>
            <p className="mt-1 text-sm text-muted-foreground">최신 순으로 최대 20건까지 표시됩니다.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadData();
            }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCw className="size-4" strokeWidth={1.5} />
            새로고침
          </button>
        </div>

        {ledgers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">포인트 이력이 없습니다.</div>
        ) : (
          <div className="mt-6 space-y-1">
            {ledgers.map((ledger) => {
              const positive = isPositiveLedger(ledger.type);
              const Icon = positive ? CirclePlus : CircleMinus;

              return (
                <div
                  key={ledger.ledgerId}
                  className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        positive ? 'bg-[var(--success-soft)] text-success' : 'bg-[var(--danger-soft)] text-danger'
                      }`}
                    >
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{LEDGER_LABELS[ledger.type]}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ledger.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(ledger.createdAt).toLocaleString('ko-KR')}
                      </p>
                      {ledger.relatedOrderId ? (
                        <Link
                          to={`/orders/${ledger.relatedOrderId}`}
                          className="mt-1 inline-block text-xs font-medium text-primary hover:text-[var(--primary-hover)]"
                        >
                          관련 주문 보기
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={positive ? 'text-success' : 'text-danger'}>
                      <span className="text-lg font-semibold">
                        {positive ? '+' : ''}
                        {ledger.amount.toLocaleString()}P
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      잔액 {ledger.balanceAfter.toLocaleString()}P
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
