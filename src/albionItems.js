'use strict';

// Albion Online item render URL
const renderUrl = (itemId, quality = 1) =>
  `https://render.albiononline.com/v1/item/${itemId}.png?quality=${quality}`;

// All weapon types with display info
const WEAPON_TYPES = [
  // ── KILIÇLAR ──────────────────────────────────
  { id: 'MAIN_SWORD',        name: 'Kılıç',              category: 'Kılıç',         hand: '1H', roles: ['tank','dps'] },
  { id: '2H_CLAYMORE',       name: 'Claymore',           category: 'Kılıç',         hand: '2H', roles: ['tank','dps'] },
  { id: '2H_DUALSWORD',      name: 'Çift Kılıç',         category: 'Kılıç',         hand: '2H', roles: ['dps'] },
  // ── BALTALAR ──────────────────────────────────
  { id: 'MAIN_AXE',          name: 'Balta',              category: 'Balta',         hand: '1H', roles: ['dps','tank'] },
  { id: '2H_AXE',            name: 'Büyük Balta',        category: 'Balta',         hand: '2H', roles: ['dps'] },
  { id: '2H_HALBERD',        name: 'Halberd',            category: 'Balta',         hand: '2H', roles: ['dps','support'] },
  { id: '2H_SCYTHE',         name: 'Tırpan',             category: 'Balta',         hand: '2H', roles: ['dps'] },
  // ── TOPUZLAR ──────────────────────────────────
  { id: 'MAIN_MACE',         name: 'Topuz',              category: 'Topuz',         hand: '1H', roles: ['tank','support'] },
  { id: '2H_MACE',           name: 'Büyük Topuz',        category: 'Topuz',         hand: '2H', roles: ['tank'] },
  { id: 'MAIN_ROCKMACE',     name: 'Kaya Topuzu',        category: 'Topuz',         hand: '1H', roles: ['tank'] },
  // ── ÇEKİÇLER ──────────────────────────────────
  { id: '2H_HAMMER',         name: 'Çekiç',              category: 'Çekiç',         hand: '2H', roles: ['tank'] },
  { id: '2H_POLEHAMMER',     name: 'Saplı Çekiç',        category: 'Çekiç',         hand: '2H', roles: ['tank','dps'] },
  // ── MIZRAKLAR ─────────────────────────────────
  { id: 'MAIN_SPEAR',        name: 'Mızrak',             category: 'Mızrak',        hand: '1H', roles: ['dps','support'] },
  { id: '2H_SPEAR',          name: 'İki El Mızrak',      category: 'Mızrak',        hand: '2H', roles: ['dps'] },
  { id: '2H_GLAIVE',         name: 'Glaive',             category: 'Mızrak',        hand: '2H', roles: ['dps','support'] },
  // ── HANÇERLER ─────────────────────────────────
  { id: 'MAIN_DAGGER',       name: 'Hançer',             category: 'Hançer',        hand: '1H', roles: ['dps'] },
  { id: '2H_DAGGERPAIR',     name: 'Çift Hançer',        category: 'Hançer',        hand: '2H', roles: ['dps'] },
  { id: '2H_CLAWS',          name: 'Pençeler',           category: 'Hançer',        hand: '2H', roles: ['dps'] },
  // ── YAYLAR ────────────────────────────────────
  { id: 'MAIN_BOW',          name: 'Yay',                category: 'Yay',           hand: '2H', roles: ['dps'] },
  { id: '2H_BOW',            name: 'Savaş Yayı',         category: 'Yay',           hand: '2H', roles: ['dps'] },
  { id: '2H_CROSSBOW',       name: 'Büyük Tatar Yayı',   category: 'Tatar Yayı',    hand: '2H', roles: ['dps'] },
  { id: 'MAIN_CROSSBOW',     name: 'Tatar Yayı',         category: 'Tatar Yayı',    hand: '1H', roles: ['dps'] },
  // ── ASALAR ────────────────────────────────────
  { id: 'MAIN_QUARTERSTAFF', name: 'Asa',                category: 'Asa',           hand: '1H', roles: ['tank','dps','support'] },
  { id: '2H_QUARTERSTAFF',   name: 'İki El Asa',         category: 'Asa',           hand: '2H', roles: ['tank','support'] },
  { id: '2H_IRONCLADEDSTAFF','name': 'Demirli Asa',      category: 'Asa',           hand: '2H', roles: ['tank'] },
  // ── ATEŞ ASASI ────────────────────────────────
  { id: 'MAIN_FIRESTAFF',    name: 'Ateş Asası',         category: 'Ateş Asası',    hand: '1H', roles: ['dps'] },
  { id: '2H_FIRESTAFF',      name: 'Büyük Ateş Asası',   category: 'Ateş Asası',    hand: '2H', roles: ['dps'] },
  { id: '2H_INFERNOSTAFF',   name: 'İnferno Asası',      category: 'Ateş Asası',    hand: '2H', roles: ['dps'] },
  // ── BUZ ASASI ─────────────────────────────────
  { id: 'MAIN_FROSTSTAFF',   name: 'Buz Asası',          category: 'Buz Asası',     hand: '1H', roles: ['dps','support'] },
  { id: '2H_FROSTSTAFF',     name: 'Büyük Buz Asası',    category: 'Buz Asası',     hand: '2H', roles: ['dps','support'] },
  { id: '2H_ICEGAUNTLETS',   name: 'Buz Eldiveni',       category: 'Buz Asası',     hand: '2H', roles: ['dps','support'] },
  // ── GİZEM ASASI ───────────────────────────────
  { id: 'MAIN_ARCANESTAFF',  name: 'Gizem Asası',        category: 'Gizem Asası',   hand: '1H', roles: ['support','dps'] },
  { id: '2H_ARCANESTAFF',    name: 'Büyük Gizem Asası',  category: 'Gizem Asası',   hand: '2H', roles: ['support','dps'] },
  { id: '2H_ENIGMATICSTAFF', name: 'Enigmatik Asa',      category: 'Gizem Asası',   hand: '2H', roles: ['support'] },
  // ── LANET ASASI ───────────────────────────────
  { id: 'MAIN_CURSEDSTAFF',  name: 'Lanet Asası',        category: 'Lanet Asası',   hand: '1H', roles: ['dps','support'] },
  { id: '2H_CURSEDSTAFF',    name: 'Büyük Lanet Asası',  category: 'Lanet Asası',   hand: '2H', roles: ['dps'] },
  { id: '2H_DEMONICSTAFF',   name: 'Şeytan Asası',       category: 'Lanet Asası',   hand: '2H', roles: ['dps','support'] },
  // ── KUTSAL ASA ────────────────────────────────
  { id: 'MAIN_HOLYSTAFF',    name: 'Kutsal Asa',         category: 'Kutsal Asa',    hand: '1H', roles: ['healer','support'] },
  { id: '2H_HOLYSTAFF',      name: 'Büyük Kutsal Asa',   category: 'Kutsal Asa',    hand: '2H', roles: ['healer'] },
  { id: '2H_DIVINESTAFF',    name: 'İlahi Asa',          category: 'Kutsal Asa',    hand: '2H', roles: ['healer','support'] },
  // ── DOĞA ASASI ────────────────────────────────
  { id: 'MAIN_NATURESTAFF',  name: 'Doğa Asası',         category: 'Doğa Asası',    hand: '1H', roles: ['healer','support'] },
  { id: '2H_NATURESTAFF',    name: 'Büyük Doğa Asası',   category: 'Doğa Asası',    hand: '2H', roles: ['healer'] },
  { id: '2H_WILDSTAFF',      name: 'Vahşi Asa',          category: 'Doğa Asası',    hand: '2H', roles: ['healer','dps'] },
  // ── BİÇİM DEĞİŞTİRİCİ ────────────────────────
  { id: '2H_SHAPESHIFTER_MORGANA', name: 'Biçim Değiştirici (Morgana)', category: 'Biçim Değiştirici', hand: '2H', roles: ['dps','tank'] },
  { id: '2H_SHAPESHIFTER_UNDEAD',  name: 'Biçim Değiştirici (Ölümsüz)',  category: 'Biçim Değiştirici', hand: '2H', roles: ['dps'] },
  { id: '2H_SHAPESHIFTER_KEEPER',  name: 'Biçim Değiştirici (Bekçi)',    category: 'Biçim Değiştirici', hand: '2H', roles: ['dps','support'] },
];

