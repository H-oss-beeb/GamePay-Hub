import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Gamepad2, CreditCard, CheckCircle2, AlertCircle, ShoppingCart, Star, Tv, Trophy, Smartphone, Key, Search, ChevronDown, Music, Menu, ShieldCheck, X, Wallet, Flame, User } from 'lucide-react';
import type { Page } from '../App';
import { downloadPDFReceipt } from '../utils/pdfGenerator';
import DepositModal from './DepositModal';
import AuthModal from './AuthModal';
import { useApp } from '../context/AppContext';
import { updateUserBalance, createOrderRecord, syncUserProfile } from '../utils/paymentSync';
import { auth, signInWithGoogle } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { usePing } from '../hooks/usePing';

export type CatalogItemPackage = {
  id?: string;
  title: string;
  priceIQD: number;
  bonus?: string;
  wholesaleCost?: number;
  retailPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  onSale?: boolean;
  expiresAt?: number;
  durationLabel?: string;
  effectivePrice?: number;
  effectivePriceIQD?: number;
  presetWeight?: number;
  isBestseller?: boolean;
};

export type CatalogItem = {
  id: string;
  name: string;
  typeLabel: string;
  category: 'GAMES' | 'STREAMING' | 'SPORTS' | string;
  fullType: 'DIRECT_ID' | 'DIGITAL_CODE';
  regex?: RegExp;
  example?: string;
  packages: CatalogItemPackage[];
  bgGradient: string;
  glowColor: string;
  logoUrl: string;
  badge?: string;
  isPopular?: boolean;
  hasDiscount?: boolean;
  maxDiscount?: number;
  salesCount?: number;
  popularityRank?: number;
};

export const CATALOG: CatalogItem[] = [
  // 🎮 GAMES
  { 
    id: 'pubg', 
    name: 'PUBG Mobile', 
    typeLabel: 'شحن ID / أكواد', 
    category: 'GAMES', 
    fullType: 'DIRECT_ID', 
    regex: /^\d{8,12}$/, 
    example: '123456789', 
    hasDiscount: true, 
    maxDiscount: 15, 
    badge: '🔥 خصم 15%', 
    salesCount: 18450,
    isPopular: true,
    packages: [
      {title: '60 UC', priceIQD: 1500, presetWeight: 20}, 
      {title: '600 UC', priceIQD: 15000, originalPrice: 12.00, retailPrice: 10.00, onSale: true, discountPercent: 15, bonus: '+60 UC مجاناً', presetWeight: 90}, 
      {title: '6,000 UC', priceIQD: 150000, bonus: '+2,100 UC مجاناً', presetWeight: 50}, 
      {title: '18,000 UC', priceIQD: 450000, bonus: '+6,300 UC مجاناً', presetWeight: 40}, 
      {title: '24,000 UC', priceIQD: 600000, bonus: '+8,400 UC مجاناً', presetWeight: 30}, 
      {title: '30,000 UC', priceIQD: 750000, bonus: '+10,500 UC مجاناً', presetWeight: 20}
    ], 
    bgGradient: 'from-amber-500/20 to-transparent', 
    glowColor: 'bg-amber-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/Se7jR6A5R0Mk9ClaIguf46yi2K3k32JsqKb3gAtrktIh3JwnFfxrQRmG9GLvdMpbxbMrReUOxzDkStxGxNo-5Q=s512' 
  },
  { 
    id: 'freefire', 
    name: 'Free Fire', 
    typeLabel: 'شحن جواهر ID', 
    category: 'GAMES', 
    fullType: 'DIRECT_ID', 
    regex: /^\d{9,10}$/, 
    example: '123456789', 
    hasDiscount: false, 
    salesCount: 12200,
    isPopular: true,
    packages: [
      {title: '1,080 Diamonds', priceIQD: 15000, presetWeight: 90}
    ], 
    bgGradient: 'from-red-500/20 to-transparent', 
    glowColor: 'bg-red-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/JT88XmsHoGDio7FxONwh382DhuTxuccfMmWFDtRBFjilySzNqWOCxUhqm8IhBKzQSwVrW2HWp_XvSgKFwi3ETA=s512' 
  },
  { 
    id: 'ludo', 
    name: 'Yalla Ludo', 
    typeLabel: 'كوينز وجواهر', 
    category: 'GAMES', 
    fullType: 'DIRECT_ID', 
    regex: /^\d{8,12}$/, 
    example: '123456789', 
    hasDiscount: false, 
    salesCount: 9800,
    isPopular: true,
    packages: [
      {title: 'Gold Coins $100', priceIQD: 150000, presetWeight: 50}, 
      {title: 'Diamonds $100', priceIQD: 150000, presetWeight: 90}
    ], 
    bgGradient: 'from-emerald-500/20 to-transparent', 
    glowColor: 'bg-emerald-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/qSN0Eb6mDVPIX4PRggTB3PsEU1oyPorteUfiuJ709P9cZxdWP9Y-kV0htG7rtJNYywGE-3wlrC_7Gix0h0-Urw=s512' 
  },
  { 
    id: 'roblox', 
    name: 'Roblox', 
    typeLabel: 'بطاقات Robux', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 8400,
    isPopular: true,
    packages: [
      {title: '$10 Robux', priceIQD: 15000, presetWeight: 40}, 
      {title: '$25 Robux', priceIQD: 37500, presetWeight: 90}, 
      {title: '$50 Robux', priceIQD: 75000, presetWeight: 60}, 
      {title: '$100 Robux', priceIQD: 150000, presetWeight: 30}
    ], 
    bgGradient: 'from-cyan-500/20 to-transparent', 
    glowColor: 'bg-cyan-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/QqZj22aXblAyYDxLQw-Gg0ycW0QkKhrDnwqgERZU9BMRXZnMlgXfq-94sikG5mEpt_I0lzZxcUzfLblmQgwYzUE=s512' 
  },
  { 
    id: 'psn', 
    name: 'PlayStation Network', 
    typeLabel: 'أرصدة المتاجر', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 7900,
    packages: [
      {title: '$100 US Store', priceIQD: 139000, presetWeight: 90}, 
      {title: '$100 KSA Store', priceIQD: 148000, presetWeight: 60}
    ], 
    bgGradient: 'from-blue-500/20 to-transparent', 
    glowColor: 'bg-blue-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/3Y2xJ77Ucj7Ovxf12AbJszkAqttbJfiO7DOjK9NO8vQn57Rar8uhkgcwbXFu2k7eXZR-Z0_Nbo8NWKfZjkDsRQ=s512' 
  },
  { 
    id: 'razer', 
    name: 'Razer Gold', 
    typeLabel: 'بطاقات شحن عالمية', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 7100,
    packages: [
      {title: '$100 Global', priceIQD: 150000, presetWeight: 90}, 
      {title: '100 TL Turkey', priceIQD: 8500, presetWeight: 40}
    ], 
    bgGradient: 'from-green-500/20 to-transparent', 
    glowColor: 'bg-green-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/wty3EGsgTR9CY0eX3EgsO-p2UtSBw4xVk8xlwb-UJRl6WciaMIf1aA9uMk64_SaUWwW8bulJG4OzDa-YDNDAMYM=s512' 
  },
  { 
    id: 'fortnite', 
    name: 'Fortnite', 
    typeLabel: 'بطاقات V-Bucks', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 6500,
    packages: [
      {title: '1000 V-Bucks', priceIQD: 13500, presetWeight: 50}, 
      {title: '2800 V-Bucks', priceIQD: 34000, presetWeight: 90}, 
      {title: '5000 V-Bucks', priceIQD: 54000, presetWeight: 40}
    ], 
    bgGradient: 'from-violet-500/20 to-transparent', 
    glowColor: 'bg-violet-500', 
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_lettermark_logo.png' 
  },
  { 
    id: 'steam', 
    name: 'Steam Wallet', 
    typeLabel: 'بطاقات محفظة Steam', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 6100,
    packages: [
      {title: '$10 Steam', priceIQD: 15000, presetWeight: 40}, 
      {title: '$20 Steam', priceIQD: 30000, presetWeight: 90}, 
      {title: '$50 Steam', priceIQD: 75000, presetWeight: 60}, 
      {title: '$100 Steam', priceIQD: 150000, presetWeight: 30}
    ], 
    bgGradient: 'from-slate-400/20 to-transparent', 
    glowColor: 'bg-slate-400', 
    logoUrl: 'https://play-lh.googleusercontent.com/E_x2GPSJakCdUYfECBptVyFoVnC4BxIPy3K4OdbwNyEtEJkRAY_J-Lo_Ltiybq6LiJ_aZCIzvqLv5h4Fbk91=s512' 
  },
  { 
    id: 'google_play', 
    name: 'Google Play', 
    typeLabel: 'بطاقات شحن المتجر', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 5800,
    packages: [
      {title: '$10 US', priceIQD: 15000, presetWeight: 40}, 
      {title: '$50 US', priceIQD: 75000, presetWeight: 90}, 
      {title: '$100 US', priceIQD: 150000, presetWeight: 50}
    ], 
    bgGradient: 'from-emerald-500/20 to-transparent', 
    glowColor: 'bg-emerald-500', 
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' 
  },
  { 
    id: 'apple', 
    name: 'Apple / iTunes', 
    typeLabel: 'بطاقات شحن الحساب', 
    category: 'GAMES', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 5200,
    packages: [
      {title: '$100 US', priceIQD: 145000, presetWeight: 90}, 
      {title: '$500 US', priceIQD: 744000, presetWeight: 30}
    ], 
    bgGradient: 'from-white/20 to-transparent', 
    glowColor: 'bg-white', 
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/App_Store_%28iOS%29.svg' 
  },
  
  // 🎬 STREAMING
  { 
    id: 'tiktok', 
    name: 'TikTok Coins', 
    typeLabel: 'شحن الرصيد والدعم', 
    category: 'STREAMING', 
    fullType: 'DIRECT_ID', 
    regex: /^@?[\w.-]+$/, 
    example: '@username', 
    hasDiscount: false, 
    salesCount: 15400,
    isPopular: true,
    packages: [
      {title: '70 Coins', priceIQD: 1500, presetWeight: 40}, 
      {title: '350 Coins', priceIQD: 7500, presetWeight: 90}, 
      {title: '700 Coins', priceIQD: 15000, presetWeight: 60}
    ], 
    bgGradient: 'from-rose-500/20 to-transparent', 
    glowColor: 'bg-rose-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/2o7iuqPe-0msP3DvNhzoOgNo4eZ6GkL_RtGVeKyBn5UBQAW5cw-GW5V3wDOHB1yTQuqWzrFLFOv2u4_5ea1uhg=s512' 
  },
  { 
    id: 'shahid', 
    name: 'Shahid VIP+', 
    typeLabel: 'قسائم تفعيل', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 8700,
    isPopular: true,
    packages: [
      {title: '3 Months', priceIQD: 34500, presetWeight: 90}, 
      {title: '6 Months', priceIQD: 67500, presetWeight: 50}
    ], 
    bgGradient: 'from-yellow-500/20 to-transparent', 
    glowColor: 'bg-yellow-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/OX_8Lxi6zQdeob7G9t45jHK889TOrfULfn4vf6MP6a3lx4U26naAbim14BIIKOmt1_5AbUpqgCFqldWzpp-LMro=s512' 
  },
  { 
    id: 'netflix', 
    name: 'Netflix', 
    typeLabel: 'بطاقات شحن المحفظة', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 7600,
    isPopular: true,
    packages: [
      {title: '$15 Gift Card', priceIQD: 22500, presetWeight: 90}, 
      {title: '$30 Gift Card', priceIQD: 45000, presetWeight: 50}
    ], 
    bgGradient: 'from-red-600/20 to-transparent', 
    glowColor: 'bg-red-600', 
    logoUrl: 'https://play-lh.googleusercontent.com/fXVS45nukV1x9PYVSKHkCQK0QGCOishIvAOxIZS3sgRem8HS7l9l94_Ggj-WZPrTLePRdNYN4pp4SPAQL7oS0PU=s512' 
  },
  { 
    id: 'starzplay', 
    name: 'STARZPLAY', 
    typeLabel: 'اشتراكات الترفيه', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 4900,
    packages: [
      {title: '1 Month', priceIQD: 16000, presetWeight: 90}, 
      {title: '1 Year', priceIQD: 160000, presetWeight: 40}
    ], 
    bgGradient: 'from-orange-500/20 to-transparent', 
    glowColor: 'bg-orange-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/YBV3m8kba2QY2mH-DxShSuVhFv8oOM7bEnm9qUvaDIKZQntxMVzuZig5fjrOBsDAPDHxT-rR-OTn40E3_37e=s512' 
  },
  { 
    id: 'spotify', 
    name: 'Spotify Premium', 
    typeLabel: 'اشتراكات بريميوم', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 4800,
    packages: [
      {title: '1 Month', priceIQD: 8000, presetWeight: 90}, 
      {title: '1 Year', priceIQD: 80000, presetWeight: 40}
    ], 
    bgGradient: 'from-green-500/20 to-transparent', 
    glowColor: 'bg-green-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/cShys-AmJ93dB0SV8kE6Fl5eSaf4-qMMZdwEDKI5VEmKAXfzOqbiaeAsqqrEBCTdIEs=s512' 
  },
  { 
    id: 'osn', 
    name: 'OSN+', 
    typeLabel: 'قسائم تفعيل', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 4200,
    packages: [
      {title: '1 Month', priceIQD: 14000, presetWeight: 50}, 
      {title: '3 Months', priceIQD: 42000, presetWeight: 90}, 
      {title: '1 Year', priceIQD: 160000, presetWeight: 30}
    ], 
    bgGradient: 'from-purple-500/20 to-transparent', 
    glowColor: 'bg-purple-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/gH7sktSkPqYCrcfvAjW9py5nuB2wVVfReBJpCTJNb0hdROPcKF3QdeNilTlEOSf-R5cMav5sC7n5b0KI9nv1Fg=s512' 
  },
  { 
    id: 'anghami', 
    name: 'Anghami Plus', 
    typeLabel: 'اشتراكات موسيقية', 
    category: 'STREAMING', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 3100,
    packages: [
      {title: '1 Month', priceIQD: 8000, presetWeight: 90}, 
      {title: '3 Months', priceIQD: 24000, presetWeight: 50}, 
      {title: '1 Year', priceIQD: 80000, presetWeight: 30}
    ], 
    bgGradient: 'from-purple-600/20 to-transparent', 
    glowColor: 'bg-purple-600', 
    logoUrl: 'https://play-lh.googleusercontent.com/Dj-qfFIIZZmjx-zxS_39MrYqiogBj9U9cfSWpjBOaDKA6J5XfBgOp1cWIWxXx9peIcJAwQt_AyvfhGGxs0UE=s512' 
  },
  
  // ⚽ SPORTS
  { 
    id: 'bein_sports', 
    name: 'beIN Sports / TOD', 
    typeLabel: 'اشتراكات وقسائم', 
    category: 'SPORTS', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 9100,
    isPopular: true,
    packages: [
      {title: '1 Month', priceIQD: 15000, presetWeight: 90}, 
      {title: '3 Months', priceIQD: 45000, presetWeight: 50}
    ], 
    bgGradient: 'from-[#5c2d91]/40 to-transparent', 
    glowColor: 'bg-[#5c2d91]', 
    logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/0d/84/5a/0d845adc-ce32-86e2-cec2-444e9927c023/AppIcon-0-1x_U007epad-0-1-85-220-0.png/512x512bb.jpg' 
  },
  { 
    id: 'shahid_sports', 
    name: 'Shahid VIP Sports', 
    typeLabel: 'الدوري السعودي وSSC', 
    category: 'SPORTS', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 7300,
    isPopular: true,
    packages: [
      {title: '3 Months', priceIQD: 34500, presetWeight: 90}, 
      {title: '6 Months', priceIQD: 67500, presetWeight: 50}
    ], 
    bgGradient: 'from-yellow-500/20 to-transparent', 
    glowColor: 'bg-yellow-500', 
    logoUrl: 'https://play-lh.googleusercontent.com/OX_8Lxi6zQdeob7G9t45jHK889TOrfULfn4vf6MP6a3lx4U26naAbim14BIIKOmt1_5AbUpqgCFqldWzpp-LMro=s512' 
  },
  { 
    id: 'starzplay_sports', 
    name: 'STARZPLAY Sports', 
    typeLabel: 'الدوري الإيطالي وUFC', 
    category: 'SPORTS', 
    fullType: 'DIGITAL_CODE', 
    hasDiscount: false, 
    salesCount: 3800,
    packages: [
      {title: '1 Month', priceIQD: 12500, presetWeight: 90}, 
      {title: '1 Year', priceIQD: 125000, presetWeight: 40}
    ], 
    bgGradient: 'from-sky-400/20 to-transparent', 
    glowColor: 'bg-sky-400', 
    logoUrl: 'https://play-lh.googleusercontent.com/YBV3m8kba2QY2mH-DxShSuVhFv8oOM7bEnm9qUvaDIKZQntxMVzuZig5fjrOBsDAPDHxT-rR-OTn40E3_37e=s512' 
  },
];

