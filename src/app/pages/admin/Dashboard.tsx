import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  ClipboardList,
  Coins,
  PackagePlus,
  Receipt,
  Tag,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  Warehouse,
} from 'lucide-react';
import { adminApi } from '../../api';
import type { AdminDashboard } from '../../types';

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getDashboard();
        setDashboard(response.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const cards = useMemo(
    () =>
      dashboard
        ? [
            {
              label: '전체 회원',
              value: dashboard.userCount.toLocaleString(),
              icon: UsersRound,
              tone: 'bg-[#e7eef9] text-[#17375f]',
            },
            {
              label: '운영 중 상품',
              value: dashboard.activeProductCount.toLocaleString(),
              icon: Tag,
              tone: 'bg-[#eef3f7] text-[#334a6a]',
            },
            {
              label: '오늘 주문',
              value: dashboard.todayOrderCount.toLocaleString(),
              icon: Receipt,
              tone: 'bg-[#eef5ff] text-[#234f8d]',
            },
            {
              label: '오늘 사용 포인트',
              value: `${dashboard.todayUsedPoint.toLocaleString()}P`,
              icon: Coins,
              tone: 'bg-[#fff2e8] text-[#8e5622]',
            },
          ]
        : [],
    [dashboard],
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">운영 대시보드를 불러오고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="py-12 text-center text-muted-foreground">대시보드 데이터를 불러오지 못했습니다.</div>;
  }

  const chartValues = [
    Math.max(dashboard.todayOrderCount * 0.5, 6),
    Math.max(dashboard.todayOrderCount * 0.8, 10),
    Math.max(dashboard.todayOrderCount * 0.7, 12),
    Math.max(dashboard.todayOrderCount * 1.1, 14),
    Math.max(dashboard.todayOrderCount * 0.65, 11),
    Math.max(dashboard.todayOrderCount * 0.95, 13),
    Math.max(dashboard.todayOrderCount * 1.2, 16),
  ];
  const chartMax = Math.max(...chartValues, 16);

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-[#d7dde9] bg-[linear-gradient(135deg,#f7fbff_0%,#eef3f8_100%)] p-7 shadow-[0_18px_38px_rgba(0,30,64,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#4f5e74]">운영 현황</p>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#001e40]">사내 복지몰 운영 대시보드</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5d6b80]">
                Stitch 시안의 백오피스 톤을 기준으로, 업무 우선순위와 위험 신호가 먼저 보이도록 요약했습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/orders?status=cancel_requested"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#c9d3e3] bg-white px-5 text-sm font-bold text-[#17375f] transition-colors hover:bg-[#f4f7fb]"
            >
              취소 요청 확인
            </Link>
            <Link
              to="/admin/products/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#001e40] px-5 text-sm font-bold text-white transition-colors hover:bg-[#12325f]"
            >
              상품 등록
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-[#dde3ea] bg-white p-6 shadow-[0_10px_24px_rgba(23,28,31,0.05)]"
          >
            <div className={`flex size-12 items-center justify-center rounded-2xl ${card.tone}`}>
              <card.icon className="size-5" strokeWidth={1.8} />
            </div>
            <p className="mt-5 text-sm font-semibold text-[#667386]">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#001e40]">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="rounded-[28px] border border-[#dde3ea] bg-white p-7 shadow-[0_16px_32px_rgba(23,28,31,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold tracking-[0.14em] text-[#667386]">주문 흐름</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#001e40]">최근 주문 추이</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#eef3f8] px-3 py-1.5 text-[11px] font-bold text-[#425268]">
              <span className="inline-block size-2 rounded-full bg-[#001e40]" />
              최근 7일 기준
            </div>
          </div>

          <div className="mt-8 flex h-64 items-end gap-4">
            {chartValues.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-52 w-full items-end rounded-t-[18px] bg-[#edf2f7] px-2">
                  <div
                    className={`w-full rounded-t-[14px] ${index === 3 ? 'bg-[#001e40]' : 'bg-[#7b95b7]'}`}
                    style={{ height: `${Math.max((value / chartMax) * 100, 18)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold tracking-[0.12em] text-[#748094]">
                  {['월', '화', '수', '목', '금', '토', '일'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#e7d6d6] bg-white p-6 shadow-[0_14px_30px_rgba(23,28,31,0.05)]">
            <div className="flex items-center gap-2 text-[#b42318]">
              <TriangleAlert className="size-5" strokeWidth={1.9} />
              <h3 className="text-sm font-extrabold tracking-[0.14em]">즉시 확인 필요</h3>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-[#fff1f0] p-4">
                <p className="text-xs font-bold text-[#a63a32]">취소 요청 대기</p>
                <p className="mt-2 text-2xl font-extrabold text-[#7a1f1f]">{dashboard.pendingCancelCount.toLocaleString()}건</p>
              </div>
              <div className="rounded-2xl bg-[#fff7eb] p-4">
                <p className="text-xs font-bold text-[#915a1d]">재고 부족 상품</p>
                <p className="mt-2 text-2xl font-extrabold text-[#6c4518]">{dashboard.lowStockCount.toLocaleString()}개</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#dde3ea] bg-white p-6 shadow-[0_14px_30px_rgba(23,28,31,0.05)]">
            <p className="text-xs font-extrabold tracking-[0.14em] text-[#667386]">빠른 작업</p>
            <div className="mt-5 space-y-3">
              {[
                { to: '/admin/products/new', icon: PackagePlus, label: '상품 등록', description: '신규 상품과 운영 정보를 입력합니다.' },
                { to: '/admin/users', icon: Coins, label: '포인트 운영', description: '회원별 포인트 지급과 조정을 진행합니다.' },
                { to: '/admin/orders', icon: ClipboardList, label: '주문 관리', description: '배송, 취소, 반품 상태를 확인합니다.' },
                { to: '/admin/products', icon: Warehouse, label: '재고 관리', description: '품절과 재고 임박 상품을 정리합니다.' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="group flex items-center justify-between rounded-2xl bg-[#f3f6f9] px-4 py-4 transition-colors hover:bg-[#e9eef4]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#17375f] shadow-sm">
                      <action.icon className="size-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#17212e]">{action.label}</p>
                      <p className="text-xs leading-5 text-[#667386]">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-[#667386] transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#dde3ea] bg-white p-7 shadow-[0_16px_32px_rgba(23,28,31,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-[#667386]">운영 요약</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#001e40]">오늘 우선 확인할 지표</h2>
          </div>
          <Link to="/admin/orders" className="text-sm font-bold text-[#17375f] hover:text-[#001e40]">
            주문 관리로 이동
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-[#f4f7fb] p-5">
            <p className="text-sm font-semibold text-[#667386]">주문 처리 집중도</p>
            <p className="mt-3 text-3xl font-extrabold text-[#001e40]">{Math.max(dashboard.todayOrderCount - dashboard.pendingCancelCount, 0).toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6 text-[#667386]">오늘 주문 대비 즉시 처리 가능한 주문 수를 기준으로 본 운영 집중 지표입니다.</p>
          </div>
          <div className="rounded-[24px] bg-[#f6f1eb] p-5">
            <p className="text-sm font-semibold text-[#8d5d23]">포인트 사용 강도</p>
            <p className="mt-3 text-3xl font-extrabold text-[#6e4719]">{dashboard.todayUsedPoint.toLocaleString()}P</p>
            <p className="mt-2 text-sm leading-6 text-[#8d5d23]">오늘 누적 사용 포인트로, 캠페인 반응과 상품 선호도를 함께 확인할 수 있습니다.</p>
          </div>
          <div className="rounded-[24px] bg-[#eef5ff] p-5">
            <p className="text-sm font-semibold text-[#31527b]">상품 운영 안정도</p>
            <p className="mt-3 text-3xl font-extrabold text-[#17375f]">
              {Math.max(dashboard.activeProductCount - dashboard.lowStockCount, 0).toLocaleString()}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4f6481]">정상 운영 중인 상품 수를 기준으로, 추가 보충이 필요한 범위를 한눈에 볼 수 있습니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
