import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight,
  Gift,
  HeartHandshake,
  PackageCheck,
  Percent,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { categoryApi, pointApi, productApi } from '../api';
import type { Category, PointBalance, Product } from '../types';

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
  loading: '\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
  welfareBenefit: '\uC0AC\uB0B4 \uBCF5\uC9C0 \uD61C\uD0DD',
  openBenefit: '\uC2E0\uADDC \uD61C\uD0DD \uC624\uD508',
  heroDescription:
    '\uC774\uBC88 \uB2EC \uBCF5\uC9C0\uD3EC\uC778\uD2B8\uB85C \uC0DD\uD65C\u00B7\uB514\uC9C0\uD138\u00B7\uAC74\uAC15 \uC0C1\uD488\uC744 \uB354 \uAC00\uBCBC\uAC8C \uB9CC\uB098\uBCF4\uC138\uC694.',
  pointBalance: '\uBCF4\uC720 \uD3EC\uC778\uD2B8',
  available: '\uC0AC\uC6A9 \uAC00\uB2A5',
  reserved: '\uC608\uC57D \uD3EC\uC778\uD2B8',
  expiring: '\uB9CC\uB8CC \uC608\uC815',
  category: '\uCE74\uD14C\uACE0\uB9AC',
  viewAll: '\uC804\uCCB4\uBCF4\uAE30',
  couponPack: '\uC774\uB2EC\uC758 \uBCF5\uC9C0 \uCFE0\uD3F0\uD329',
  couponDescription:
    '\uC2E0\uADDC \uC785\uC810 \uC0C1\uD488\uACFC \uC778\uAE30 \uCE74\uD14C\uACE0\uB9AC\uB97C \uD568\uAED8 \uB9CC\uB098\uBCF4\uC138\uC694.',
  recommend: '\uCD94\uCC9C \uC0C1\uD488',
  popularNow: '\uC9C0\uAE08 \uB9CE\uC774 \uCC3E\uB294 \uC0C1\uD488',
  best: '\uBCF5\uC9C0\uBAB0 \uBCA0\uC2A4\uD2B8',
  continueBrowse: '\uACC4\uC18D \uB458\uB7EC\uBCF4\uAE30',
  companyAccount: '\uD68C\uC0AC \uC804\uC6A9 \uBCF5\uC9C0 \uACC4\uC815 \uC6B4\uC601',
  companyAccountDescription:
    '\uC774\uBA54\uC77C \uC778\uC99D \uAE30\uBC18\uC73C\uB85C \uC6B4\uC601\uD574 \uC0AC\uB0B4 \uAD6C\uC131\uC6D0\uB9CC \uC548\uC804\uD558\uAC8C \uC774\uC6A9\uD560 \uC218 \uC788\uB3C4\uB85D \uAD6C\uC131\uD588\uC2B5\uB2C8\uB2E4.',
  productExchange: '\uBCF5\uC9C0\uD3EC\uC778\uD2B8 \uAD50\uD658',
  soldOut: '\uD488\uC808',
  lowStock: '\uC7AC\uACE0 \uC784\uBC15',
  newBadge: '\uC2E0\uADDC',
  popularBadge: '\uC778\uAE30',
} as const;

const BADGE_LABELS: Record<string, string> = {
  New: TEXT.newBadge,
  Popular: TEXT.popularBadge,
};

