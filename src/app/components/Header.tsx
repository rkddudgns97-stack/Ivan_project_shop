import { Link, useLocation } from 'react-router';
import { ShoppingBag, CircleUserRound, Gift, Coins, LayoutGrid, ArrowLeftRight } from 'lucide-react';
import { mockCurrentUser } from '../mockData';

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const user = mockCurrentUser;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2">
            <Gift className="size-6 text-primary" strokeWidth={1.5} />
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>사내 복지몰</span>
            {isAdmin && <span style={{ fontSize: 'var(--text-sm)' }} className="text-muted-foreground">(관리자)</span>}
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={location.pathname === '/admin' ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname === '/admin' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  대시보드
                </Link>
                <Link
                  to="/admin/products"
                  className={location.pathname.startsWith('/admin/products') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/products') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  상품 관리
                </Link>
                <Link
                  to="/admin/users"
                  className={location.pathname.startsWith('/admin/users') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/users') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  임직원 관리
                </Link>
                <Link
                  to="/admin/orders"
                  className={location.pathname.startsWith('/admin/orders') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/orders') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  주문 관리
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={location.pathname === '/' ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname === '/' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  홈
                </Link>
                <Link
                  to="/products"
                  className={location.pathname.startsWith('/products') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/products') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  상품
                </Link>
                <Link
                  to="/orders"
                  className={location.pathname.startsWith('/orders') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/orders') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  주문내역
                </Link>
                <Link
                  to="/points"
                  className={location.pathname.startsWith('/points') ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                  style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/points') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
                >
                  포인트
                </Link>
              </>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center gap-4">
            {!isAdmin && (
              <Link to="/cart" className="relative p-2 hover:bg-muted/30 rounded-full">
                <ShoppingBag className="size-5 text-foreground/70" strokeWidth={1.5} />
                <span
                  className="absolute top-0 right-0 size-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  2
                </span>
              </Link>
            )}

            <div className="flex items-center gap-2">
              <CircleUserRound className="size-5 text-foreground/70" strokeWidth={1.5} />
              <span style={{ fontSize: 'var(--text-sm)' }} className="text-foreground/70">{user.name}</span>
            </div>

            {/* 역할 전환 */}
            {user.roles.includes('admin') && (
              <Link
                to={isAdmin ? '/' : '/admin'}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-[var(--radius)]"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {isAdmin ? (
                  <>
                    <ShoppingBag className="size-4" strokeWidth={1.5} />
                    <span>쇼핑몰</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="size-4" strokeWidth={1.5} />
                    <span>관리자</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="md:hidden flex items-center gap-4 pb-3 overflow-x-auto">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className={`whitespace-nowrap ${location.pathname === '/admin' ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname === '/admin' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                대시보드
              </Link>
              <Link
                to="/admin/products"
                className={`whitespace-nowrap ${location.pathname.startsWith('/admin/products') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/products') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                상품 관리
              </Link>
              <Link
                to="/admin/users"
                className={`whitespace-nowrap ${location.pathname.startsWith('/admin/users') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/users') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                임직원 관리
              </Link>
              <Link
                to="/admin/orders"
                className={`whitespace-nowrap ${location.pathname.startsWith('/admin/orders') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/admin/orders') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                주문 관리
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`whitespace-nowrap ${location.pathname === '/' ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname === '/' ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                홈
              </Link>
              <Link
                to="/products"
                className={`whitespace-nowrap ${location.pathname.startsWith('/products') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/products') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                상품
              </Link>
              <Link
                to="/orders"
                className={`whitespace-nowrap ${location.pathname.startsWith('/orders') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/orders') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                주문내역
              </Link>
              <Link
                to="/points"
                className={`whitespace-nowrap ${location.pathname.startsWith('/points') ? 'text-primary' : 'text-foreground/70'}`}
                style={{ fontSize: 'var(--text-sm)', fontWeight: location.pathname.startsWith('/points') ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)' }}
              >
                포인트
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}