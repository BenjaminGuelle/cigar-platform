/**
 * Script de génération des icônes PWA
 * Génère toutes les tailles d'icônes nécessaires pour iOS et Android
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/icons/pwa');

// Tailles requises pour PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Couleurs du design system "Smoke & Gold"
const COLORS = {
  background: '#0a0a0a',
  gold: '#d4af37',
  goldLight: '#c5a059',
  text: '#f2f2f2',
  border: '#666666'
};

/**
 * Crée un SVG d'icône avec le logo C&C
 * Version simplifiée sans dépendance aux fonts externes
 */
function createIconSvg(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0; // 10% padding pour maskable
  const innerSize = size - (padding * 2);
  const center = size / 2;
  const radius = innerSize / 2 - 2;
  const innerRadius = radius - 10;

  // Taille de la police proportionnelle
  const fontSize = Math.floor(innerSize * 0.35);
  const ampersandSize = Math.floor(fontSize * 0.28);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${COLORS.background}"/>

  <!-- Outer circle (subtle) -->
  <circle cx="${center}" cy="${center}" r="${radius}" stroke="${COLORS.border}" stroke-width="${Math.max(1, size / 256)}" fill="none"/>

  <!-- Inner gold circle -->
  <circle cx="${center}" cy="${center}" r="${innerRadius}" stroke="${COLORS.goldLight}" stroke-width="${Math.max(2, size / 64)}" fill="none"/>

  <!-- C&C Text - Using system serif as fallback -->
  <text x="${center}" y="${center + fontSize * 0.15}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${fontSize}px"
        font-weight="400"
        fill="${COLORS.text}"
        letter-spacing="-0.02em">
    <tspan>C</tspan>
    <tspan fill="${COLORS.goldLight}" font-size="${ampersandSize}px" font-weight="700" dy="-${ampersandSize * 0.1}">&amp;</tspan>
    <tspan fill="${COLORS.text}" font-size="${fontSize}px" font-weight="400" dy="${ampersandSize * 0.1}">C</tspan>
  </text>

  <!-- Decorative gold dots -->
  <circle cx="${center}" cy="${center - innerRadius + 5}" r="${Math.max(1.5, size / 170)}" fill="${COLORS.goldLight}"/>
</svg>`;
}

/**
 * Génère une icône PNG à partir du SVG
 */
async function generateIcon(size, maskable = false) {
  const svg = createIconSvg(size, maskable);
  const filename = maskable ? `maskable-icon-${size}x${size}.png` : `icon-${size}x${size}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated: ${filename}`);
}

/**
 * Génère l'icône Apple Touch (180x180)
 */
async function generateAppleTouchIcon() {
  const size = 180;
  const svg = createIconSvg(size, false);
  const outputPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log('✓ Generated: apple-touch-icon.png');
}

/**
 * Génère les icônes de raccourcis
 */
async function generateShortcutIcons() {
  // Icône Clubs (avec symbole utilisateurs)
  const clubsSvg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="96" rx="16" fill="${COLORS.background}"/>
    <circle cx="48" cy="36" r="12" stroke="${COLORS.goldLight}" stroke-width="2" fill="none"/>
    <path d="M28 68c0-11 9-20 20-20s20 9 20 20" stroke="${COLORS.goldLight}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="72" cy="32" r="8" stroke="${COLORS.gold}" stroke-width="1.5" fill="none" opacity="0.7"/>
    <circle cx="24" cy="32" r="8" stroke="${COLORS.gold}" stroke-width="1.5" fill="none" opacity="0.7"/>
  </svg>`;

  // Icône Tastings (avec symbole flamme/cigare)
  const tastingsSvg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="96" rx="16" fill="${COLORS.background}"/>
    <path d="M48 20c-8 12-16 20-16 32 0 12 7.2 20 16 20s16-8 16-20c0-12-8-20-16-32z"
          stroke="${COLORS.goldLight}" stroke-width="2" fill="none"/>
    <path d="M48 36c-4 6-8 10-8 16 0 6 3.6 10 8 10s8-4 8-10c0-6-4-10-8-16z"
          fill="${COLORS.goldLight}" opacity="0.3"/>
  </svg>`;

  await sharp(Buffer.from(clubsSvg)).png().toFile(path.join(OUTPUT_DIR, 'shortcut-clubs.png'));
  console.log('✓ Generated: shortcut-clubs.png');

  await sharp(Buffer.from(tastingsSvg)).png().toFile(path.join(OUTPUT_DIR, 'shortcut-tastings.png'));
  console.log('✓ Generated: shortcut-tastings.png');
}

/**
 * Génère le favicon ICO (multi-tailles)
 */
async function generateFavicon() {
  const sizes = [16, 32, 48];
  const buffers = [];

  for (const size of sizes) {
    const svg = createIconSvg(size, false);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    buffers.push({ size, buffer });
  }

  // Pour un vrai ICO, il faudrait un package comme 'to-ico'
  // Pour l'instant, on crée juste un favicon 32x32
  const svg = createIconSvg(32, false);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));

  console.log('✓ Generated: favicon-32x32.png');
}

async function main() {
  console.log('🎨 Generating PWA icons for Cigar & Club...\n');

  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Générer toutes les tailles d'icônes standard
  for (const size of ICON_SIZES) {
    await generateIcon(size, false);
  }

  // Générer l'icône maskable (512x512)
  await generateIcon(512, true);

  // Générer l'icône Apple Touch
  await generateAppleTouchIcon();

  // Générer les icônes de raccourcis
  await generateShortcutIcons();

  // Générer le favicon
  await generateFavicon();

  console.log('\n✅ All PWA icons generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);