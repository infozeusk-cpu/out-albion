'use strict';

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const path    = require('path');

const { q, getFullEventData, createFullEvent, ROLE_DISPLAY } = require('./database');

let config;
try { config = require('../config.json'); }
catch { config = { port: 3000, jwtSecret: 'dev_secret' }; }

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../public')));

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try { req.user = jwt.verify(token, config.jwtSecret); next(); }
  catch { res.status(401).json({ error: 'Gecersiz token' }); }
}
function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Sadece admin' });
  next();
}

// ── AUTH ──────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Eksik alanlar' });
    const user = await q.getUserByUsername.get(username);
    if (!user) return res.status(401).json({ error: 'Kullanici bulunamadi' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Yanlis sifre' });
    const token = jwt.sign({ id: user._id, username: user.username, is_admin: user.is_admin }, config.jwtSecret, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, username: user.username, is_admin: user.is_admin } });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ── USERS ─────────────────────────────────────────────────────────────────
app.get('/api/users', auth, adminOnly, async (req, res) => {
  const list = await q.getAllUsers.all();
  res.json(list.map(u => ({ id: u._id, username: u.username, is_admin: u.is_admin, created_at: u.created_at })));
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, is_admin = 0 } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Eksik alanlar' });
    const hash = bcrypt.hashSync(password, 10);
    const u = await q.createUser.run(username, hash, is_admin ? 1 : 0);
    res.json({ id: u._id, username });
  } catch(e){ res.status(400).json({ error: 'Kullanici adi zaten alinmis' }); }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  await q.deleteUser.run(req.params.id);
  res.json({ ok: true });
});

// ── EVENTS ────────────────────────────────────────────────────────────────
app.get('/api/events', auth, async (req, res) => {
  const list = await q.getAllEvents.all();
  list.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  res.json(list.map(e => ({ ...e, id: e._id })));
});

app.get('/api/events/:id', auth, async (req, res) => {
  const event = await getFullEventData(req.params.id);
  if (!event) return res.status(404).json({ error: 'Etkinlik bulunamadi' });
  res.json(event);
});

app.post('/api/events', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, start_time, end_time, channel_id, roles, post_to_discord = true } = req.body;
    if (!title || !start_time) return res.status(400).json({ error: 'Baslik ve baslangic zamani gerekli' });

    const eventId = await createFullEvent({
      title, description: description || '',
      start_time, end_time: end_time || null,
      channel_id: channel_id || config.eventChannelId || '',
      guild_id:   config.guildId || '',
      created_by: req.user.username,
      roles:      roles || [],
    });

    if (post_to_discord) {
      try {
        const { postEvent } = require('./bot');
        const ch = channel_id || config.eventChannelId;
        if (ch) await postEvent(eventId, ch);
      } catch(e){ console.warn('[SERVER] Discord post basarisiz:', e.message); }
    }
    res.json({ id: eventId, message: 'Etkinlik olusturuldu' });
  } catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
});

app.patch('/api/events/:id/status', auth, adminOnly, async (req, res) => {
  await q.updateEventStatus.run(req.body.status, req.params.id);
  if (req.body.status === 'closed') {
    try { const { refreshEventMessage } = require('./bot'); await refreshEventMessage(req.params.id); } catch{}
  }
  res.json({ ok: true });
});

app.delete('/api/events/:id', auth, adminOnly, async (req, res) => {
  await q.deleteEvent.run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/events/:id/participants', auth, async (req, res) => {
  const list = await q.getParticipantsByEvent.all(req.params.id);
  res.json(list);
});

// ── ALBION ITEMS ──────────────────────────────────────────────────────────
app.get('/api/albion/items', (req, res) => {
  const { WEAPON_TYPES, OFFHAND_TYPES, ARMOR_TYPES, CAPE_TYPES, FOOD_TYPES, POTION_TYPES } = require('./albionItems');
  res.json({ WEAPON_TYPES, OFFHAND_TYPES, ARMOR_TYPES, CAPE_TYPES, FOOD_TYPES, POTION_TYPES });
});

// ── PAGES ─────────────────────────────────────────────────────────────────
app.get('/',       (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/admin',  (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));
app.get('/panel',  (req, res) => res.sendFile(path.join(__dirname, '../public/panel.html')));

function start() {
  const port = config.port || 3000;
  app.listen(port, () => {
    console.log(`[WEB] ✅ http://localhost:${port}`);
    console.log(`[WEB] Admin: http://localhost:${port}/admin`);
  });
}

module.exports = { app, start };
