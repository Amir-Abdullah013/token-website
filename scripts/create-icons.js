const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#3B82F6"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
    <text x="${size/2}" y="${size/2 + size/20}" text-anchor="middle" fill="#3B82F6" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold">T</text>
  </svg>`;
};

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create different sized icons
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svgContent = createIcon(size);
  const filename = `icon-${size}x${size}.png`;
  
  // For now, save as SVG (we'll convert to PNG later)
  const svgFilename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, svgFilename), svgContent);
  
  console.log(`Created ${svgFilename}`);
});

// Also create the specific icon that's missing
const icon144 = createIcon(144);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-144x144.png'), icon144);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-144x144.svg'), icon144);

console.log('Icons created successfully!');
