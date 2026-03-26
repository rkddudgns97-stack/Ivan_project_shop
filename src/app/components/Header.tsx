import { Link, useLocation } from 'react-router';
import { CircleUserRound, Gift, LayoutGrid, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

type NavItem = {
  to: string;
  label: string;
  active: (pathname: string) => boolean;
};

const userNavItems: NavItem[] = [
  { to: '/', label: '홈', active: (pathname) => pathname === '/' },
  { to: '/products', label: '상품', active: (pathname) => pathname.startsWith('/products') },
  { to: '/orders', label: '주문내역', active: (pathname) => pathname.startsWith('/orders') },
  { to: '/points', label: '포인트', active: (pathname) => pathname.startsWith('/points') },
];

const adminNavItems: NavItem[] = [
  { to: '/admin', label: '대시보드', active: (pathname) => pathname === '/admin' },
  { to: '/admin/products', label: '상품 관리', active: (pathname) => pathname.startsWith('/admin/products') },
  { to: '/admin/users', label: '회원 관리', active: (pathname) => pathname.startsWith('/admin/users') },
  { to: '/admin/orders', label: '주문 관리', active: (pathname) => pathname.startsWith('/admin/orders') },
];

function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const isActive = item.active(pathname);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={[
              'rounded-full px-4 py-2 text-sm transition-colors',
              isActive
                ? 'bg-[var(--primary-soft)] text-primary'
                : 'text-muted-foreground hover:bg-[var(--surface-subtle)] hover:text-foreground',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const navItems = isAdmin ? adminNavItems : userNavItems;

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Gift className="size-5" strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold tracking-[0.14em] text-primary">사내 복지 플랫폼</p>
                <div className="flex items-center gap-2">
                  <span className="text-[length:var(--text-lg)] font-semibold text-foreground">
                    사내 복지몰
                  </span>
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      isAdmin
                        ? 'bg-[var(--info-soft)] text-info'
                        : 'bg-[var(--primary-soft)] text-primary',
                    ].join(' ')}
                  >
                    {isAdmin ? '운영 모드' : '직원 모드'}
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-border bg-[var(--surface-subtle)] px-3 py-2 text-sm text-muted-foreground">
              <CircleUserRound className="size-4" strokeWidth={1.7} />
              <span className="font-medium text-foreground">{user.name}</span>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--border-highlight)] hover:bg-[var(--surface-subtle)] hover:text-foreground"
            >
              로그아웃
            </button>

            {user.roles.includes('admin') && (
              <Link
                to={isAdmin ? '/' : '/admin'}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--border-highlight)] hover:bg-[var(--surface-subtle)] hover:text-foreground"
              >
                {isAdmin ? <ShoppingBag className="size-4" strokeWidth={1.7} /> : <LayoutGrid className="size-4" strokeWidth={1.7} />}
                <span>{isAdmin ? '복지몰 보기' : '관리자 전환'}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="flex items-center gap-2 overflow-x-auto">
            <NavLinks items={navItems} pathname={location.pathname} />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            {user.roles.includes('admin') && (
              <Link
                to={isAdmin ? '/' : '/admin'}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--border-highlight)] hover:bg-[var(--surface-subtle)] hover:text-foreground"
              >
                {isAdmin ? <ShoppingBag className="size-4" strokeWidth={1.7} /> : <ShieldCheck className="size-4" strokeWidth={1.7} />}
                <span>{isAdmin ? '복지몰' : '관리자'}</span>
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                className="relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-[var(--surface-subtle)] hover:text-foreground"
              >
                <ShoppingBag className="size-5" strokeWidth={1.7} />
                <span className="absolute right-1.5 top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  2
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