function getBadgeLabel(badge?: string) {
  if (!badge) return null;
  return BADGE_LABELS[badge] ?? badge;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.productId}`}
      className="group block overflow-hidden rounded-[18px] bg-white shadow-[0_8px_18px_rgba(31,36,48,0.08)] transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[0.95] overflow-hidden bg-[#f3f4f8]">
        <img
          src={product.thumbnailUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {getBadgeLabel(product.badge) ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#f05a4a] px-2.5 py-1 text-[11px] font-bold text-white">
            {getBadgeLabel(product.badge)}
          </span>
        ) : null}
        {product.stockStatus === 'out_of_stock' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/38">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1f2430]">{TEXT.soldOut}</span>
          </div>
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
          <div className="space-y-0.5">
            <p className="text-[15px] font-extrabold text-[#f05a4a]">{product.pointPrice.toLocaleString()}P</p>
            <p className="text-[11px] text-[#8a93a7]">{TEXT.productExchange}</p>
          </div>
          {product.stockStatus === 'low_stock' ? (
            <span className="rounded-full bg-[#fff4e6] px-2 py-1 text-[10px] font-bold text-[#d58a1f]">{TEXT.lowStock}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function Home() {
  const [pointBalance, setPointBalance] = useState<PointBalance | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [balanceRes, categoriesRes, productsRes] = await Promise.all([
          pointApi.getBalance(),
          categoryApi.getAll(),
          productApi.getList({ sort: 'popular', size: 24 }),
        ]);

        setPointBalance(balanceRes.data);
        setCategories(categoriesRes.data);
        setProducts(productsRes.data.items);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const topCategories = useMemo(() => categories.slice(0, 6), [categories]);
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const feedProducts = useMemo(() => products.slice(4), [products]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">{TEXT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] space-y-5 xl:max-w-7xl">
      <section className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#ffd88d_0%,#ffbb58_46%,#ff9d4a_100%)] px-4 py-4 shadow-[0_14px_30px_rgba(240,122,70,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-white/78 px-3 py-1 text-[10px] font-bold text-[#d46b00]">
              {TEXT.welfareBenefit}
            </span>
            <h1 className="text-[18px] font-extrabold leading-tight text-[#8b3d00] sm:text-[20px]">{TEXT.openBenefit}</h1>
            <p className="max-w-[220px] text-[12px] leading-5 text-[#7b470f] sm:max-w-[250px]">{TEXT.heroDescription}</p>
          </div>

          <div className="min-w-[84px] rounded-[18px] bg-white/65 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-bold leading-4 text-[#b15a12]">{TEXT.pointBalance}</p>
            <p className="mt-1 text-[22px] font-extrabold leading-none text-[#7b3500]">
              {pointBalance?.availablePoint.toLocaleString() ?? '0'}P
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: TEXT.available, value: `${pointBalance?.availablePoint.toLocaleString() ?? '0'}P` },
            { label: TEXT.reserved, value: `${pointBalance?.reservedPoint.toLocaleString() ?? '0'}P` },
            { label: TEXT.expiring, value: `${pointBalance?.expiringPoint.toLocaleString() ?? '0'}P` },
          ].map((item) => (
            <div key={item.label} className="rounded-[16px] bg-white/52 px-2 py-2.5 text-center">
              <p className="text-[10px] font-semibold leading-4 text-[#99551c]">{item.label}</p>
              <p className="mt-1 text-[13px] font-extrabold leading-none text-[#7b3500]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-white px-4 py-5 shadow-[0_8px_20px_rgba(31,36,48,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-[#232c51]">{TEXT.category}</h2>
          <Link to="/products" className="text-[12px] font-bold text-[#f05a4a]">
            {TEXT.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6">
          {topCategories.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
            return (
              <Link key={category.id} to={`/products?category=${category.id}`} className="text-center">
                <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${CATEGORY_BG[index % CATEGORY_BG.length]}`}>
                  <Icon className="size-6" strokeWidth={1.8} />
                </div>
                <p className="mt-2 break-keep text-[12px] font-semibold leading-4 text-[#232c51]">{category.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[20px] bg-[linear-gradient(90deg,#fff3f4_0%,#fff8ec_100%)] px-4 py-3 shadow-[0_6px_16px_rgba(31,36,48,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#f05a4a]">
              <Percent className="size-5" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-[#232c51]">{TEXT.couponPack}</p>
              <p className="text-[11px] leading-4 text-[#8a93a7]">{TEXT.couponDescription}</p>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-[#f05a4a]" strokeWidth={2} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#f05a4a]">{TEXT.recommend}</p>
            <h2 className="text-[17px] font-extrabold text-[#232c51]">{TEXT.popularNow}</h2>
          </div>
          <Link to="/products" className="text-[12px] font-bold text-[#f05a4a]">
            {TEXT.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-white px-4 py-5 shadow-[0_8px_20px_rgba(31,36,48,0.06)]">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#eef7ff] text-[#4e7bb8]">
            <ShieldCheck className="size-7" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[15px] font-extrabold text-[#232c51]">{TEXT.companyAccount}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#8a93a7]">{TEXT.companyAccountDescription}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#f05a4a]">{TEXT.best}</p>
            <h2 className="text-[17px] font-extrabold text-[#232c51]">{TEXT.continueBrowse}</h2>
          </div>
          <Link to="/products" className="text-[12px] font-bold text-[#f05a4a]">
            {TEXT.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {feedProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
