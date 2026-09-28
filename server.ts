import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

// Types
type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// Universal Supplier Adapter Pattern
interface BaseSupplierConfig {
  merchantId: string;
  secretKey: string;
  baseUrl: string;
}

abstract class SupplierAdapter {
  protected config: BaseSupplierConfig;
  
  constructor(config: BaseSupplierConfig) {
    this.config = config;
  }
  
  abstract checkBalance(): Promise<number>;
  abstract processRecharge(playerId: string, productId: string): Promise<{ success: boolean, receipt: string }>;
}

class LikeCardAdapter extends SupplierAdapter {
  async checkBalance() {
    // Simulated LikeCard API call
    return 1250.00;
  }
  
  async processRecharge(playerId: string, productId: string) {
    // Simulated fulfillment
    return { success: true, receipt: `LC-${Math.random().toString(36).substring(7)}` };
  }
}

class MidasBuyAdapter extends SupplierAdapter {
  async checkBalance() {
    // Simulated MidasBuy API call
    return 800.50;
  }
  
  async processRecharge(playerId: string, productId: string) {
    // Simulated fulfillment
    return { success: true, receipt: `MB-${Math.random().toString(36).substring(7)}` };
  }
}

// Active Supplier Instances
const suppliers = {
  likecard: new LikeCardAdapter({ merchantId: 'MK_9941824', secretKey: 'SECRET', baseUrl: 'https://api.likecard.com/v1' }),
  midasbuy: new MidasBuyAdapter({ merchantId: 'M_PUBG_81', secretKey: 'SECRET', baseUrl: 'https://api.midasbuy.com' })
};

interface Order {
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

interface Employee {
  id: string;
  name: string;
  token: string;
  isRevoked: boolean;
  rating: number;
  completed: number;
  failed: number;
}

// In-memory data store for demonstration
let employees: Employee[] = [
  { id: 'EMP-001', name: 'أحمد محمود', token: 'TK-88X9-22M', isRevoked: false, rating: 4.8, completed: 145, failed: 2 },
  { id: 'EMP-002', name: 'محمد علي', token: 'TK-11A2-99L', isRevoked: true, rating: 3.2, completed: 45, failed: 12 },
];

let orders: Order[] = [
  {
    id: "ORD-987123",
    playerId: "5123490812",
    gameType: "PUBG Mobile",
    packageDetails: "660 UC",
    status: "PENDING",
    claimedBy: null,
    receiptUrl: null,
    adminDownloadedReceipt: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    claimedAt: null,
    completedAt: null,
  }
];

// Active SSE clients
let clients: { id: string; res: express.Response }[] = [];

// Broadcast an update to all connected clients
const broadcast = (event: string, data: any) => {
  clients.forEach(client => {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: '10mb' }));

  // --- Real-Time Ping / Latency Check API ---
  app.all('/api/ping', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).send('pong');
  });

  // --- Suppliers API ---
  app.get('/api/suppliers/balance', async (req, res) => {
    try {
      const likecard = await suppliers.likecard.checkBalance();
      const midasbuy = await suppliers.midasbuy.checkBalance();
      res.json({ likecard, midasbuy });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch supplier balances' });
    }
  });

  // --- Employees API ---
  app.get('/api/employees', (req, res) => {
    res.json(employees);
  });

  app.post('/api/employees', (req, res) => {
    const { name, token } = req.body;
    const newEmployee: Employee = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name,
      token,
      isRevoked: false,
      rating: 5.0,
      completed: 0,
      failed: 0
    };
    employees.push(newEmployee);
    res.status(201).json(newEmployee);
  });

  app.patch('/api/employees/:id/revoke', (req, res) => {
    const { id } = req.params;
    const emp = employees.find(e => e.id === id);
    if (emp) {
      emp.isRevoked = true;
      return res.json(emp);
    }
    res.status(404).json({ error: 'Employee not found' });
  });


  // --- Orders API ---
  app.get('/api/orders/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial data
    res.write(`event: initial\ndata: ${JSON.stringify(orders)}\n\n`);

    const clientId = crypto.randomUUID();
    clients.push({ id: clientId, res });

    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });
  });

  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', async (req, res) => {
    const { playerId, gameType, packageDetails } = req.body;
    
    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      playerId,
      gameType,
      packageDetails,
      status: 'IN_PROGRESS',
      claimedBy: 'SYSTEM_AUTO',
      receiptUrl: null,
      adminDownloadedReceipt: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      claimedAt: new Date().toISOString(),
      completedAt: null,
    };
    orders.push(newOrder);
    broadcast('order_created', newOrder);

    // Automated fulfillment
    try {
      const fulfillment = await suppliers.likecard.processRecharge(playerId, packageDetails);
      if (fulfillment.success) {
        newOrder.status = 'COMPLETED';
        newOrder.receiptUrl = fulfillment.receipt;
        newOrder.completedAt = new Date().toISOString();
        newOrder.updatedAt = new Date().toISOString();
        broadcast('order_completed', newOrder);
      }
    } catch (e) {
      newOrder.status = 'FAILED';
      newOrder.updatedAt = new Date().toISOString();
      broadcast('order_updated', newOrder);
    }
    
    res.status(201).json(newOrder);
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      const deletedOrder = orders.splice(orderIndex, 1)[0];
      broadcast('order_deleted', deletedOrder);
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Cannot delete order (not found)' });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, employeeId, receiptUrl } = req.body;

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIndex];

    // Status transitions
    if (status === 'IN_PROGRESS' && order.status === 'PENDING') {
      order.status = 'IN_PROGRESS';
      order.claimedBy = employeeId;
      order.claimedAt = new Date().toISOString();
    } else if (status === 'COMPLETED' && order.status === 'IN_PROGRESS' && order.claimedBy === employeeId) {
      order.status = 'COMPLETED';
      order.receiptUrl = receiptUrl || null;
      order.completedAt = new Date().toISOString();
      
      // Update employee stats
      const emp = employees.find(e => e.id === employeeId);
      if (emp) emp.completed += 1;
      
    } else if (status === 'FAILED' && order.status === 'IN_PROGRESS' && order.claimedBy === employeeId) {
      order.status = 'PENDING'; // Back to pool
      order.claimedBy = null;
      order.claimedAt = null;
      
      const emp = employees.find(e => e.id === employeeId);
      if (emp) emp.failed += 1;
    } else {
       return res.status(400).json({ error: 'Invalid state transition or unauthorized' });
    }

    order.updatedAt = new Date().toISOString();
    
    // Broadcast the update
    broadcast('order_updated', order);

    if (status === 'COMPLETED') {
      broadcast('order_completed', order);
    }
    
    res.json(order);
  });

  app.patch('/api/orders/:id/download', (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });
    
    const order = orders[orderIndex];
    if (order.status === 'COMPLETED') {
      order.adminDownloadedReceipt = true;
      order.updatedAt = new Date().toISOString();
      broadcast('order_updated', order);
      return res.json(order);
    }
    res.status(400).json({ error: 'Order not completed yet' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
