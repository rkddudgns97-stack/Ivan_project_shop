import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CreditCard, Landmark } from 'lucide-react';
import { pointApi } from '../api';
import { toast } from 'sonner';

const RECHARGE_OPTIONS = [10000, 30000, 50000, 100000, 300000, 500000];

export function PointRechargePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const handleRecharge = async () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;

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
      const res = await pointApi.requestRecharge(finalAmount, paymentMethod);
      toast.success('충전이 완료되었습니다.');
      navigate('/points');
    } catch (error) {
      toast.error('충전에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 뒤로 가기 */}
      <button
        onClick={() => navigate('/points')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        <span>포인트 관리</span>
      </button>

      <div className="bg-card rounded-[var(--radius-card)] p-8 space-y-6">
        <div>
          <h1>포인트 충전</h1>
          <p className="mt-2 text-muted-foreground">부족한 포인트를 충전하세요.</p>
        </div>

        {/* 충전 금액 선택 */}
        <div className="space-y-3">
          <label className="block text-foreground" style={{ fontWeight: 'var(--font-weight-medium)' }}>충전 금액</label>
          <div className="grid grid-cols-3 gap-3">
            {RECHARGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setAmount(option);
                  setCustomAmount('');
                }}
                className={`px-4 py-3 border rounded-[var(--radius)] transition-colors ${
                  amount === option && !customAmount
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                {option.toLocaleString()}P
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="space-y-2">
            <label className="block text-foreground/70">직접 입력</label>
            <div className="relative">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="10,000 ~ 1,000,000"
                min="10000"
                max="1000000"
                step="10000"
                className="w-full px-4 py-3 pr-12 border border-border rounded-[var(--radius)] bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">P</span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)' }} className="text-muted-foreground">최소 10,000P ~ 최대 1,000,000P</p>
          </div>
        </div>

        {/* 결제 수단 */}
        <div className="space-y-3">
          <label className="block text-foreground" style={{ fontWeight: 'var(--font-weight-medium)' }}>결제 수단</label>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center justify-between px-4 py-3 border rounded-[var(--radius)] transition-colors ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-muted-foreground" strokeWidth={1.5} />
                <span>신용카드</span>
              </div>
              {paymentMethod === 'card' && (
                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="size-3 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>

            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`w-full flex items-center justify-between px-4 py-3 border rounded-[var(--radius)] transition-colors ${
                paymentMethod === 'transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Landmark className="size-5 text-muted-foreground" strokeWidth={1.5} />
                <span>계좌이체</span>
              </div>
              {paymentMethod === 'transfer' && (
                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="size-3 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 충전 금액 요약 */}
        <div className="bg-background rounded-[var(--radius)] p-6 space-y-3">
          <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="text-muted-foreground">충전 금액</span>
            <span>{(customAmount ? parseInt(customAmount, 10) : amount).toLocaleString()}P</span>
          </div>
          <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="text-muted-foreground">결제 수단</span>
            <span>{paymentMethod === 'card' ? '신용카드' : '계좌이체'}</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>총 결제 금액</span>
            <span className="text-primary" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              {(customAmount ? parseInt(customAmount, 10) : amount).toLocaleString()}P
            </span>
          </div>
        </div>

        {/* 충전 버튼 */}
        <button
          onClick={handleRecharge}
          disabled={processing}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}
        >
          {processing ? '처리 중...' : '충전하기'}
        </button>

        {/* 안내사항 */}
        <div className="p-4 bg-warning-soft rounded-[var(--radius)]">
          <p style={{ fontSize: 'var(--text-sm)' }} className="text-foreground/70">
            <strong>안내사항</strong>
          </p>
          <ul className="mt-2 text-muted-foreground space-y-1 list-disc list-inside" style={{ fontSize: 'var(--text-sm)' }}>
            <li>충전된 포인트는 복지 포인트와 동일하게 사용할 수 있습니다.</li>
            <li>결제는 안전한 PG사를 통해 처리됩니다.</li>
            <li>충전 후 취소는 고객센터를 통해 가능합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}