import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { recordOrderToDailyFinancialArchive } from '../utils/financialArchiveSync';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Order {
  id: string;
  playerId: string;
  gameType: string;
  packageDetails: string;
  status: OrderStatus;
  claimedBy: string | null;
  receiptUrl: string | null;
  adminDownloadedReceipt: boolean;
  createdAt: string;
  updatedAt: string;
  claimedAt: string | null;
  completedAt: string | null;
}

export interface Employee {
  id: string;
  name: string;
  token: string;
  isRevoked: boolean;
  rating: number;
  completed: number;
  failed: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info';
}

interface OrderContextProps {
  orders: Order[];
  employees: Employee[];
  toasts: ToastNotification[];
  refreshData: () => Promise<void>;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  setOrdersLocally: (orders: Order[]) => void;
  setEmployeesLocally: (emps: Employee[]) => void;
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

export const saveCompletedOrder = (orderPayload: any) => {
  try {
    // 1. Fetch current stored receipts
    const existingRaw = localStorage.getItem('gamepay_orders');
    let existingOrders: any[] = [];

    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        // Ensure parsed data is strictly an array
        existingOrders = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        existingOrders = [];
      }
    }

    const payloadArray = Array.isArray(orderPayload) ? orderPayload : [orderPayload];
    
    // 2. Prevent duplicate entries if same ID exists
    const validNewOrders = payloadArray.filter(
      newOrder => !existingOrders.some(order => order.id === newOrder.id)
    );

    if (validNewOrders.length === 0) return;

    // 3. Prepend new order (newest on top)
    const updatedOrders = [...validNewOrders, ...existingOrders];

    // 4. Save entire cumulative array back to localStorage
    localStorage.setItem('gamepay_orders', JSON.stringify(updatedOrders));

    // 5. Automatically sync into Daily Financial Archives & recalculate real-time metrics
    recordOrderToDailyFinancialArchive(validNewOrders);

