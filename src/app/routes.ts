import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { ProductDetailPage } from './pages/ProductDetail';
import { CartPage } from './pages/Cart';
import { OrdersPage } from './pages/Orders';
import { OrderDetailPage } from './pages/OrderDetail';
import { PointsPage } from './pages/Points';
import { PointRechargePage } from './pages/PointRecharge';
import { AdminDashboardPage } from './pages/admin/Dashboard';
import { AdminProductsPage } from './pages/admin/Products';
import { AdminUsersPage } from './pages/admin/Users';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      // 사용자 페이지
      { index: true, Component: Home },
      { path: 'products', Component: ProductList },
      { path: 'products/:id', Component: ProductDetailPage },
      { path: 'cart', Component: CartPage },
      { path: 'checkout', Component: CartPage }, // 간단하게 장바구니와 동일하게 처리
      { path: 'orders', Component: OrdersPage },
      { path: 'orders/:id', Component: OrderDetailPage },
      { path: 'points', Component: PointsPage },
      { path: 'points/recharge', Component: PointRechargePage },
      
      // 관리자 페이지
      { path: 'admin', Component: AdminDashboardPage },
      { path: 'admin/products', Component: AdminProductsPage },
      { path: 'admin/products/new', Component: AdminProductsPage }, // 간단하게 목록과 동일
      { path: 'admin/products/:id', Component: AdminProductsPage }, // 간단하게 목록과 동일
      { path: 'admin/users', Component: AdminUsersPage },
      { path: 'admin/orders', Component: OrdersPage }, // 재사용
      { path: 'admin/orders/:id', Component: OrderDetailPage }, // 재사용
      
      // 404
      { path: '*', Component: NotFound },
    ],
  },
]);