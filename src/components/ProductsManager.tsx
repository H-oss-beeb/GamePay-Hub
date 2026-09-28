import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Power, AlertTriangle, X, Image as ImageIcon, CheckCircle, Package, ChevronDown, ChevronUp, Save, Undo2, Gamepad2, Film, Trophy, DollarSign, Flame, Percent, Tag, Sparkles, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type PackageType = {
  id: string;
  title: string;
  likecardId: string;
  wholesaleCost: number;
  retailPrice: number;
  onSale?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  expiresAt?: number | null;
  durationLabel?: string;
};

export const DURATION_OPTIONS = [
  { id: '24h', label: '24 ساعة (يوم)', ms: 24 * 60 * 60 * 1000 },
  { id: '3d', label: '3 أيام', ms: 3 * 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7 أيام (أسبوع)', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: 'permanent', label: 'دائم / بدون انتهاء', ms: null }
] as const;

export type DurationId = typeof DURATION_OPTIONS[number]['id'];

export const formatRemainingTime = (expiresAt?: number | null, durationLabel?: string) => {
  if (!expiresAt) {
    return '⏳ دائم / بدون انتهاء';
  }
  const diff = expiresAt - Date.now();
  if (diff <= 0) {
    return '⏳ انتهت مدة العرض';
  }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days >= 1) {
    return `⏳ المتبقي: ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومان' : 'أيام'}${hours > 0 ? ` و ${hours} س` : ''}`;
  }
  if (hours >= 1) {
    return `⏳ المتبقي: ${hours} ساعة${minutes > 0 ? ` و ${minutes} د` : ''}`;
  }
  return `⏳ المتبقي: ${Math.max(1, minutes)} دقيقة`;
};

type ServiceType = {
  id: string;
  name: string;
  category: string;
  image: string;
  isActive: boolean;
  packages: PackageType[];
};

const CATEGORIES = [
  { id: 'الكل', label: 'الكل', icon: null },
  { id: 'الألعاب', label: 'الألعاب', icon: Gamepad2 },
  { id: 'الترفيه والمسلسلات', label: 'الترفيه والمسلسلات', icon: Film },
  { id: 'القنوات الرياضية', label: 'القنوات الرياضية', icon: Trophy }
];

export const INITIAL_SERVICES_DATA: ServiceType[] = [
  // CATEGORY 1: "الألعاب" (10 Services)
  {
    id: '1',
    name: 'PUBG Mobile',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p1_1', title: '60 UC', likecardId: '1042', wholesaleCost: 0.90, retailPrice: 1.25 },
      { id: 'p1_2', title: '325 UC', likecardId: '1043', wholesaleCost: 4.50, retailPrice: 5.50 },
      { id: 'p1_3', title: '660 UC', likecardId: '1044', wholesaleCost: 8.50, retailPrice: 9.99 },
      { id: 'p1_4', title: '1800 UC', likecardId: '1045', wholesaleCost: 22.00, retailPrice: 21.25, originalPrice: 25.00, onSale: true, discountPercent: 15 }
    ]
  },
  {
    id: '2',
    name: 'Yalla Ludo',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p2_1', title: '10 Gold Coins', likecardId: '3011', wholesaleCost: 0.90, retailPrice: 1.50 },
      { id: 'p2_2', title: '50 Gold Coins', likecardId: '3012', wholesaleCost: 4.50, retailPrice: 6.00 }
    ]
  },
  {
    id: '3',
    name: 'Free Fire',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p3_1', title: '100 Diamonds', likecardId: '2011', wholesaleCost: 0.85, retailPrice: 1.20 },
      { id: 'p3_2', title: '210 Diamonds', likecardId: '2012', wholesaleCost: 1.80, retailPrice: 2.50 }
    ]
  },
  {
    id: '4',
    name: 'Roblox',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p4_1', title: '800 Robux', likecardId: '5011', wholesaleCost: 9.00, retailPrice: 11.50 }
    ]
  },
  {
    id: '5',
    name: 'Fortnite',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p5_1', title: '1000 V-Bucks', likecardId: '5511', wholesaleCost: 7.50, retailPrice: 9.99 }
    ]
  },
  {
    id: '6',
    name: 'Razer Gold',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p6_1', title: '$10 Razer Gold', likecardId: '5611', wholesaleCost: 9.50, retailPrice: 11.00 }
    ]
  },
  {
    id: '7',
    name: 'PlayStation Network',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p7_1', title: '$10 Card', likecardId: '6011', wholesaleCost: 9.50, retailPrice: 11.00 },
      { id: 'p7_2', title: '$20 Card', likecardId: '6012', wholesaleCost: 19.00, retailPrice: 22.00 }
    ]
  },
  {
    id: '8',
    name: 'Apple / iTunes',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p8_1', title: '$10 iTunes', likecardId: '6811', wholesaleCost: 9.50, retailPrice: 10.50 }
    ]
  },
  {
    id: '9',
    name: 'Google Play',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p9_1', title: '$10 Google Play', likecardId: '6911', wholesaleCost: 9.50, retailPrice: 10.50 }
    ]
  },
  {
    id: '10',
    name: 'Steam Wallet',
    category: 'الألعاب',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p10_1', title: '$10 Steam', likecardId: '7011', wholesaleCost: 9.50, retailPrice: 11.50 }
    ]
  },

  // CATEGORY 2: "الترفيه والمسلسلات" (7 Services)
  {
    id: '11',
    name: 'Netflix',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p11_1', title: 'اشتراك شهر شاشة واحدة', likecardId: '7111', wholesaleCost: 3.50, retailPrice: 5.00 }
    ]
  },
  {
    id: '12',
    name: 'Shahid VIP',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p12_1', title: 'اشتراك شهري', likecardId: '8011', wholesaleCost: 4.50, retailPrice: 6.50 }
    ]
  },
  {
    id: '13',
    name: 'STARZPLAY',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p13_1', title: 'اشتراك شهري', likecardId: '9011', wholesaleCost: 3.00, retailPrice: 4.50 }
    ]
  },
  {
    id: '14',
    name: 'OSN',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p14_1', title: 'اشتراك شهري', likecardId: '9411', wholesaleCost: 4.00, retailPrice: 5.50 }
    ]
  },
  {
    id: '15',
    name: 'Anghami Plus',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p15_1', title: 'اشتراك شهري', likecardId: '9511', wholesaleCost: 2.50, retailPrice: 3.50 }
    ]
  },
  {
    id: '16',
    name: 'TikTok Coins',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p16_1', title: '100 Coins', likecardId: '9611', wholesaleCost: 1.50, retailPrice: 2.00 }
    ]
  },
  {
    id: '17',
    name: 'Spotify Premium',
    category: 'الترفيه والمسلسلات',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p17_1', title: 'اشتراك شهري', likecardId: '9711', wholesaleCost: 3.50, retailPrice: 5.00 }
    ]
  },

  // CATEGORY 3: "القنوات الرياضية" (3 Services)
  {
    id: '18',
    name: 'beIN Connect / Sports',
    category: 'القنوات الرياضية',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p18_1', title: 'اشتراك شهري', likecardId: '10011', wholesaleCost: 15.00, retailPrice: 20.00 }
    ]
  },
  {
    id: '19',
    name: 'Shahid VIP Sports',
    category: 'القنوات الرياضية',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p19_1', title: 'اشتراك شهري رياضي', likecardId: '11011', wholesaleCost: 12.00, retailPrice: 16.00 }
    ]
  },
  {
    id: '20',
    name: 'STARZPLAY Sports',
    category: 'القنوات الرياضية',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200',
    isActive: true,
    packages: [
      { id: 'p20_1', title: 'اشتراك رياضي شهري', likecardId: '12011', wholesaleCost: 8.00, retailPrice: 12.00 }
    ]
  }
];

