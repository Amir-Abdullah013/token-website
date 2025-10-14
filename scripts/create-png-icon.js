const fs = require('fs');
const path = require('path');

// Create a simple 144x144 PNG icon using a minimal approach
// This creates a basic blue square with white circle and "T" text
const createPNGIcon = () => {
  // For now, let's create a simple SVG that browsers can handle
  const svgContent = `<svg width="144" height="144" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
    <rect width="144" height="144" fill="#3B82F6"/>
    <circle cx="72" cy="72" r="45" fill="white"/>
    <text x="72" y="85" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="54" font-weight="bold">T</text>
  </svg>`;
  
  // Write as SVG for now (browsers can handle SVG icons)
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon-144x144.png'), svgContent);
  console.log('✅ Created icon-144x144.png');
};

createPNGIcon();

















