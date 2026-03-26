import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CirclePlus, Eye, EyeOff, ImagePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, categoryApi, productApi } from '../../api';
import type { Category, Product, ProductDetail } from '../../types';

type ProductFormState = {
  name: string;
  categoryId: string;
  thumbnailUrl: string;
  detailImageUrls: string[];
  pointPrice: string;
  cashPrice: string;
  badge: string;
  description: string;
  deliveryInfo: string;
  purchaseLimit: string;
  status: Product['status'];
  stockStatus: Product['stockStatus'];
};

const STATUS_LABELS: Record<Product['status'], string> = {
  draft: '임시 저장',
  active: '운영 중',
  inactive: '운영 중지',
  sold_out: '품절',
};

const STOCK_STATUS_LABELS: Record<Product['stockStatus'], string> = {
  in_stock: '재고 충분',
  low_stock: '재고 임박',
  out_of_stock: '품절',
};

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '운영 중' },
  { value: 'draft', label: '임시 저장' },
  { value: 'inactive', label: '운영 중지' },
  { value: 'sold_out', label: '품절' },
];

const EMPTY_FORM: ProductFormState = {
  name: '',
  categoryId: '',
  thumbnailUrl: '',
  detailImageUrls: [],
  pointPrice: '',
  cashPrice: '0',
  badge: '',
  description: '',
  deliveryInfo: '',
  purchaseLimit: '',
  status: 'draft',
  stockStatus: 'in_stock',
};

const DETAIL_GUIDE = '권장 크기 780 x 5000 px / 10MB 이하 / JPG, PNG';

function toFormState(product: ProductDetail): ProductFormState {
  return {
    name: product.name,
    categoryId: product.categoryId,
    thumbnailUrl: product.thumbnailUrl,
    detailImageUrls: product.images,
    pointPrice: String(product.pointPrice),
    cashPrice: String(product.cashPrice ?? 0),
    badge: product.badge ?? '',
    description: product.description ?? '',
    deliveryInfo: product.deliveryInfo ?? '',
    purchaseLimit: product.purchaseLimit ? String(product.purchaseLimit) : '',
    status: product.status,
    stockStatus: product.stockStatus,
  };
}

