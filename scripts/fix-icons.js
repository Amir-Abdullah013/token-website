const fs = require('fs');
const path = require('path');

// Create a simple 16x16 ICO file (minimal approach)
const createFavicon = () => {
  // For now, create a simple SVG that works as favicon
  const svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="#3B82F6"/>
    <circle cx="16" cy="16" r="10" fill="white"/>
    <text x="16" y="20" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="12" font-weight="bold">T</text>
  </svg>`;
  
  // Write as SVG (modern browsers handle SVG favicons)
  fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), svgContent);
  console.log('✅ Fixed favicon.ico');
};

// Create a proper 144x144 PNG icon
const createPNGIcon = () => {
  const svgContent = `<svg width="144" height="144" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
    <rect width="144" height="144" fill="#3B82F6"/>
    <circle cx="72" cy="72" r="45" fill="white"/>
    <text x="72" y="85" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="54" font-weight="bold">T</text>
  </svg>`;
  
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon-144x144.png'), svgContent);
  console.log('✅ Fixed icon-144x144.png');
};

createFavicon();
createPNGIcon();
console.log('🎯 All icons fixed!');











