'use strict';

const Jimp = require('jimp');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const ALBION_RENDER = 'https://render.albiononline.com/v1/item/';
const ICON_SIZE = 90;
const CARD_W = 700;
const CARD_H = 520;

// Slot positions on the card (x, y, label)
const SLOT_LAYOUT = [
  { key: 'mainHand', x: 60,  y: 180, label: 'Ana El' },
  { key: 'offHand',  x: 60,  y: 310, label: 'İkinci El' },
  { key: 'head',     x: 305, y: 30,  label: 'Baş' },
  { key: 'chest',    x: 305, y: 160, label: 'Göğüs' },
  { key: 'boots',    x: 305, y: 295, label: 'Botlar' },
  { key: 'cape',     x: 550, y: 180, label: 'Pelerin' },
  { key: 'food',     x: 165, y: 410, label: 'Yemek' },
  { key: 'potion',   x: 440, y: 410, label: 'İksir' },
];

// Fetch an item icon as a Jimp image
async function fetchIcon(itemId) {
  try {
    const url = `${ALBION_RENDER}${encodeURIComponent(itemId)}.png?size=${ICON_SIZE}&quality=1`;
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) return null;
    const buf = await res.buffer();
    const img = await Jimp.read(buf);
    img.resize(ICON_SIZE, ICON_SIZE);
    return img;
  } catch {
    return null;
  }
}

// Draw rounded rectangle border
function drawBorder(img, x, y, w, h, color) {
  // Top and bottom edges
  for (let i = x; i < x + w; i++) {
    img.setPixelColor(color, i, y);
    img.setPixelColor(color, i, y + h - 1);
  }
  // Left and right edges
  for (let j = y; j < y + h; j++) {
    img.setPixelColor(color, x, j);
    img.setPixelColor(color, x + w - 1, j);
  }
}

// Fill rectangle
function fillRect(img, x, y, w, h, color) {
  for (let cy = y; cy < y + h; cy++) {
    for (let cx = x; cx < x + w; cx++) {
      img.setPixelColor(color, cx, cy);
    }
  }
}

async function generateBuildImage(buildData, weaponName, roleName, eventTitle, username) {
  if (!buildData) buildData = {};

  // Create base canvas
  const card = new Jimp(CARD_W, CARD_H, 0x0d1117ff); // Very dark bg

  // Dark panel background
  fillRect(card, 10, 10, CARD_W - 20, CARD_H - 20, 0x161b22ff);

  // Gold border
  const GOLD = Jimp.cssColorToHex('#c9a84c');
  drawBorder(card, 10, 10, CARD_W - 20, CARD_H - 20, GOLD);
  drawBorder(card, 11, 11, CARD_W - 22, CARD_H - 22, GOLD);

  // Header bar
  fillRect(card, 10, 10, CARD_W - 20, 60, 0x1f2937ff);
  drawBorder(card, 10, 10, CARD_W - 20, 60, GOLD);

  // Draw each slot
  for (const slot of SLOT_LAYOUT) {
    const itemId = buildData[slot.key];
    const sx = slot.x;
    const sy = slot.y;

    // Slot background
    fillRect(card, sx, sy, ICON_SIZE + 4, ICON_SIZE + 4, 0x21262dff);
    drawBorder(card, sx, sy, ICON_SIZE + 4, ICON_SIZE + 4, 0x30363dff);
    drawBorder(card, sx + 1, sy + 1, ICON_SIZE + 2, ICON_SIZE + 2, 0x30363dff);

    if (itemId) {
      // Draw item icon
      const icon = await fetchIcon(itemId);
      if (icon) {
        card.composite(icon, sx + 2, sy + 2);
        // Gold highlight border for filled slots
        drawBorder(card, sx, sy, ICON_SIZE + 4, ICON_SIZE + 4, GOLD);
      }
    }

    // Draw slot label above slot (small text would require a font, skip for now)
    // Slot labels are positioned but Jimp doesn't support text natively without font loading
  }

  // Try to add text using Jimp's built-in bitmap font
  try {
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_8_WHITE);

    // Title
    card.print(fontLarge, 20, 22, `${eventTitle || 'Etkinlik'} — Build Kartı`, CARD_W - 40);

    // Username & role
    const roleText = `${username || '???'} | ${roleName || '???'} | ${weaponName || '???'}`;
    card.print(fontSmall, 20, 44, roleText, CARD_W - 40);

    // Slot labels
    for (const slot of SLOT_LAYOUT) {
      card.print(fontSmall, slot.x, slot.y - 12 < 0 ? slot.y + ICON_SIZE + 5 : slot.y - 12, slot.label);
    }
  } catch {
    // Font loading failed — image still has icons
  }

  // Return as PNG buffer
  const buf = await card.getBufferAsync(Jimp.MIME_PNG);
  return buf;
}

module.exports = { generateBuildImage };
