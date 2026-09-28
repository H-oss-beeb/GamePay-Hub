const fs = require('fs');
let code = fs.readFileSync('src/components/Storefront.tsx', 'utf8');

code = code.replace(/priceIQD/g, 'priceSAR');

fs.writeFileSync('src/components/Storefront.tsx', code);
