import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { UsersRound, Tag, Receipt, TrendingUp, TriangleAlert, ChevronRight, PackagePlus, Coins, ClipboardList, Warehouse } from 'lucide-react';
import type { AdminDashboard } from '../../types';
import { adminApi } from '../../api';

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getDashboard();
        setDashboard(res.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
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

  if (!dashboard) {
    return <div className="text-center py-12 text-muted-foreground">데이터를 불러올 수 없습니다.</div>;
  }

  const cards = [
    { label: '전체 임직원', value: dashboard.userCount.toLocaleString(), icon: UsersRound, iconBg: 'bg-primary/10', iconColor: 'text-primary', link: '/admin/users' },
    { label: '활성 상품', value: dashboard.activeProductCount.toLocaleString(), icon: Tag, iconBg: 'bg-success-soft', iconColor: 'text-success', link: '/admin/products' },
    { label: '금일 주문', value: dashboard.todayOrderCount.toLocaleString(), icon: Receipt, iconBg: 'bg-info-soft', iconColor: 'text-info', link: '/admin/orders' },
    { label: '금일 사용 포인트', value: `${dashboard.todayUsedPoint.toLocaleString()}P`, icon: TrendingUp, iconBg: 'bg-warning-soft', iconColor: 'text-warning' },
    { label: '취소 대기', value: dashboard.pendingCancelCount.toLocaleString(), icon: TriangleAlert, iconBg: 'bg-danger-soft', iconColor: 'text-danger', link: '/admin/orders?status=cancel_requested' },
    { label: '재고 부족', value: dashboard.lowStockCount.toLocaleString(), icon: Warehouse, iconBg: 'bg-danger-soft', iconColor: 'text-danger', link: '/admin/products?stock=low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>관리자 대시보드</h1>
        <p className="mt-1 text-muted-foreground">복지몰 운영 현황을 확인하세요.</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-[var(--radius-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-12 rounded-full ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`size-6 ${card.iconColor}`} strokeWidth={1.5} />
              </div>
              {card.link && (
                <Link to={card.link} className="text-primary hover:text-primary/80">
                  <ChevronRight className="size-5" strokeWidth={1.5} />
                </Link>
              )}
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">{card.label}</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'var(--font-weight-semibold)' }} className="mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 */}
      <div className="bg-card rounded-[var(--radius-card)] p-6">
        <h2 className="mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/admin/products/new', icon: PackagePlus, label: '상품 등록' },
            { to: '/admin/users', icon: Coins, label: '포인트 지급' },
            { to: '/admin/orders', icon: ClipboardList, label: '주문 관리' },
            { to: '/admin/products', icon: Warehouse, label: '재고 관리' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-[var(--radius)] hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <action.icon className="size-6 text-muted-foreground" strokeWidth={1.5} />
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}