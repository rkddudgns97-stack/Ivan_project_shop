import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Gift, HeartHandshake, PackageCheck, Percent, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import { categoryApi, productApi } from '../api';
import type { Category, Product } from '../types';

const CATEGORY_ICONS = [Gift, Sparkles, HeartHandshake, PackageCheck, Star, Percent];
const CATEGORY_BG = [
  'bg-[#fff4ec] text-[#f26b4f]',
  'bg-[#eef7ff] text-[#4e7bb8]',
  'bg-[#f2f8ef] text-[#5c8c53]',
  'bg-[#f7f3ff] text-[#7b63b2]',
  'bg-[#fff7e8] text-[#b98229]',
  'bg-[#eef6f5] text-[#347f80]',
];

const TEXT = {
  title: '카테고리',
  description: '원하는 카테고리를 선택하고 복지 상품을 둘러보세요.',
  all: '전체',
  allProducts: '전체 상품',
  sortPopular: '추천순',
  sortNewest: '최신순',
  sortLow: '포인트 낮은순',
  sortHigh: '포인트 높은순',
  loading: '상품을 불러오고 있습니다.',
  empty: '조건에 맞는 상품이 없습니다.',
  totalPrefix: '총 ',
  totalSuffix: '개의 상품',
  soldOut: '품절',
  lowStock: '재고 임박',
  newBadge: '신규',
  popularBadge: '인기',
} as const;

const SORT_OPTIONS = [
  { value: 'popular', label: TEXT.sortPopular },
  { value: 'newest', label: TEXT.sortNewest },
  { value: 'price_low', label: TEXT.sortLow },
  { value: 'price_high', label: TEXT.sortHigh },
];

const BADGE_LABELS: Record<string, string> = {
  New: TEXT.newBadge,
  Popular: TEXT.popularBadge,
};

export function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const categoryId = searchParams.get('category') ?? '';
  const sortBy = searchParams.get('sort') ?? 'popular';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getList({
            categoryId: categoryId || undefined,
            sort: sortBy,
          }),
          categoryApi.getAll(),
        ]);

        setProducts(productsRes.data.items);
        setTotal(productsRes.data.meta.total);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [categoryId, sortBy]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const handleCategoryChange = (nextCategoryId?: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextCategoryId) {
      nextParams.set('category', nextCategoryId);
    } else {
      nextParams.delete('category');
    }

    setSearchParams(nextParams);
  };

  const handleSortChange = (nextSort: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', nextSort);
    setSearchParams(nextParams);
  };

  return (
    <div className="mx-auto max-w-[560px] space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#232c51]">{TEXT.title}</h1>
        <p className="mt-1 text-[14px] text-[#8a93a7]">
          {selectedCategory?.description ?? TEXT.description}
        </p>
      </div>

      <section className="rounded-[24px] bg-white px-4 py-5 shadow-[0_8px_20px_rgba(35,44,81,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-[#232c51]">{selectedCategory?.name ?? TEXT.allProducts}</h2>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#8a93a7]" strokeWidth={1.7} />
            <select
              value={sortBy}
              onChange={(event) => handleSortChange(event.target.value)}
              className="bg-transparent text-[13px] font-semibold text-[#495273] outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          <button type="button" onClick={() => handleCategoryChange(undefined)} className="text-center">
            <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${!categoryId ? 'bg-[#232c51] text-white' : 'bg-[#f4f6fb] text-[#6c759e]'}`}>
              <Gift className="size-6" strokeWidth={1.8} />
            </div>
            <p className="mt-2 break-keep text-[12px] font-semibold leading-4 text-[#232c51]">{TEXT.all}</p>
          </button>

          {categories.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
            const active = categoryId === category.id;

            return (
              <button key={category.id} type="button" onClick={() => handleCategoryChange(category.id)} className="text-center">
                <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${active ? 'bg-[#232c51] text-white' : CATEGORY_BG[index % CATEGORY_BG.length]}`}>
                  <Icon className="size-6" strokeWidth={1.8} />
                </div>
                <p className="mt-2 break-keep text-[12px] font-semibold leading-4 text-[#232c51]">{category.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[20px] bg-white">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-[14px] text-[#8a93a7]">{TEXT.loading}</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#d8dced] bg-white px-6 py-16 text-center text-[14px] text-[#8a93a7]">
          {TEXT.empty}
        </div>
      ) : (
        <section className="space-y-4 pb-2">
          <p className="text-[13px] text-[#8a93a7]">
            {TEXT.totalPrefix}
            {total.toLocaleString()}
            {TEXT.totalSuffix}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link
                key={product.productId}
                to={`/products/${product.productId}`}
                className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_20px_rgba(35,44,81,0.06)]"
              >
                <div className="relative aspect-[0.9] overflow-hidden bg-[#f4f6fb]">
                  <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" />
                  {product.badge ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#f05a4a] px-2.5 py-1 text-[11px] font-bold text-white">
                      {BADGE_LABELS[product.badge] ?? product.badge}
                    </span>
                  ) : null}
                  {product.stockStatus === 'out_of_stock' ? (
                    <span className="absolute bottom-3 right-3 rounded-full bg-[#eef0f7] px-2.5 py-1 text-[10px] font-bold text-[#6c759e]">
                      {TEXT.soldOut}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 px-3 pb-4 pt-3">
                  <p className="line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-5 text-[#232c51]">
                    {product.name}
                  </p>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-[15px] font-extrabold text-[#f05a4a]">{product.pointPrice.toLocaleString()}P</p>
                    {product.stockStatus === 'low_stock' ? (
                      <span className="rounded-full bg-[#fff4e6] px-2 py-1 text-[10px] font-bold text-[#d58a1f]">{TEXT.lowStock}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