const OFFHAND_TYPES = [
  { id: 'OFF_SHIELD',   name: 'Kalkan',       category: 'Kalkan' },
  { id: 'OFF_BOOK',     name: 'Büyü Kitabı',  category: 'Kitap' },
  { id: 'OFF_HORN',     name: 'Savaş Borusu', category: 'Boru' },
  { id: 'OFF_TORCH',    name: 'Meşale',       category: 'Meşale' },
  { id: 'OFF_TOTEM',    name: 'Totem',        category: 'Totem' },
  { id: 'OFF_ORB',      name: 'Küre',         category: 'Küre' },
  { id: 'OFF_SKULL',    name: 'Kafatası',     category: 'Kafatası' },
];

const ARMOR_TYPES = {
  head: [
    { id: 'HEAD_CLOTH_SET1',   name: 'Scholar Başlığı',    category: 'Kumaş' },
    { id: 'HEAD_CLOTH_SET2',   name: 'Mage Başlığı',       category: 'Kumaş' },
    { id: 'HEAD_CLOTH_SET3',   name: 'Cleric Başlığı',     category: 'Kumaş' },
    { id: 'HEAD_LEATHER_SET1', name: 'Stalker Başlığı',    category: 'Deri' },
    { id: 'HEAD_LEATHER_SET2', name: 'Mercenary Başlığı',  category: 'Deri' },
    { id: 'HEAD_LEATHER_SET3', name: 'Hunter Başlığı',     category: 'Deri' },
    { id: 'HEAD_PLATE_SET1',   name: 'Knight Miğferi',     category: 'Plaka' },
    { id: 'HEAD_PLATE_SET2',   name: 'Guardian Miğferi',   category: 'Plaka' },
    { id: 'HEAD_PLATE_SET3',   name: 'Soldier Miğferi',    category: 'Plaka' },
  ],
  chest: [
    { id: 'ARMOR_CLOTH_SET1',   name: 'Scholar Cübbesi',   category: 'Kumaş' },
    { id: 'ARMOR_CLOTH_SET2',   name: 'Mage Cübbesi',      category: 'Kumaş' },
    { id: 'ARMOR_CLOTH_SET3',   name: 'Cleric Cübbesi',    category: 'Kumaş' },
    { id: 'ARMOR_LEATHER_SET1', name: 'Stalker Zırhı',     category: 'Deri' },
    { id: 'ARMOR_LEATHER_SET2', name: 'Mercenary Zırhı',   category: 'Deri' },
    { id: 'ARMOR_LEATHER_SET3', name: 'Hunter Zırhı',      category: 'Deri' },
    { id: 'ARMOR_PLATE_SET1',   name: 'Knight Plakası',    category: 'Plaka' },
    { id: 'ARMOR_PLATE_SET2',   name: 'Guardian Plakası',  category: 'Plaka' },
    { id: 'ARMOR_PLATE_SET3',   name: 'Soldier Plakası',   category: 'Plaka' },
  ],
  boots: [
    { id: 'SHOES_CLOTH_SET1',   name: 'Scholar Ayakkabısı',   category: 'Kumaş' },
    { id: 'SHOES_CLOTH_SET2',   name: 'Mage Ayakkabısı',      category: 'Kumaş' },
    { id: 'SHOES_CLOTH_SET3',   name: 'Cleric Ayakkabısı',    category: 'Kumaş' },
    { id: 'SHOES_LEATHER_SET1', name: 'Stalker Ayakkabısı',   category: 'Deri' },
    { id: 'SHOES_LEATHER_SET2', name: 'Mercenary Ayakkabısı', category: 'Deri' },
    { id: 'SHOES_LEATHER_SET3', name: 'Hunter Ayakkabısı',    category: 'Deri' },
    { id: 'SHOES_PLATE_SET1',   name: 'Knight Çizmesi',       category: 'Plaka' },
    { id: 'SHOES_PLATE_SET2',   name: 'Guardian Çizmesi',     category: 'Plaka' },
    { id: 'SHOES_PLATE_SET3',   name: 'Soldier Çizmesi',      category: 'Plaka' },
  ],
};