export const CATEGORIES = [
  { id: 'explore', label: 'استكشاف 🚀', icon: '🚀', isMaster: true },
  { id: 'games', label: 'الألعاب', icon: '🎮' },
  { id: 'sports', label: 'الرياضة', icon: '⚽' },
  { id: 'entertainment', label: 'الترفيه', icon: '🎬' },
  { id: 'gift_cards', label: 'بطاقات الهدايا', icon: '🎁' },
  { id: 'subscriptions', label: 'الاشتراكات', icon: '🔑' },
];

export const isItemInCategory = (item: CatalogItem, catId: string | null): boolean => {
  if (!catId || catId === 'all' || catId === 'explore') return true;
  
  const idLower = catId.toLowerCase();
  const itemCat = String(item.category || '').toLowerCase();
  
  if (idLower === 'games') {
    return itemCat === 'games' || itemCat === 'الألعاب';
  }
  
  if (idLower === 'sports') {
    return itemCat === 'sports' || itemCat === 'الرياضة' || itemCat === 'القنوات الرياضية';
  }
  
  if (idLower === 'entertainment') {
    return itemCat === 'streaming' || itemCat === 'entertainment' || itemCat === 'الترفيه' || itemCat === 'الترفيه والمسلسلات';
  }
  
  if (idLower === 'gift_cards') {
    const giftCardIds = ['apple', 'google_play', 'steam', 'razer', 'psn', 'roblox', 'netflix'];
    return (
      itemCat === 'gift_cards' ||
      itemCat === 'بطاقات الهدايا' ||
      giftCardIds.includes(item.id) ||
      Boolean(item.name?.toLowerCase().includes('card')) ||
      Boolean(item.typeLabel?.includes('بطاق')) ||
      Boolean(item.packages?.some(p => p.title.toLowerCase().includes('gift card') || p.title.toLowerCase().includes('card') || p.title.toLowerCase().includes('store')))
    );
  }
  
  if (idLower === 'subscriptions') {
    const subscriptionIds = ['shahid', 'starzplay', 'spotify', 'osn', 'anghami', 'bein_sports', 'shahid_sports', 'starzplay_sports'];
    return (
      itemCat === 'subscriptions' ||
      itemCat === 'الاشتراكات' ||
      subscriptionIds.includes(item.id) ||
      Boolean(item.typeLabel?.includes('اشتراك')) ||
      Boolean(item.typeLabel?.includes('قسائم')) ||
      Boolean(item.typeLabel?.includes('تفعيل')) ||
      Boolean(item.packages?.some(p => p.title.toLowerCase().includes('month') || p.title.toLowerCase().includes('year')))
    );
  }
  
  return itemCat === idLower;
};

const GATEWAYS = [
  { id: 'wallet', name: 'رصيد المحفظة الفوري (GamePay Wallet)', color: 'bg-emerald-500' },
  { id: 'switch', name: 'Switch / Qi Card (كي كارد)', color: 'bg-amber-500' },
  { id: 'zaincash', name: 'Zain Cash (زين كاش)', color: 'bg-red-500' },
  { id: 'visa', name: 'بطاقة محفوظة / Visa & Mastercard', color: 'bg-blue-600' },
];

const BrandLogo = ({ url, name, className, category, id, color = 'text-white' }: { url: string, name: string, className?: string, category?: string, id?: string, color?: string }) => {
  let FallbackIcon = CreditCard;
  if (category === 'GAMES') FallbackIcon = Gamepad2;
  if (category === 'STREAMING' || category === 'SPORTS') FallbackIcon = Tv;
  if (id === 'spotify' || id === 'anghami') FallbackIcon = Music;
  if (id === 'apple' || id === 'google_play' || id === 'razer') FallbackIcon = CreditCard;

  return (
    <>
      <img
        crossOrigin="anonymous"
        src={url}
        alt={name}
        width={300}
        height={225}
        draggable={false}
        loading="lazy"
        decoding="async"
        className={className}
        style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' as any }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
        }}
      />
      <div className={`hidden items-center justify-center ${color} ${className}`}>
        <FallbackIcon className="w-2/3 h-2/3 opacity-80" />
      </div>
    </>
  );
};

// Memoized Product Card with purged expensive CSS (No backdrop-filter, no heavy blur blobs, content-visibility auto)
const MemoizedProductCard = React.memo(function MemoizedProductCard({
  item,
  index,
  isAvailable,
  isFav,
  isPopularMode,
  onOpen,
  onToggleFavorite,
}: {
  item: CatalogItem;
  index: number;
  isAvailable: boolean;
  isFav: boolean;
  isPopularMode: boolean;
  onOpen: (service: CatalogItem & { isAvailable?: boolean }) => void;
  onToggleFavorite: (service: CatalogItem) => void;
}) {
  const getCardBorder = () => {
    if (!isAvailable) return 'border-red-900/40 bg-slate-950 grayscale';
    if (!isPopularMode) return 'border-slate-800/90 hover:border-amber-500/50 bg-slate-900';
    if (index === 0) return 'border-amber-400/80 bg-slate-900 ring-1 ring-amber-400/40';
    if (index === 1) return 'border-slate-400/70 bg-slate-900 ring-1 ring-slate-400/30';
    if (index === 2) return 'border-orange-500/70 bg-slate-900 ring-1 ring-orange-500/30';
    return 'border-slate-800 bg-slate-900 hover:border-amber-500/50';
  };

  return (
    <button
      onClick={() => onOpen({ ...item, isAvailable })}
      className={`group relative overflow-hidden rounded-2xl border ${getCardBorder()} flex flex-col justify-between w-full text-right cursor-pointer select-none`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 240px' }}
    >
      {/* Star / Favorite Quick Toggle Button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(item);
        }}
        title={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        className={`absolute top-2 left-2 z-30 p-1.5 rounded-full cursor-pointer transition-colors ${
          isFav 
            ? 'bg-amber-500 text-slate-950 border border-amber-400' 
            : 'bg-black/60 text-slate-400 hover:text-amber-400 border border-white/10 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-slate-950 text-slate-950' : 'text-slate-300'}`} />
      </div>

      {/* Dynamic Leaderboard Badges OR Standard Badge */}
      {isPopularMode ? (
        <div className="absolute top-2 right-2 z-30 pointer-events-none flex items-center gap-1">
          {index === 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-amber-300 bg-amber-400 text-slate-950 whitespace-nowrap">
              <span>🥇</span> #1 الأكثر مبيعاً
            </span>
          )}
          {index === 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-slate-300 bg-slate-200 text-slate-950 whitespace-nowrap">
              <span>🥈</span> #2
            </span>
          )}
          {index === 2 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-amber-700 bg-amber-600 text-white whitespace-nowrap">
              <span>🥉</span> #3
            </span>
          )}
          {index >= 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-700 bg-slate-900 text-slate-300 whitespace-nowrap">
              #{index + 1}
            </span>
          )}
          {item.hasDiscount && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-white" />
              <span>%{item.maxDiscount || 15}-</span>
            </span>
          )}
        </div>
      ) : item.badge ? (
        <div className="absolute top-2 right-2 z-30 pointer-events-none">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
            item.hasDiscount || item.badge.includes('خصم')
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
          }`}>
            {(item.hasDiscount || item.badge.includes('خصم')) && <Flame className="w-2.5 h-2.5 fill-white shrink-0" />}
            <span className="whitespace-nowrap">{item.badge}</span>
          </span>
        </div>
      ) : null}

      {!isAvailable && (
        <div className="absolute inset-0 bg-black/75 z-20 flex items-center justify-center rounded-2xl">
          <div className="bg-red-950 border border-red-500/50 text-red-400 font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs">
            <span>🚫</span> غير متوفر حالياً
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="w-full aspect-[4/3.3] relative overflow-hidden rounded-t-2xl z-10 bg-slate-950">
        <BrandLogo 
          url={item.logoUrl} 
          name={item.name} 
          className="w-full h-full aspect-[4/3.3] object-cover rounded-t-2xl pointer-events-none select-none" 
          category={item.category} 
          id={item.id} 
          color={item.glowColor.replace('bg-', 'text-')} 
        />
      </div>

      {/* Card Footer: Flat slate-950 with top border */}
      <div className="w-full flex flex-col justify-center items-center bg-slate-950 border-t border-slate-800 p-3 text-center z-10 relative rounded-b-2xl">
        <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-full block">{item.name}</h3>
        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full mt-1 truncate max-w-full block">
          {item.typeLabel}
        </span>
      </div>
    </button>
  );
});

// Isolated LivePingBadge: Encapsulates ping timer state so Storefront tree never re-renders on ping ticks
const LivePingBadge = React.memo(function LivePingBadge() {
  const { ping, status: pingStatus, refreshPing } = usePing({ interval: 6000 });
  const isBad = ping === null || pingStatus === 'offline' || ping > 150;
  const isGood = ping !== null && ping < 80;

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        refreshPing();
      }} 
      title={ping !== null ? `سرعة الاستجابة الحية: ${ping}ms - اضغط للتحديث` : 'الشبكة غير متصلة'}
      className={`text-[9px] font-mono font-bold flex items-center gap-1 tracking-wider mt-0.5 cursor-pointer active:scale-95 transition-all ${
        isBad
          ? 'text-rose-400'
          : isGood
            ? 'text-emerald-400'
            : 'text-amber-400'
      }`}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          isBad
            ? 'bg-rose-500'
            : isGood
              ? 'bg-emerald-400'
              : 'bg-amber-400'
        }`}
      />
      <span>{ping !== null ? `${ping}ms` : 'Offline'}</span>
    </div>
  );
});




