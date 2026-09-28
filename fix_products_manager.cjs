const fs = require('fs');
let code = fs.readFileSync('src/components/ProductsManager.tsx', 'utf8');

// 1. Add localStorage persistence
const useEffectCode = `
  useEffect(() => {
    const saved = localStorage.getItem('gamepay_services_status');
    if (saved) {
      try {
        const statusMap = JSON.parse(saved);
        setServices(prev => prev.map(s => ({
          ...s,
          isActive: statusMap[s.name] !== undefined ? statusMap[s.name] : s.isActive
        })));
        setDraftServices(prev => prev.map(s => ({
          ...s,
          isActive: statusMap[s.name] !== undefined ? statusMap[s.name] : s.isActive
        })));
      } catch (e) {
        console.error("Failed to parse services status", e);
      }
    }
  }, []);

  useEffect(() => {
    // Only save to localStorage if it's not the initial state (or save it anyway since services is initialized)
    if (services.length > 0) {
      const statusMap = services.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
      localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    }
  }, [services]);
`;

code = code.replace(
  `  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set(['1']));`,
  `  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set(['1']));\n${useEffectCode}`
);

// 2. Fix the modal structure
const modalOld = `<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 hide-scrollbar">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white">إضافة خدمة جديدة</h2>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="space-y-4">`;

const modalNew = `<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shadow-2xl z-50">
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-white">إضافة خدمة جديدة</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 m-1 z-50 transition-colors">
                   <X className="w-5 h-5"/>
                 </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4 flex-1">`;

code = code.replace(modalOld, modalNew);

// 3. Fix the bottom button padding/margin in the modal
const saveBtnOld = `<button onClick={handleAddServiceSubmit} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-lg flex items-center justify-center gap-2 mt-8 sticky bottom-0 z-10">
                <Save className="w-5 h-5" /> حفظ وإنشاء الخدمة مع باقاتها
              </button>
            </motion.div>`;
const saveBtnNew = `<button onClick={handleAddServiceSubmit} className="w-full shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-lg flex items-center justify-center gap-2 mt-4 sticky bottom-0 z-10">
                <Save className="w-5 h-5" /> حفظ وإنشاء الخدمة مع باقاتها
              </button>
              </div>
            </motion.div>`;
code = code.replace(saveBtnOld, saveBtnNew);

fs.writeFileSync('src/components/ProductsManager.tsx', code);