const CAPE_TYPES = [
  { id: 'UNDEAD_CAPE',      name: 'Ölümsüz Pelerini' },
  { id: 'MORGANA_CAPE',     name: 'Morgana Pelerini' },
  { id: 'KEEPER_CAPE',      name: 'Bekçi Pelerini' },
  { id: 'HERETIC_CAPE',     name: 'Sapkın Pelerini' },
  { id: 'LYMHURST_CAPE',    name: 'Lymhurst Pelerini' },
  { id: 'BRIDGEWATCH_CAPE', name: 'Bridgewatch Pelerini' },
  { id: 'CAERLEON_CAPE',    name: 'Caerleon Pelerini' },
  { id: 'MARTLOCK_CAPE',    name: 'Martlock Pelerini' },
  { id: 'THETFORD_CAPE',    name: 'Thetford Pelerini' },
  { id: 'FORTSTERLING_CAPE','name': 'Fort Sterling Pelerini' },
  { id: 'BRECILIEN_CAPE',   name: 'Brecilien Pelerini' },
];

const FOOD_TYPES = [
  { id: 'MEAL_SEAWEEDSALAD',  name: 'Deniz Yosunu Salatası' },
  { id: 'MEAL_BREAD',         name: 'Ekmek' },
  { id: 'MEAL_PORK',          name: 'Kızarmış Domuz' },
  { id: 'MEAL_CHICKEN',       name: 'Pişmiş Tavuk' },
  { id: 'MEAL_MUTTON',        name: 'Kuzu Güveci' },
  { id: 'MEAL_BEEF',          name: 'Biftek' },
  { id: 'MEAL_GOATMEAT',      name: 'Keçi Yahnisi' },
  { id: 'MEAL_SANDSOLE',      name: 'Kum Pisibalığı' },
  { id: 'MEAL_SOWTHISLE',     name: 'Eşek Marulu' },
  { id: 'MEAL_GRAINEYE',      name: 'Tahıl Çorbası' },
];

