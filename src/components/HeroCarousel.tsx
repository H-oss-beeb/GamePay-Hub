import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATALOG, CatalogItem } from './Storefront';

export default React.memo(function HeroCarousel({ 
  onSelectService, 
  serviceStatus = {},
  catalog = CATALOG
}: { 
  onSelectService: (service: CatalogItem & { isAvailable?: boolean }) => void;
  serviceStatus?: Record<string, boolean>;
  catalog?: CatalogItem[];
}) {
  const [localStatus, setLocalStatus] = useState<Record<string, boolean>>(serviceStatus);

  useEffect(() => {
    if (serviceStatus && Object.keys(serviceStatus).length > 0) {
      setLocalStatus(serviceStatus);
    }
  }, [serviceStatus]);

  // Event-driven status sync without aggressive setInterval polling
  useEffect(() => {
    const checkStatus = () => {
      try {
        const savedServices = localStorage.getItem('gamepay_services');
        if (savedServices) {
          const parsed = JSON.parse(savedServices);
          if (Array.isArray(parsed)) {
            const statusMap = parsed.reduce((acc: any, s: any) => ({ ...acc, [s.name]: s.isActive }), {});
            setLocalStatus(statusMap);
            return;
          }
        }
        const saved = localStorage.getItem('gamepay_services_status');
        if (saved) {
          setLocalStatus(JSON.parse(saved));
        }
      } catch (e) {}
    };

    window.addEventListener('storage', checkStatus);
    window.addEventListener('gamepay_services_updated', checkStatus);
    return () => {
      window.removeEventListener('storage', checkStatus);
      window.removeEventListener('gamepay_services_updated', checkStatus);
    };
  }, []);

  // Filter 6 exact services (2 per category starting with PUBG)
  const sourceCatalog = catalog && catalog.length > 0 ? catalog : CATALOG;
  const featuredServices = [
    sourceCatalog.find(s => s.id === 'pubg') || sourceCatalog[0],
    sourceCatalog.find(s => s.id === 'ludo') || sourceCatalog.find(s => s.id === 'freefire') || sourceCatalog[1],
    sourceCatalog.find(s => s.id === 'shahid') || sourceCatalog[2],
    sourceCatalog.find(s => s.id === 'netflix') || sourceCatalog.find(s => s.id === 'apple') || sourceCatalog[3],
    sourceCatalog.find(s => s.id === 'bein_sports') || sourceCatalog[4],
    sourceCatalog.find(s => s.id === 'starzplay_sports') || sourceCatalog[5],
  ].filter(Boolean) as CatalogItem[];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Swipe & Autoplay Pause State
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalGestureRef = useRef<boolean | null>(null);
  const pauseAutoplayUntilRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const pauseAutoplay = useCallback((durationMs: number = 5000) => {
    pauseAutoplayUntilRef.current = Date.now() + durationMs;
  }, []);

  // Freeze banner autoplay while user is performing category swipe
  useEffect(() => {
    const handleSwipeActive = (e: any) => {
      if (e?.detail?.active) {
        pauseAutoplayUntilRef.current = Date.now() + 5000;
      }
    };
    window.addEventListener('gamepay_swipe_active', handleSwipeActive);
    return () => window.removeEventListener('gamepay_swipe_active', handleSwipeActive);
  }, []);

  const goToNextSlide = useCallback(() => {
    if (featuredServices.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % featuredServices.length);
  }, [featuredServices.length]);

  const goToPrevSlide = useCallback(() => {
    if (featuredServices.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + featuredServices.length) % featuredServices.length);
  }, [featuredServices.length]);

  // Autoplay with 5s interval and interaction pause
  useEffect(() => {
    if (featuredServices.length === 0) return;

    timerRef.current = setInterval(() => {
      if (Date.now() < pauseAutoplayUntilRef.current) {
        return; // Paused due to recent user touch/interaction
      }
      goToNextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [featuredServices.length, goToNextSlide]);

  // Touch handlers for manual banner swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalGestureRef.current = null;
    pauseAutoplay(5000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    if (isHorizontalGestureRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 7 || absY > 7) {
        isHorizontalGestureRef.current = absX >= absY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    const wasHorizontal = isHorizontalGestureRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalGestureRef.current = null;
    pauseAutoplay(5000);

    if (!wasHorizontal) return;

    // Physical RTL logic:
    // Drag finger RIGHT (deltaX > 40) -> Advance to NEXT banner slide
    // Drag finger LEFT (deltaX < -40) -> Go back to PREVIOUS banner slide
    if (deltaX > 40) {
      goToNextSlide();
    } else if (deltaX < -40) {
      goToPrevSlide();
    }
  };

  const activeService = featuredServices[currentSlide] || featuredServices[0] || sourceCatalog[0];
  const isAvailable = localStatus[activeService.name] !== false;

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onSelectService({ ...activeService, isAvailable })}
      className={`relative w-full h-[220px] sm:h-[235px] md:h-[250px] rounded-3xl overflow-hidden border select-none ${
        isAvailable 
          ? 'border-slate-800/80 hover:border-amber-500/40 cursor-pointer' 
          : 'border-red-900/60 cursor-not-allowed'
      } shadow-2xl bg-slate-950 group transition-all`}
      style={{ touchAction: 'pan-y', overscrollBehaviorX: 'contain' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeService.id + '-' + currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="absolute inset-0 overflow-hidden"
          style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
        >
          {/* Full-Cover Background Image extending flush edge-to-edge with zero letterboxing */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <img 
               crossOrigin="anonymous"
               src={activeService.logoUrl} 
               alt={activeService.name} 
               width={600}
               height={250}
               draggable={false}
               loading="lazy"
               decoding="async"
               className={`w-full h-full object-cover object-center transition-transform duration-500 pointer-events-none select-none ${
                 isAvailable 
                   ? 'brightness-85 sm:brightness-80' 
                   : 'brightness-40 grayscale'
               }`}
               style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' as any }}
            />
            {/* Smooth RTL Gradient Fade: ensures high contrast on right for text and keeps artwork clear on left */}
            <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/80 via-45% to-transparent z-10" />
            {/* Top & Bottom Vignette Fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/25 z-10" />
          </div>

          {/* Unavailable badge at top corner for mobile/desktop */}
          {!isAvailable && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5 bg-red-950/90 border border-red-500/50 text-red-400 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md">
              <span>🚫</span> متوقف مؤقتاً
            </div>
          )}

          {/* Pinned Corner Promotional Badge for Discounted Services (renders ONLY if hasDiscount === true) */}
          {isAvailable && Boolean(activeService.hasDiscount) && (
            <div className="absolute top-0 left-0 z-30 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-xs font-extrabold tracking-wide py-1.5 px-3.5 sm:px-4 rounded-br-2xl border-b border-r border-orange-300/30 shadow-md shadow-red-950/60 flex items-center gap-1 select-none">
              <span>🔥</span>
              <span>عرض خاص -{activeService.maxDiscount || (activeService as any).discountPercent || 15}%</span>
            </div>
          )}

          {/* Text Grouping (Clean RTL Alignment) */}
          <div className="relative z-20 flex flex-col justify-center items-start text-right h-full p-4 sm:p-7 max-w-[62%] sm:max-w-[55%] space-y-1.5 sm:space-y-2">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold px-3 py-0.5 rounded-full backdrop-blur-md">
                <span>🔥</span> الأكثر مبيعاً • {activeService.category === 'GAMES' ? 'الألعاب' : activeService.category === 'STREAMING' ? 'الترفيه والمسلسلات' : 'القنوات الرياضية'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] sm:text-xs font-bold px-3 py-0.5 rounded-full backdrop-blur-md">
                <span>🚫</span> غير متوفر حالياً
              </span>
            )}
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {activeService.name}
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm font-medium line-clamp-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {isAvailable ? 'شحن فوري مباشر بأفضل الأسعار الرسمية' : 'هذه الخدمة متوقفة مؤقتاً حالياً في المتجر'}
            </p>
            {isAvailable ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onSelectService({ ...activeService, isAvailable }); }}
                className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>اشحن الآن</span>
                <span className="text-sm">⚡</span>
              </button>
            ) : (
              <button 
                disabled
                className="mt-2 bg-red-950/80 border border-red-500/50 text-red-400 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl opacity-50 pointer-events-none cursor-not-allowed flex items-center gap-2"
              >
                <span>غير متوفر حالياً</span>
                <span className="text-sm">🚫</span>
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Buttons */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          pauseAutoplay(5000);
          goToPrevSlide();
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          pauseAutoplay(5000);
          goToNextSlide();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 shadow-lg">
        {featuredServices.map((service, index) => {
          const serviceAvail = localStatus[service.name] !== false;
          return (
            <button
              key={index}
              onClick={(e) => { 
                e.stopPropagation(); 
                pauseAutoplay(5000);
                setCurrentSlide(index); 
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? (serviceAvail ? 'w-5 bg-amber-500' : 'w-5 bg-red-500') 
                  : (serviceAvail ? 'w-1.5 bg-slate-600 hover:bg-slate-400' : 'w-1.5 bg-red-900/60')
              }`}
            />
          );
        })}
      </div>
    </div>
  );
});
