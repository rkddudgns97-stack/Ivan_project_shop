import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CirclePlus, Eye, EyeOff, ImagePlus, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, categoryApi, productApi } from '../../api';
import type { Category, Product, ProductDetail } from '../../types';

type ProductFormState = {
  name: string;
  categoryId: string;
  thumbnailUrl: string;
  detailImageUrls: string[];
  pointPrice: string;
  stockQuantity: string;
  description: string;
  deliveryInfo: string;
  purchaseLimit: string;
  status: Product['status'];
};

const STATUS_LABELS: Record<Product['status'], string> = {
  draft: '임시 저장',
  active: '운영 중',
  inactive: '운영 중지',
  sold_out: '품절',
};

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '운영 중' },
  { value: 'draft', label: '임시 저장' },
  { value: 'inactive', label: '운영 중지' },
  { value: 'sold_out', label: '품절' },
] as const;

const EMPTY_FORM: ProductFormState = {
  name: '',
  categoryId: '',
  thumbnailUrl: '',
  detailImageUrls: [],
  pointPrice: '',
  stockQuantity: '0',
  description: '',
  deliveryInfo: '',
  purchaseLimit: '',
  status: 'draft',
};

const DETAIL_GUIDE = '권장 크기 780 x 5000 px / 10MB 이하 / JPG, PNG';

function toFormState(product: ProductDetail): ProductFormState {
  return {
    name: product.name,
    categoryId: product.categoryId,
    thumbnailUrl: product.thumbnailUrl,
    detailImageUrls: product.images,
    pointPrice: String(product.pointPrice),
    stockQuantity: String(
      product.stockQuantity ?? product.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? 0,
    ),
    description: product.description ?? '',
    deliveryInfo: product.deliveryInfo ?? '',
    purchaseLimit: product.purchaseLimit ? String(product.purchaseLimit) : '',
    status: product.status,
  };
}

function getStockLabel(stockQuantity: number) {
  if (stockQuantity <= 0) return '품절';
  if (stockQuantity <= 10) return '품절 임박';
  return '재고 충분';
}

