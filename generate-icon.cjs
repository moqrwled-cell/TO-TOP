const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const width = 1024;
  const height = 1024;

  const svgImage = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Deep Black Background -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="#0a0a0a" />
    
    <!-- Luxurious Gold Accent Gradient -->
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bf953f" />
        <stop offset="50%" stop-color="#fcf6ba" />
        <stop offset="100%" stop-color="#b38728" />
      </linearGradient>
    </defs>
    
    <!-- Subtle Top/Bottom Accents -->
    <rect x="0" y="0" width="${width}" height="12" fill="url(#goldGrad)" />
    <rect x="0" y="${height - 12}" width="${width}" height="12" fill="url(#goldGrad)" />
    
    <!-- Text -->
    <!-- We use Arabic text directly in SVG. -->
    <text x="512" y="600" font-family="'Segoe UI', Arial, sans-serif" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle" direction="rtl">نحو الأفضل</text>
    
    <!-- Gold Underline under text -->
    <rect x="312" y="660" width="400" height="8" rx="4" fill="url(#goldGrad)" />
    
    <!-- Abstract Icon above text (Upward arrow / Mountain peak style) -->
    <path d="M 512 250 L 650 400 L 580 400 L 580 480 L 444 480 L 444 400 L 374 400 Z" fill="url(#goldGrad)" />
  </svg>
  `;

  const svgBuffer = Buffer.from(svgImage);

  try {
    console.log("Generating icon.jpg...");
    await sharp(svgBuffer).jpeg({ quality: 100 }).toFile('public/icon.jpg');
    
    console.log("Generating icon-192x192.jpg...");
    await sharp(svgBuffer).resize(192, 192).jpeg({ quality: 100 }).toFile('public/icon-192x192.jpg');
    
    console.log("Generating icon-512x512.jpg...");
    await sharp(svgBuffer).resize(512, 512).jpeg({ quality: 100 }).toFile('public/icon-512x512.jpg');
    
    console.log("Icons generated successfully!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

generateIcons();
