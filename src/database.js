'use strict';

const Datastore = require('nedb-promises');
const path      = require('path');
const fs        = require('fs');
const bcrypt    = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Collections
const users        = Datastore.create({ filename: path.join(dataDir, 'users.db'),        autoload: true });
const events       = Datastore.create({ filename: path.join(dataDir, 'events.db'),       autoload: true });
const event_roles  = Datastore.create({ filename: path.join(dataDir, 'event_roles.db'),  autoload: true });
const role_weapons = Datastore.create({ filename: path.join(dataDir, 'role_weapons.db'), autoload: true });
const participants = Datastore.create({ filename: path.join(dataDir, 'participants.db'),  autoload: true });

users.ensureIndex({ fieldName: 'username', unique: true });

// Default admin
(async () => {
  const existing = await users.findOne({ username: 'admin' });
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await users.insert({ username: 'admin', password: hash, is_admin: true, created_at: new Date().toISOString() });
    console.log('[DB] Varsayilan admin olusturuldu -> kullanici: admin | sifre: admin123');
  }
})();

const ROLE_DISPLAY = {
  tank:    { label: 'Tank',    emoji: '🛡️', color: 0x4fc3f7 },
  healer:  { label: 'Healer', emoji: '💚', color: 0x81c784 },
  dps:     { label: 'DPS',    emoji: '⚔️', color: 0xef5350 },
  support: { label: 'Support',emoji: '✨', color: 0xffb74d },
};

async function getFullEventData(eventId) {
  const event = await events.findOne({ _id: eventId });
  if (!event) return null;

  const roles = await event_roles.find({ event_id: eventId });
  for (const role of roles) {
    const weapons = await role_weapons.find({ role_id: role._id });
    role.weapons = weapons.map(w => ({ ...w, id: w._id }));
    role.count   = await participants.count({ event_id: eventId, role_id: role._id });
    role.id      = role._id;
  }

  const parts = await participants.find({ event_id: eventId });
  parts.sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));

  const enriched = await Promise.all(parts.map(async p => {
    const role   = p.role_id   ? await event_roles.findOne({ _id: p.role_id })   : null;
    const weapon = p.weapon_id ? await role_weapons.findOne({ _id: p.weapon_id }) : null;
    return { ...p, role_type: role?.role_type||'', role_label: role?.role_label||'', weapon_name: weapon?.weapon_name||'', weapon_item_id: weapon?.weapon_item_id||'' };
  }));

  return { ...event, id: event._id, roles, participants: enriched };
}

async function createFullEvent(eventData) {
  const { roles: rolesData = [], ...evtFields } = eventData;
  evtFields.status     = 'active';
  evtFields.created_at = new Date().toISOString();

  const newEvent = await events.insert(evtFields);
  const eventId  = newEvent._id;

  for (const roleData of rolesData) {
    const { weapons: weaponsData = [], ...roleFields } = roleData;
    roleFields.event_id = eventId;
    const newRole = await event_roles.insert(roleFields);
    for (const weapon of weaponsData) {
      await role_weapons.insert({ role_id: newRole._id, weapon_name: weapon.weapon_name||'', weapon_item_id: weapon.weapon_item_id||'', build_data: weapon.build_data||{} });
    }
  }
  return eventId;
}

const q = {
  getUserByUsername: { get: (username) => users.findOne({ username }) },
  createUser:        { run: (username, password, is_admin) => users.insert({ username, password, is_admin: !!is_admin, created_at: new Date().toISOString() }) },
  getAllUsers:        { all: () => users.find({}) },
  deleteUser:        { run: (id) => users.remove({ _id: id, username: { $ne: 'admin' } }, {}) },

  getEventById:       { get:  (id)     => events.findOne({ _id: id }) },
  getAllEvents:        { all:  ()       => events.find({}) },
  getActiveEvents:    { all:  ()       => events.find({ status: 'active' }) },
  updateEventMessage: { run:  (msgId, id) => events.update({ _id: id }, { $set: { message_id: msgId } }) },
  updateEventStatus:  { run:  (status, id) => events.update({ _id: id }, { $set: { status } }) },
  deleteEvent: { run: async (id) => {
    const roles = await event_roles.find({ event_id: id });
    for (const r of roles) await role_weapons.remove({ role_id: r._id }, { multi: true });
    await event_roles.remove({ event_id: id }, { multi: true });
    await participants.remove({ event_id: id }, { multi: true });
    await events.remove({ _id: id }, {});
  }},

  getRolesByEvent: { all: (eventId) => event_roles.find({ event_id: eventId }) },
  getRoleById:     { get: (id)      => event_roles.findOne({ _id: id }) },
  createRole:      { run: (fields)  => event_roles.insert(fields) },

  getWeaponsByRole: { all: (roleId) => role_weapons.find({ role_id: roleId }) },
  getWeaponById:    { get: (id)     => role_weapons.findOne({ _id: id }) },
  createWeapon:     { run: (fields) => role_weapons.insert(fields) },

  addParticipant: { run: async (fields) => {
    await participants.remove({ event_id: fields.event_id, user_id: fields.user_id }, {});
    return participants.insert({ ...fields, joined_at: new Date().toISOString() });
  }},
  removeParticipant:      { run: (eventId, userId) => participants.remove({ event_id: eventId, user_id: userId }, {}) },
  getParticipantsByEvent: { all: (eventId) => participants.find({ event_id: eventId }) },
  getParticipant:         { get: (eventId, userId) => participants.findOne({ event_id: eventId, user_id: userId }) },
  countByRole: { get: async (eventId, roleId) => ({ cnt: await participants.count({ event_id: eventId, role_id: roleId }) }) },
};

module.exports = { q, getFullEventData, createFullEvent, ROLE_DISPLAY };