    // 6. Trigger real-time UI re-render events
    window.dispatchEvent(new Event('orders_updated'));
    window.dispatchEvent(new Event('gamepay_orders_updated'));
  } catch (err) {
    console.error("Error saving completed order:", err);
  }
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrdersState] = useState<Order[]>(() => {
    const saved = localStorage.getItem('gamepay_orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [employees, setEmployeesState] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('gamepay_employees');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      const saved = localStorage.getItem('gamepay_orders');
      if (saved) {
        try {
          setOrdersState(JSON.parse(saved));
        } catch (e) {
          setOrdersState([]);
        }
      } else {
        setOrdersState([]);
      }
    };

    const handleLogout = () => {
      setOrdersState([]);
    };

    window.addEventListener('gamepay_orders_updated', handleStorageUpdate);
    window.addEventListener('gamepay_auth_logout', handleLogout);
    window.addEventListener('storage', (e) => {
      if (e.key === 'gamepay_orders') handleStorageUpdate();
    });

    return () => {
      window.removeEventListener('gamepay_orders_updated', handleStorageUpdate);
      window.removeEventListener('gamepay_auth_logout', handleLogout);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);
  
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const setOrdersLocally = useCallback((newOrders: Order[]) => {
    setOrdersState(newOrders);
    // Removed direct localStorage overwrite here to prevent wiping customer receipts
  }, []);

  const setEmployeesLocally = useCallback((newEmps: Employee[]) => {
    setEmployeesState(newEmps);
    localStorage.setItem('gamepay_employees', JSON.stringify(newEmps));
  }, []);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [ordersRes, empRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/employees')
      ]);

      if (ordersRes.ok && ordersRes.headers.get('content-type')?.includes('application/json')) {
        const ordersData = await ordersRes.json();
        setOrdersLocally(ordersData);
      }
      
      if (empRes.ok && empRes.headers.get('content-type')?.includes('application/json')) {
        const empData = await empRes.json();
        setEmployeesLocally(empData);
      }
    } catch (err: any) {
      // Suppress network errors during polling to prevent console spam
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        console.warn("Network unavailable for background sync, will retry.");
      } else {
        console.error("Failed to fetch initial data", err);
      }
    }
  }, [setOrdersLocally, setEmployeesLocally]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    refreshData();

    // Auto-polling sync loop
    const syncInterval = setInterval(() => {
      refreshData();
    }, 2000);

    // Connect to SSE stream
    const eventSource = new EventSource('/api/orders/stream');

    eventSource.addEventListener('initial', (e) => {
      try {
        const initialOrders = JSON.parse(e.data);
        if (Array.isArray(initialOrders)) {
          setOrdersLocally(initialOrders);
        }
      } catch (err) {
        console.error("Failed to parse initial orders", err);
      }
    });

    eventSource.addEventListener('order_created', (e) => {
      try {
        const newOrder = JSON.parse(e.data);
        setOrdersState(prev => [newOrder, ...prev]);
        
        // Update local storage carefully
        const raw = localStorage.getItem('gamepay_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          const existing = Array.isArray(parsed) ? parsed : [];
          if (existing.some(o => o.id === newOrder.id)) {
             const updated = existing.map(o => o.id === newOrder.id ? newOrder : o);
             localStorage.setItem('gamepay_orders', JSON.stringify(updated));
             window.dispatchEvent(new Event('orders_updated'));
          }
        }
        
        // Show notification for employees
        const title = "طلب جديد متاح!";
        const message = `لعبة: ${newOrder.gameType} | باقة: ${newOrder.packageDetails}`;
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: message, icon: '/favicon.ico' });
        }
        addToast({ title, message, type: 'info' });
      } catch (err) {
        console.error("Failed to parse new order", err);
      }
    });

    eventSource.addEventListener('order_updated', (e) => {
      try {
        const updatedOrder = JSON.parse(e.data);
        setOrdersState(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        
        // Update local storage carefully
        const raw = localStorage.getItem('gamepay_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          const existing = Array.isArray(parsed) ? parsed : [];
          if (existing.some(o => o.id === updatedOrder.id)) {
             const updated = existing.map(o => o.id === updatedOrder.id ? updatedOrder : o);
             localStorage.setItem('gamepay_orders', JSON.stringify(updated));
             window.dispatchEvent(new Event('orders_updated'));
          }
        }
      } catch (err) {
        console.error("Failed to parse updated order", err);
      }
    });
    
    eventSource.addEventListener('order_completed', (e) => {
      try {
        const completedOrder = JSON.parse(e.data);
        recordOrderToDailyFinancialArchive(completedOrder);
        setEmployeesState(prev => {
          const emp = prev.find((emp: Employee) => emp.id === completedOrder.claimedBy);
          const empName = emp ? emp.name : completedOrder.claimedBy;
          
          const title = "تم إنجاز طلب جديد!";
          const message = `تم إنجاز الشحنة ${completedOrder.id} بواسطة ${empName}`;
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message, icon: '/favicon.ico' });
          }
          addToast({ title, message, type: 'success' });
          
          return prev; // We just used this to find the name synchronously without a fetch, since we already have it in context
        });
        
        // Fetch fresh employee list to update completed stats
        fetch('/api/employees').then(res => res.json()).then(setEmployeesLocally);
        
      } catch (err) {
        console.error("Failed to process order_completed event", err);
      }
    });

    eventSource.addEventListener('order_deleted', (e) => {
      try {
        const deletedOrder = JSON.parse(e.data);
        setOrdersState(prev => prev.filter(o => o.id !== deletedOrder.id));
        
        // Update local storage carefully
        const raw = localStorage.getItem('gamepay_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          const existing = Array.isArray(parsed) ? parsed : [];
          if (existing.some(o => o.id === deletedOrder.id)) {
             const updated = existing.filter(o => o.id !== deletedOrder.id);
             localStorage.setItem('gamepay_orders', JSON.stringify(updated));
             window.dispatchEvent(new Event('orders_updated'));
          }
        }
      } catch (err) {
        console.error("Failed to parse deleted order", err);
      }
    });

    return () => {
      clearInterval(syncInterval);
      eventSource.close();
    };
  }, [refreshData, setOrdersLocally, setEmployeesLocally, addToast]);

  return (
    <OrderContext.Provider value={{ orders, employees, toasts, refreshData, addToast, removeToast, setOrdersLocally, setEmployeesLocally }}>
      {children}
    </OrderContext.Provider>
  );
};