function isCloudinaryConfigError(message: string) {
  return message.includes('Cloudinary');
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
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  const detailPreviewImages = useMemo(() => form.detailImageUrls.slice(0, 4), [form.detailImageUrls]);
  const stockQuantity = Number(form.stockQuantity || '0');

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
            deliveryInfo: '결제 후 2~3영업일 내 순차 발송됩니다.',
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
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
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

      setForm((previous) => ({
        ...previous,
        thumbnailUrl: type === 'thumbnail' ? urls[0] : previous.thumbnailUrl,
        detailImageUrls:
          type === 'detail' ? [...previous.detailImageUrls, ...urls] : previous.detailImageUrls,
      }));

      toast.success(
        type === 'thumbnail'
          ? '대표 이미지를 업로드했습니다.'
          : `상세 이미지 ${urls.length}장을 업로드했습니다.`,
      );
    } catch (error) {
      console.error('Failed to upload image:', error);
      const message =
        error instanceof Error && isCloudinaryConfigError(error.message)
          ? '이미지 업로드 환경이 아직 설정되지 않았습니다. 아래 URL 입력란에 직접 이미지 주소를 넣어 주세요.'
          : error instanceof Error
            ? error.message
            : '이미지 업로드에 실패했습니다.';
      toast.error(message);
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pointPrice = Number(form.pointPrice);
    const nextStockQuantity = Number(form.stockQuantity || '0');

    if (!form.name.trim()) {
      toast.error('상품명을 입력해 주세요.');
      return;
    }
    if (!form.categoryId) {
      toast.error('카테고리를 선택해 주세요.');
      return;
    }
    if (!form.thumbnailUrl.trim()) {
      toast.error('대표 이미지를 등록해 주세요.');
      return;
    }
    if (!Number.isFinite(pointPrice) || pointPrice <= 0) {
      toast.error('필요 포인트를 확인해 주세요.');
      return;
    }
    if (!Number.isFinite(nextStockQuantity) || nextStockQuantity < 0) {
      toast.error('재고 수량을 확인해 주세요.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      thumbnailUrl: form.thumbnailUrl.trim(),
      imageUrls: form.detailImageUrls,
      pointPrice,
      stockQuantity: nextStockQuantity,
      description: form.description.trim(),
      deliveryInfo: form.deliveryInfo.trim(),
      purchaseLimit: form.purchaseLimit.trim() ? Number(form.purchaseLimit) : null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEditMode && id) {
        await adminApi.updateProduct(id, payload as any);
        toast.success('상품 정보를 수정했습니다.');
      } else {
        await adminApi.createProduct(payload as any);
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
              필요 포인트, 재고 수량, 상세 이미지를 중심으로 상품을 관리합니다.
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
          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-[var(--radius-card)] border border-border bg-card p-6"
          >
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
                <label className="block text-sm font-medium">필요 포인트</label>
                <input
                  type="number"
                  min="0"
                  value={form.pointPrice}
                  onChange={(event) => handleFormChange('pointPrice', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  보유 포인트가 부족하면 부족분만 현금 결제되도록 계산됩니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">재고 수량</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(event) => handleFormChange('stockQuantity', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  재고 10개 이하는 자동으로 `품절 임박`이 표시됩니다.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">대표 이미지</label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(event) => handleFormChange('thumbnailUrl', event)}
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-input-background px-4 py-3 text-sm"
                  placeholder="이미지 URL을 직접 입력하거나 아래 업로드 버튼을 사용해 주세요."
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm hover:bg-[var(--surface-subtle)]">
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
                  <span className="text-xs text-muted-foreground">
                    Cloudinary가 미설정이면 URL 직접 입력 방식으로도 등록할 수 있습니다.
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">상세 이미지</label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {DETAIL_GUIDE}. 여러 장 업로드하면 상세 화면에 세로형으로 노출됩니다.
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
                    setForm((previous) => ({
                      ...previous,
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
                  value="정책 확정 전 비활성"
                  readOnly
                  className="mt-2 w-full rounded-[var(--radius)] border border-border bg-muted/20 px-4 py-3 text-foreground/50"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  배지 정책이 정해질 때까지 사용하지 않습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">운영 상태</label>
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
                <div className="rounded-full bg-muted/20 px-3 py-1 text-xs font-semibold text-foreground/40">
                  배지 비활성
                </div>
                <h3 className="text-base font-medium leading-7 text-foreground">
                  {form.name || '상품명을 입력해 주세요.'}
                </h3>
                <div className="space-y-1">
                  <span className="block text-lg font-semibold text-primary">
                    {(Number(form.pointPrice) || 0).toLocaleString()}P
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    포인트 부족 시 부족분만 현금 결제 가능
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {form.description || '상품 설명은 사용자 상세 화면 상단 소개 영역에 노출됩니다.'}
                </p>
                <p className="text-sm font-medium text-foreground">
                  재고 {stockQuantity.toLocaleString()}개 / {getStockLabel(stockQuantity)}
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
          <p className="mt-1 text-muted-foreground">
            필요 포인트와 재고 수량 중심으로 상품을 운영합니다.
          </p>
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
            <Search
              className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
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
                  {['상품', '필요 포인트', '재고 수량', '재고 상태', '운영 상태', '작업'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const nextStockQuantity = product.stockQuantity ?? 0;

                  return (
                    <tr key={product.productId} className="hover:bg-muted/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="size-12 rounded-[var(--radius-sm)] object-cover"
                          />
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {product.productId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{product.pointPrice.toLocaleString()}P</td>
                      <td className="px-6 py-4 font-medium">{nextStockQuantity.toLocaleString()}개</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-muted/20 px-2.5 py-1 text-xs font-semibold">
                          {getStockLabel(nextStockQuantity)}
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
                              className="rounded-full p-2 text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-primary"
                              title="운영 시작"
                            >
                              <Eye className="size-4" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
