const fs = require('fs');
let code = fs.readFileSync('src/components/Storefront.tsx', 'utf8');

const oldCards = `{CATALOG.filter(item => item.category === activeCategory).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setPlayerId('');
                      setSelectedPackage(null);
                      setIsItemModalOpen(true);
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.3)] transition-all duration-300 h-56 cursor-pointer flex flex-col justify-between bg-gradient-to-b from-slate-900/90 via-slate-950 to-black w-full"
                  >
                    <div className={\`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-20 w-32 h-32 rounded-full pointer-events-none \${item.glowColor}\`}></div>
                    <div className={\`w-full h-40 relative overflow-hidden rounded-t-2xl z-10 flex items-center justify-center bg-black/40 p-3\`}>
                       <BrandLogo 
                         url={item.logoUrl} 
                         name={item.name} 
                         className={\`max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]\`} 
                         category={item.category} 
                         id={item.id} 
                         color={item.glowColor.replace('bg-', 'text-')} 
                       />
                    </div>
                    <div className="h-20 w-full flex flex-col justify-center items-center bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-2 text-center z-10 relative">
                      <h3 className="text-sm font-extrabold text-white tracking-wide truncate max-w-full block">{item.name}</h3>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-0.5 rounded-full mt-1 truncate max-w-full block">{item.typeLabel}</span>
                    </div>
                  </button>
                ))}`;

const newCards = `{CATALOG.filter(item => item.category === activeCategory).map(item => {
                  const isAvailable = serviceStatus[item.name] !== false; // default true if undefined
                  return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!isAvailable) return;
                      setSelectedItem(item);
                      setPlayerId('');
                      setSelectedPackage(null);
                      setIsItemModalOpen(true);
                    }}
                    disabled={!isAvailable}
                    className={\`group relative overflow-hidden rounded-2xl border \${isAvailable ? 'border-white/10 hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.3)] cursor-pointer' : 'border-red-900/50 cursor-not-allowed grayscale'} transition-all duration-300 h-56 flex flex-col justify-between bg-gradient-to-b from-slate-900/90 via-slate-950 to-black w-full\`}
                  >
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center backdrop-blur-[2px]">
                         <div className="bg-red-500/20 border border-red-500/50 text-red-400 font-bold px-4 py-2 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2">
                            <span>🚫</span> غير متوفر حالياً
                         </div>
                      </div>
                    )}
                    <div className={\`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-20 w-32 h-32 rounded-full pointer-events-none \${item.glowColor}\`}></div>
                    <div className={\`w-full h-40 relative overflow-hidden rounded-t-2xl z-10 flex items-center justify-center bg-black/40 p-3\`}>
                       <BrandLogo 
                         url={item.logoUrl} 
                         name={item.name} 
                         className={\`max-w-full max-h-full object-contain transition-transform duration-300 ease-out \${isAvailable ? 'group-hover:scale-105' : ''} drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]\`} 
                         category={item.category} 
                         id={item.id} 
                         color={item.glowColor.replace('bg-', 'text-')} 
                       />
                    </div>
                    <div className="h-20 w-full flex flex-col justify-center items-center bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-2 text-center z-10 relative">
                      <h3 className="text-sm font-extrabold text-white tracking-wide truncate max-w-full block">{item.name}</h3>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-0.5 rounded-full mt-1 truncate max-w-full block">{item.typeLabel}</span>
                    </div>
                  </button>
                )
                })}`;

code = code.replace(oldCards, newCards);

fs.writeFileSync('src/components/Storefront.tsx', code);
