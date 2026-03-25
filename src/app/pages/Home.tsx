import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Coins, Sparkles, Gift, ChevronRight, ClipboardList, History, Store } from 'lucide-react';
import type { PointBalance, Category, Product } from '../types';
import { pointApi, categoryApi, productApi } from '../api';

export function Home() {
  const [pointBalance, setPointBalance] = useState<PointBalance | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [balanceRes, categoriesRes, productsRes] = await Promise.all([
          pointApi.getBalance(),
          categoryApi.getAll(),
          productApi.getRecommendations(),
        ]);

        setPointBalance(balanceRes.data);
        setCategories(categoriesRes.data);
        setRecommendedProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to load data:', error);
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
    <div className="space-y-8">
      {/* 포인트 카드 */}
      <div className="bg-primary rounded-[var(--radius-card)] p-6 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p style={{ fontSize: 'var(--text-sm)' }} className="opacity-90">내 복지 포인트</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'var(--font-weight-semibold)' }}>
              {pointBalance?.availablePoint.toLocaleString()}P
            </p>
            {pointBalance?.expiringPoint && pointBalance.expiringPoint > 0 && (
              <p style={{ fontSize: 'var(--text-sm)' }} className="opacity-75">
                {new Date(pointBalance.expiringAt!).toLocaleDateString()} 만료 예정: {pointBalance.expiringPoint.toLocaleString()}P
              </p>
            )}
          </div>
          <Coins className="size-12 opacity-80" strokeWidth={1.5} />
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            to="/points"
            className="px-4 py-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-[var(--radius)] transition-colors"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            사용 내역
          </Link>
          <Link
            to="/points/recharge"
            className="px-4 py-2 bg-primary-foreground text-primary hover:opacity-90 rounded-[var(--radius)] transition-colors"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            포인트 충전
          </Link>
        </div>
      </div>

      {/* 카테고리 */}
      <section>
        <h2 className="mb-4">카테고리</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="flex flex-col items-center gap-3 p-4 bg-card rounded-[var(--radius-card)] hover:shadow-sm transition-shadow"
            >
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="size-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">{category.name}</p>
                {category.description && (
                  <p style={{ fontSize: 'var(--text-xs)' }} className="text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 상품 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2>추천 상품</h2>
          <Link to="/products" className="flex items-center gap-1 text-primary hover:text-primary/80" style={{ fontSize: 'var(--text-sm)' }}>
            전체보기
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <Link
              key={product.productId}
              to={`/products/${product.productId}`}
              className="bg-card rounded-[var(--radius-card)] overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="relative aspect-square">
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-destructive text-destructive-foreground rounded-[var(--radius-sm)]" style={{ fontSize: 'var(--text-xs)' }}>
                    {product.badge}
                  </span>
                )}
                {product.stockStatus === 'out_of_stock' && (
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                    <span className="px-3 py-1 bg-card text-foreground rounded-[var(--radius-sm)]" style={{ fontSize: 'var(--text-sm)' }}>품절</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-foreground line-clamp-2 min-h-[3rem]" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>
                  {product.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {product.pointPrice.toLocaleString()}P
                  </span>
                  {product.stockStatus === 'low_stock' && (
                    <span style={{ fontSize: 'var(--text-xs)' }} className="text-warning">품절임박</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 빠른 링크 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/orders"
          className="flex items-center gap-4 p-6 bg-card rounded-[var(--radius-card)] hover:shadow-sm transition-shadow"
        >
          <div className="size-12 rounded-full bg-success-soft flex items-center justify-center">
            <ClipboardList className="size-6 text-success" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">주문 내역</p>
            <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">주문 상태를 확인하세요</p>
          </div>
          <ChevronRight className="size-5 text-muted ml-auto" strokeWidth={1.5} />
        </Link>

        <Link
          to="/points"
          className="flex items-center gap-4 p-6 bg-card rounded-[var(--radius-card)] hover:shadow-sm transition-shadow"
        >
          <div className="size-12 rounded-full bg-info-soft flex items-center justify-center">
            <History className="size-6 text-info" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">포인트 내역</p>
            <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">사용 내역을 확인하세요</p>
          </div>
          <ChevronRight className="size-5 text-muted ml-auto" strokeWidth={1.5} />
        </Link>

        <Link
          to="/products"
          className="flex items-center gap-4 p-6 bg-card rounded-[var(--radius-card)] hover:shadow-sm transition-shadow"
        >
          <div className="size-12 rounded-full bg-warning-soft flex items-center justify-center">
            <Store className="size-6 text-warning" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">전체 상품</p>
            <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">다양한 상품을 둘러보세요</p>
          </div>
          <ChevronRight className="size-5 text-muted ml-auto" strokeWidth={1.5} />
        </Link>
      </section>
    </div>
  );
}