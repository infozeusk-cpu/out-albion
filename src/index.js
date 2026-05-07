'use strict';

const { client } = require('./bot');
const { start }  = require('./server');

let config;
try {
  config = require('../config.json');
} catch {
  console.error('[MAIN] ❌ config.json bulunamadı! install.bat çalıştırın.');
  process.exit(1);
}

if (!config.token || config.token === 'DISCORD_BOT_TOKEN_BURAYA') {
  console.error('[MAIN] ❌ config.json içinde BOT TOKEN ayarlanmamış!');
  console.log('[MAIN] config.json dosyasını düzenleyip bot tokenınızı girin.');
  process.exit(1);
}

// Start web server
start();

// Login Discord bot
client.login(config.token).catch(err => {
  console.error('[BOT] ❌ Discord girişi başarısız:', err.message);
  console.log('[BOT] Token doğru mu? config.json kontrol edin.');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[MAIN] Bot kapatılıyor...');
  client.destroy();
  process.exit(0);
});
