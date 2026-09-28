import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Gamepad2, Tv, Trophy, Gift, Key, Sparkles } from 'lucide-react';

export default function SearchModal({ 
  isOpen, 
  onClose, 
  catalog = [], 
  onSelect,
  serviceStatus = {} 
}: {
  isOpen: boolean;
  onClose: () => void;
  catalog: any[];
  onSelect: (item: any) => void;
  serviceStatus?: Record<string, boolean>;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and reset query upon opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Modal Scroll Lock & Escape key listener
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const cleanQuery = (query || '').trim().toLowerCase();

  const results = cleanQuery.length > 0 
    ? catalog.filter((item: any) => 
        (item.name && item.name.toLowerCase().includes(cleanQuery)) || 
        (item.typeLabel && item.typeLabel.toLowerCase().includes(cleanQuery)) ||
        (item.category && item.category.toLowerCase().includes(cleanQuery))
      )
    : [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GAMES':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'STREAMING':
        return <Tv className="w-4 h-4 text-sky-400" />;
      case 'SPORTS':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'GIFT_CARDS':
        return <Gift className="w-4 h-4 text-purple-400" />;
      case 'SUBSCRIPTIONS':
        return <Key className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-xl p-4 flex flex-col gap-4 items-center justify-start overflow-y-auto"
        >
          {/* Inner Content Container */}
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl flex flex-col gap-3 mt-2 sm:mt-6"
            dir="rtl"
          >
            {/* Top Bar: Dynamic Search Input with auto-focus + Prominent Close Button (✕) */}
            <div className="flex items-center gap-2.5 w-full">
              <div className="relative flex-1 flex items-center bg-slate-900/90 border border-white/10 focus-within:border-amber-500/50 rounded-2xl shadow-xl transition-all h-12 px-3.5">
                <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ابحث عن لعبة، بطاقة، باقة، أو اشتراك..."
                  className="w-full bg-transparent border-none outline-none text-white text-sm sm:text-base placeholder-slate-400 pr-1 pl-2"
                />
                {query.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs cursor-pointer ml-1"
                    title="مسح البحث"
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Prominent Close Button (✕) */}
              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg group"
                title="إغلاق البحث"
                aria-label="إغلاق البحث"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Live Search Results Container */}
            <div className="w-full bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col max-h-[75vh]">
              {cleanQuery.length > 0 ? (
                <div className="overflow-y-auto p-3 divide-y divide-white/5 space-y-1">
                  {results.length > 0 ? (
                    results.map((item: any) => {
                      const isAvailable = serviceStatus ? serviceStatus[item.name] !== false : true;
                      const startingPrice = item.packages && item.packages.length > 0 ? item.packages[0].priceIQD : null;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelect({ ...item, isAvailable });
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right group ${
                            isAvailable 
                              ? 'hover:bg-white/5 cursor-pointer' 
                              : 'opacity-70 hover:bg-red-950/20 cursor-pointer'
                          }`}
                        >
                          <img 
                            src={item.logoUrl} 
                            alt={item.name} 
                            className={`w-11 h-11 object-contain bg-slate-950 p-1.5 rounded-xl border border-white/10 shrink-0 group-hover:border-amber-500/40 transition-colors ${
                              !isAvailable ? 'grayscale brightness-60' : ''
                            }`} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-bold truncate transition-colors ${
                                isAvailable ? 'text-white group-hover:text-amber-400' : 'text-slate-300'
                              }`}>
                                {item.name}
                              </h4>
                              {!isAvailable ? (
                                <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                                  غير متوفر 🚫
                                </span>
                              ) : item.badge ? (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                                  {item.badge}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                              {getCategoryIcon(item.category)}
                              <span className="truncate">{item.typeLabel}</span>
                            </div>
                          </div>

                          {startingPrice && (
                            <div className="text-left shrink-0">
                              <span className="font-mono text-xs text-amber-400 font-bold block">
                                {startingPrice.toLocaleString()} د.ع
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                ابتداءً من
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-12 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-slate-500">
                        🔍
                      </div>
                      <span className="font-bold text-white text-sm">
                        لا توجد نتائج مطابقة لـ "{(query || '').trim()}"
                      </span>
                      <span className="text-xs text-slate-400">
                        تأكد من كتابة اسم اللعبة أو الخدمة بشكل صحيح أو تصفح الأقسام الرئيسية
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Suggested Popular Services when Search is Empty */
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>الخدمات الأكثر بحثاً وشهرة</span>
                    </span>
                    <span className="text-[10px] text-slate-500">اضغط للاختيار السريع</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {catalog.slice(0, 6).map((item: any) => {
                      const isAvailable = serviceStatus ? serviceStatus[item.name] !== false : true;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelect({ ...item, isAvailable });
                            onClose();
                          }}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/40 hover:bg-white/5 transition-all text-right cursor-pointer group"
                        >
                          <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded-lg object-contain bg-slate-900 p-1 border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-white group-hover:text-amber-400 block truncate transition-colors">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.typeLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
