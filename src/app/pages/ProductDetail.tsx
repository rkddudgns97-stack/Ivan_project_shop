import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BoxIcon, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, pointApi, productApi } from '../api';
import type { PointBalance, ProductDetail } from '../types';

const STOCK_STATUS_LABELS = {
  in_stock: '구매 가능',
  low_stock: '재고 임박',
  out_of_stock: '품절',
} as const;

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [pointBalance, setPointBalance] = useState<PointBalance | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [productResponse, balanceResponse] = await Promise.all([
          productApi.getDetail(id),
          pointApi.getBalance(),
        ]);

        setProduct(productResponse.data);
        setPointBalance(balanceResponse.data);

        if (productResponse.data.variants?.length) {
          setSelectedVariantId(productResponse.data.variants[0].variantId);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('상품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [id]);

  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.variantId === selectedVariantId),
    [product, selectedVariantId],
  );

  const imageUrls = product?.images?.length ? product.images : product ? [product.thumbnailUrl] : [];
  const currentImageUrl = imageUrls[selectedImageIndex] ?? imageUrls[0];
  const pointPrice = selectedVariant?.pointPrice ?? product?.pointPrice ?? 0;
  const isOutOfStock =
    product?.stockStatus === 'out_of_stock' || (!!selectedVariant && selectedVariant.stock <= 0);
  const maxQuantity = Math.max(
    1,
    Math.min(product?.purchaseLimit ?? 99, selectedVariant?.stock ?? product?.purchaseLimit ?? 99),
  );
  const requiredPointTotal = pointPrice * quantity;
  const availablePoint = pointBalance?.availablePoint ?? 0;
  const usablePoint = Math.min(availablePoint, requiredPointTotal);
  const shortfallCash = Math.max(0, requiredPointTotal - usablePoint);

  const updateQuantity = (nextQuantity: number) => {
    setQuantity(Math.max(1, Math.min(maxQuantity, nextQuantity)));
  };

  const addToCart = async () => {
    if (!product) return false;

    if (product.variants?.length && !selectedVariantId) {
      toast.error('옵션을 선택해 주세요.');
      return false;
    }

    setSubmitting(true);
    try {
      await cartApi.addItem(product.productId, selectedVariantId || undefined, quantity);
      toast.success('장바구니에 담았습니다.');
      return true;
    } catch (error) {
      console.error('Failed to add cart item:', error);
      toast.error('장바구니 담기에 실패했습니다.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    const added = await addToCart();
    if (added) {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">상품 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card py-16 text-center">
        <p className="text-muted-foreground">상품 정보를 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="mt-4 text-sm font-medium text-primary hover:text-[var(--primary-hover)]"
        >
          상품 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        이전으로
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-card">
            <img src={currentImageUrl} alt={product.name} className="h-full w-full object-cover" />
            {product.badge ? (
              <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                {product.badge}
              </span>
            ) : null}
          </div>

          {imageUrls.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {imageUrls.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-[var(--radius-sm)] border ${
                    selectedImageIndex === index ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} 미리보기 ${index + 1}`}
                    className="aspect-square h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h1>{product.name}</h1>
            <p className="mt-2 leading-7 text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-3 border-y border-border py-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">상품 필요 포인트</p>
              <p className="text-3xl font-semibold tracking-tight text-primary">
                {pointPrice.toLocaleString()}P
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">내 보유 포인트</p>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {availablePoint.toLocaleString()}P
              </p>
            </div>
            {product.stockStatus === 'low_stock' ? (
              <p className="text-sm font-medium text-warning">재고가 얼마 남지 않았습니다.</p>
            ) : null}
          </div>

          {product.variants?.length ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">옵션 선택</label>
              <select
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {product.variants.map((variant) => (
                  <option key={variant.variantId} value={variant.variantId}>
                    {variant.name} / {variant.pointPrice.toLocaleString()}P
                    {variant.stock <= 0 ? ' / 품절' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">수량</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
                className="rounded-[var(--radius)] border border-border px-4 py-2 hover:bg-muted/20"
              >
                -
              </button>
              <span className="w-14 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
                className="rounded-[var(--radius)] border border-border px-4 py-2 hover:bg-muted/20"
              >
                +
              </button>
            </div>
            {product.purchaseLimit ? (
              <p className="text-sm text-muted-foreground">
                최대 {product.purchaseLimit}개까지 구매할 수 있습니다.
              </p>
            ) : null}
          </div>

          <div className="rounded-[var(--radius)] bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">총 필요 포인트</span>
              <span className="text-xl font-semibold text-primary">
                {requiredPointTotal.toLocaleString()}P
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium text-foreground">포인트 사용 예정</span>
              <span className="text-lg font-semibold text-foreground">
                {usablePoint.toLocaleString()}P
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium text-foreground">부족분 현금 결제</span>
              <span className="text-lg font-semibold text-foreground">
                {shortfallCash.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                void addToCart();
              }}
              disabled={isOutOfStock || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] border border-primary px-6 py-3 text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              장바구니
            </button>
            <button
              type="button"
              onClick={() => {
                void handleBuyNow();
              }}
              disabled={isOutOfStock || submitting}
              className="flex-1 rounded-[var(--radius)] bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOutOfStock ? '품절' : '바로 주문'}
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 size-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-foreground">배송 안내</p>
                <p className="mt-1 text-muted-foreground">
                  {product.deliveryInfo || '결제 후 2~3영업일 내 순차적으로 배송됩니다.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BoxIcon className="mt-0.5 size-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-foreground">재고 상태</p>
                <p className="mt-1 text-muted-foreground">
                  {
                    STOCK_STATUS_LABELS[
                      selectedVariant && selectedVariant.stock <= 0 ? 'out_of_stock' : product.stockStatus
                    ]
                  }
                </p>
              </div>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] p-4 text-muted-foreground">
              포인트가 부족해도 주문할 수 있습니다. 보유 포인트를 먼저 사용하고, 남는 부족분만
              현금으로 결제합니다.
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <h2 className="text-xl font-semibold text-foreground">상세 안내</h2>
          <p className="text-sm text-muted-foreground">
            상품 상세는 세로형 이미지로 제공됩니다.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[780px] space-y-3">
          {imageUrls.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-detail-${index}`}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-white"
            >
              <img
                src={imageUrl}
                alt={`${product.name} 상세 이미지 ${index + 1}`}
                className="h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
