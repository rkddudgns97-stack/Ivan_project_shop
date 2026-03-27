import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, MapPin, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, orderApi, shippingAddressApi } from '../api';
import type { Cart, ShippingAddress } from '../types';

type AddressForm = {
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
};

const EMPTY_ADDRESS_FORM: AddressForm = {
  recipientName: '',
  phone: '',
  zipCode: '',
  address1: '',
  address2: '',
};

export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.addressId === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cartResponse, addressResponse] = await Promise.all([
          cartApi.get(),
          shippingAddressApi.getList(),
        ]);

        setCart(cartResponse.data);
        setAddresses(addressResponse.data);

        const defaultAddress =
          addressResponse.data.find((address) => address.isDefault) ?? addressResponse.data[0];
        setSelectedAddressId(defaultAddress?.addressId ?? '');
      } catch (error) {
        console.error('Failed to load cart page data:', error);
        toast.error('장바구니 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    setUpdating(true);
    try {
      const response = await cartApi.updateQuantity(cartItemId, quantity);
      setCart(response.data);
      toast.success('수량을 변경했습니다.');
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('수량 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdating(true);
    try {
      const response = await cartApi.removeItem(cartItemId);
      setCart(response.data);
      toast.success('상품을 장바구니에서 삭제했습니다.');
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      toast.error('상품 삭제에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateAddress = async () => {
    const requiredValues = Object.values(addressForm).slice(0, 4);
    if (requiredValues.some((value) => !value.trim())) {
      toast.error('받는 분, 연락처, 우편번호, 기본 주소를 입력해 주세요.');
      return;
    }

    setCreatingAddress(true);
    try {
      const response = await shippingAddressApi.create({
        ...addressForm,
        isDefault: true,
      });

      setAddresses((previous) => [
        { ...response.data, isDefault: true },
        ...previous.map((item) => ({ ...item, isDefault: false })),
      ]);
      setSelectedAddressId(response.data.addressId);
      setAddressForm(EMPTY_ADDRESS_FORM);
      toast.success('배송지를 등록했습니다.');
    } catch (error) {
      console.error('Failed to create address:', error);
      toast.error('배송지 등록에 실패했습니다.');
    } finally {
      setCreatingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('장바구니가 비어 있습니다.');
      return;
    }

    if (!selectedAddressId) {
      toast.error('배송지를 먼저 선택해 주세요.');
      return;
    }

    setCheckingOut(true);
    try {
      const response = await orderApi.checkout({
        cartItemIds: cart.items.map((item) => item.cartItemId),
        shippingAddressId: selectedAddressId,
        agreePolicy: true,
        paymentMethod: cart.paymentSummary.shortfallCashAmount ? 'card' : 'point_only',
        cashAmount: cart.paymentSummary.shortfallCashAmount ?? 0,
      });

      toast.success('주문이 완료되었습니다.');
      navigate(`/orders/${response.data.orderId}`);
    } catch (error) {
      console.error('Failed to checkout:', error);
      toast.error('주문 처리에 실패했습니다.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">장바구니를 불러오고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <h1>장바구니</h1>
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card text-center">
          <ShoppingBag className="mb-4 size-16 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-muted-foreground">장바구니에 담긴 상품이 없습니다.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
          >
            상품 보러 가기
          </Link>
        </div>
      </div>
    );
  }

  const payment = cart.paymentSummary;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1>장바구니</h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
            <div className="divide-y divide-border">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="p-6">
                  <div className="flex gap-4">
                    <Link to={`/products/${item.productId}`} className="shrink-0">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="size-24 rounded-[var(--radius-sm)] object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${item.productId}`}
                        className="line-clamp-2 font-medium text-foreground hover:text-primary"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.variantName}</p>
                      ) : null}

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            void handleUpdateQuantity(item.cartItemId, item.quantity - 1);
                          }}
                          disabled={updating || item.quantity === 1}
                          className="rounded-[var(--radius-sm)] border border-border px-3 py-1 hover:bg-muted/20 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            void handleUpdateQuantity(item.cartItemId, item.quantity + 1);
                          }}
                          disabled={updating}
                          className="rounded-[var(--radius-sm)] border border-border px-3 py-1 hover:bg-muted/20 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          void handleRemoveItem(item.cartItemId);
                        }}
                        disabled={updating}
                        className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <X className="size-5" strokeWidth={1.5} />
                      </button>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {(item.pointPrice * item.quantity).toLocaleString()}P
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.pointPrice.toLocaleString()}P x {item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" strokeWidth={1.5} />
              <h2>배송지 선택</h2>
            </div>

            {addresses.length ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.addressId}
                    className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-4 transition-colors ${
                      selectedAddressId === address.addressId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-[var(--border-highlight)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping-address"
                      checked={selectedAddressId === address.addressId}
                      onChange={() => setSelectedAddressId(address.addressId)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{address.recipientName}</p>
                        {address.isDefault ? (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            기본 배송지
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ({address.zipCode}) {address.address1} {address.address2}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                등록된 배송지가 없습니다. 아래에서 새 배송지를 입력해 주세요.
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-[var(--radius)] border border-border bg-background p-4">
              <p className="font-medium text-foreground">새 배송지 등록</p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={addressForm.recipientName}
                  onChange={(event) =>
                    setAddressForm((previous) => ({ ...previous, recipientName: event.target.value }))
                  }
                  placeholder="받는 분"
                  className="h-11 rounded-[var(--radius)] border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={addressForm.phone}
                  onChange={(event) =>
                    setAddressForm((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  placeholder="연락처"
                  className="h-11 rounded-[var(--radius)] border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={addressForm.zipCode}
                  onChange={(event) =>
                    setAddressForm((previous) => ({ ...previous, zipCode: event.target.value }))
                  }
                  placeholder="우편번호"
                  className="h-11 rounded-[var(--radius)] border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={addressForm.address1}
                  onChange={(event) =>
                    setAddressForm((previous) => ({ ...previous, address1: event.target.value }))
                  }
                  placeholder="기본 주소"
                  className="h-11 rounded-[var(--radius)] border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={addressForm.address2}
                  onChange={(event) =>
                    setAddressForm((previous) => ({ ...previous, address2: event.target.value }))
                  }
                  placeholder="상세 주소"
                  className="h-11 rounded-[var(--radius)] border border-border bg-card px-4 outline-none focus:ring-2 focus:ring-ring md:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleCreateAddress();
                }}
                disabled={creatingAddress}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
              >
                {creatingAddress ? '등록 중...' : '배송지 등록'}
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-5 rounded-[var(--radius-card)] border border-border bg-card p-6 xl:sticky xl:top-24 xl:self-start">
          <div>
            <h2>결제 요약</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              포인트를 우선 사용하고, 부족한 금액만 현금으로 결제합니다.
            </p>
          </div>

          <div className="space-y-3 rounded-[var(--radius)] bg-background p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">총 필요 포인트</span>
              <span className="font-semibold text-foreground">
                {(payment.requiredPointAmount ?? cart.totalPointAmount).toLocaleString()}P
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">내 보유 포인트</span>
              <span className="font-semibold text-foreground">
                {(payment.availablePointAmount ?? 0).toLocaleString()}P
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">포인트 사용 예정</span>
              <span className="font-semibold text-primary">
                {payment.finalPointAmount.toLocaleString()}P
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">부족분 현금 결제</span>
              <span className="font-semibold text-foreground">
                {(payment.shortfallCashAmount ?? payment.finalCashAmount).toLocaleString()}원
              </span>
            </div>
          </div>

          {selectedAddress ? (
            <div className="rounded-[var(--radius)] border border-border bg-background p-4 text-sm">
              <p className="font-medium text-foreground">선택한 배송지</p>
              <p className="mt-2 text-foreground">{selectedAddress.recipientName}</p>
              <p className="mt-1 text-muted-foreground">{selectedAddress.phone}</p>
              <p className="mt-1 text-muted-foreground">
                ({selectedAddress.zipCode}) {selectedAddress.address1} {selectedAddress.address2}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleCheckout();
            }}
            disabled={checkingOut || !selectedAddressId}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkingOut ? '주문 처리 중...' : '주문하기'}
            <ArrowRight className="size-4" strokeWidth={1.6} />
          </button>
        </aside>
      </div>
    </div>
  );
}
