import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CirclePlus, Search, SlidersHorizontal, Pencil, Eye, EyeOff } from 'lucide-react';
import type { Product } from '../../types';
import { productApi, adminApi } from '../../api';
import { toast } from 'sonner';

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getList({
        query: searchQuery || undefined,
      });
      let filtered = res.data.items;
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
      }
      
      setProducts(filtered);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      await adminApi.updateProductStatus(productId, status);
      toast.success('상품 상태가 변경되었습니다.');
      loadProducts();
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const statusLabels: Record<Product['status'], string> = {
    draft: '임시 저장',
    active: '판매 중',
    inactive: '판매 중지',
    sold_out: '품절',
  };

  const statusColors: Record<Product['status'], string> = {
    draft: 'bg-muted/30 text-foreground/70',
    active: 'bg-success-soft text-success',
    inactive: 'bg-danger-soft text-danger',
    sold_out: 'bg-warning-soft text-warning',
  };

  const stockStatusColors: Record<string, string> = {
    in_stock: 'bg-success-soft text-success',
    low_stock: 'bg-warning-soft text-warning',
    out_of_stock: 'bg-danger-soft text-danger',
  };

  const filterButtons = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '판매 중' },
    { value: 'draft', label: '임시 저장' },
    { value: 'inactive', label: '판매 중지' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1>상품 관리</h1>
          <p className="mt-1 text-muted-foreground">상품을 등록하고 관리하세요.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
        >
          <CirclePlus className="size-5" strokeWidth={1.5} />
          <span>상품 등록</span>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card rounded-[var(--radius-card)] p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-[var(--radius)] bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-primary/90"
          >
            검색
          </button>
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-muted-foreground" strokeWidth={1.5} />
          <div className="flex gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-4 py-1.5 rounded-[var(--radius-button)] transition-colors ${
                  statusFilter === btn.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/20 text-foreground/70 hover:bg-muted/40'
                }`}
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card rounded-[var(--radius-card)] p-12 text-center">
          <p className="text-muted-foreground">상품이 없습니다.</p>
          <Link
            to="/admin/products/new"
            className="inline-block mt-4 text-primary hover:text-primary/80"
          >
            첫 상품 등록하기 →
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-[var(--radius-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--neutral-100)' }} className="border-b border-border">
                <tr>
                  {['상품', '가격', '재고 상태', '판매 상태', '액션'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-muted-foreground uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.productId} className="hover:bg-muted/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="size-12 object-cover rounded-[var(--radius-sm)]"
                        />
                        <div>
                          <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="text-foreground">{product.name}</p>
                          <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">ID: {product.productId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ fontWeight: 'var(--font-weight-medium)' }}>{product.pointPrice.toLocaleString()}P</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-[var(--radius-sm)] ${stockStatusColors[product.stockStatus]}`} style={{ fontSize: 'var(--text-xs)' }}>
                        {product.stockStatus === 'in_stock' && '재고 있음'}
                        {product.stockStatus === 'low_stock' && '품절 임박'}
                        {product.stockStatus === 'out_of_stock' && '품절'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-[var(--radius-sm)] ${statusColors[product.status]}`} style={{ fontSize: 'var(--text-xs)' }}>
                        {statusLabels[product.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${product.productId}`}
                          className="p-1.5 text-muted-foreground hover:text-primary"
                          title="수정"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        {product.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(product.productId, 'inactive')}
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                            title="판매 중지"
                          >
                            <EyeOff className="size-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(product.productId, 'active')}
                            className="p-1.5 text-muted-foreground hover:text-success"
                            title="판매 시작"
                          >
                            <Eye className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}