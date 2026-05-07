'use strict';

const {
  Client, GatewayIntentBits, Events, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder,
} = require('discord.js');

const { q, getFullEventData, ROLE_DISPLAY } = require('./database');
const { generateBuildImage } = require('./buildGenerator');

let config;
try { config = require('../config.json'); }
catch { console.error('[BOT] config.json bulunamadi!'); process.exit(1); }

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
});

// ── EMBED BUILDER ──────────────────────────────────────────────────────────
function buildEventEmbed(eventData) {
  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle(`⚔️  ${eventData.title}`)
    .setDescription(eventData.description || 'Etkinlik aciklamasi yok.')
    .setFooter({ text: `Etkinlik ID: ${eventData.id}` })
    .setTimestamp();

  const start = new Date(eventData.start_time);
  embed.addFields({ name: '🕐 Baslangic', value: `<t:${Math.floor(start.getTime()/1000)}:F>`, inline: true });
  if (eventData.end_time) {
    const end = new Date(eventData.end_time);
    embed.addFields({ name: '🕛 Bitis', value: `<t:${Math.floor(end.getTime()/1000)}:R>`, inline: true });
  }
  embed.addFields({ name: '\u200B', value: '\u200B' });

  const roles = eventData.roles || [];
  for (const role of roles) {
    const rd = ROLE_DISPLAY[role.role_type] || { emoji: '❓', label: role.role_label };
    const participants = (eventData.participants || []).filter(p => p.role_id === role.id || p.role_id === role._id);
    const count = participants.length;
    const memberList = participants.length
      ? participants.map(p => `• ${p.username} — ${p.weapon_name || '?'}`).join('\n')
      : '*Henüz katilimci yok*';
    embed.addFields({ name: `${rd.emoji} ${rd.label} (${count}/${role.max_slots})`, value: memberList, inline: true });
  }

  embed.addFields({ name: '👥 Toplam', value: `**${(eventData.participants||[]).length}** kisi`, inline: false });
  return embed;
}

function buildJoinLeaveRow(eventId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`join_event_${eventId}`).setLabel('✅  Katil').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`leave_event_${eventId}`).setLabel('❌  Ayril').setStyle(ButtonStyle.Danger),
  );
}

// ── REFRESH EVENT MESSAGE ──────────────────────────────────────────────────
async function refreshEventMessage(eventId) {
  try {
    const eventData = await getFullEventData(eventId);
    if (!eventData || !eventData.channel_id || !eventData.message_id) return;
    const channel = await client.channels.fetch(eventData.channel_id).catch(() => null);
    if (!channel) return;
    const message = await channel.messages.fetch(eventData.message_id).catch(() => null);
    if (!message) return;
    await message.edit({ embeds: [buildEventEmbed(eventData)], components: [buildJoinLeaveRow(eventId)] });
  } catch (err) { console.error('[BOT] Mesaj guncellenemedi:', err.message); }
}

// ── POST EVENT ─────────────────────────────────────────────────────────────
async function postEvent(eventId, channelId) {
  try {
    const channel   = await client.channels.fetch(channelId);
    if (!channel) return { success: false, error: 'Kanal bulunamadi' };
    const eventData = await getFullEventData(eventId);
    if (!eventData) return { success: false, error: 'Etkinlik bulunamadi' };
    const msg = await channel.send({ embeds: [buildEventEmbed(eventData)], components: [buildJoinLeaveRow(eventId)] });
    await q.updateEventMessage.run(msg.id, eventId);
    return { success: true, messageId: msg.id };
  } catch (err) { return { success: false, error: err.message }; }
}