export function AdminProductsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreateMode = location.pathname.endsWith('/new');
  const isEditMode = Boolean(id);
  const isFormMode = isCreateMode || isEditMode;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'thumbnail' | 'detail' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const detailPreviewImages = useMemo(() => form.detailImageUrls.slice(0, 4), [form.detailImageUrls]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts({
        query: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setProducts(response.data.items);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('상품 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFormMode) {
      void loadProducts();
      return;
    }

    const loadForm = async () => {
      setLoading(true);
      try {
        const categoryResponse = await categoryApi.getAll();
        setCategories(categoryResponse.data);

        if (isCreateMode) {
          setForm({
            ...EMPTY_FORM,
            categoryId: categoryResponse.data[0]?.id ?? '',
            deliveryInfo: '결제 후 2~3영업일 내 순차적으로 배송됩니다.',
          });
          setProductDetail(null);
          return;
        }

        if (!id) return;

        const productResponse = await productApi.getDetail(id);
        setProductDetail(productResponse.data);
        setForm(toFormState(productResponse.data));
      } catch (error) {
        console.error('Failed to load product form data:', error);
        toast.error('상품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void loadForm();
  }, [id, isCreateMode, isFormMode]);

  useEffect(() => {
    if (!isFormMode) {
      void loadProducts();
    }
  }, [statusFilter, isFormMode]);

  const handleFormChange = (
    key: keyof ProductFormState,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: 'thumbnail' | 'detail',
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      setUploading(type);
      const uploaded = await Promise.all(files.map((file) => adminApi.uploadImage(file)));
      const urls = uploaded.map((item) => item.data.url);

      setForm((prev) => ({
        ...prev,
        thumbnailUrl: type === 'thumbnail' ? urls[0] : prev.thumbnailUrl,
        detailImageUrls: type === 'detail' ? [...prev.detailImageUrls, ...urls] : prev.detailImageUrls,
      }));

      toast.success(type === 'thumbnail' ? '대표 이미지를 업로드했습니다.' : `상세 이미지 ${urls.length}장을 업로드했습니다.`);
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pointPrice = Number(form.pointPrice);
    const cashPrice = Number(form.cashPrice || '0');

    if (!form.name.trim()) return toast.error('상품명을 입력해 주세요.');
    if (!form.categoryId) return toast.error('카테고리를 선택해 주세요.');
    if (!form.thumbnailUrl.trim()) return toast.error('대표 이미지를 등록해 주세요.');
    if (!Number.isFinite(pointPrice) || pointPrice <= 0) return toast.error('포인트 금액을 확인해 주세요.');
    if (!Number.isFinite(cashPrice) || cashPrice < 0) return toast.error('추가 결제 금액을 확인해 주세요.');

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      thumbnailUrl: form.thumbnailUrl.trim(),
      imageUrls: form.detailImageUrls,
      pointPrice,
      cashPrice,
      badge: form.badge.trim() || null,
      description: form.description.trim(),
      deliveryInfo: form.deliveryInfo.trim(),
      purchaseLimit: form.purchaseLimit.trim() ? Number(form.purchaseLimit) : null,
      status: form.status,
      stockStatus: form.stockStatus,
    };

    setSaving(true);
    try {
      if (isEditMode && id) {
        await adminApi.updateProduct(id, payload);
        toast.success('상품 정보를 수정했습니다.');
      } else {
        await adminApi.createProduct(payload);
        toast.success('상품을 등록했습니다.');
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('상품 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (productId: string, status: Product['status']) => {
    try {
      await adminApi.updateProductStatus(productId, status);
      toast.success('상품 상태를 변경했습니다.');
      await loadProducts();
    } catch (error) {
      console.error('Failed to update product status:', error);
      toast.error('상품 상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        {isFormMode ? '상품 정보를 불러오고 있습니다.' : '상품 목록을 불러오고 있습니다.'}
      </div>
    );
  }

  if (isFormMode) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" strokeWidth={1.5} />
          상품 목록으로 돌아가기
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1>{isEditMode ? '상품 수정' : '상품 등록'}</h1>
            <p className="mt-1 text-muted-foreground">
              {isEditMode ? '상품 가격과 상세 이미지를 함께 관리합니다.' : '복지몰에 노출할 상품을 등록합니다.'}
            </p>
          </div>
          {productDetail ? (
            <Link
              to={`/products/${productDetail.productId}`}
              className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm hover:bg-[var(--surface-subtle)]"
            >
              사용자 화면 보기
            </Link>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <form onSubmit={handleSave} className="space-y-6 rounded-[var(--radius-card)] border border-border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">상품명</label>
                <input
                  value={form.name}
                  onChange={(event) => handleFormChange('name', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                  placeholder="예: 리포좀 멜라토프로"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">카테고리</label>
                <select
                  value={form.categoryId}
                  onChange={(event) => handleFormChange('categoryId', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">구매 제한</label>
                <input
                  type="number"
                  min="1"
                  value={form.purchaseLimit}
                  onChange={(event) => handleFormChange('purchaseLimit', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                  placeholder="비워두면 제한 없음"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">복지포인트 금액</label>
                <input
                  type="number"
                  min="0"
                  value={form.pointPrice}
                  onChange={(event) => handleFormChange('pointPrice', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">추가 결제 금액</label>
                <input
                  type="number"
                  min="0"
                  value={form.cashPrice}
                  onChange={(event) => handleFormChange('cashPrice', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">대표 이미지</label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(event) => handleFormChange('thumbnailUrl', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 text-sm"
                  placeholder="Cloudinary 업로드 후 URL이 자동 입력됩니다."
                />
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm hover:bg-[var(--surface-subtle)]">
                  <ImagePlus className="size-4" strokeWidth={1.8} />
                  {uploading === 'thumbnail' ? '업로드 중...' : '대표 이미지 업로드'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(event) => {
                      void handleImageUpload(event, 'thumbnail');
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">상세 이미지</label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {DETAIL_GUIDE}. 여러 장 업로드하면 상세 화면에 세로로 노출됩니다.
                </p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm hover:bg-[var(--surface-subtle)]">
                  <ImagePlus className="size-4" strokeWidth={1.8} />
                  {uploading === 'detail' ? '업로드 중...' : '상세 이미지 업로드'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={(event) => {
                      void handleImageUpload(event, 'detail');
                    }}
                    className="hidden"
                  />
                </label>
                <textarea
                  value={form.detailImageUrls.join('\n')}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      detailImageUrls: event.target.value
                        .split('\n')
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }))
                  }
                  rows={4}
                  className="mt-3 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 font-mono text-xs"
                  placeholder={'https://example.com/detail-1.jpg\nhttps://example.com/detail-2.jpg'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">배지</label>
                <input
                  value={form.badge}
                  onChange={(event) => handleFormChange('badge', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                  placeholder="인기 / 추천 / 신규"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">상품 상태</label>
                <select
                  value={form.status}
                  onChange={(event) => handleFormChange('status', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">재고 상태</label>
                <select
                  value={form.stockStatus}
                  onChange={(event) => handleFormChange('stockStatus', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                >
                  {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">상품 설명</label>
                <textarea
                  value={form.description}
                  onChange={(event) => handleFormChange('description', event)}
                  rows={4}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">배송 안내</label>
                <textarea
                  value={form.deliveryInfo}
                  onChange={(event) => handleFormChange('deliveryInfo', event)}
                  rows={3}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="rounded-[var(--radius)] border border-border px-5 py-3 hover:bg-[var(--surface-subtle)]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-[var(--radius)] bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50"
              >
                {saving ? '저장 중...' : isEditMode ? '변경사항 저장' : '상품 등록'}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
              <div className="aspect-[4/5] bg-[var(--surface-subtle)]">
                {form.thumbnailUrl ? (
                  <img
                    src={form.thumbnailUrl}
                    alt={form.name || '상품 미리보기'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    대표 이미지 미리보기
                  </div>
                )}
              </div>
              <div className="space-y-3 p-5">
                {form.badge ? (
                  <span className="inline-flex rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                    {form.badge}
                  </span>
                ) : null}
                <h3 className="text-base font-medium leading-7 text-foreground">
                  {form.name || '상품명을 입력해 주세요'}
                </h3>
                <div className="space-y-1">
                  <span className="block text-lg font-semibold text-primary">
                    {(Number(form.pointPrice) || 0).toLocaleString()}P
                  </span>
                  {(Number(form.cashPrice) || 0) > 0 ? (
                    <span className="block text-sm font-semibold text-foreground">
                      + {(Number(form.cashPrice) || 0).toLocaleString()}원
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {form.description || '상품 설명은 상세 상단 소개 영역에 함께 노출됩니다.'}
                </p>
              </div>
            </section>

            {form.detailImageUrls.length > 0 ? (
              <section className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">상세 이미지 미리보기</p>
                  <span className="text-xs text-muted-foreground">{form.detailImageUrls.length}장</span>
                </div>
                <div className="space-y-3">
                  {detailPreviewImages.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-[var(--radius)] border border-border">
                      <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <span className="text-xs text-muted-foreground">상세 이미지 {index + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              detailImageUrls: prev.detailImageUrls.filter((_, imageIndex) => imageIndex !== index),
                            }))
                          }
                          className="rounded-full p-1 text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-destructive"
                        >
                          <Trash2 className="size-4" strokeWidth={1.8} />
                        </button>
                      </div>
                      <img src={imageUrl} alt={`상세 이미지 ${index + 1}`} className="h-auto w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>상품 관리</h1>
          <p className="mt-1 text-muted-foreground">가격 구조와 운영 상태를 한눈에 관리하세요.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-primary-foreground hover:bg-[var(--primary-hover)]"
        >
          <CirclePlus className="size-5" strokeWidth={1.5} />
          상품 등록
        </Link>
      </div>

      <section className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadProducts();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="상품명으로 검색"
              className="w-full rounded-[var(--radius)] border border-border bg-input-background py-2 pl-10 pr-4"
            />
          </div>
          <button type="submit" className="rounded-[var(--radius)] bg-primary px-6 py-2 text-primary-foreground">
            검색
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-[var(--radius-button)] px-4 py-1.5 text-sm ${
                statusFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-foreground/75 hover:bg-muted/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {products.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          조건에 맞는 상품이 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-[var(--surface-subtle)]">
                <tr>
                  {['상품', '포인트 / 추가금', '재고 상태', '운영 상태', '작업'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                        <img src={product.thumbnailUrl} alt={product.name} className="size-12 rounded-[var(--radius-sm)] object-cover" />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product.productId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div>{product.pointPrice.toLocaleString()}P</div>
                      {product.cashPrice > 0 ? (
                        <div className="mt-1 text-sm text-muted-foreground">+ {product.cashPrice.toLocaleString()}원</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-muted/20 px-2.5 py-1 text-xs font-semibold">
                        {STOCK_STATUS_LABELS[product.stockStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-muted/20 px-2.5 py-1 text-xs font-semibold">
                        {STATUS_LABELS[product.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${product.productId}`}
                          className="rounded-full p-2 text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-primary"
                          title="상품 수정"
                        >
                          <Pencil className="size-4" strokeWidth={1.5} />
                        </Link>
                        {product.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleStatusChange(product.productId, 'inactive');
                            }}
                            className="rounded-full p-2 text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-destructive"
                            title="운영 중지"
                          >
                            <EyeOff className="size-4" strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              void handleStatusChange(product.productId, 'active');
                            }}
                            className="rounded-full p-2 text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-success"
                            title="운영 시작"
                          >
                            <Eye className="size-4" strokeWidth={1.5} />
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
