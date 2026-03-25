import { Search, SlidersHorizontal } from 'lucide-react';
import type { Product, Category } from '../types';
import { productApi, categoryApi } from '../api';

export function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const categoryId = searchParams.get('category');
  const sortBy = searchParams.get('sort') || 'popular';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getList({
            categoryId: categoryId || undefined,
            query: searchQuery || undefined,
            sort: sortBy,
          }),
          categoryApi.getAll(),
        ]);

        setProducts(productsRes.data.items);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, searchQuery, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (catId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    setSearchParams(params);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1>상품 목록</h1>
        {selectedCategory && (
          <p className="mt-1 text-muted-foreground">{selectedCategory.name}</p>
        )}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted" strokeWidth={1.5} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="상품명을 검색하세요..."
          className="w-full pl-10 pr-4 py-3 border border-border rounded-[var(--radius)] bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {/* 필터 및 정렬 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 카테고리 필터 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-[var(--radius-button)] whitespace-nowrap transition-colors ${
                !categoryId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground/70 hover:bg-muted/30'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-[var(--radius-button)] whitespace-nowrap transition-colors ${
                  categoryId === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground/70 hover:bg-muted/30'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-muted-foreground" strokeWidth={1.5} />
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-border rounded-[var(--radius)] bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="popular">인기순</option>
            <option value="newest">최신순</option>
            <option value="price_low">낮은 가격순</option>
            <option value="price_high">높은 가격순</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">상품을 불러오는 중...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-muted-foreground">상품이 없습니다.</p>
          {(categoryId || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="mt-4 text-primary hover:text-primary/80"
            >
              전체 상품 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">
            총 {products.length}개의 상품
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
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
        </>
      )}
    </div>
  );
}