import SidebarDrawer from './SidebarDrawer';
import HeroCarousel from './HeroCarousel';
import CartDrawer from './CartDrawer';
import SearchModal from './SearchModal';
import MaintenanceScreen from './MaintenanceScreen';
import { useCart } from '../context/CartContext';
import { useOrderContext, saveCompletedOrder } from '../context/OrderContext';

export const getSyncedCatalog = (baseCatalog: CatalogItem[]): CatalogItem[] => {
  try {
    const saved = localStorage.getItem('gamepay_services');
    if (!saved) return baseCatalog;
    const savedServices = JSON.parse(saved);
    if (!Array.isArray(savedServices) || savedServices.length === 0) return baseCatalog;

    return baseCatalog.map(baseItem => {
      const matching = savedServices.find((s: any) => 
        (s?.name || '').trim().toLowerCase() === (baseItem?.name || '').trim().toLowerCase() ||
        (s?.id && s?.id === baseItem?.id)
      );
      if (!matching) return baseItem;

      if (Array.isArray(matching.packages) && matching.packages.length > 0) {
        const syncedPackages: CatalogItemPackage[] = matching.packages.map((pkg: any) => {
          const basePkg = baseItem.packages.find(bp => (bp?.title || '').toLowerCase().includes((pkg?.title || '').toLowerCase()));
          
          let baseRetailUSD = typeof pkg.retailPrice === 'number' && pkg.retailPrice > 0
            ? (pkg.retailPrice >= 500 ? pkg.retailPrice / 1500 : pkg.retailPrice)
            : (basePkg?.retailPrice || (basePkg?.priceIQD ? basePkg.priceIQD / 1500 : 1));

          const originalPriceUSD = typeof pkg.originalPrice === 'number' && pkg.originalPrice > 0
            ? pkg.originalPrice
            : baseRetailUSD;

          const isExpired = Boolean(pkg.expiresAt && Date.now() > pkg.expiresAt);
          const onSale = Boolean(!isExpired && pkg.onSale && typeof pkg.discountPercent === 'number' && pkg.discountPercent > 0);
          const discountPercent = onSale ? pkg.discountPercent : 0;

          // Effective Price calculation: effectivePrice = basePrice * (1 - (discountPercent / 100))
          const effectivePriceUSD = onSale
            ? Number((originalPriceUSD * (1 - (discountPercent / 100))).toFixed(2))
            : (typeof pkg.retailPrice === 'number' && pkg.retailPrice > 0 ? (pkg.retailPrice >= 500 ? pkg.retailPrice / 1500 : pkg.retailPrice) : originalPriceUSD);

          const effectivePriceIQD = Math.round(effectivePriceUSD * 1500);

          return {
            id: pkg.id,
            title: pkg.title,
            wholesaleCost: pkg.wholesaleCost,
            retailPrice: effectivePriceUSD,
            originalPrice: originalPriceUSD,
            discountPercent: discountPercent,
            onSale: onSale,
            expiresAt: pkg.expiresAt,
            durationLabel: pkg.durationLabel,
            effectivePrice: effectivePriceUSD,
            effectivePriceIQD: effectivePriceIQD,
            priceIQD: effectivePriceIQD,
            presetWeight: typeof pkg.presetWeight === 'number' ? pkg.presetWeight : basePkg?.presetWeight,
            ...(basePkg?.bonus ? { bonus: basePkg.bonus } : {})
          };
        });

        const hasActiveDiscount = syncedPackages.some(p => p.onSale && (p.discountPercent || 0) > 0);
        const maxDiscount = hasActiveDiscount 
          ? Math.max(...syncedPackages.filter(p => p.onSale).map(p => p.discountPercent || 0)) 
          : 0;

        return {
          ...baseItem,
          salesCount: typeof matching.salesCount === 'number' ? matching.salesCount : baseItem.salesCount,
          packages: syncedPackages,
          hasDiscount: hasActiveDiscount,
          maxDiscount: maxDiscount,
          badge: hasActiveDiscount ? `🔥 خصم ${maxDiscount}%` : baseItem.badge
        };
      }
      return baseItem;
    });
  } catch (e) {
    return baseCatalog;
  }
};

/**
 * Dynamic calculation function getTopSellingPackage(serviceId)
 * 1. Reads transaction/order history across all user purchase records
 * 2. Calculates total completed order volume/frequency for each package
 * 3. Evaluates MAX(purchaseCount)
 * 4. Fallback: highest initial preset weight
 */
export function getTopSellingPackage(
  service: CatalogItem | string,
  ordersList?: any[],
  currentCatalog?: CatalogItem[]
): CatalogItemPackage | null {
  const activeList = currentCatalog && currentCatalog.length > 0 ? currentCatalog : CATALOG;
  const currentService: CatalogItem | undefined = typeof service === 'string'
    ? (activeList.find(s => s.id === service) || CATALOG.find(s => s.id === service))
    : service;

  if (!currentService || !currentService.packages || currentService.packages.length === 0) {
    return null;
  }

  // 1. Read completed order records across all purchase records / active state
  let allOrders: any[] = [];
  if (Array.isArray(ordersList) && ordersList.length > 0) {
    allOrders = ordersList;
  } else {
    try {
      const raw = localStorage.getItem('gamepay_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) allOrders = parsed;
      }
    } catch (e) {
      allOrders = [];
    }
  }

  // Filter completed orders matching this service
  const serviceOrders = allOrders.filter(o => {
    const isCompleted = !o.status || o.status === 'Completed' || o.status === 'مكتمل' || o.status === 'SUCCESS';
    if (!isCompleted) return false;

    const sId = (currentService.id || '').toLowerCase();
    const sName = (currentService.name || '').toLowerCase();
    const ordServiceId = (o.serviceId || o.gameType || '').toLowerCase();
    const ordServiceName = (o.serviceName || '').toLowerCase();

    return (
      (ordServiceId && ordServiceId === sId) ||
      (ordServiceName && ordServiceName === sName) ||
      (ordServiceName && sName && (ordServiceName.includes(sName) || sName.includes(ordServiceName))) ||
      (ordServiceName && sId && ordServiceName.includes(sId))
    );
  });

  // 2. Count purchases per package
  const packagePurchaseCounts = new Map<string, number>();

  for (const ord of serviceOrders) {
    const pkgIdentifier = ord.packageTier || ord.packageId || ord.packageName || ord.title;
    if (pkgIdentifier) {
      const matchedPkg = currentService.packages.find(p =>
        (p.id && p.id === pkgIdentifier) ||
        p.title === pkgIdentifier ||
        pkgIdentifier.toLowerCase().includes(p.title.toLowerCase()) ||
        p.title.toLowerCase().includes(pkgIdentifier.toLowerCase())
      );
      const key = matchedPkg ? (matchedPkg.id || matchedPkg.title) : pkgIdentifier;
      packagePurchaseCounts.set(key, (packagePurchaseCounts.get(key) || 0) + 1);
    }
  }

  // 3. Dynamically evaluate package with MAX(purchaseCount)
  let maxCount = 0;
  let topPkgByOrders: CatalogItemPackage | null = null;

  for (const pkg of currentService.packages) {
    const key = pkg.id || pkg.title;
    const count = packagePurchaseCounts.get(key) || packagePurchaseCounts.get(pkg.title) || 0;
    if (count > maxCount) {
      maxCount = count;
      topPkgByOrders = pkg;
    }
  }

  if (topPkgByOrders && maxCount > 0) {
    return topPkgByOrders;
  }

  // 4. Fallback: If no order history exists yet, pick package with highest initial preset weight
  const sortedByWeight = [...currentService.packages].sort((a, b) => {
    const weightA = typeof a.presetWeight === 'number' ? a.presetWeight : 0;
    const weightB = typeof b.presetWeight === 'number' ? b.presetWeight : 0;
    return weightB - weightA;
  });

  return sortedByWeight[0] || currentService.packages[0] || null;
}

