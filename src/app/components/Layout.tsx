import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router';
import {
  Boxes,
  CircleUserRound,
  Coins,
  Gift,
  Grid2x2,
  LayoutGrid,
  Search,
  Settings,
  ShoppingCart,
  Store,
  UsersRound,
  ClipboardList,
} from 'lucide-react';
import { cartApi } from '../api';
import { useAuth } from '../auth/AuthProvider';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Store;
  active: (pathname: string) => boolean;
};

const UI_TEXT = {
  service: '\uC0AC\uB0B4 \uBCF5\uC9C0 \uC11C\uBE44\uC2A4',
  brand: '\uC0AC\uB0B4 \uBCF5\uC9C0\uBAB0',
  point: '\uD3EC\uC778\uD2B8',
  adminBrand: '\uBCF5\uC9C0\uBAB0 \uAD00\uB9AC\uC790',
  adminConsole: '\uC6B4\uC601 \uCF58\uC194',
  dashboard: '\uB300\uC2DC\uBCF4\uB4DC',
  productAdmin: '\uC0C1\uD488 \uAD00\uB9AC',
  userAdmin: '\uD68C\uC6D0 \uAD00\uB9AC',
  orderAdmin: '\uC8FC\uBB38 \uAD00\uB9AC',
  signOut: '\uB85C\uADF8\uC544\uC6C3',
  searchPlaceholder: '\uC6B4\uC601 \uB300\uC2DC\uBCF4\uB4DC \uAC80\uC0C9',
  adminAccount: '\uAD00\uB9AC\uC790 \uACC4\uC815',
  home: '\uD648',
  category: '\uCE74\uD14C\uACE0\uB9AC',
  search: '\uAC80\uC0C9',
  cart: '\uC7A5\uBC14\uAD6C\uB2C8',
  myPage: '\uB9C8\uC774',
} as const;

const userBottomItems: NavItem[] = [
  { to: '/', label: UI_TEXT.home, icon: Store, active: (pathname) => pathname === '/' },
  { to: '/products', label: UI_TEXT.category, icon: Grid2x2, active: (pathname) => pathname.startsWith('/products') },
  {
    to: '/search',
    label: UI_TEXT.search,
    icon: Search,
    active: (pathname) => pathname.startsWith('/search'),
  },
  { to: '/cart', label: UI_TEXT.cart, icon: ShoppingCart, active: (pathname) => pathname.startsWith('/cart') },
  {
    to: '/me',
    label: UI_TEXT.myPage,
    icon: CircleUserRound,
    active: (pathname) => pathname.startsWith('/me'),
  },
];

const adminSideItems: NavItem[] = [
  { to: '/admin', label: UI_TEXT.dashboard, icon: LayoutGrid, active: (pathname) => pathname === '/admin' },
  {
    to: '/admin/products',
    label: UI_TEXT.productAdmin,
    icon: Boxes,
    active: (pathname) => pathname.startsWith('/admin/products'),
  },
  {
    to: '/admin/users',
    label: UI_TEXT.userAdmin,
    icon: UsersRound,
    active: (pathname) => pathname.startsWith('/admin/users'),
  },
  {
    to: '/admin/orders',
    label: UI_TEXT.orderAdmin,
    icon: ClipboardList,
    active: (pathname) => pathname.startsWith('/admin/orders'),
  },
];

function UserShell() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const response = await cartApi.get();
        const count = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    void loadCartCount();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f7f5ff] text-[#232c51]">
      <header className="sticky top-0 z-40 border-b border-[#d5dbff]/70 bg-[#efefff]/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-between px-4 py-3.5 xl:max-w-7xl xl:px-6">
          <div className="flex items-center">
            <div className="leading-none">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-[#00666c]">{UI_TEXT.service}</p>
              <p className="mt-1 text-[16px] font-extrabold tracking-tight text-[#232c51]">{UI_TEXT.brand}</p>
            </div>
          </div>

          <Link
            to="/points"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#9fe7fa] px-3.5 py-2 text-[12px] font-bold text-[#0d6173] transition-colors hover:bg-[#8bdff5]"
          >
            <Coins className="size-4" strokeWidth={1.9} />
            <span>{UI_TEXT.point}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] px-4 pb-28 pt-6 xl:max-w-7xl xl:px-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-[28px] bg-white/96 shadow-[0_-10px_30px_rgba(35,44,81,0.08)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[560px] items-center justify-around px-4 pb-5 pt-3 xl:max-w-7xl">
          {userBottomItems.map((item) => {
            const active = item.active(location.pathname);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={[
                  'flex min-w-[60px] flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all',
                  active ? 'bg-[#efefff] text-[#00666c]' : 'text-[#6c759e] hover:text-[#00666c]',
                ].join(' ')}
              >
                <div className="relative">
                  <item.icon className="size-5" strokeWidth={active ? 2 : 1.8} />
                  {item.to === '/cart' && cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[#ff6b6b] px-1 text-[9px] font-extrabold leading-4 text-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 text-[11px] font-bold tracking-[0.02em]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function AdminShell() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6fafe] text-[#171c1f]">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#f0f4f8] p-4">
        <div className="mb-8 px-4 py-6">
          <p className="text-lg font-extrabold tracking-[0.12em] text-[#001e40]">{UI_TEXT.adminBrand}</p>
          <p className="mt-2 text-[10px] font-bold tracking-[0.22em] text-[#6b7280]">{UI_TEXT.adminConsole}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {adminSideItems.map((item) => {
            const active = item.active(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                  active ? 'bg-white text-[#001e40] shadow-sm' : 'text-[#43474f] hover:bg-[#eaeef2]',
                ].join(' ')}
              >
                <item.icon className="size-5" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#c3c6d1]/30 pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#43474f] transition-colors hover:bg-[#eaeef2]"
          >
            <CircleUserRound className="size-5" strokeWidth={1.8} />
            <span>{UI_TEXT.signOut}</span>
          </button>
        </div>
      </aside>

      <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#c3c6d1]/20 bg-[#f6fafe]/90 px-6 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" strokeWidth={1.8} />
          <input
            readOnly
            value={UI_TEXT.searchPlaceholder}
            className="w-64 rounded-lg bg-[#e4e9ed] py-2 pl-10 pr-4 text-xs font-semibold text-[#667085] outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-[#001e40] transition-colors hover:bg-[#eef2f6]"
          >
            <Settings className="size-5" strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#001e40] text-white">
              <Gift className="size-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#001e40]">{user?.name}</p>
              <p className="text-[11px] font-semibold text-[#667085]">{UI_TEXT.adminAccount}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="ml-64 px-8 pb-10 pt-24">
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  if (!user) {
    return <Navigate to={isAdmin ? '/admin/login' : '/auth'} replace />;
  }

  if (isAdmin && !user.roles.includes('admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  return isAdmin ? <AdminShell /> : <UserShell />;
}
