import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/Auth';
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetail';
import { CartPage } from './pages/Cart';
import { OrdersPage } from './pages/Orders';
import { OrderDetailPage } from './pages/OrderDetail';
import { MyPage } from './pages/MyPage';
import { PointsPage } from './pages/Points';
import { PointRechargePage } from './pages/PointRecharge';
import { AdminDashboardPage } from './pages/admin/Dashboard';
import { AdminProductsPage } from './pages/admin/Products';
import { AdminUsersPage } from './pages/admin/Users';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: AuthPage,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: ProductList },
      { path: 'search', Component: SearchPage },
      { path: 'products/:id', Component: ProductDetailPage },
      { path: 'cart', Component: CartPage },
      { path: 'checkout', Component: CartPage },
      { path: 'orders', Component: OrdersPage },
      { path: 'orders/:id', Component: OrderDetailPage },
      { path: 'me', Component: MyPage },
      { path: 'points', Component: PointsPage },
      { path: 'points/recharge', Component: PointRechargePage },
      { path: 'admin', Component: AdminDashboardPage },
      { path: 'admin/products', Component: AdminProductsPage },
      { path: 'admin/products/new', Component: AdminProductsPage },
      { path: 'admin/products/:id', Component: AdminProductsPage },
      { path: 'admin/users', Component: AdminUsersPage },
      { path: 'admin/orders', Component: OrdersPage },
      { path: 'admin/orders/:id', Component: OrderDetailPage },
      { path: '*', Component: NotFound },
    ],
  },
]);