// ── INTERACTION ────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const id    = interaction.customId;
  const parts = id.split('_');

  // JOIN
  if (id.startsWith('join_event_')) {
    const eventId   = parts[2];
    const eventData = await getFullEventData(eventId);
    if (!eventData || eventData.status !== 'active')
      return interaction.reply({ content: '❌ Bu etkinlik artik aktif degil.', ephemeral: true });

    const existing = await q.getParticipant.get(eventId, interaction.user.id);
    if (existing)
      return interaction.reply({ content: '⚠️ Zaten bu etkinlige katildiniz!', ephemeral: true });

    const roles = eventData.roles || [];
    const rolesWithCount = roles.map(r => ({ ...r, count: (eventData.participants||[]).filter(p=>p.role_id===r.id||p.role_id===r._id).length }));
    const available = rolesWithCount.filter(r => r.count < r.max_slots);
    if (!available.length)
      return interaction.reply({ content: '😔 Tüm roller dolu!', ephemeral: true });

    const buttons = rolesWithCount.map(r => {
      const rd = ROLE_DISPLAY[r.role_type] || { emoji:'❓', label:r.role_label };
      return new ButtonBuilder()
        .setCustomId(`role_select_${eventId}_${r.id||r._id}`)
        .setLabel(`${rd.emoji} ${rd.label} (${r.count}/${r.max_slots})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(r.count >= r.max_slots);
    });
    const rows = [];
    for (let i=0;i<buttons.length;i+=5) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i,i+5)));

    return interaction.reply({
      ephemeral: true,
      embeds: [new EmbedBuilder().setColor(0xc9a84c).setTitle('⚔️ Rol Secimi').setDescription(`**${eventData.title}** etkinligi icin rolunu sec:`)],
      components: rows,
    });
  }

  // LEAVE
  if (id.startsWith('leave_event_')) {
    const eventId  = parts[2];
    const existing = await q.getParticipant.get(eventId, interaction.user.id);
    if (!existing) return interaction.reply({ content: '⚠️ Bu etkinlige kayitli degilsiniz.', ephemeral: true });
    await q.removeParticipant.run(eventId, interaction.user.id);
    await refreshEventMessage(eventId);
    return interaction.reply({ content: '👋 Etkinlikten ayrildiniz.', ephemeral: true });
  }

  // ROLE SELECT
  if (id.startsWith('role_select_')) {
    const eventId = parts[2];
    const roleId  = parts[3];
    const role    = await q.getRoleById.get(roleId);
    if (!role) return interaction.reply({ content: '❌ Rol bulunamadi.', ephemeral: true });

    const weapons = await q.getWeaponsByRole.all(roleId);
    if (!weapons.length) return interaction.reply({ content: '❌ Bu rol icin silah tanimlanmamis.', ephemeral: true });

    const buttons = weapons.map(w =>
      new ButtonBuilder()
        .setCustomId(`weapon_select_${eventId}_${roleId}_${w._id}`)
        .setLabel(w.weapon_name.substring(0,80))
        .setStyle(ButtonStyle.Secondary)
    );
    const rows = [];
    for (let i=0;i<buttons.length;i+=5) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i,i+5)));

    const rd = ROLE_DISPLAY[role.role_type] || { emoji:'❓', label:role.role_label };
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(0xc9a84c).setTitle(`${rd.emoji} Silah Secimi — ${rd.label}`).setDescription('Kullanacagin silahi sec:')],
      components: rows,
    });
  }

  // WEAPON SELECT
  if (id.startsWith('weapon_select_')) {
    const eventId  = parts[2];
    const roleId   = parts[3];
    const weaponId = parts[4];

    const [eventData, weapon, role] = await Promise.all([
      getFullEventData(eventId),
      q.getWeaponById.get(weaponId),
      q.getRoleById.get(roleId),
    ]);

    if (!weapon || !role || !eventData)
      return interaction.update({ content: '❌ Hata olustu.', components: [], embeds: [] });

    await q.addParticipant.run({
      event_id:  eventId,
      user_id:   interaction.user.id,
      username:  interaction.user.tag,
      role_id:   roleId,
      weapon_id: weaponId,
    });

    await interaction.update({
      embeds: [new EmbedBuilder().setColor(0x57f287).setTitle('✅ Etkinlige Katildiniz!').setDescription(`**Rol:** ${role.role_label}\n**Silah:** ${weapon.weapon_name}\n\nBuild kartiniz DM'den gonderilecek!`)],
      components: [],
    });

    await refreshEventMessage(eventId);

    // DM build card
    try {
      const buildData = weapon.build_data || {};
      const rd = ROLE_DISPLAY[role.role_type] || { label: role.role_label };
      const imageBuffer = await generateBuildImage(buildData, weapon.weapon_name, rd.label, eventData.title, interaction.user.username);
      const attachment  = new AttachmentBuilder(imageBuffer, { name: 'build.png' });
      const buildEmbed  = new EmbedBuilder()
        .setColor(0xc9a84c).setTitle('⚔️ Build Kartin')
        .setDescription(`**Etkinlik:** ${eventData.title}\n**Rol:** ${rd.label}\n**Silah:** ${weapon.weapon_name}\n\n${formatBuildFields(buildData)}`)
        .setImage('attachment://build.png').setTimestamp();
      await interaction.user.send({ embeds: [buildEmbed], files: [attachment] });
    } catch (e) { console.warn('[BOT] DM gonderilemedi:', e.message); }
  }
});

function formatBuildFields(buildData) {
  if (!buildData) return '';
  const slots = { mainHand:'🗡️ Ana El',offHand:'🛡️ Ikinci El',head:'⛑️ Bas',chest:'🥋 Gogus',boots:'👢 Botlar',cape:'🧣 Pelerin',food:'🍖 Yemek',potion:'🧪 Iksir' };
  return Object.entries(slots).filter(([k])=>buildData[k]).map(([k,l])=>`**${l}:** \`${buildData[k]}\``).join('\n') || '*Build bilgisi yok*';
}

client.once(Events.ClientReady, () => { console.log(`[BOT] ✅ Giris yapildi: ${client.user.tag}`); });

module.exports = { client, postEvent, refreshEventMessage };
