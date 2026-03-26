import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, MapPin, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, orderApi, pointApi, shippingAddressApi } from '../api';
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
  const [pointBalance, setPointBalance] = useState(0);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const hasAddresses = addresses.length > 0;
  const isInsufficientPoints = (cart?.paymentSummary.finalPointAmount ?? 0) > pointBalance;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cartRes, balanceRes, addressRes] = await Promise.all([
          cartApi.get(),
          pointApi.getBalance(),
          shippingAddressApi.getList(),
        ]);

        setCart(cartRes.data);
        setPointBalance(balanceRes.data.availablePoint);
        setAddresses(addressRes.data);

        const defaultAddress =
          addressRes.data.find((address) => address.isDefault) ?? addressRes.data[0];
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

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.addressId === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

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
      toast.error('받는 분, 연락처, 우편번호, 주소를 입력해 주세요.');
      return;
    }

    setCreatingAddress(true);
    try {
      const response = await shippingAddressApi.create({
        ...addressForm,
        isDefault: true,
      });

      setAddresses((prev) => [
        { ...response.data, isDefault: true },
        ...prev.map((item) => ({ ...item, isDefault: false })),
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

    if (isInsufficientPoints) {
      toast.error('보유 포인트가 부족합니다.');
      return;
    }

    setCheckingOut(true);
    try {
      const response = await orderApi.checkout({
        cartItemIds: cart.items.map((item) => item.cartItemId),
        shippingAddressId: selectedAddressId,
        agreePolicy: true,
        paymentMethod: cart.paymentSummary.finalCashAmount > 0 ? 'card' : 'point_only',
        cashAmount: cart.paymentSummary.finalCashAmount,
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1>장바구니</h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
            <div className="divide-y divide-border">
              {cart.items.map((item) => {
                const itemPointTotal = item.pointPrice * item.quantity;
                const itemCashTotal = item.cashPrice * item.quantity;

                return (
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
                            {itemPointTotal.toLocaleString()}P
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.pointPrice.toLocaleString()}P x {item.quantity}
                          </p>
                          {itemCashTotal > 0 ? (
                            <p className="mt-1 text-sm font-medium text-foreground">
                              + {itemCashTotal.toLocaleString()}원
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" strokeWidth={1.5} />
              <h2>배송지 선택</h2>
            </div>

            {hasAddresses ? (
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
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  주문을 위해 기본 배송지를 먼저 등록해 주세요.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={addressForm.recipientName}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, recipientName: event.target.value }))
                    }
                    placeholder="받는 분"
                    className="rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={addressForm.phone}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="연락처"
                    className="rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={addressForm.zipCode}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, zipCode: event.target.value }))
                    }
                    placeholder="우편번호"
                    className="rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={addressForm.address1}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, address1: event.target.value }))
                    }
                    placeholder="기본 주소"
                    className="rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <input
                  value={addressForm.address2}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, address2: event.target.value }))
                  }
                  placeholder="상세 주소"
                  className="w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleCreateAddress();
                  }}
                  disabled={creatingAddress}
                  className="rounded-[var(--radius-button)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  기본 배송지 저장
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
            <h2>주문 요약</h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">상품 포인트</span>
                <span>{cart.paymentSummary.itemPointAmount.toLocaleString()}P</span>
              </div>
              {cart.paymentSummary.itemCashAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">추가 결제 금액</span>
                  <span>{cart.paymentSummary.itemCashAmount.toLocaleString()}원</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">배송비</span>
                <span className="text-success">무료</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">총 결제 포인트</span>
                <span className="text-xl font-semibold text-primary">
                  {cart.paymentSummary.finalPointAmount.toLocaleString()}P
                </span>
              </div>
              {cart.paymentSummary.finalCashAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">총 추가 결제 금액</span>
                  <span className="text-lg font-semibold text-foreground">
                    {cart.paymentSummary.finalCashAmount.toLocaleString()}원
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-1 text-sm">
                <span className="text-muted-foreground">보유 포인트</span>
                <span className={isInsufficientPoints ? 'text-destructive' : 'text-foreground'}>
                  {pointBalance.toLocaleString()}P
                </span>
              </div>
              {isInsufficientPoints ? (
                <div className="rounded-[var(--radius-sm)] bg-destructive/5 p-3 text-sm text-destructive">
                  보유 포인트가 부족합니다.
                  <Link to="/points/recharge" className="ml-1 underline hover:text-destructive/80">
                    충전하러 가기
                  </Link>
                </div>
              ) : null}
              {cart.paymentSummary.finalCashAmount > 0 ? (
                <div className="rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] p-3 text-sm text-muted-foreground">
                  추가 결제 수단 선택 화면은 마지막 단계에서 붙일 예정입니다. 현재는 주문 구조만 먼저
                  반영되어 있습니다.
                </div>
              ) : null}
            </div>

            {selectedAddress ? (
              <div className="mt-4 rounded-[var(--radius-sm)] bg-background p-4 text-sm">
                <p className="font-medium text-foreground">{selectedAddress.recipientName}</p>
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
              disabled={updating || checkingOut || isInsufficientPoints || !selectedAddressId}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              주문하기
              <ArrowRight className="size-5" strokeWidth={1.5} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
