const fs = require('fs');

let code = fs.readFileSync('src/components/Storefront.tsx', 'utf8');

// Replace priceSAR with priceIQD everywhere
code = code.replace(/priceSAR/g, 'priceIQD');
code = code.replace(/ر\.س/g, 'د.ع');

// Write back to the file
fs.writeFileSync('src/components/Storefront.tsx', code);