const POTION_TYPES = [
  { id: 'POTION_HEALING',      name: 'İyileşme İksiri' },
  { id: 'POTION_ENERGY',       name: 'Enerji İksiri' },
  { id: 'POTION_GIGANTIFY',    name: 'Dev İksiri' },
  { id: 'POTION_STONESKIN',    name: 'Taş Deri İksiri' },
  { id: 'POTION_INVISIBILITY', name: 'Görünmezlik İksiri' },
  { id: 'POTION_REVIVE',       name: 'Diriliş İksiri' },
  { id: 'POTION_POISON',       name: 'Zehir İksiri' },
];

// Generate tiered item ID: T8_MAIN_SWORD@3
function buildItemId(baseId, tier = 8, enchant = 0) {
  const base = `T${tier}_${baseId}`;
  return enchant > 0 ? `${base}@${enchant}` : base;
}

// Get Albion render URL for an item
function getIconUrl(itemId) {
  return renderUrl(itemId);
}

// Get item display name from build data
function getItemName(buildData, slot) {
  if (!buildData || !buildData[slot]) return 'Boş';
  const itemId = buildData[slot];
  // Try to find in all item lists
  const allItems = [
    ...WEAPON_TYPES,
    ...OFFHAND_TYPES,
    ...ARMOR_TYPES.head,
    ...ARMOR_TYPES.chest,
    ...ARMOR_TYPES.boots,
    ...CAPE_TYPES,
    ...FOOD_TYPES,
    ...POTION_TYPES,
  ];
  // Strip tier prefix for matching
  const stripped = itemId.replace(/^T\d_/, '').replace(/@\d$/, '');
  const found = allItems.find(i => i.id === stripped);
  return found ? found.name : itemId;
}

const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];

const SLOT_LABELS = {
  mainHand: 'Ana El',
  offHand: 'İkinci El',
  head: 'Baş',
  chest: 'Göğüs',
  boots: 'Botlar',
  cape: 'Pelerin',
  food: 'Yemek',
  potion: 'İksir',
};

module.exports = {
  WEAPON_TYPES,
  OFFHAND_TYPES,
  ARMOR_TYPES,
  CAPE_TYPES,
  FOOD_TYPES,
  POTION_TYPES,
  TIERS,
  ENCHANTS,
  SLOT_LABELS,
  buildItemId,
  getIconUrl,
  getItemName,
  renderUrl,
};
