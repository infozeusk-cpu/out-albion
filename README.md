# ⚔️ Albion Event Bot

Guild etkinliklerini Discord üzerinden yönetmek için geliştirilmiş tam kapsamlı bir bot + web panel sistemi.

---

## 🚀 Kurulum

### 1. Gereksinimler
- [Node.js 18+](https://nodejs.org/) (LTS önerilir)
- Discord Bot Token

### 2. Dosyaları İndirip Kur
```
install.bat
```
> Bu dosyayı çift tıklayın. Gerekli paketleri otomatik yükler.

### 3. `config.json` Düzenle
`config.example.json` dosyası otomatik `config.json` olarak kopyalanır.
İçini doldurun:

```json
{
  "token": "BOT_TOKENINIZI_BURAYA_YAZIN",
  "clientId": "BOT_UYGULAMA_ID",
  "guildId": "SUNUCU_ID",
  "eventChannelId": "ETKİNLİK_KANAL_ID",
  "port": 3000,
  "jwtSecret": "rastgele_bir_sifre_yazin"
}
```

### 4. Botu Başlat
```
start.bat
```
Konsol açılır ve aşağıdaki çıktıyı görürsünüz:
```
[WEB] ✅ Web panel: http://localhost:3000
[BOT] ✅ Giriş yapıldı: BotAdin#1234
```

---

## 🌐 Web Panel

| URL | Açıklama |
|-----|----------|
| `http://localhost:3000` | Giriş Sayfası |
| `http://localhost:3000/admin` | Admin Paneli |
| `http://localhost:3000/panel` | Kullanıcı Paneli |

**Varsayılan admin girişi:**
- Kullanıcı: `admin`
- Şifre: `admin123`

> ⚠️ İlk girişten sonra şifrenizi değiştirmeniz önerilir.

---

## ⚙️ Özellikler

### Discord Tarafı
- ✅ Katıl / ❌ Ayrıl butonları
- Katılınca sadece o kullanıcıya görünen **Rol Seçimi** (Tank / Healer / DPS / Support)
- Rol seçince sadece o kullanıcıya görünen **Silah Seçimi**
- Silah seçiminin ardından butonsuz ekran (kaybolur)
- Seçilen silahın **build kartı** kullanıcıya DM olarak gönderilir (görsel)
- Etkinlik embed'i katılımcı sayısıyla güncellenir

### Admin Paneli
- Etkinlik oluşturma (başlık, açıklama, tarih/saat)
- Rol ekleme: Tank / Healer / DPS / Support
- Her rol için **Albion Online build oluşturucu**
  - Tüm slot'lar: Ana El, İkinci El, Baş, Göğüs, Botlar, Pelerin, Yemek, İksir
  - Tier ve Enchant seçimi
  - Tüm Albion silah/ekipman iconları (Albion render API)
- Etkinlikleri Discord'a gönder / kapat / sil
- Kullanıcı yönetimi (oluştur, admin yap, sil)

### Kullanıcı Paneli
- Aktif etkinlikleri görüntüle
- Katılımcı listesini gör
- Discord ile entegre katılım akışı

---

## 📁 Dosya Yapısı

```
albion-event-bot/
├── start.bat           ← Başlatma dosyası
├── install.bat         ← Kurulum dosyası
├── config.json         ← Konfigürasyon (sen doldurursun)
├── config.example.json ← Örnek config
├── package.json
├── data/
│   └── bot.db          ← SQLite veritabanı (otomatik oluşur)
├── temp/               ← Geçici dosyalar
├── public/
│   ├── login.html      ← Giriş sayfası
│   ├── admin.html      ← Admin paneli
│   └── panel.html      ← Kullanıcı paneli
└── src/
    ├── index.js        ← Ana giriş noktası
    ├── bot.js          ← Discord bot mantığı
    ├── server.js       ← Express web sunucusu
    ├── database.js     ← SQLite veritabanı
    ├── albionItems.js  ← Albion eşya veritabanı
    └── buildGenerator.js ← Build kartı görsel üretici
```

---

## 🔧 Discord Bot Ayarları

1. [Discord Developer Portal](https://discord.com/developers/applications) → Yeni Uygulama
2. Bot sekmesi → Token kopyala → `config.json`'a yapıştır
3. Bot izinleri (Privileged Gateway Intents):
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. OAuth2 → Bot → İzinler:
   - Send Messages
   - Embed Links
   - Send Messages in Threads
   - Read Message History
   - Use External Emojis
   - **Send DMs** (varsayılan açık)
5. Botu sunucuya davet et

---

## 🛡️ Güvenlik

- `config.json` dosyasını asla paylaşmayın
- `jwtSecret` alanını güçlü bir değerle doldurun
- Sunucuya canlı ortamda deploy edecekseniz `port: 443` ve HTTPS kullanın

---

## 🐛 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `config.json bulunamadı` | `install.bat` çalıştırın |
| `Bot Discord'a bağlanamıyor` | Token doğruluğunu kontrol edin |
| `DM gönderilmiyor` | Kullanıcının DM ayarlarını kontrol edin |
| `Build kartı bozuk` | `npm install` ile Jimp'i yeniden yükleyin |
| `Port 3000 meşgul` | `config.json`'da `port` değerini değiştirin |