const INITIAL_SERVICES = INITIAL_SERVICES_DATA;

export default function ProductsManager() {
  const { formatIQD, exchangeRatePerUSD } = useApp();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [services, setServices] = useState<ServiceType[]>(() => {
    const savedServices = localStorage.getItem('gamepay_services');
    return savedServices ? JSON.parse(savedServices) : INITIAL_SERVICES_DATA;
  });
  const [draftServices, setDraftServices] = useState<ServiceType[]>(() => {
    const savedServices = localStorage.getItem('gamepay_services');
    return savedServices ? JSON.parse(savedServices) : INITIAL_SERVICES_DATA;
  });
  
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set(['1']));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Discount Management State
  const [selectedDiscountServiceId, setSelectedDiscountServiceId] = useState<string>('1');
  const [selectedDiscountPackageId, setSelectedDiscountPackageId] = useState<string>('ALL');
  const [discountPercentInput, setDiscountPercentInput] = useState<number>(15);
  const [selectedDuration, setSelectedDuration] = useState<DurationId>('3d');

  const selectedDiscountService = useMemo(() => {
    return draftServices.find(s => s.id === selectedDiscountServiceId) || draftServices[0];
  }, [draftServices, selectedDiscountServiceId]);

  // Aggregated Active Discounts by Service
  const aggregatedActiveDiscounts = useMemo(() => {
    const now = Date.now();
    const list: {
      serviceId: string;
      serviceName: string;
      serviceCategory: string;
      serviceImage?: string;
      discountedCount: number;
      totalPackages: number;
      maxDiscountPercent: number;
      expiresAt?: number | null;
      durationLabel?: string;
    }[] = [];

    draftServices.forEach(s => {
      const activePkgs = s.packages.filter(p => 
        p.onSale && 
        (p.discountPercent || 0) > 0 && 
        (!p.expiresAt || p.expiresAt > now)
      );

      if (activePkgs.length > 0) {
        const maxPercent = Math.max(...activePkgs.map(p => p.discountPercent || 0));
        const timedExpiries = activePkgs.filter(p => typeof p.expiresAt === 'number' && p.expiresAt > 0);
        const earliestExpiry = timedExpiries.length > 0
          ? Math.min(...timedExpiries.map(p => p.expiresAt as number))
          : null;

        list.push({
          serviceId: s.id,
          serviceName: s.name,
          serviceCategory: s.category,
          serviceImage: s.image,
          discountedCount: activePkgs.length,
          totalPackages: s.packages.length,
          maxDiscountPercent: maxPercent,
          expiresAt: earliestExpiry,
          durationLabel: activePkgs[0]?.durationLabel
        });
      }
    });

    return list;
  }, [draftServices]);

  // Automatic clean-up and reversion of expired promotions
  useEffect(() => {
    const checkExpiredDiscounts = () => {
      const now = Date.now();
      let hasExpired = false;

      const updated = services.map(s => {
        let serviceModified = false;
        const pkgs = s.packages.map(p => {
          if (p.onSale && p.expiresAt && p.expiresAt <= now) {
            hasExpired = true;
            serviceModified = true;
            return {
              ...p,
              onSale: false,
              discountPercent: 0,
              retailPrice: p.originalPrice || p.retailPrice,
              expiresAt: null,
              durationLabel: undefined
            };
          }
          return p;
        });
        return serviceModified ? { ...s, packages: pkgs } : s;
      });

      if (hasExpired) {
        setServices(updated);
        setDraftServices(updated);
        localStorage.setItem('gamepay_services', JSON.stringify(updated));
        window.dispatchEvent(new Event('gamepay_services_updated'));
      }
    };

    checkExpiredDiscounts();
    const timer = setInterval(checkExpiredDiscounts, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, [services]);

  const handleApplyDiscount = () => {
    if (!selectedDiscountServiceId || discountPercentInput <= 0) {
      showToast('يرجى تحديد الخدمة ونسبة الخصم أولاً');
      return;
    }

    const durationObj = DURATION_OPTIONS.find(d => d.id === selectedDuration) || DURATION_OPTIONS[1];
    const expiresAt = durationObj.ms ? Date.now() + durationObj.ms : null;
    const durationLabel = durationObj.label;

    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== selectedDiscountServiceId) return s;
      return {
        ...s,
        packages: s.packages.map(p => {
          if (selectedDiscountPackageId !== 'ALL' && p.id !== selectedDiscountPackageId) {
            return p;
          }
          const orig = p.originalPrice || p.retailPrice;
          const discounted = Number((orig * (1 - (discountPercentInput / 100))).toFixed(2));
          return {
            ...p,
            onSale: true,
            discountPercent: discountPercentInput,
            originalPrice: orig,
            retailPrice: discounted,
            expiresAt: expiresAt,
            durationLabel: durationLabel
          };
        })
      };
    });

    const updated = updater(services);
    setServices(updated);
    setDraftServices(prev => updater(prev));
    localStorage.setItem('gamepay_services', JSON.stringify(updated));
    const statusMap = updated.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    window.dispatchEvent(new Event('gamepay_services_updated'));
    showToast(`تم تطبيق خصم ${discountPercentInput}% بنجاح لمدة (${durationLabel}) وتحديث المتجر فوراً! 🔥`);
  };

  const handleRemoveDiscount = (serviceId: string, packageId: string | 'ALL') => {
    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        packages: s.packages.map(p => {
          if (packageId !== 'ALL' && p.id !== packageId) {
            return p;
          }
          const orig = p.originalPrice || p.retailPrice;
          return {
            ...p,
            onSale: false,
            discountPercent: 0,
            retailPrice: orig,
            expiresAt: null,
            durationLabel: undefined
          };
        })
      };
    });

    const updated = updater(services);
    setServices(updated);
    setDraftServices(prev => updater(prev));
    localStorage.setItem('gamepay_services', JSON.stringify(updated));
    const statusMap = updated.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    window.dispatchEvent(new Event('gamepay_services_updated'));
    showToast('تم إلغاء العرض بالكامل واستعادة السعر الأصلي بنجاح 🔄');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Automatically sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('gamepay_services', JSON.stringify(services));
    const statusMap = services.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
  }, [services]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newService, setNewService] = useState<{name: string, category: string, image: string, packages: PackageType[]}>({ name: '', category: 'الألعاب', image: '', packages: [] });

  // Modal Scroll Lock & Escape key listener for Add Service Modal
  useEffect(() => {
    if (isAddModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsAddModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAddModalOpen]);

  const hasChanges = JSON.stringify(services) !== JSON.stringify(draftServices);

  const handleSaveChanges = () => {
    setServices(draftServices);
    localStorage.setItem('gamepay_services', JSON.stringify(draftServices));
    const statusMap = draftServices.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    showToast('تم حفظ جميع التعديلات ومزامنتها بنجاح!');
  };

  const handleCancelChanges = () => {
    setDraftServices(services);
  };

  // Preserve toggle immediately in React state and localStorage
  const toggleServiceStatus = (serviceId: string) => {
    const updatedServices = services.map(s => s.id === serviceId ? { ...s, isActive: !s.isActive } : s);
    setServices(updatedServices);
    setDraftServices(prev => prev.map(s => s.id === serviceId ? { ...s, isActive: !s.isActive } : s));
    localStorage.setItem('gamepay_services', JSON.stringify(updatedServices));
    const statusMap = updatedServices.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
  };
  const toggleServiceActive = toggleServiceStatus;

  // Preserve price edits immediately in React state and localStorage
  const updatePackagePrice = (serviceId: string, packageId: string, retailPrice: number) => {
    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        packages: s.packages.map(p => p.id === packageId ? { ...p, retailPrice } : p)
      };
    });

    const updated = updater(services);
    setServices(updated);
    setDraftServices(prev => updater(prev));
    localStorage.setItem('gamepay_services', JSON.stringify(updated));
  };

  const toggleExpand = (id: string) => {
    setExpandedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updatePackage = (serviceId: string, packageId: string, field: keyof PackageType, value: any) => {
    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        packages: s.packages.map(p => {
          if (p.id !== packageId) return p;
          return { ...p, [field]: value };
        })
      };
    });

    setDraftServices(prev => updater(prev));
    const updatedServices = updater(services);
    setServices(updatedServices);
    localStorage.setItem('gamepay_services', JSON.stringify(updatedServices));
  };

  const addPackage = (serviceId: string) => {
    const newPkg: PackageType = {
      id: Math.random().toString(),
      title: '',
      likecardId: '',
      wholesaleCost: 0,
      retailPrice: 0
    };
    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== serviceId) return s;
      return { ...s, packages: [...s.packages, newPkg] };
    });

    const updatedServices = updater(services);
    setServices(updatedServices);
    setDraftServices(prev => updater(prev));
    localStorage.setItem('gamepay_services', JSON.stringify(updatedServices));
    setExpandedServiceIds(prev => new Set([...prev, serviceId]));
  };

  const deletePackage = (serviceId: string, packageId: string) => {
    const updater = (list: ServiceType[]) => list.map(s => {
      if (s.id !== serviceId) return s;
      return { ...s, packages: s.packages.filter(p => p.id !== packageId) };
    });

    const updatedServices = updater(services);
    setServices(updatedServices);
    setDraftServices(prev => updater(prev));
    localStorage.setItem('gamepay_services', JSON.stringify(updatedServices));
  };

  const handleAddServiceSubmit = () => {
    if (!(newService?.name || '').trim()) return;
    const s: ServiceType = {
      id: Math.random().toString(),
      name: newService.name,
      category: newService.category,
      image: newService.image,
      isActive: true,
      packages: newService.packages
    };
    const updated = [s, ...services];
    setServices(updated);
    setDraftServices(updated);
    localStorage.setItem('gamepay_services', JSON.stringify(updated));
    setExpandedServiceIds(prev => new Set([...prev, s.id]));
    setIsAddModalOpen(false);
    setNewService({ name: '', category: 'الألعاب', image: '', packages: [] });
    showToast('تمت إضافة الخدمة الجديدة بنجاح!');
  };

  // Reset / Restore default data
  const handleResetDefaults = () => {
    localStorage.removeItem('gamepay_services');
    localStorage.removeItem('gamepay_services_status');
    setServices(INITIAL_SERVICES_DATA);
    setDraftServices(INITIAL_SERVICES_DATA);
    localStorage.setItem('gamepay_services', JSON.stringify(INITIAL_SERVICES_DATA));
    const statusMap = INITIAL_SERVICES_DATA.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    showToast('تمت إعادة ضبط المصنع للخدمات واسترجاع البيانات الأصلية 🔄');
  };

  const filteredDraftServices = draftServices.filter(s => 
    (activeCategory === 'الكل' || s.category === activeCategory) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.packages.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      
      {/* Toast Feedback - Fixed safely below top navbar to eliminate clipping on mobile & desktop */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[150] max-w-[92vw] sm:max-w-md w-auto bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_12px_35px_rgba(245,158,11,0.45)] flex items-center justify-center gap-2.5 text-xs sm:text-sm border-2 border-white/40 backdrop-blur-md text-center"
          >
            <CheckCircle className="w-5 h-5 shrink-0 text-slate-950" />
            <span className="leading-snug">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Actions: Reset & Status Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>مزامنة فورية وتلقائية للأسعار وحالة التوفر مع المتجر</span>
        </div>
        <button 
          onClick={handleResetDefaults}
          className="text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 px-3 py-1.5 rounded-lg font-medium transition-colors border border-transparent hover:border-slate-700 active:scale-95"
          title="مسح التعديلات واستعادة القائمة الافتراضية"
        >
          إعادة ضبط المصنع للخدمات 🔄
        </button>
      </div>
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto w-full md:w-auto hide-scrollbar shrink-0 backdrop-blur-md">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button 
                key={c.id} 
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === c.id ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {c.label}
              </button>
            )
          })}
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="بحث عن خدمة أو باقة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800/80 text-sm rounded-xl py-2.5 pr-9 pl-4 text-white focus:outline-none focus:border-amber-500" 
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors shadow-lg"
          >
             <Plus className="w-4 h-4" /> <span className="hidden sm:inline">إضافة خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* DEDICATED DISCOUNT & PROMOTIONS MANAGEMENT WIDGET */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Flame className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                🔥 إدارة العروض والخصومات
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  تحديث مباشر للمتجر
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تطبيق وحذف الخصومات الترويجية على الخدمات والباقات مع المزامنة التلقائية المباشرة للمتجر وكشف الحساب
              </p>
            </div>
          </div>
          <div>
            {aggregatedActiveDiscounts.length > 0 ? (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                {aggregatedActiveDiscounts.length} خدمات مروّجة نشطة
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium">
                لا توجد عروض نشطة حالياً
              </span>
            )}
          </div>
        </div>

        {/* Discount Application Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Dropdown 1: Service */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>1. اختر الخدمة / اللعبة</span>
            </label>
            <select
              value={selectedDiscountServiceId}
              onChange={(e) => {
                setSelectedDiscountServiceId(e.target.value);
                setSelectedDiscountPackageId('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
            >
              {draftServices.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Package */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>2. اختر الباقة المستهدفة</span>
            </label>
            <select
              value={selectedDiscountPackageId}
              onChange={(e) => setSelectedDiscountPackageId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
            >
              <option value="ALL">🔥 تطبيق على جميع باقات الخدمة ({selectedDiscountService?.packages.length || 0} باقات)</option>
              {selectedDiscountService?.packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} - ${p.originalPrice || p.retailPrice} USD {p.onSale ? `(خصم %${p.discountPercent} نشط)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Input 3: Discount Percentage */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>3. نسبة الخصم المئوية (%)</span>
              </span>
              <span className="text-amber-400 font-mono font-black text-sm">%{discountPercentInput}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="90"
                value={discountPercentInput}
                onChange={(e) => setDiscountPercentInput(Math.max(1, Math.min(90, Number(e.target.value) || 0)))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm outline-none pr-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {[10, 15, 20, 25, 30, 50].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercentInput(pct)}
                  className={`px-2 py-0.5 text-xs rounded-lg font-bold transition-all ${
                    discountPercentInput === pct 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  %{pct}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. DISCOUNT DURATION SELECTOR */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>4. اختر مدة العرض والخصم</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {selectedDuration === 'permanent' 
                ? '✅ العرض مستمر بدون انتهاء حتى الإلغاء اليدوي' 
                : '⏳ سيتم استرجاع السعر الأساسي تلقائياً عند انتهاء المدة المحددة'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DURATION_OPTIONS.map(opt => {
              const isSelected = selectedDuration === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 border border-amber-400'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Calculation Preview & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-5">
          <div className="text-xs space-y-1">
            <span className="text-slate-400 block font-medium">معاينة الحسبة والخصم:</span>
            {selectedDiscountPackageId === 'ALL' ? (
              <div className="text-amber-400 font-bold flex flex-wrap items-center gap-2">
                <span>🔥 سيتم تطبيق خصم %{discountPercentInput} على كافة باقات خدمة:</span>
                <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{selectedDiscountService?.name}</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono text-[11px]">
                  المدة: {DURATION_OPTIONS.find(d => d.id === selectedDuration)?.label}
                </span>
              </div>
            ) : (() => {
              const targetPkg = selectedDiscountService?.packages.find(p => p.id === selectedDiscountPackageId);
              if (!targetPkg) return null;
              const orig = targetPkg.originalPrice || targetPkg.retailPrice;
              const discounted = Number((orig * (1 - (discountPercentInput / 100))).toFixed(2));
              const savings = Number((orig - discounted).toFixed(2));
              return (
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="text-slate-400 line-through">${orig.toFixed(2)} USD</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-emerald-400 font-black text-sm">${discounted.toFixed(2)} USD</span>
                  <span className="text-amber-400 font-bold">(~{formatIQD(discounted).toLocaleString()} د.ع)</span>
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px] font-sans">
                    توفير ${savings.toFixed(2)} USD
                  </span>
                  <span className="text-slate-400 text-[11px] font-sans">
                    • المدة: {DURATION_OPTIONS.find(d => d.id === selectedDuration)?.label}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRemoveDiscount(selectedDiscountServiceId, selectedDiscountPackageId)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء الخصم</span>
            </button>
            <button
              onClick={handleApplyDiscount}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>🔥 تطبيق الخصم</span>
            </button>
          </div>
        </div>

        {/* 1. CONSOLIDATED ACTIVE DISCOUNTS LIST (تجميع العروض حسب الخدمة) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>العروض والخصومات المفعّلة حالياً ({aggregatedActiveDiscounts.length} خدمات مروّجة)</span>
            </h3>
            {aggregatedActiveDiscounts.length > 0 && (
              <span className="text-[11px] text-amber-400/90 font-medium">
                تجميع ملخّص حسب الخدمة
              </span>
            )}
          </div>

          {aggregatedActiveDiscounts.length === 0 ? (
            <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-500">
              لا توجد عروض أو خصومات نشطة حالياً. اختر خدمة وباقة وحدد المدة من النموذج أعلاه واضغط "🔥 تطبيق الخصم" لتفعيلها فوراً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {aggregatedActiveDiscounts.map(disc => {
                const isAllPackages = disc.discountedCount === disc.totalPackages;
                const scopeLabel = isAllPackages 
                  ? `تطبيق على كافة الباقات (${disc.discountedCount} باقات)`
                  : `تطبيق على ${disc.discountedCount} ${disc.discountedCount === 1 ? 'باقة' : disc.discountedCount === 2 ? 'باقتين' : 'باقات'}`;
                const remainingText = formatRemainingTime(disc.expiresAt, disc.durationLabel);

                return (
                  <div
                    key={disc.serviceId}
                    className="bg-slate-950/90 border border-amber-500/40 hover:border-amber-500/70 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden transition-all group"
                  >
                    {/* Top row: Image, Name, and Discount Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                          {disc.serviceImage ? (
                            <img src={disc.serviceImage} alt={disc.serviceName} className="w-full h-full object-cover" />
                          ) : (
                            <Gamepad2 className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-white text-sm sm:text-base truncate">{disc.serviceName}</h4>
                          <span className="text-[11px] text-slate-400 block truncate">{disc.serviceCategory}</span>
                        </div>
                      </div>

                      <span className="shrink-0 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md border border-rose-400/30 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-white text-white" />
                        <span>خصم {disc.maxDiscountPercent}%</span>
                      </span>
                    </div>

                    {/* Middle details: Package Scope & Expiration */}
                    <div className="bg-slate-900/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-medium">نطاق الباقات:</span>
                        <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {scopeLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 font-medium">صلاحية العرض:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {remainingText}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action: Single Action Button */}
                    <button
                      onClick={() => handleRemoveDiscount(disc.serviceId, 'ALL')}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      <X className="w-4 h-4" />
                      <span>❌ إلغاء العرض بالكامل</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accordion Service Cards */}
      <div className="space-y-4">
        {filteredDraftServices.map(service => (
          <div key={service.id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md transition-all shadow-xl">
            {/* Service Header Row */}
            <div className="p-4 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors" onClick={() => toggleExpand(service.id)}>
               <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                   {service.image ? <img src={service.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-3 text-slate-600" />}
               </div>
               <div className="flex-1 min-w-0">
                   <h3 className="font-black text-white text-base md:text-lg truncate">{service.name}</h3>
                   <div className="flex flex-wrap items-center gap-2 mt-1">
                       <span className="text-[10px] sm:text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 truncate">{service.category}</span>
                       <span className="text-[10px] sm:text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">{service.packages.length} باقات</span>
                   </div>
               </div>
               <div className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                   <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={service.isActive} onChange={() => toggleServiceActive(service.id)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${service.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${service.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                    <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
                    <button onClick={() => toggleExpand(service.id)} className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors">
                        تعديل الأسعار {expandedServiceIds.has(service.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleExpand(service.id)} className="sm:hidden p-2 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800 transition-colors">
                        {expandedServiceIds.has(service.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
               </div>
            </div>
            
            {/* Expanded Packages Content */}
            <AnimatePresence>
                {expandedServiceIds.has(service.id) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-800/80 bg-slate-950/30">
                        <div className="p-4 sm:p-6">
                            
                             {/* Mobile View: Stacked Cards */}
                            <div className="md:hidden space-y-3">
                                {service.packages.map(pkg => {
                                  const profitAmount = pkg.retailPrice - pkg.wholesaleCost;
                                  const isLoss = profitAmount < 0;
                                  const hasDiscount = Boolean(pkg.onSale && (pkg.discountPercent || 0) > 0);
                                  return (
                                    <div key={pkg.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 relative">
                                        {hasDiscount && (
                                          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-amber-300 text-xs font-bold mb-1 shadow-sm">
                                            <span className="flex items-center gap-1.5">
                                              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1">
                                                <Flame className="w-3 h-3 fill-slate-950" />
                                                <span>خصم {pkg.discountPercent}%</span>
                                              </span>
                                              {pkg.durationLabel && <span className="text-[10px] text-slate-400 font-normal">({pkg.durationLabel})</span>}
                                            </span>
                                            <button
                                              onClick={() => handleRemoveDiscount(service.id, pkg.id)}
                                              className="text-[10px] underline hover:text-white text-rose-400 cursor-pointer"
                                            >
                                              إلغاء الخصم
                                            </button>
                                          </div>
                                        )}
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 space-y-3 w-full pr-8">
                                                <div>
                                                  <label className="text-xs text-slate-400 mb-1 block">اسم الباقة</label>
                                                  <input type="text" value={pkg.title} onChange={e => updatePackage(service.id, pkg.id, 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-amber-500 outline-none" />
                                                </div>
                                                <div>
                                                  <label className="text-xs text-slate-400 mb-1 block">رمز المنتج (LikeCard)</label>
                                                  <input type="text" value={pkg.likecardId} onChange={e => updatePackage(service.id, pkg.id, 'likecardId', e.target.value)} className="w-full bg-slate-950 border border-amber-500/30 text-amber-500 rounded-lg p-2 text-sm font-mono focus:border-amber-500 outline-none" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                  <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">سعر التكلفة ($)</label>
                                                    <input type="number" value={pkg.wholesaleCost} onChange={e => updatePackage(service.id, pkg.id, 'wholesaleCost', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg p-2 text-sm font-mono focus:border-amber-500 outline-none" />
                                                  </div>
                                                  <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                      <label className="text-xs text-slate-400">سعر البيع ($ / د.ع)</label>
                                                      {hasDiscount && pkg.originalPrice && (
                                                        <span className="text-[10px] text-slate-500 line-through font-mono">
                                                          ${pkg.originalPrice.toFixed(2)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <input type="number" value={pkg.retailPrice} onChange={e => updatePackage(service.id, pkg.id, 'retailPrice', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-lg p-2 text-sm font-mono focus:border-amber-500 outline-none" />
                                                    <div className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-center mt-1">
                                                      ≈ {formatIQD(pkg.retailPrice).toLocaleString()} د.ع
                                                    </div>
                                                  </div>

                                                </div>
                                                <div>
                                                  <label className="text-xs text-slate-400 mb-1 block">صافي الربح</label>
                                                  <div className={`w-full flex items-center justify-center gap-2 rounded-lg p-2 text-sm font-bold border ${isLoss ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                                      {isLoss ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                      <span>{isLoss ? '⚠️ خسارة!' : `+ $${profitAmount.toFixed(2)}`}</span>
                                                  </div>
                                                </div>
                                            </div>
                                            <button onClick={() => deletePackage(service.id, pkg.id)} className="absolute top-4 left-4 p-2 text-slate-500 hover:text-red-400 bg-slate-950 rounded-lg border border-slate-800 transition-colors shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                  )
                                })}
                            </div>

                            {/* Desktop View: Wide Table */}
                            <div className="hidden md:block w-full overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-slate-400 border-b border-slate-800">
                                            <th className="pb-3 px-3 font-medium min-w-[150px]">اسم الباقة</th>
                                            <th className="pb-3 px-3 font-medium min-w-[120px]">رمز المنتج</th>
                                            <th className="pb-3 px-3 font-medium min-w-[100px]">سعر التكلفة ($)</th>
                                            <th className="pb-3 px-3 font-medium min-w-[140px]">سعر البيع ($ / د.ع)</th>
                                            <th className="pb-3 px-3 font-medium min-w-[120px]">صافي الربح</th>
                                            <th className="pb-3 px-3 font-medium text-left">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {service.packages.map(pkg => {
                                          const profitAmount = pkg.retailPrice - pkg.wholesaleCost;
                                          const isLoss = profitAmount < 0;
                                          const iqdPrice = formatIQD(pkg.retailPrice);
                                          const hasDiscount = Boolean(pkg.onSale && (pkg.discountPercent || 0) > 0);
                                          return (
                                            <tr key={pkg.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                                                <td className="p-3">
                                                    <input type="text" value={pkg.title} onChange={e => updatePackage(service.id, pkg.id, 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                                                </td>
                                                <td className="p-3">
                                                    <input type="text" value={pkg.likecardId} onChange={e => updatePackage(service.id, pkg.id, 'likecardId', e.target.value)} className="w-full bg-slate-950 border border-amber-500/30 text-amber-500 font-mono rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                                                </td>
                                                <td className="p-3">
                                                    <input type="number" value={pkg.wholesaleCost} onChange={e => updatePackage(service.id, pkg.id, 'wholesaleCost', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-slate-300 font-mono rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                                                </td>
                                                <td className="p-3">
                                                    <div className="space-y-1">
                                                      <div className="flex items-center gap-1.5">
                                                        <input type="number" value={pkg.retailPrice} onChange={e => updatePackage(service.id, pkg.id, 'retailPrice', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold font-mono rounded-lg px-3 py-1.5 text-sm focus:border-amber-500 outline-none" />
                                                        {hasDiscount && (
                                                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm whitespace-nowrap">
                                                            <Flame className="w-3 h-3 fill-slate-950" />
                                                            <span>خصم {pkg.discountPercent}%</span>
                                                          </span>
                                                        )}
                                                      </div>
                                                      {hasDiscount && pkg.originalPrice && (
                                                        <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                                                          <span>الأصلي:</span>
                                                          <span className="line-through font-mono">${pkg.originalPrice.toFixed(2)}</span>
                                                        </div>
                                                      )}
                                                      <div className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-center">
                                                        ≈ {iqdPrice.toLocaleString()} د.ع
                                                      </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${isLoss ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                                        {isLoss ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                        {isLoss ? 'خسارة!' : `+ $${profitAmount.toFixed(2)}`}
                                                    </div>
                                                </td>

                                                <td className="p-3 text-left">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                      {hasDiscount ? (
                                                        <button 
                                                          onClick={() => handleRemoveDiscount(service.id, pkg.id)} 
                                                          title="إلغاء الخصم واستعادة السعر الأصلي"
                                                          className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg border border-rose-500/30 transition-colors"
                                                        >
                                                          <Percent className="w-4 h-4" />
                                                        </button>
                                                      ) : (
                                                        <button 
                                                          onClick={() => {
                                                            setSelectedDiscountServiceId(service.id);
                                                            setSelectedDiscountPackageId(pkg.id);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                          }} 
                                                          title="تطبيق عرض وخصم ترويجي على هذه الباقة"
                                                          className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        >
                                                          <Flame className="w-4 h-4" />
                                                        </button>
                                                      )}
                                                      <button onClick={() => deletePackage(service.id, pkg.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors">
                                                          <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                </td>
                                            </tr>
                                          )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {service.packages.length === 0 && (
                                <div className="text-center p-6 text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800 my-4 text-sm">
                                    لا توجد باقات. ابدأ بإضافة باقة جديدة.
                                </div>
                            )}
                            
                            <button onClick={() => addPackage(service.id)} className="mt-4 flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700/50 border-dashed transition-colors text-sm font-bold">
                                <Plus className="w-4 h-4" />
                                إضافة باقة جديدة لهذه الخدمة
                            </button>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        ))}
        {filteredDraftServices.length === 0 && (
          <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-500">
             لم يتم العثور على أي خدمات مطابقة للبحث.
          </div>
        )}
      </div>

      {/* Floating Sticky Save Bar */}
      <AnimatePresence>
          {hasChanges && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 100, opacity: 0 }} 
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-slate-900 border border-amber-500/30 rounded-2xl p-3 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)] backdrop-blur-xl w-[90%] sm:w-auto overflow-hidden"
              >
                  <button onClick={handleSaveChanges} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base">
                      <Save className="w-4 h-4" /> حفظ التغييرات 
                  </button>
                  <button onClick={handleCancelChanges} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all border border-slate-700 text-sm sm:text-base">
                      <Undo2 className="w-4 h-4" /> إلغاء
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Add Service Simple Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 pt-16 sm:p-6 overflow-hidden"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-lg max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* 1. FIXED MODAL HEADER - NEVER SCROLLS OUT OF VIEW */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 z-10">
                <h3 className="text-lg font-bold text-white">إضافة خدمة جديدة</h3>
                
                {/* CLOSE BUTTON (X) - ALWAYS VISIBLE & TOUCHABLE */}
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)} 
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* 2. SCROLLABLE BODY - ONLY THIS AREA SCROLLS WHEN PACKAGES ARE ADDED */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-right custom-scrollbar">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">اسم الخدمة</label>
                  <input type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" placeholder="مثال: PUBG Mobile" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">التصنيف</label>
                  <select value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none appearance-none">
                    {CATEGORIES.filter(c => c.id !== 'الكل').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">رابط أيقونة الخدمة (اختياري)</label>
                  <input type="text" value={newService.image} onChange={e => setNewService({...newService, image: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none" placeholder="https://..." />
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <span className="w-4 h-px bg-amber-500/50"></span>
                    باقات الخدمة والأسعار
                  </h3>
                  
                  <div className="space-y-4">
                    {newService.packages.map((pkg, index) => {
                       const profitAmount = pkg.retailPrice - pkg.wholesaleCost;
                       const isLoss = profitAmount < 0;
                       return (
                          <div key={pkg.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative group">
                             <button onClick={() => {
                                 const newPkgs = newService.packages.filter(p => p.id !== pkg.id);
                                 setNewService({...newService, packages: newPkgs});
                             }} className="absolute top-2 left-2 p-1.5 text-slate-500 hover:text-red-400 bg-slate-900 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                             
                             <div className="pr-6 space-y-3">
                               <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">اسم الباقة (مثال: 100 Diamond)</label>
                                  <input type="text" value={pkg.title} onChange={e => {
                                      const newPkgs = [...newService.packages];
                                      newPkgs[index].title = e.target.value;
                                      setNewService({...newService, packages: newPkgs});
                                  }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none" />
                               </div>
                               <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">LikeCard Product ID</label>
                                  <input type="text" value={pkg.likecardId} onChange={e => {
                                      const newPkgs = [...newService.packages];
                                      newPkgs[index].likecardId = e.target.value;
                                      setNewService({...newService, packages: newPkgs});
                                  }} className="w-full bg-slate-900 border border-amber-500/30 text-amber-500 font-mono rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="block text-xs font-medium text-slate-400 mb-1">سعر التكلفة ($)</label>
                                      <input type="number" value={pkg.wholesaleCost} onChange={e => {
                                          const newPkgs = [...newService.packages];
                                          newPkgs[index].wholesaleCost = Number(e.target.value);
                                          setNewService({...newService, packages: newPkgs});
                                      }} className="w-full bg-slate-900 border border-slate-700 text-slate-300 font-mono rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-slate-400 mb-1">سعر البيع ($)</label>
                                      <input type="number" value={pkg.retailPrice} onChange={e => {
                                          const newPkgs = [...newService.packages];
                                          newPkgs[index].retailPrice = Number(e.target.value);
                                          setNewService({...newService, packages: newPkgs});
                                      }} className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold font-mono rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                                  </div>
                               </div>
                               <div>
                                  <div className={`w-full flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-bold border ${isLoss ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                      {isLoss ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                      <span>{isLoss ? '⚠️ خسارة!' : `+ $${profitAmount.toFixed(2)}`}</span>
                                  </div>
                               </div>
                             </div>
                          </div>
                       );
                    })}
                    
                    <button onClick={() => {
                       setNewService({
                           ...newService, 
                           packages: [...newService.packages, { id: Math.random().toString(), title: '', likecardId: '', wholesaleCost: 0, retailPrice: 0 }]
                       });
                    }} className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2 text-sm font-bold mt-2">
                       <Plus className="w-4 h-4" /> إضافة باقة جديدة لهذه الخدمة
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. FIXED MODAL FOOTER */}
              <div className="shrink-0 p-4 bg-slate-900 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={handleAddServiceSubmit} 
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>💾 حفظ وإنشاء الخدمة مع باقاتها</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
