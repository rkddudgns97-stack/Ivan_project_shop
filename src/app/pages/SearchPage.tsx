import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Clock3, Search, Star, TrendingUp, X } from 'lucide-react';
import { productApi } from '../api';
import type { Product } from '../types';

const RECENT_SEARCH_KEY = 'welfare-mall-recent-searches';
const POPULAR_KEYWORDS = ['리포좀 멜라토프로', '풋사과 낙산균', '모닝·나이트 루틴', '숙면', '장 건강'];

const TEXT = {
  title: '검색',
  placeholder: '상품명이나 키워드로 검색',
  recent: '최근 검색어',
  popular: '인기 검색어',
  result: '검색 결과',
  emptyRecent: '최근 검색어가 없습니다.',
  emptyResult: '검색 결과가 없습니다.',
  totalPrefix: '총 ',
  totalSuffix: '개의 상품',
  clearAll: '전체 삭제',
  soldOut: '품절',
  lowStock: '재고 임박',
  newBadge: '신규',
  popularBadge: '인기',
} as const;

const BADGE_LABELS: Record<string, string> = {
  New: TEXT.newBadge,
  Popular: TEXT.popularBadge,
};

function readRecentSearches() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(values: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(values));
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const appliedQuery = searchParams.get('q') ?? '';

  useEffect(() => {
    setSearchQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!appliedQuery) {
        setProducts([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const response = await productApi.getList({
          query: appliedQuery,
          sort: 'popular',
        });

        setProducts(response.data.items);
        setTotal(response.data.meta.total);
      } catch (error) {
        console.error('Failed to search products:', error);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [appliedQuery]);

  const applySearch = (value: string) => {
    const next = value.trim();
    setSearchQuery(next);

    const nextParams = new URLSearchParams(searchParams);
    if (next) {
      nextParams.set('q', next);
      const updatedRecent = [next, ...recentSearches.filter((item) => item !== next)].slice(0, 8);
      setRecentSearches(updatedRecent);
      writeRecentSearches(updatedRecent);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch(searchQuery);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    writeRecentSearches([]);
  };

  return (
    <div className="mx-auto max-w-[560px] space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#232c51]">{TEXT.title}</h1>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8a93a7]" strokeWidth={1.7} />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={TEXT.placeholder}
          className="w-full rounded-[18px] border border-[#d8dced] bg-white py-3.5 pl-12 pr-12 text-[15px] text-[#232c51] shadow-[0_8px_20px_rgba(35,44,81,0.05)] outline-none focus:border-[#b8c2eb]"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              applySearch('');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a93a7]"
          >
            <X className="size-5" strokeWidth={1.7} />
          </button>
        ) : null}
      </form>

      {!appliedQuery ? (
        <div className="space-y-6">
          <section className="rounded-[20px] border border-[#d8dced] bg-white p-5 shadow-[0_8px_20px_rgba(35,44,81,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-[#6c759e]" strokeWidth={1.8} />
                <h2 className="text-[15px] font-extrabold text-[#232c51]">{TEXT.recent}</h2>
              </div>
              {recentSearches.length > 0 ? (
                <button type="button" onClick={clearRecent} className="text-[12px] font-semibold text-[#8a93a7]">
                  {TEXT.clearAll}
                </button>
              ) : null}
            </div>

            {recentSearches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => applySearch(keyword)}
                    className="rounded-full bg-[#f4f6fb] px-4 py-2 text-[13px] font-semibold text-[#495273]"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#8a93a7]">{TEXT.emptyRecent}</p>
            )}
          </section>

          <section className="rounded-[20px] border border-[#d8dced] bg-white p-5 shadow-[0_8px_20px_rgba(35,44,81,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#ff7d6b]" strokeWidth={1.8} />
              <h2 className="text-[15px] font-extrabold text-[#232c51]">{TEXT.popular}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_KEYWORDS.map((keyword, index) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => applySearch(keyword)}
                  className="rounded-full border border-[#ffd6cf] bg-[#fff6f4] px-4 py-2 text-[13px] font-semibold text-[#f05a4a]"
                >
                  {index + 1}. {keyword}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#8a93a7]">"{appliedQuery}"</p>
              <h2 className="text-[18px] font-extrabold text-[#232c51]">{TEXT.result}</h2>
            </div>
            <p className="text-[13px] text-[#8a93a7]">
              {TEXT.totalPrefix}
              {total.toLocaleString()}
              {TEXT.totalSuffix}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-[20px] bg-white">
              <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#d8dced] bg-white px-6 py-16 text-center text-[14px] text-[#8a93a7]">
              {TEXT.emptyResult}
            </div>
          ) : (
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
                  </div>
                  <div className="space-y-2 px-3 pb-4 pt-3">
                    <p className="line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-5 text-[#232c51]">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1 text-[#f2a000]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="size-3 fill-current" strokeWidth={1.8} />
                      ))}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-[15px] font-extrabold text-[#f05a4a]">{product.pointPrice.toLocaleString()}P</p>
                      {product.stockStatus === 'low_stock' ? (
                        <span className="rounded-full bg-[#fff4e6] px-2 py-1 text-[10px] font-bold text-[#d58a1f]">{TEXT.lowStock}</span>
                      ) : null}
                      {product.stockStatus === 'out_of_stock' ? (
                        <span className="rounded-full bg-[#eef0f7] px-2 py-1 text-[10px] font-bold text-[#6c759e]">{TEXT.soldOut}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
