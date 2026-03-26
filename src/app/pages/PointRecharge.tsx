import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { pointApi } from '../api';

const RECHARGE_OPTIONS = [10000, 30000, 50000, 100000, 300000, 500000];

export function PointRechargePage() {
  const navigate = useNavigate();

  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [processing, setProcessing] = useState(false);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleRecharge = async () => {
    if (!finalAmount || finalAmount < 10000) {
      toast.error('최소 충전 금액은 10,000P입니다.');
      return;
    }

    if (finalAmount > 1000000) {
      toast.error('최대 충전 금액은 1,000,000P입니다.');
      return;
    }

    setProcessing(true);
    try {
      const response = await pointApi.requestRecharge(finalAmount, paymentMethod);
      toast.success('포인트 충전이 완료되었습니다.');
      navigate(response.data.paymentRedirectUrl || '/points');
    } catch (error) {
      console.error('Failed to recharge points:', error);
      toast.error('포인트 충전에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => navigate('/points')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        포인트 관리
      </button>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-8">
        <div>
          <h1>포인트 충전</h1>
          <p className="mt-2 text-muted-foreground">부족한 포인트를 충전해서 바로 사용할 수 있어요.</p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">충전 금액</label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {RECHARGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(option);
                    setCustomAmount('');
                  }}
                  className={`rounded-[var(--radius)] border px-4 py-3 text-sm transition-colors ${
                    selectedAmount === option && !customAmount
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-[var(--border-highlight)]'
                  }`}
                >
                  {option.toLocaleString()}P
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">직접 입력</label>
            <div className="relative mt-3">
              <input
                type="number"
                min="10000"
                max="1000000"
                step="10000"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="10,000 ~ 1,000,000"
                className="w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">P</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">최소 10,000P부터 최대 1,000,000P까지 충전할 수 있습니다.</p>
          </div>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-medium text-foreground">결제 수단</label>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 transition-colors ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-[var(--border-highlight)]'
              }`}
            >
              <span className="flex items-center gap-3">
                <CreditCard className="size-5 text-muted-foreground" strokeWidth={1.5} />
                신용카드
              </span>
              {paymentMethod === 'card' ? <span className="text-sm font-medium text-primary">선택됨</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 transition-colors ${
                paymentMethod === 'transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-[var(--border-highlight)]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Landmark className="size-5 text-muted-foreground" strokeWidth={1.5} />
                계좌이체
              </span>
              {paymentMethod === 'transfer' ? <span className="text-sm font-medium text-primary">선택됨</span> : null}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[var(--radius)] bg-background p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">충전 금액</span>
            <span>{finalAmount.toLocaleString()}P</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">결제 수단</span>
            <span>{paymentMethod === 'card' ? '신용카드' : '계좌이체'}</span>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">총 결제 금액</span>
              <span className="text-xl font-semibold text-primary">{finalAmount.toLocaleString()}P</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleRecharge();
          }}
          disabled={processing}
          className="mt-8 w-full rounded-[var(--radius)] bg-primary px-6 py-4 text-lg font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? '충전 처리 중...' : '충전하기'}
        </button>
      </section>
    </div>
  );
}
