import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Cart } from '../types';
import { cartApi, pointApi } from '../api';
import { toast } from 'sonner';

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [pointBalance, setPointBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cartRes, balanceRes] = await Promise.all([
          cartApi.get(),
          pointApi.getBalance(),
        ]);
        setCart(cartRes.data);
        setPointBalance(balanceRes.data.availablePoint);
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    setUpdating(true);
    try {
      const res = await cartApi.updateQuantity(cartItemId, quantity);
      setCart(res.data);
      toast.success('수량이 변경되었습니다.');
    } catch (error) {
      toast.error('수량 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdating(true);
    try {
      const res = await cartApi.removeItem(cartItemId);
      setCart(res.data);
      toast.success('상품이 삭제되었습니다.');
    } catch (error) {
      toast.error('상품 삭제에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('장바구니가 비어있습니다.');
      return;
    }

    if (cart.totalPointAmount > pointBalance) {
      toast.error('보유 포인트가 부족합니다.');
      return;
    }

    navigate('/checkout');
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">장바구니</h1>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-card rounded-[var(--radius-card)] p-12">
          <ShoppingBag className="size-16 text-muted mb-4" strokeWidth={1.5} />
          <p className="text-muted-foreground mb-6">장바구니가 비어있습니다.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
          >
            상품 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  const isInsufficientPoints = cart.totalPointAmount > pointBalance;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1>장바구니</h1>

      {/* 장바구니 아이템 */}
      <div className="bg-card rounded-[var(--radius-card)] divide-y divide-border">
        {cart.items.map((item) => (
          <div key={item.cartItemId} className="p-6">
            <div className="flex gap-4">
              <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                <img
                  src={item.thumbnailUrl}
                  alt={item.productName}
                  className="size-24 object-cover rounded-[var(--radius-sm)]"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.productId}`}
                  className="text-foreground hover:text-primary line-clamp-2"
                  style={{ fontWeight: 'var(--font-weight-medium)' }}
                >
                  {item.productName}
                </Link>
                {item.variantName && (
                  <p style={{ fontSize: 'var(--text-sm)' }} className="mt-1 text-muted-foreground">{item.variantName}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                    disabled={updating || item.quantity === 1}
                    className="px-3 py-1 border border-border rounded-[var(--radius-sm)] hover:bg-muted/20 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                    disabled={updating}
                    className="px-3 py-1 border border-border rounded-[var(--radius-sm)] hover:bg-muted/20 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => handleRemoveItem(item.cartItemId)}
                  disabled={updating}
                  className="p-2 text-muted hover:text-destructive disabled:opacity-50"
                >
                  <X className="size-5" strokeWidth={1.5} />
                </button>
                <div className="text-right">
                  <p className="text-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {(item.pointPrice * item.quantity).toLocaleString()}P
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">
                    {item.pointPrice.toLocaleString()}P × {item.quantity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 주문 요약 */}
      <div className="bg-card rounded-[var(--radius-card)] p-6 space-y-4">
        <h2>주문 요약</h2>

        <div className="space-y-2" style={{ fontSize: 'var(--text-sm)' }}>
          <div className="flex justify-between">
            <span className="text-muted-foreground">상품 금액</span>
            <span>{cart.totalPointAmount.toLocaleString()}P</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">배송비</span>
            <span className="text-success">무료</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>총 결제 금액</span>
            <span className="text-primary" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              {cart.totalPointAmount.toLocaleString()}P
            </span>
          </div>
          <div className="flex justify-between items-center" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="text-muted-foreground">보유 포인트</span>
            <span className={isInsufficientPoints ? 'text-destructive' : 'text-foreground'}>
              {pointBalance.toLocaleString()}P
            </span>
          </div>
          {isInsufficientPoints && (
            <div className="mt-2 p-3 bg-destructive/5 rounded-[var(--radius-sm)] text-destructive" style={{ fontSize: 'var(--text-sm)' }}>
              포인트가 부족합니다. 
              <Link to="/points/recharge" className="ml-1 underline hover:text-destructive/80">
                포인트 충전하기
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={handleCheckout}
          disabled={isInsufficientPoints || updating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>주문하기</span>
          <ArrowRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}