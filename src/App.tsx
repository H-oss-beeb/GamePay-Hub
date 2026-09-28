import { useState } from 'react';
import PortalLogin from './components/PortalLogin';
import AdminDashboard from './components/AdminDashboard';
import Storefront from './components/Storefront';
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';
import { AppProvider } from './context/AppContext';
import { GlobalToastContainer } from './components/GlobalToastContainer';

export type Page = 'LOGIN' | 'ADMIN' | 'STORE';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('STORE');
  const [adminRole, setAdminRole] = useState<'MASTER' | 'PARTNER'>('PARTNER');

  return (
    <AppProvider>
      <OrderProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#05070c] text-slate-200 font-sans selection:bg-[#ff6b00]/30 selection:text-white relative" dir="rtl">
            <GlobalToastContainer limit={1} />
            {currentPage === 'STORE' && <Storefront onNavigate={setCurrentPage} />}
            {currentPage === 'LOGIN' && <PortalLogin onNavigate={setCurrentPage} setAdminRole={setAdminRole} />}
            {currentPage === 'ADMIN' && <AdminDashboard onNavigate={setCurrentPage} />}
          </div>
        </CartProvider>
      </OrderProvider>
    </AppProvider>
  );
}

