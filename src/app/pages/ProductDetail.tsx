import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ShoppingBag, BoxIcon, Truck, ArrowLeft } from 'lucide-react';
import type { ProductDetail } from '../types';
import { productApi, cartApi } from '../api';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const res = await productApi.getDetail(id);
        setProduct(res.data);
        if (res.data.variants && res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0].variantId);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('상품을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.variants && !selectedVariant) {
      toast.error('옵션을 선택해주세요.');
      return;
    }

    setAdding(true);
    try {
      await cartApi.addItem(product.productId, selectedVariant || undefined, quantity);
      toast.success('장바구니에 추가되었습니다.');
    } catch (error) {
      toast.error('장바구니 추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
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

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">상품을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-primary hover:text-primary/80"
        >
          상품 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const currentPrice = product.variants && selectedVariant
    ? product.variants.find(v => v.variantId === selectedVariant)?.pointPrice || product.pointPrice
    : product.pointPrice;

  const isOutOfStock = product.stockStatus === 'out_of_stock';

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} />
        <span>뒤로 가기</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 이미지 영역 */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-card rounded-[var(--radius-card)] overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-destructive text-destructive-foreground rounded-[var(--radius-sm)]" style={{ fontSize: 'var(--text-sm)' }}>
                {product.badge}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <div key={idx} className="aspect-square bg-card rounded-[var(--radius-sm)] overflow-hidden cursor-pointer hover:ring-2 ring-ring">
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="space-y-6">
          <div>
            <h1>{product.name}</h1>
            <p className="mt-2 text-muted-foreground">{product.description}</p>
          </div>

          <div className="border-t border-b border-border py-4">
            <div className="text-primary" style={{ fontSize: '1.875rem', fontWeight: 'var(--font-weight-semibold)' }}>
              {currentPrice.toLocaleString()}P
            </div>
            {product.stockStatus === 'low_stock' && (
              <p className="mt-2 text-warning" style={{ fontSize: 'var(--text-sm)' }}>품절 임박</p>
            )}
          </div>

          {/* 옵션 선택 */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-foreground/70">옵션 선택</label>
              <select
                value={selectedVariant || ''}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-[var(--radius)] bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {product.variants.map((variant) => (
                  <option key={variant.variantId} value={variant.variantId}>
                    {variant.name} - {variant.pointPrice.toLocaleString()}P
                    {variant.stock === 0 && ' (품절)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 수량 선택 */}
          <div className="space-y-2">
            <label className="block text-foreground/70">수량</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 border border-border rounded-[var(--radius)] hover:bg-muted/20"
              >
                -
              </button>
              <span className="w-16 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 border border-border rounded-[var(--radius)] hover:bg-muted/20"
              >
                +
              </button>
            </div>
            {product.purchaseLimit && (
              <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">최대 {product.purchaseLimit}개까지 구매 가능</p>
            )}
          </div>

          {/* 총 금액 */}
          <div className="bg-background rounded-[var(--radius)] p-4">
            <div className="flex items-center justify-between">
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>총 금액</span>
              <span className="text-primary" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                {(currentPrice * quantity).toLocaleString()}P
              </span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-primary text-primary rounded-[var(--radius)] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              <span>장바구니</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || adding}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isOutOfStock ? '품절' : '바로 구매'}
            </button>
          </div>

          {/* 배송 정보 */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-3" style={{ fontSize: 'var(--text-sm)' }}>
              <Truck className="size-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)' }}>배송 정보</p>
                <p className="text-muted-foreground">{product.deliveryInfo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ fontSize: 'var(--text-sm)' }}>
              <BoxIcon className="size-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)' }}>재고 상태</p>
                <p className="text-muted-foreground">
                  {product.stockStatus === 'in_stock' && '재고 있음'}
                  {product.stockStatus === 'low_stock' && '품절 임박'}
                  {product.stockStatus === 'out_of_stock' && '품절'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}