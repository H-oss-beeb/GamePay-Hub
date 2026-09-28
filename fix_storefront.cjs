const fs = require('fs');
let code = fs.readFileSync('src/components/Storefront.tsx', 'utf8');

const hookInjection = `  const [activeCategory, setActiveCategory] = useState<'GAMES' | 'STREAMING' | 'SPORTS'>('GAMES');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkStatus = () => {
      const saved = localStorage.getItem('gamepay_services_status');
      if (saved) {
        try {
          setServiceStatus(JSON.parse(saved));
        } catch (e) {}
      }
    };
    checkStatus();
    window.addEventListener('storage', checkStatus);
    // Also poll every few seconds just in case since same-window localStorage might not fire 'storage' event in some browsers
    const interval = setInterval(checkStatus, 2000);
    return () => {
      window.removeEventListener('storage', checkStatus);
      clearInterval(interval);
    };
  }, []);
`;
code = code.replace(
  `  const [activeCategory, setActiveCategory] = useState<'GAMES' | 'STREAMING' | 'SPORTS'>('GAMES');\n  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);`,
  hookInjection
);

fs.writeFileSync('src/components/Storefront.tsx', code);