export default function Storefront({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartBadgePulse, setCartBadgePulse] = useState(false);
  
  const { cart, addToCart, clearCart } = useCart();
  const { addToast: addAppToast, removeToast: removeAppToast, clearToasts: clearAppToasts } = useApp();

  // User Authentication & Live Wallet Balance State
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const setIsWalletModalOpen = setIsDepositModalOpen;
  const isLoggedIn = Boolean(currentUser && currentUser.email);
  const [balance, setBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const user = useMemo(() => {
    if (currentUser && currentUser.email) {
      return {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'عميل GamePay',
        balanceUSD: balance
      };
    }
    return {
      uid: 'guest_customer',
      email: '',
      displayName: 'عميل زائر',
      balanceUSD: 0
    };
  }, [currentUser, balance]);

  // Unified Toast helper triggering root GlobalToastContainer with ID overriding & dismiss support
  const toast = useMemo(() => ({
    success: (message: string, options?: { id?: string }) => {
      setTimeout(() => {
        addAppToast({
          message,
          type: 'success',
          id: options?.id
        }, options);
      }, 0);
    },
    error: (message: string, options?: { id?: string }) => {
      setTimeout(() => {
        addAppToast({
          message,
          type: 'error',
          id: options?.id
        }, options);
      }, 0);
    },
    dismiss: (id?: string) => {
      if (id) {
        removeAppToast(id);
      } else {
        clearAppToasts();
      }
    }
  }), [addAppToast, removeAppToast, clearAppToasts]);

  // Sync with Firebase Auth and custom auth events
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        setCurrentUser(fbUser);
        try {
          const profile = await syncUserProfile(fbUser);
          if (typeof profile.balanceUSD === 'number') {
            setBalance(profile.balanceUSD);
          }
        } catch (err) {
          console.warn("User profile sync warning:", err);
        }
      } else {
        setCurrentUser(null);
        setBalance(0);
      }
    });

    const handleUserLogin = (e: any) => {
      if (e.detail?.user && e.detail.user.email) {
        setCurrentUser(e.detail.user);
      }
    };

    const handleAuthLogout = () => {
      setCurrentUser(null);
      setBalance(0);
    };

    window.addEventListener('gamepay_user_login', handleUserLogin);
    window.addEventListener('gamepay_auth_logout', handleAuthLogout);

    return () => {
      unsub();
      window.removeEventListener('gamepay_user_login', handleUserLogin);
      window.removeEventListener('gamepay_auth_logout', handleAuthLogout);
    };
  }, []);

  // Listen to live balance update broadcasts across components and tabs ONLY if user is authenticated
  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      if (!currentUser || !currentUser.email) {
        setBalance(0);
        return;
      }
      if (e.detail && typeof e.detail.balance === 'number') {
        setBalance(e.detail.balance);
      } else {
        try {
          const saved = localStorage.getItem('gamepay_customer_balance');
          if (saved) {
            const num = parseFloat(saved);
            if (!isNaN(num)) setBalance(num);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('gamepay_balance_updated', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);
    return () => {
      window.removeEventListener('gamepay_balance_updated', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
  }, [currentUser]);
  
  // Total cart amount for the badge
  const cartTotal = cart.reduce((sum, item) => sum + item.package.priceIQD, 0);

  const [activeCategory, setActiveCategory] = useState<string>('explore');
  const [waveDirection, setWaveDirection] = useState<'left' | 'right'>('left');
  const [isDiscountOnly, setIsDiscountOnly] = useState<boolean>(false);
  const [isFavoritesOnly, setIsFavoritesOnly] = useState<boolean>(false);
  const [isPopularityFilter, setIsPopularityFilter] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'NONE' | 'DEALS' | 'FAVORITES' | 'TOP_SELLERS'>('NONE');
  const [catalogList, setCatalogList] = useState<CatalogItem[]>(() => getSyncedCatalog(CATALOG));
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // Swipe & Touch Navigation State (Continuous Multi-Panel Track, GPU-Accelerated)
  const categoryPillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchHistoryRef = useRef<{ x: number; time: number }[]>([]);
  const isHorizontalGestureRef = useRef<boolean | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const categoryIndex = useMemo(() => {
    const idx = CATEGORIES.findIndex(c => c.id === activeCategory);
    return idx >= 0 ? idx : 0;
  }, [activeCategory]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Auto-center active category pill in sticky filter bar & sync track position
  useEffect(() => {
    if (activeCategory && categoryPillRefs.current[activeCategory]) {
      categoryPillRefs.current[activeCategory]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
    if (trackRef.current) {
      const trackIndex = (CATEGORIES.length - 1) - categoryIndex;
      trackRef.current.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
      trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
    }
  }, [activeCategory, categoryIndex]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setIsCartOpen(false);
    if (activeCategory === categoryId && categoryId !== 'explore') {
      // Tapping the active category or its 'X' clears back to explore (all products)
      setActiveCategory('explore');
    } else {
      // Tapping an inactive category switches to it
      const targetIndex = CATEGORIES.findIndex(c => c.id === categoryId);
      if (targetIndex !== -1) {
        setWaveDirection(targetIndex >= categoryIndex ? 'left' : 'right');
        setActiveCategory(categoryId);
      }
    }
  }, [activeCategory, categoryIndex]);

  // Touch Gesture Engine - Ultra-smooth 60/120fps direct GPU track physics with flick awareness
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
    touchHistoryRef.current = [{ x: clientX, time: performance.now() }];
    isHorizontalGestureRef.current = null;

    // Freeze banner autoplay and other background timers during active swipe
    window.dispatchEvent(new CustomEvent('gamepay_swipe_active', { detail: { active: true } }));

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    // Record touch sample for velocity calculation (last 80-100ms window)
    const now = performance.now();
    touchHistoryRef.current.push({ x: currentX, time: now });
    if (touchHistoryRef.current.length > 8) {
      touchHistoryRef.current = touchHistoryRef.current.filter(p => now - p.time <= 100);
    }

    // Strict lock axis after ~8px: if vertical, release control immediately to native scroll
    if (isHorizontalGestureRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX >= 8 || absY >= 8) {
        if (absY > absX) {
          isHorizontalGestureRef.current = false;
          return;
        } else {
          isHorizontalGestureRef.current = true;
        }
      } else {
        return;
      }
    }

    if (!isHorizontalGestureRef.current) return;

    const trackIndex = (CATEGORIES.length - 1) - categoryIndex;

    // HARD BOUNDARY LOCK (NO OVERFLOW GAPS)
    // In visually reversed LTR track, categoryIndex 0 ("استكشاف 🚀") is at the rightmost track position (index 5)
    // Moving finger LEFT (deltaX < 0) has nothing to the right -> lock to 0.
    // Last category ("الاشتراكات") is at the leftmost track position (index 0)
    // Moving finger RIGHT (deltaX > 0) has nothing to the left -> lock to 0.
    let effectiveDeltaX = deltaX;
    if (categoryIndex === 0 && effectiveDeltaX < 0) {
      effectiveDeltaX = 0;
    } else if (categoryIndex === CATEGORIES.length - 1 && effectiveDeltaX > 0) {
      effectiveDeltaX = 0;
    }

    // Direct physical 1:1 follow wrapped in requestAnimationFrame with ZERO React state updates
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (trackRef.current) {
        const basePercent = trackIndex * -100;
        const sign = effectiveDeltaX >= 0 ? '+' : '-';
        const absPx = Math.abs(effectiveDeltaX);
        trackRef.current.style.transform = `translate3d(calc(${basePercent}% ${sign} ${absPx}px), 0, 0)`;
      }
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    const wasHorizontal = isHorizontalGestureRef.current;

    // Calculate release flick velocity (px/ms) over last ~80ms
    const history = touchHistoryRef.current;
    let velocity = 0;
    if (history.length >= 2) {
      const oldest = history[0];
      const newest = history[history.length - 1];
      const dt = newest.time - oldest.time;
      if (dt > 8) {
        velocity = (newest.x - oldest.x) / dt;
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalGestureRef.current = null;
    touchHistoryRef.current = [];

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Resume background timers 300ms after snap ends
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gamepay_swipe_active', { detail: { active: false } }));
    }, 300);

    if (!trackRef.current) return;

    const trackIndex = (CATEGORIES.length - 1) - categoryIndex;

    // Fast flick-aware snap: 240ms cubic-bezier(0.22, 1, 0.36, 1) starting from finger position
    trackRef.current.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';

    if (!wasHorizontal) {
      trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
      return;
    }

    // Boundary Lock:
    if (categoryIndex === 0 && deltaX < 0) {
      trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
      return;
    }
    if (categoryIndex === CATEGORIES.length - 1 && deltaX > 0) {
      trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
      return;
    }

    // Google Play style flick-aware threshold:
    // Distance > 25% of viewport width OR fast flick velocity > 0.4 px/ms
    const trackWidth = trackRef.current.clientWidth || window.innerWidth;
    const distanceThreshold = trackWidth * 0.25;

    const isFlickRight = velocity > 0.4;
    const isFlickLeft = velocity < -0.4;
    const isDistanceRight = deltaX > distanceThreshold;
    const isDistanceLeft = deltaX < -distanceThreshold;

    const shouldAdvanceRight = (isDistanceRight || isFlickRight) && deltaX > 15;
    const shouldAdvanceLeft = (isDistanceLeft || isFlickLeft) && deltaX < -15;

    // PHYSICAL RTL RULE (Arabic Interface):
    // Swiping Finger RIGHT (shouldAdvanceRight): reveals NEXT category on the left -> INCREMENT categoryIndex
    // Swiping Finger LEFT (shouldAdvanceLeft): reveals PREVIOUS category on the right -> DECREMENT categoryIndex
    if (shouldAdvanceRight) {
      const nextCategoryIndex = Math.min(categoryIndex + 1, CATEGORIES.length - 1);
      if (nextCategoryIndex !== categoryIndex) {
        setWaveDirection('left');
        setActiveCategory(CATEGORIES[nextCategoryIndex].id);
      } else {
        trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
      }
    } else if (shouldAdvanceLeft) {
      const prevCategoryIndex = Math.max(categoryIndex - 1, 0);
      if (prevCategoryIndex !== categoryIndex) {
        setWaveDirection('right');
        setActiveCategory(CATEGORIES[prevCategoryIndex].id);
      } else {
        trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
      }
    } else {
      // Threshold not reached: snap smoothly back to current panel
      trackRef.current.style.transform = `translate3d(${trackIndex * -100}%, 0, 0)`;
    }
  };

  // 1. Purchase History & Order Records State (derived from gamepay_orders)
  const [orderHistory, setOrderHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('gamepay_orders');
      if (raw) {
        const orders = JSON.parse(raw);
        if (Array.isArray(orders)) return orders;
      }
    } catch (e) {}
    return [];
  });

  const [purchasedServices, setPurchasedServices] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('gamepay_orders');
      if (raw) {
        const orders = JSON.parse(raw);
        if (Array.isArray(orders)) {
          return orders
            .map((o: any) => o.serviceName || o.gameType || o.serviceId)
            .filter(Boolean);
        }
      }
    } catch (e) {}
    return [];
  });

  // Manual fallback: user can star / unstar items directly
  const [userFavorites, setUserFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('gamepay_user_favorites');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Check if a service is either purchased or explicitly starred as a favorite
  const isServiceFavorite = useCallback((service: CatalogItem): boolean => {
    if (!service) return false;
    // Manual star preference
    if (userFavorites.includes(service.id) || userFavorites.includes(service.name)) {
      return true;
    }
    // Automatically classify any service present in completed purchases as Favorite
    const sIdLower = service.id.toLowerCase();
    const sNameLower = service.name.toLowerCase();

    return purchasedServices.some((pName: string) => {
      if (!pName) return false;
      const pLower = String(pName).toLowerCase();
      return pLower === sIdLower || 
             pLower === sNameLower || 
             pLower.includes(sIdLower) || 
             sNameLower.includes(pLower);
    });
  }, [userFavorites, purchasedServices]);

  // Throttling lock for rapid favorite toggle clicks (ignore rapid clicks within 250ms)
  const lastFavToggleTimeRef = useRef<number>(0);

  const toggleFavorite = useCallback((service: CatalogItem) => {
    if (!service) return;
    const now = Date.now();
    if (now - lastFavToggleTimeRef.current < 250) {
      return;
    }
    lastFavToggleTimeRef.current = now;

    const exists = userFavorites.includes(service.id) || userFavorites.includes(service.name);
    const updated = exists 
      ? userFavorites.filter(id => id !== service.id && id !== service.name)
      : [...userFavorites, service.id];
    try {
      localStorage.setItem('gamepay_user_favorites', JSON.stringify(updated));
    } catch (e) {}
    setUserFavorites(updated);
    toast.success(
      exists ? `تمت إزالة ${service.name} من المفضلة` : `تمت إضافة ${service.name} إلى المفضلة ⭐`,
      { id: 'fav-toggle-toast' }
    );
  }, [userFavorites, toast]);
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>(() => {
    try {
      const savedServices = localStorage.getItem('gamepay_services');
      if (savedServices) {
        const parsed = JSON.parse(savedServices);
        return parsed.reduce((acc: any, s: any) => ({ ...acc, [s.name]: s.isActive }), {});
      }
      const savedStatus = localStorage.getItem('gamepay_services_status');
      return savedStatus ? JSON.parse(savedStatus) : {};
    } catch (e) {
      return {};
    }
  });

  // Supplier Safety & Critical Stop State
  const [safetySettings, setSafetySettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('gamepay_safety_settings');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // App & System Maintenance Mode Guard State
  const [appSettings, setAppSettings] = useState<{ isMaintenanceMode: boolean; maintenanceMessage: string; supportTelegram: string }>(() => {
    try {
      const saved = localStorage.getItem('gamepay_system_settings');
      const directMode = localStorage.getItem('gamepay_maintenance_mode') === 'true' || localStorage.getItem('gamepay_is_maintenance_mode') === 'true';
      const directMsg = localStorage.getItem('gamepay_maintenance_message') || '';
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isMaintenanceMode: parsed.isMaintenanceMode ?? parsed.maintenanceMode ?? directMode,
          maintenanceMessage: parsed.maintenanceMessage || directMsg || 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
          supportTelegram: parsed.supportTelegram || 'https://t.me/gamepay_support'
        };
      }
      return {
        isMaintenanceMode: directMode,
        maintenanceMessage: directMsg || 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
        supportTelegram: 'https://t.me/gamepay_support'
      };
    } catch (e) {
      return {
        isMaintenanceMode: false,
        maintenanceMessage: 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
        supportTelegram: 'https://t.me/gamepay_support'
      };
    }
  });

  const [suppliersConfig, setSuppliersConfig] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_suppliers_config');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const isStoreEmergencyStopped = useMemo(() => {
    if (!safetySettings || !safetySettings.enableCriticalStop) return false;
    const likecard = suppliersConfig.find((s: any) => s.id === 'likecard') || suppliersConfig[0];
    if (!likecard) return false;
    const critical = safetySettings.criticalThreshold ?? 10;
    return (likecard.balance <= critical);
  }, [safetySettings, suppliersConfig]);

  useEffect(() => {
    const syncWithStorage = () => {
      try {
        // Sync maintenance settings
        const savedSettings = localStorage.getItem('gamepay_system_settings');
        const directMode = localStorage.getItem('gamepay_maintenance_mode') === 'true' || localStorage.getItem('gamepay_is_maintenance_mode') === 'true';
        const directMsg = localStorage.getItem('gamepay_maintenance_message') || '';
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setAppSettings({
            isMaintenanceMode: parsed.isMaintenanceMode ?? parsed.maintenanceMode ?? directMode,
            maintenanceMessage: parsed.maintenanceMessage || directMsg || 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
            supportTelegram: parsed.supportTelegram || 'https://t.me/gamepay_support'
          });
        } else {
          setAppSettings(prev => ({
            ...prev,
            isMaintenanceMode: directMode,
            maintenanceMessage: directMsg || prev.maintenanceMessage
          }));
        }

        const savedSafety = localStorage.getItem('gamepay_safety_settings');
        if (savedSafety) setSafetySettings(JSON.parse(savedSafety));

        const savedSuppliers = localStorage.getItem('gamepay_suppliers_config');
        if (savedSuppliers) setSuppliersConfig(JSON.parse(savedSuppliers));

        const savedServices = localStorage.getItem('gamepay_services');
        if (savedServices) {
          const parsed = JSON.parse(savedServices);
          const statusMap = parsed.reduce((acc: any, s: any) => ({ ...acc, [s.name]: s.isActive }), {});
          setServiceStatus(statusMap);
          setCatalogList(getSyncedCatalog(CATALOG));
          return;
        }
        const saved = localStorage.getItem('gamepay_services_status');
        if (saved) {
          setServiceStatus(JSON.parse(saved));
        }
      } catch (e) {}
    };

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        const detail = e.detail;
        setAppSettings({
          isMaintenanceMode: Boolean(detail.isMaintenanceMode ?? detail.maintenanceMode),
          maintenanceMessage: detail.maintenanceMessage || 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
          supportTelegram: detail.supportTelegram || 'https://t.me/gamepay_support'
        });
      }
    };

    const syncOrdersAndFavorites = () => {
      try {
        const raw = localStorage.getItem('gamepay_orders');
        if (raw) {
          const orders = JSON.parse(raw);
          if (Array.isArray(orders)) {
            setOrderHistory(orders);
            setPurchasedServices(
              orders.map((o: any) => o.serviceName || o.gameType || o.serviceId).filter(Boolean)
            );
          }
        }
      } catch (e) {}

      try {
        const rawFavs = localStorage.getItem('gamepay_user_favorites');
        if (rawFavs) {
          const parsed = JSON.parse(rawFavs);
          if (Array.isArray(parsed)) setUserFavorites(parsed);
        }
      } catch (e) {}
    };

    syncWithStorage();
    syncOrdersAndFavorites();
    window.addEventListener('storage', syncWithStorage);
    window.addEventListener('storage', syncOrdersAndFavorites);
    window.addEventListener('orders_updated', syncOrdersAndFavorites);
    window.addEventListener('gamepay_orders_updated', syncOrdersAndFavorites);
    window.addEventListener('gamepay_services_updated', syncWithStorage);
    window.addEventListener('gamepay_settings_updated', handleSettingsUpdated);

    const handleFilterTrigger = (e: any) => {
      const filter = e?.detail?.filter;
      if (filter === 'DEALS') {
        setIsDiscountOnly(true);
        setIsFavoritesOnly(false);
        setIsPopularityFilter(false);
        setActiveFilter('DEALS');
      } else if (filter === 'FAVORITES') {
        setIsFavoritesOnly(true);
        setIsDiscountOnly(false);
        setIsPopularityFilter(false);
        setActiveFilter('FAVORITES');
      } else if (filter === 'TOP_SELLERS' || filter === 'POPULARITY') {
        setIsPopularityFilter(true);
        setIsDiscountOnly(false);
        setIsFavoritesOnly(false);
        setActiveFilter('TOP_SELLERS');
      } else if (filter === 'ALL') {
        setIsDiscountOnly(false);
        setIsFavoritesOnly(false);
        setIsPopularityFilter(false);
        setActiveFilter('NONE');
      } else {
        setIsDiscountOnly(false);
        setIsFavoritesOnly(false);
        setIsPopularityFilter(false);
        setActiveFilter(filter);
      }
    };
    window.addEventListener('gamepay_filter_trigger', handleFilterTrigger);

    return () => {
      window.removeEventListener('storage', syncWithStorage);
      window.removeEventListener('storage', syncOrdersAndFavorites);
      window.removeEventListener('orders_updated', syncOrdersAndFavorites);
      window.removeEventListener('gamepay_orders_updated', syncOrdersAndFavorites);
      window.removeEventListener('gamepay_services_updated', syncWithStorage);
      window.removeEventListener('gamepay_settings_updated', handleSettingsUpdated);
      window.removeEventListener('gamepay_filter_trigger', handleFilterTrigger);
    };
  }, []);

  
  const [playerId, setPlayerId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<CatalogItem['packages'][0] | null>(null);
  const [selectedGateway, setSelectedGateway] = useState(GATEWAYS[0].id);
  
  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState<'SELECT_METHOD' | 'PROCESSING' | 'SUCCESS'>('SELECT_METHOD');
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // Dynamic calculation for the top-selling package in the currently viewed service
  const topSellingPackage = useMemo(() => {
    if (!selectedItem) return null;
    return getTopSellingPackage(selectedItem, orderHistory, catalogList);
  }, [selectedItem, orderHistory, catalogList]);

  // Active real discounts count and filtered catalog
  const activeDiscountsCount = useMemo(() => {
    return catalogList.filter(s => s.packages.some(p => Boolean(p.onSale && (p.discountPercent || 0) > 0 && (!p.expiresAt || Date.now() <= p.expiresAt)))).length;
  }, [catalogList]);

  const getCategoryItems = useCallback((categoryId: string | null) => {
    const items = catalogList.filter(item => {
      if (!isItemInCategory(item, categoryId)) return false;

      // Favorites Filter: If isFavoritesOnly is active, strictly filter by purchased or starred favorites
      if (isFavoritesOnly || activeFilter === 'FAVORITES') {
        const isFav = isServiceFavorite(item);
        if (!isFav) return false;
      }

      // Discount Match: If isDiscountOnly is true, ONLY include items where hasDiscount === true or discountPercent > 0
      if (isDiscountOnly || activeFilter === 'DEALS') {
        const hasDiscount = Boolean(
          item.hasDiscount === true ||
          (typeof item.maxDiscount === 'number' && item.maxDiscount > 0) ||
          (typeof (item as any).discountPercent === 'number' && (item as any).discountPercent > 0) ||
          (item.badge && item.badge.includes('خصم')) ||
          item.packages.some(p => Boolean(
            (p.onSale && (p.discountPercent || 0) > 0 && (!p.expiresAt || Date.now() <= p.expiresAt)) ||
            ((p.discountPercent || 0) > 0)
          ))
        );
        if (!hasDiscount) return false;
      }

      return true;
    });

    // Sorting Logic: If isPopularityFilter or activeFilter === 'TOP_SELLERS', sort descending based on salesCount
    if (isPopularityFilter || activeFilter === 'TOP_SELLERS') {
      return [...items].sort((a, b) => {
        const aSales = typeof a.salesCount === 'number' ? a.salesCount : (a.isPopular ? 10000 : 1000);
        const bSales = typeof b.salesCount === 'number' ? b.salesCount : (b.isPopular ? 10000 : 1000);
        return bSales - aSales;
      });
    }

    return items;
  }, [catalogList, isFavoritesOnly, isDiscountOnly, isPopularityFilter, activeFilter, isServiceFavorite]);

  const categoryPanelsData = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      items: getCategoryItems(cat.id),
    }));
  }, [getCategoryItems]);

  const reversedPanelsData = useMemo(() => {
    return [...categoryPanelsData].reverse();
  }, [categoryPanelsData]);

  const allItems = useMemo(() => {
    return getCategoryItems(null);
  }, [getCategoryItems]);

  const filteredCatalog = useMemo(() => {
    if (activeCategory === null) return allItems;
    return categoryPanelsData.find(p => p.category.id === activeCategory)?.items || [];
  }, [categoryPanelsData, activeCategory, allItems]);

  const renderProductCard = (item: CatalogItem, index: number) => {
    const isAvailable = serviceStatus[item.name] !== false; // default true if undefined
    const isFav = isServiceFavorite(item);
    const isPopularMode = Boolean(isPopularityFilter || activeFilter === 'TOP_SELLERS');

    // Dynamic leaderboard styling based on rank
    const getCardBorderAndBg = () => {
      if (!isAvailable) {
        return 'border-red-900/50 cursor-pointer grayscale bg-gradient-to-b from-slate-900/90 via-slate-950 to-black';
      }
      if (!isPopularMode) {
        return 'border-white/10 hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.3)] cursor-pointer bg-gradient-to-b from-slate-900/90 via-slate-950 to-black';
      }
      if (index === 0) {
        return 'border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/60 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] cursor-pointer bg-gradient-to-b from-amber-950/40 via-slate-950 to-black';
      }
      if (index === 1) {
        return 'border-slate-300/80 shadow-[0_0_24px_rgba(203,213,225,0.25)] ring-1 ring-slate-300/40 hover:shadow-[0_0_35px_rgba(203,213,225,0.4)] cursor-pointer bg-gradient-to-b from-slate-800/40 via-slate-950 to-black';
      }
      if (index === 2) {
        return 'border-orange-500/80 shadow-[0_0_22px_rgba(249,115,22,0.22)] ring-1 ring-orange-500/50 hover:shadow-[0_0_32px_rgba(249,115,22,0.35)] cursor-pointer bg-gradient-to-b from-orange-950/40 via-slate-950 to-black';
      }
      return 'border-slate-800/90 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.18)] cursor-pointer bg-gradient-to-b from-slate-900/90 via-slate-950 to-black';
    };

    return (
      <button
        key={item.id}
        onClick={() => handleOpenService({ ...item, isAvailable })}
        className={`group relative overflow-visible rounded-2xl border ${getCardBorderAndBg()} transition-all duration-300 flex flex-col justify-between w-full text-right`}
      >
        {/* Star / Favorite Quick Toggle Button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
          title={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          className={`absolute top-2 left-2 z-30 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            isFav 
              ? 'bg-amber-500/25 text-amber-400 border border-amber-400/40 shadow-sm shadow-amber-950/60' 
              : 'bg-black/50 text-slate-400 hover:text-amber-400 border border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </div>

        {/* Dynamic Leaderboard Badges OR Standard Badge */}
        {isPopularMode ? (
          <div className="absolute -top-2.5 right-3 z-30 pointer-events-none flex items-center gap-1.5">
            {index === 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1 border border-amber-300 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-1 ring-amber-300/60 shadow-amber-500/40 whitespace-nowrap">
                <span>🥇</span>
                <span>#1 الأكثر مبيعاً</span>
              </span>
            )}
            {index === 1 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1 border border-slate-200 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-950 ring-1 ring-slate-300/40 shadow-slate-400/20 whitespace-nowrap">
                <span>🥈</span>
                <span>#2</span>
              </span>
            )}
            {index === 2 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1 border border-orange-400 bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white shadow-orange-700/20 whitespace-nowrap">
                <span>🥉</span>
                <span>#3</span>
              </span>
            )}
            {index >= 3 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1 border border-slate-700 bg-slate-900/95 text-slate-300 whitespace-nowrap">
                <span>{index + 1}#</span>
              </span>
            )}
            {item.hasDiscount && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-sm flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 fill-white" />
                <span>%{item.maxDiscount || 15}-</span>
              </span>
            )}
          </div>
        ) : item.badge ? (
          <div className="absolute -top-2.5 right-3 z-30 pointer-events-none">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1 border ${
              item.hasDiscount || item.badge.includes('خصم')
                ? 'bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white border-rose-400/50 shadow-red-900/40'
                : 'bg-amber-500 text-slate-950 border-amber-300/40 shadow-amber-950/40 font-bold'
            }`}>
              {(item.hasDiscount || item.badge.includes('خصم')) && <Flame className="w-3 h-3 fill-white shrink-0" />}
              <span className="whitespace-nowrap">{item.badge}</span>
            </span>
          </div>
        ) : null}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center backdrop-blur-[2px] rounded-2xl">
             <div className="bg-red-500/20 border border-red-500/50 text-red-400 font-bold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1.5 text-xs">
                <span>🚫</span> غير متوفر حالياً
             </div>
          </div>
        )}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-20 w-32 h-32 rounded-full pointer-events-none ${item.glowColor}`}></div>
        
        {/* Compact Image Container: Flush borders, tight aspect ratio [4/3.3] to reduce vertical height */}
        <div className="w-full aspect-[4/3.3] relative overflow-hidden rounded-t-2xl z-10 bg-slate-950">
           <BrandLogo 
             url={item.logoUrl} 
             name={item.name} 
             className={`w-full h-full aspect-[4/3.3] object-cover rounded-t-2xl transition-transform duration-300 ease-out ${isAvailable ? 'group-hover:scale-105' : ''} drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]`} 
             category={item.category} 
             id={item.id} 
             color={item.glowColor.replace('bg-', 'text-')} 
           />
        </div>
        
        {/* Card Footer Section: Consistent inner padding p-3 */}
        <div className="w-full flex flex-col justify-center items-center bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-3 text-center z-10 relative rounded-b-2xl">
          <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-full block">{item.name}</h3>
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 sm:px-3 py-0.5 rounded-full mt-1 truncate max-w-full block">{item.typeLabel}</span>
        </div>
      </button>
    );
  };

  // Strict Global Service Opener / Purchase Blocker
  const handleOpenService = (service: CatalogItem & { isAvailable?: boolean }) => {
    if (isStoreEmergencyStopped) {
      alert(safetySettings?.emergencyMessage || "الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.");
      return;
    }
    const isAvailable = service.isAvailable !== undefined ? service.isAvailable : (serviceStatus[service.name] !== false);
    if (!isAvailable) {
      alert("هذه الخدمة متوقفة مؤقتاً حالياً ولا يمكن الشراء منها.");
      return;
    }
    const freshItem = catalogList.find(c => c.id === service.id || c.name === service.name) || service;
    setActiveCategory(freshItem.category);
    setSelectedItem(freshItem);
    setPlayerId('');
    const topPkg = getTopSellingPackage(freshItem, orderHistory, catalogList);
    setSelectedPackage(topPkg || freshItem.packages[0] || null);
    setIsItemModalOpen(true);
  };

  // Scroll Lock & Escape listener for Item Modal
  useEffect(() => {
    if (isItemModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsItemModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isItemModalOpen]);

  // Scroll Lock & Escape listener for Payment Modal
  useEffect(() => {
    if (isPaymentModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && paymentModalState !== 'PROCESSING') {
          setIsPaymentModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isPaymentModalOpen, paymentModalState]);
  
  const [rating, setRating] = useState(0);

  const getCurrencyIcon = (categoryId: string, id: string) => {
    if (id === 'pubg') return '🪙';
    if (id === 'freefire') return '💎';
    if (id === 'ludo') return '🎲';
    if (categoryId === 'GAMES') return '🎮';
    if (categoryId === 'STREAMING') return '👑';
    return '🏆';
  };

  const isValidId = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.fullType === 'DIGITAL_CODE') return true;
    if (!selectedItem.regex) return playerId.length > 0;
    return selectedItem.regex.test(playerId);
  }, [playerId, selectedItem]);

  const handleCheckout = () => {
    if (!selectedItem || serviceStatus[selectedItem.name] === false) {
      alert("هذه الخدمة متوقفة مؤقتاً حالياً ولا يمكن الشراء منها.");
      setIsItemModalOpen(false);
      return;
    }
    if (isValidId && selectedPackage) {
      setIsItemModalOpen(false);
      setWalletError(null);
      setPaymentModalState('SELECT_METHOD');
      setIsPaymentModalOpen(true);
    }
  };

  const productPriceUSD = useMemo(() => {
    if (!selectedPackage) return 0;
    if (typeof selectedPackage.retailPrice === 'number' && selectedPackage.retailPrice > 0) {
      return Number(selectedPackage.retailPrice.toFixed(2));
    }
    const match = selectedPackage.title.match(/\$(\d+(\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
    const iqd = selectedPackage.priceIQD || 1500;
    return Number((iqd / 1500).toFixed(2));
  }, [selectedPackage]);

  const setIsCheckoutModalOpen = (open: boolean) => {
    setIsPaymentModalOpen(open);
    if (!open) {
      setWalletError(null);
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async (productPrice: number) => {
    const currentBalance = Number(user.balanceUSD || 0);
    const price = Number(productPrice);

    // 1. Check if user has sufficient funds
    if (currentBalance < price) {
      toast.error("رصيد المحفظة غير كافٍ لإتمام العملية. يرجى إعادة شحن الحساب.", { id: 'wallet-balance-toast' });
      setWalletError("رصيد المحفظة غير كافٍ لإتمام العملية. يرجى إعادة شحن الحساب.");
      return;
    }

    try {
      setIsProcessing(true);
      setWalletError(null);

      // 2. Calculate updated balance
      const updatedBalance = currentBalance - price;

      // 3. Atomically update user balance in Firebase & Global State
      await updateUserBalance(user.uid, updatedBalance);

      // 4. Record order transaction in database
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedOrderId(orderId);

      await createOrderRecord({
        userId: user.uid,
        amountUSD: price,
        paymentMethod: 'GamePay Wallet',
        status: 'Completed',
        createdAt: new Date().toISOString(),
        orderId,
        serviceName: selectedItem?.name || 'خدمة ألعاب',
        packageTier: selectedPackage?.title || 'باقة ألعاب',
        playerId: selectedItem?.fullType === 'DIGITAL_CODE' ? 'DIGITAL_CODE' : playerId,
        totalAmountIQD: selectedPackage?.priceIQD || Math.round(price * 1500)
      });

      // Synchronize into Daily Financial Archives & orders list
      saveCompletedOrder({
        id: orderId,
        serviceName: selectedItem?.name || 'خدمة ألعاب',
        packageTier: selectedPackage?.title || 'باقة ألعاب',
        wholesaleCost: selectedPackage?.wholesaleCost || Number((price * 0.85).toFixed(2)),
        retailPrice: price,
        playerId: selectedItem?.fullType === 'DIGITAL_CODE' ? 'DIGITAL_CODE' : playerId,
        paymentMethod: 'GamePay Wallet',
        totalAmount: selectedPackage?.priceIQD || Math.round(price * 1500),
        date: new Date().toLocaleString('ar-IQ'),
        timestamp: Date.now(),
        status: 'مكتمل'
      });

      if (selectedItem) {
        setPurchasedServices(prev => [...prev, selectedItem.name, selectedItem.id]);
        setOrderHistory(prev => [{
          id: orderId,
          serviceName: selectedItem.name,
          serviceId: selectedItem.id,
          packageTier: selectedPackage?.title,
          packageId: selectedPackage?.id,
          status: 'مكتمل'
        }, ...prev]);
      }

      // 5. Success feedback & modal closure
      toast.success(`تم الشراء بنجاح! الرصيد المتبقي: $${updatedBalance.toFixed(2)}`, { id: 'wallet-purchase-toast' });
      setIsCheckoutModalOpen(false);

    } catch (error) {
      console.error("Wallet purchase failed:", error);
      toast.error("حدث خطأ أثناء الخصم من المحفظة، يرجى المحاولة مرة أخرى.", { id: 'wallet-purchase-toast' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async () => {
    if (isStoreEmergencyStopped) {
      alert(safetySettings?.emergencyMessage || "الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.");
      setIsPaymentModalOpen(false);
      return;
    }
    if (!selectedItem || !selectedPackage) return;
    if (serviceStatus[selectedItem.name] === false) {
      alert("هذه الخدمة متوقفة مؤقتاً حالياً ولا يمكن الشراء منها.");
      setIsPaymentModalOpen(false);
      return;
    }

    if (selectedGateway === 'wallet') {
      await handleWalletPayment(productPriceUSD);
      return;
    }

    setPaymentModalState('PROCESSING');
    
    setTimeout(() => {
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedOrderId(orderId);
      setPaymentModalState('SUCCESS');
      
      const newOrder = {
        id: orderId,
        serviceName: selectedItem.name,
        serviceId: selectedItem.id,
        packageTier: selectedPackage.title,
        packageId: selectedPackage.id,
        wholesaleCost: selectedPackage.wholesaleCost,
        retailPrice: selectedPackage.retailPrice,
        playerId: selectedItem.fullType === 'DIGITAL_CODE' ? 'DIGITAL_CODE' : playerId,
        paymentMethod: GATEWAYS.find(g => g.id === selectedGateway)?.name || 'Unknown',
        totalAmount: selectedPackage.priceIQD,
        date: new Date().toLocaleString('ar-IQ'),
        timestamp: Date.now(),
        status: 'مكتمل'
      };
      
      saveCompletedOrder(newOrder);
      if (selectedItem) {
        setPurchasedServices(prev => [...prev, selectedItem.name, selectedItem.id]);
        setOrderHistory(prev => [{
          id: orderId,
          serviceName: selectedItem.name,
          serviceId: selectedItem.id,
          packageTier: selectedPackage.title,
          packageId: selectedPackage.id,
          status: 'مكتمل'
        }, ...prev]);
      }
    }, 2500);
  };

  // ------------------------------------------------------------------
  // ROUTE GUARD: MAINTENANCE MODE STOREFRONT GUARD
  // If Maintenance Mode is active and the visitor is not an authenticated Admin,
  // display the dedicated full-screen MaintenanceScreen.
  // ------------------------------------------------------------------
  const userIsAdmin = Boolean(currentUser && currentUser.email && currentUser.email.toLowerCase().trim() === 'haiderfoad@gmail.com');

  if (appSettings.isMaintenanceMode && !userIsAdmin) {
    return (
      <MaintenanceScreen 
        message={appSettings.maintenanceMessage}
        telegramLink={appSettings.supportTelegram}
        onAdminClick={() => onNavigate('LOGIN')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] pb-20 relative font-sans text-slate-200">
      {/* Background Mesh & Grid removed for obsidian look */}
      <SidebarDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onNavigate={onNavigate} 
        onExitCart={() => setIsCartOpen(false)}
        onSelectCategory={(category) => {
          setIsCartOpen(false);
          setActiveCategory(category);
          setIsFavoritesOnly(false);
          setIsDiscountOnly(false);
          setIsPopularityFilter(false);
          setActiveFilter('NONE');
        }}
        onSelectFilter={(filter) => {
          setIsCartOpen(false);
          if (filter === 'DEALS') {
            setIsDiscountOnly(true);
            setIsFavoritesOnly(false);
            setIsPopularityFilter(false);
            setActiveFilter('DEALS');
          } else if (filter === 'FAVORITES') {
            setIsFavoritesOnly(true);
            setIsDiscountOnly(false);
            setIsPopularityFilter(false);
            setActiveFilter('FAVORITES');
          } else if (filter === 'TOP_SELLERS') {
            setIsPopularityFilter(true);
            setIsDiscountOnly(false);
            setIsFavoritesOnly(false);
            setActiveFilter('TOP_SELLERS');
          } else {
            setIsDiscountOnly(false);
            setIsFavoritesOnly(false);
            setIsPopularityFilter(false);
            setActiveFilter('NONE');
          }
        }}
      />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        catalog={catalogList} 
        serviceStatus={serviceStatus}
        onSelect={(item: any) => handleOpenService(item)} 
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
      />
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        currentBalance={balance}
        savedCards={[]}
        onConfirmDeposit={async (amountUSD) => {
          const newBal = Number((balance + amountUSD).toFixed(2));
          await updateUserBalance(user?.uid, newBal);
          toast.success(`تم شحن المحفظة بنجاح! الرصيد الجديد: $${newBal.toFixed(2)}`, { id: 'wallet-deposit-toast' });
          setIsDepositModalOpen(false);
        }}
        user={user}
      />
      
      {/* Refactored Mobile UX Standard Header */}
      <header className="sticky top-0 z-50 w-full select-none bg-slate-950/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-md">
        {/* 1. TOP ACTION BAR (RTL Standardized Layout - h-12) */}
        <div className="w-full h-12 px-3.5 flex items-center justify-between">
          {/* RIGHT SECTION: Hamburger Menu Button inside compact glass card & Sleek Search Icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => {
                setIsCartOpen(false);
                setIsDrawerOpen(true);
              }} 
              className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="فتح القائمة الجانبية"
              title="القائمة الرئيسية"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="البحث"
              title="بحث سريع"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* CENTER SECTION: Brand Logo + Dynamic Sub-PING Badge */}
          <div 
            onClick={() => {
              setIsCartOpen(false);
              setActiveFilter('NONE');
              setActiveCategory('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center flex-1 mx-2 cursor-pointer group min-w-0 leading-tight"
            title="PayGame - الصفحة الرئيسية"
          >
            <div dir="ltr" className="flex items-center justify-center gap-1.5 active:scale-95 transition-all">
              <span className="text-base sm:text-lg shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                🎮
              </span>
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent font-black tracking-wider text-lg drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                PayGame
              </span>
            </div>

            {/* Live PING Subtitle under Logo */}
            <LivePingBadge />
          </div>

          {/* LEFT SECTION: Shopping Cart Icon inside a compact glass button with live badge */}
          <div className="flex items-center shrink-0">
            <motion.button 
              animate={cartBadgePulse ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setIsDrawerOpen(false);
                setIsCartOpen(true);
              }} 
              className="relative p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="فتح سلة المشتريات"
              title="سلة المشتريات"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse">
                  {cart.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto pt-1 sm:pt-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
          
          {/* 1. QUICK BALANCE BAR (Spacing: my-2 px-4, compact height) */}
          <div className="my-2 px-4">
            <div className="w-full h-10 px-4 flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-md shadow-sm">
              {(!currentUser || !currentUser.email || balance <= 0) ? (
                <>
                  {/* Right Side: Prominent Call-To-Action button */}
                  <button
                    onClick={async () => {
                      if (!currentUser || !currentUser.email) {
                        addAppToast({
                          message: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة',
                          type: 'info'
                        });
                        try {
                          const u = await signInWithGoogle();
                          if (u) {
                            addAppToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
                          }
                        } catch {
                          setIsAuthModalOpen(true);
                        }
                      } else {
                        setIsDepositModalOpen(true);
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 hover:brightness-110"
                  >
                    <span>{(!currentUser || !currentUser.email) ? 'سجل الدخول للشحن' : 'اشحن محفظتك ⚡'}</span>
                  </button>

                  {/* Left Side: Display $0.00 in neutral text */}
                  <div 
                    onClick={async () => {
                      if (!currentUser || !currentUser.email) {
                        addAppToast({
                          message: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة',
                          type: 'info'
                        });
                        try {
                          const u = await signInWithGoogle();
                          if (u) {
                            addAppToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
                          }
                        } catch {
                          setIsAuthModalOpen(true);
                        }
                      } else {
                        setIsDepositModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 text-slate-400 font-mono text-xs font-semibold cursor-pointer hover:text-slate-200 transition-colors"
                    title={(!currentUser || !currentUser.email) ? 'يرجى تسجيل الدخول للشحن' : 'رصيد المحفظة $0.00 - اضغط للشحن'}
                  >
                    <span>$0.00</span>
                    <span>💳</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Right Side: Active Wallet indicator & Top-up button */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>رصيد المحفظة</span>
                    </span>
                    <button
                      onClick={() => setIsDepositModalOpen(true)}
                      className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      شحن ⚡
                    </button>
                  </div>

                  {/* Left Side: Live Formatted Balance (e.g. $66.00 💳) */}
                  <div 
                    onClick={() => setIsDepositModalOpen(true)}
                    className="flex items-center gap-1.5 font-mono cursor-pointer active:scale-95 transition-all"
                    title="شحن رصيد المحفظة الإلكترونية"
                  >
                    <span className="text-emerald-400 font-extrabold text-sm tracking-tight">
                      ${balance.toFixed(2)}
                    </span>
                    <span className="text-xs">💳</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Storefront Emergency Announcement Banner */}
          {isStoreEmergencyStopped && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="mx-4 my-2 bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 text-amber-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 text-center shadow-lg shadow-amber-500/10"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{safetySettings?.emergencyMessage || 'الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.'}</span>
            </motion.div>
          )}

          {/* 2. HERO SLIDER BANNER (Spacing: my-2 px-4, rounded-3xl) */}
          <div className="my-2 px-4">
            <HeroCarousel onSelectService={handleOpenService} serviceStatus={serviceStatus} catalog={catalogList} />
          </div>
          
          {/* 3. STICKY CATEGORY FILTER CHIPS BAR (Pinned right under top Navbar at top-12) */}
          <div className="sticky top-12 z-20 bg-[#0b0f19] border-b border-white/10 shadow-sm py-2 px-4">
            <div 
              className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full whitespace-nowrap py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {CATEGORIES.map(chip => {
                const isActive = activeCategory === chip.id;
                return (
                  <button 
                    key={chip.id} 
                    ref={el => { categoryPillRefs.current[chip.id] = el; }}
                    onClick={() => handleCategoryClick(chip.id)}
                    className={`relative overflow-hidden px-4 py-2 rounded-full text-xs shrink-0 flex items-center gap-1.5 cursor-pointer select-none transition-colors duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border border-amber-400 shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {!isActive && <span>{chip.icon}</span>}
                      <span>{chip.label}</span>
                      {isActive && chip.id !== 'explore' && (
                        <span className="w-4 h-4 rounded-full bg-slate-950/20 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✕
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. ACTIVE FILTER BANNER (SHOWN ONLY WHEN POPULARITY / DEALS / FAVORITES IS EXPLICITLY FILTERED) */}
          {(isPopularityFilter || activeFilter === 'TOP_SELLERS') ? (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 p-4 mx-4 my-2.5 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black flex items-center justify-center text-xl shrink-0">
                  ⚡
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    ⚡ قائمة الخدمات الأكثر شعبية والأكثر طلباً
                  </h2>
                  <p className="text-xs text-amber-200/70 font-medium">
                    مرتبة تلقائياً بحسب أعلى معدل مبيعات وطلبات مكتملة
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsFavoritesOnly(false);
                  setIsDiscountOnly(false);
                  setIsPopularityFilter(false);
                  setActiveFilter('NONE');
                  setActiveCategory('explore');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <span>عرض الكل</span>
                <span>✕</span>
              </button>
            </div>
          ) : (isFavoritesOnly || isDiscountOnly || activeFilter !== 'NONE') ? (
            <div className="flex items-center justify-between mt-2 mb-3 px-4 text-sm font-extrabold text-white">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                {(isFavoritesOnly || activeFilter === 'FAVORITES') && <span>⭐ المنتجات المفضلة</span>}
                {!isFavoritesOnly && (isDiscountOnly || activeFilter === 'DEALS') && <span>🔥 العروض والخصومات</span>}
              </h2>
              <button 
                onClick={() => {
                  setIsFavoritesOnly(false);
                  setIsDiscountOnly(false);
                  setIsPopularityFilter(false);
                  setActiveFilter('NONE');
                  setActiveCategory('explore');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>عرض الكل</span>
                <span>✕</span>
              </button>
            </div>
          ) : null}

          {/* Continuous Multi-Panel Track Architecture - 60/120fps GPU Accelerated */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full overflow-hidden relative select-none"
            style={{ 
              touchAction: 'pan-y', 
              overscrollBehaviorX: 'none', 
              direction: 'ltr' 
            }}
          >
            <div
              ref={trackRef}
              className="flex flex-nowrap items-start w-full"
              style={{
                transform: `translate3d(${((CATEGORIES.length - 1) - categoryIndex) * -100}%, 0, 0)`,
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transition: 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                direction: 'ltr',
              }}
            >
              {reversedPanelsData.map(({ category, items: panelItems }, panelIdx) => {
                const currentTrackIndex = (CATEGORIES.length - 1) - categoryIndex;
                const isNear = Math.abs(panelIdx - currentTrackIndex) <= 1;

                if (!isNear) {
                  return (
                    <div 
                      key={category.id} 
                      dir="rtl" 
                      className="w-full shrink-0 px-4"
                      style={{ 
                        contain: 'layout paint style', 
                        contentVisibility: 'hidden',
                        minHeight: '200px'
                      }} 
                    />
                  );
                }

                return (
                  <div 
                    key={category.id} 
                    dir="rtl" 
                    className="w-full shrink-0 px-4"
                    style={{ contain: 'layout paint style' }}
                  >
                    {panelItems.length === 0 ? (
                      <div className="py-12 px-6 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3 my-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                          {isFavoritesOnly || activeFilter === 'FAVORITES' ? (
                            <Star className="w-7 h-7 text-amber-400 fill-amber-400/20" />
                          ) : (
                            <Flame className="w-7 h-7 text-amber-400" />
                          )}
                        </div>
                        <h3 className="text-white font-bold text-base sm:text-lg">
                          {isFavoritesOnly || activeFilter === 'FAVORITES'
                            ? 'لا توجد خدمات في مفضلاتك بعد ⭐️'
                            : isDiscountOnly || activeFilter === 'DEALS'
                            ? 'لا تتوفر عروض أو خصومات حالياً في هذه الفئة 🏷️'
                            : 'لا توجد عناصر مطابقة لهذه التصفية حالياً'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {isFavoritesOnly || activeFilter === 'FAVORITES'
                            ? 'الخدمات التي تقوم بشحنها ستنضم تلقائياً إلى قائمتك المفضلة لتسهيل إعادة الشراء.'
                            : isDiscountOnly || activeFilter === 'DEALS'
                            ? 'يمكنك تصفح جميع الخدمات المتاحة في هذا القسم أو مراجعة باقي الأقسام.'
                            : 'يمكنك استعراض باقي الأقسام أو إعادة ضبط التصفية.'}
                        </p>
                        <button 
                          onClick={() => {
                            setIsFavoritesOnly(false);
                            setIsDiscountOnly(false);
                            setIsPopularityFilter(false);
                            setActiveFilter('NONE');
                            setActiveCategory('explore');
                          }}
                          className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-transform cursor-pointer"
                        >
                          {isFavoritesOnly || activeFilter === 'FAVORITES' 
                            ? 'تصفح جميع الخدمات'
                            : isDiscountOnly || activeFilter === 'DEALS' 
                            ? 'عرض جميع خدمات الفئة' 
                            : 'إلغاء التصفية ✕'}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mt-2 pb-10">
                        {panelItems.map((item, index) => (
                          <MemoizedProductCard
                            key={item.id}
                            item={item}
                            index={index}
                            isAvailable={serviceStatus[item.name] !== false}
                            isFav={isServiceFavorite(item)}
                            isPopularMode={Boolean(isPopularityFilter || activeFilter === 'TOP_SELLERS')}
                            onOpen={handleOpenService}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            </motion.div>
      </div>

      {/* Dynamic Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsItemModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} onClick={e => e.stopPropagation()} className="w-full sm:max-w-xl bg-slate-900 border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden cursor-default">
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <BrandLogo url={selectedItem.logoUrl} name={selectedItem.name} className="w-10 h-10 rounded-xl object-cover" category={selectedItem.category} id={selectedItem.id} />
                  <div>
                    <h2 className="text-lg font-black text-white">{selectedItem.name}</h2>
                    <span className="text-xs text-emerald-400">{selectedItem.typeLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleFavorite(selectedItem)}
                    title={isServiceFavorite(selectedItem) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isServiceFavorite(selectedItem)
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                        : 'bg-white/5 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${isServiceFavorite(selectedItem) ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button onClick={() => setIsItemModalOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* ID Input */}
                {selectedItem.fullType === 'DIRECT_ID' ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">معرف اللاعب (ID)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
                        placeholder="أدخل المعرف"
                        className={`w-full bg-[#080b11] border ${playerId.length > 0 ? (isValidId ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-400' : 'border-red-500 text-red-400') : 'border-slate-700 focus:border-amber-500 text-white'} rounded-xl px-4 py-3 font-mono text-lg outline-none transition-all`}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {playerId.length > 0 && (
                          isValidId ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex gap-3 items-center">
                    <Key className="w-6 h-6 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-100/80">سيصلك كود التفعيل الرقمي فوراً.</p>
                  </div>
                )}

                {/* Packages */}
                <div>
                  <h3 className="font-bold text-white mb-3 text-sm">اختر الباقة</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.packages.map(pkg => {
                      const isSelected = selectedPackage?.title === pkg.title;
                      const isBestseller = Boolean(
                        topSellingPackage && (
                          (topSellingPackage.id && topSellingPackage.id === pkg.id) ||
                          topSellingPackage.title === pkg.title
                        )
                      );
                      const hasDiscount = Boolean(pkg.onSale && (pkg.discountPercent || 0) > 0);
                      const originalIQD = pkg.originalPrice ? Math.round(pkg.originalPrice * 1500) : null;
                      return (
                        <button
                          key={pkg.title}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex flex-col justify-between relative overflow-hidden ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40' 
                              : isBestseller
                              ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.12)] hover:border-amber-400'
                              : 'bg-white/5 border-white/10 hover:border-amber-500/50'
                          }`}
                        >
                          {/* Corner Badges */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                            {isBestseller && (
                              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-[9px] flex items-center gap-1 shadow-md shadow-amber-500/30 border border-amber-300/40">
                                <span>🔥</span>
                                <span>الأكثر مبيعاً</span>
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center gap-0.5 shadow-sm">
                                <span>%{pkg.discountPercent}-</span>
                              </span>
                            )}
                          </div>

                          <div className="w-full pt-4">
                            <span className={`font-bold text-sm sm:text-base mb-1 block truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{pkg.title}</span>
                            {hasDiscount && originalIQD && (
                              <span className="text-[11px] text-slate-500 line-through font-mono block">
                                {originalIQD.toLocaleString()} د.ع
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-baseline justify-between w-full">
                            <span className={`font-mono font-black text-sm sm:text-base ${isSelected || isBestseller ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {pkg.priceIQD.toLocaleString()} د.ع
                            </span>
                            {pkg.retailPrice && (
                              <span className="font-mono text-[10px] text-slate-400">
                                (${pkg.retailPrice.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Row */}
              <div className="p-4 border-t border-white/10 bg-slate-950 flex gap-3 mt-auto">
                <button
                  disabled={!isValidId || !selectedPackage}
                  onClick={(e) => {
                     e.stopPropagation();
                     addToCart({ service: selectedItem, package: selectedPackage, playerId: selectedItem.fullType === 'DIGITAL_CODE' ? 'DIGITAL_CODE' : playerId });
                     setIsItemModalOpen(false);
                     setPlayerId('');
                     setSelectedPackage(null);
                     toast.success('تمت إضافة الخدمة إلى السلة بنجاح', { id: 'cart-status-toast' });
                     setCartBadgePulse(true);
                     setTimeout(() => setCartBadgePulse(false), 300);
                  }}
                  className="flex-1 py-3.5 bg-slate-800 border border-white/10 rounded-xl font-bold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  إضافة للسلة
                </button>
                <button
                  disabled={!isValidId || !selectedPackage}
                  onClick={handleCheckout}
                  className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-[#ff6b00] rounded-xl font-black text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  اشترِ الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedItem && selectedPackage && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => { if(paymentModalState === 'SELECT_METHOD' || paymentModalState === 'SUCCESS') setIsPaymentModalOpen(false); }} />
            
            {paymentModalState === 'SELECT_METHOD' && (
              <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} onClick={e => e.stopPropagation()} className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 p-6 flex flex-col cursor-default">
                <h3 className="font-black text-white text-xl mb-4 text-center">اختر طريقة الدفع</h3>

                {/* Product Summary Header */}
                <div className="bg-[#080b11] p-3.5 rounded-2xl mb-4 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">المنتج والباقة:</span>
                    <span className="font-bold text-white text-sm">{selectedItem.name} - {selectedPackage.title}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-emerald-400 font-bold text-base block">${productPriceUSD.toFixed(2)} USD</span>
                    <span className="text-slate-400 text-[11px]">{selectedPackage.priceIQD.toLocaleString()} د.ع</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {GATEWAYS.map(gw => (
                    <button key={gw.id} onClick={() => { setSelectedGateway(gw.id); setWalletError(null); }} className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${selectedGateway === gw.id ? `border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] ${gw.color}/20 bg-white/10` : 'border-white/10 bg-[#080b11] hover:bg-white/5'}`}>
                      {gw.id === 'wallet' ? (
                        <Wallet className={`w-7 h-7 ${selectedGateway === gw.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                      ) : (
                        <CreditCard className={`w-7 h-7 ${selectedGateway === gw.id ? 'text-white' : 'text-slate-500'}`} />
                      )}
                      <span className="text-xs font-bold text-center text-white">{gw.name}</span>
                    </button>
                  ))}
                </div>

                {/* Wallet Balance Status Card when selected */}
                {selectedGateway === 'wallet' && (
                  <div className={`p-4 rounded-2xl border mb-4 text-xs transition-all ${
                    balance < productPriceUSD 
                      ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        رصيد محفظة GamePay الفوري
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        ${balance.toFixed(2)} USD
                      </span>
                    </div>

                    {balance < productPriceUSD ? (
                      <div className="space-y-2 mt-2 pt-2 border-t border-red-500/20">
                        <div className="flex items-start gap-2 text-red-300">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>رصيد المحفظة غير كافٍ لإتمام العملية (${balance.toFixed(2)} متاح / مطلوب ${productPriceUSD.toFixed(2)}). يرجى إعادة شحن الحساب.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPaymentModalOpen(false);
                            setIsDepositModalOpen(true);
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Wallet className="w-4 h-4" />
                          شحن المحفظة الآن (Top Up)
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-slate-300 mt-1 pt-2 border-t border-emerald-500/20 text-[11px]">
                        <span>الرصيد المتبقي بعد الخصم:</span>
                        <span className="font-mono font-bold text-emerald-300">${(balance - productPriceUSD).toFixed(2)} USD</span>
                      </div>
                    )}
                  </div>
                )}

                {walletError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{walletError}</span>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-colors">إلغاء</button>
                  <button 
                    id="confirm-payment-btn"
                    onClick={confirmPayment} 
                    disabled={isProcessing}
                    className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-black text-lg shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'جاري الخصم...' : 'تأكيد ودفع'}
                  </button>
                </div>
              </motion.div>
            )}

            {paymentModalState === 'PROCESSING' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className="w-full sm:max-w-md bg-slate-900 border border-amber-500/20 sm:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 p-10 flex flex-col items-center justify-center text-center cursor-default">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-[#ff6b00]/20 rounded-full absolute top-0 left-0"></div>
                  <div className="w-24 h-24 border-4 border-transparent border-t-[#ff6b00] border-r-[#ff6b00] rounded-full animate-spin relative z-10 shadow-[0_0_20px_rgba(255,107,0,0.4)]"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[#ff6b00]">
                    <Gamepad2 className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-white mb-2">جاري معالجة الدفع والشحن...</h2>
                <p className="text-[#ff6b00] animate-pulse font-mono text-sm bg-[#ff6b00]/10 px-3 py-1.5 rounded-lg border border-[#ff6b00]/20">Connecting to B2B Gateways...</p>
              </motion.div>
            )}

            {paymentModalState === 'SUCCESS' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className="w-full sm:max-w-md bg-slate-900 border border-emerald-500/30 sm:rounded-3xl rounded-t-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] relative z-10 p-8 flex flex-col cursor-default">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 text-center">تم التنفيذ بنجاح!</h2>
                <p className="text-emerald-200/70 mb-6 text-sm text-center">
                  {selectedItem.fullType === 'DIRECT_ID' 
                    ? 'تم إضافة الباقة إلى حسابك في اللعبة بشكل فوري ومباشر.' 
                    : 'تم إصدار الكود الرقمي الخاص بك بنجاح.'}
                </p>
                
                <div className="bg-[#080b11] p-5 rounded-2xl mb-6 border border-white/10 text-right shadow-inner relative overflow-hidden text-sm">
                  <div className="absolute -right-5 -top-5 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl"></div>
                  
                  {selectedItem.fullType === 'DIGITAL_CODE' && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                      <p className="text-xs text-emerald-400 mb-1">كود التفعيل (Digital Code)</p>
                      <p className="font-mono text-xl text-white tracking-wider font-black">X7K9-M2P4-Q8R5</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">رقم الطلب</span><span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-md">{generatedOrderId}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">الخدمة</span><span className="text-white font-bold">{selectedItem.name}</span></div>
                    {selectedItem.fullType === 'DIRECT_ID' && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">المعرف</span><span className="font-mono text-[#00f0ff] font-bold">{playerId}</span></div>
                    )}
                    <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">الباقة</span><span className="text-white">{selectedPackage?.title}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500">طريقة الدفع</span><span className="text-white">{GATEWAYS.find(g => g.id === selectedGateway)?.name}</span></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => {
                    const fakeOrder = {
                      id: generatedOrderId,
                      serviceName: selectedItem.name,
                      playerId: selectedItem.fullType === 'DIGITAL_CODE' ? 'DIGITAL_CODE' : playerId,
                      packageTier: selectedPackage.title,
                      paymentMethod: GATEWAYS.find(g => g.id === selectedGateway)?.name || 'Unknown',
                      totalAmount: selectedPackage.priceIQD,
                      date: new Date().toLocaleString('ar-IQ')
                    };
                    downloadPDFReceipt(fakeOrder);
                  }} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-amber-500 font-bold text-sm flex items-center justify-center transition-colors">
                    تحميل الفاتورة PDF
                  </button>
                  <button onClick={() => { setIsPaymentModalOpen(false); setPlayerId(''); setSelectedPackage(null); }} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                    إغلاق ومتابعة
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
