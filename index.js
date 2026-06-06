require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events,
  StringSelectMenuBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;
const STORMY_LOGO = 'https://i.postimg.cc/ydzDms8N/stormy-1.png';

// ── CHANNELS ──────────────────────────────────────────────
const ROLE_REQUEST_CHANNEL  = '1508517254210256956';
const STAFF_CHANNEL         = '1508507337030373496';
const NAME_CHANGE_CHANNEL   = '1512689931695423588';

// ── ROLES ─────────────────────────────────────────────────
const FAMILY_ROLE_ID = '1508101062161207437';

const STAFF_ROLES = [
  '1193690559341133955',
  '1509596474462179468',
  '1508100262206636125',
  '1509213861205508148'
];

const PING_ROLES = [
  '1508100262206636125',
  '1509213861205508148',
  '1508100615006453810'
];

const EXTRA_ROLES = [
  { label: 'Stormy',         value: '1508100615006453810' },
  { label: 'Under Deputy',   value: '1508118610978144447' },
  { label: 'Event Speaker',  value: '1508476640789921994' },
  { label: 'Media',          value: '1508479963266027651' },
  { label: 'Fam war',        value: '1508482889577402368' },
  { label: 'Turfer',         value: '1508114263372464138' },
  { label: 'Shooter',        value: '1508100871190216811' },
  { label: 'Family Member',  value: '1508101062161207437' }
];

// ── STATE ─────────────────────────────────────────────────
const pendingApplications = new Set(); // user IDs with pending apps
const blacklistedUsers    = new Set(); // user IDs that are blacklisted
const pendingNameChanges  = new Set(); // user IDs with pending name changes

// ── HELPERS ───────────────────────────────────────────────
function isStaff(member) {
  return STAFF_ROLES.some(role => member.roles.cache.has(role));
}

function styledEmbed(title, description, color = 0x3498db) {
  return new EmbedBuilder()
    .setColor(color)
    .setThumbnail(STORMY_LOGO)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'Stormy | En03', iconURL: STORMY_LOGO })
    .setTimestamp();
}

// ── BOT READY ─────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} is online`);

  // ── Role Request Panel ──
  const roleChannel = await client.channels.fetch(ROLE_REQUEST_CHANNEL).catch(() => null);
  if (roleChannel) {
    const embed = styledEmbed(
      '📋 Role Request',
      'Click the **Apply** button below to submit your application to join the Stormy Family!',
      0x3498db
    );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('apply_form').setLabel('Apply').setStyle(ButtonStyle.Primary)
    );
    await roleChannel.send({ embeds: [embed], components: [row] });
  }

  // ── Name Change Panel ──
  const nameChannel = await client.channels.fetch(NAME_CHANGE_CHANNEL).catch(() => null);
  if (nameChannel) {
    const embed = styledEmbed(
      '✏️ Request Name Change',
      'Click the button below to request a nickname change.\n\nYour name will be set to: **Your Name | Your ID**',
      0x9b59b6
    );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('name_change_form').setLabel('✏️ Request Name Change').setStyle(ButtonStyle.Primary)
    );
    await nameChannel.send({ embeds: [embed], components: [row] });
  }
});

// ── INTERACTIONS ──────────────────────────────────────────
client.on(Events.InteractionCreate, async interaction => {

  // ═══════════════════════════════════════
  // BUTTONS
  // ═══════════════════════════════════════
  if (interaction.isButton()) {

    // ── Apply Form ──
    if (interaction.customId === 'apply_form') {
      if (blacklistedUsers.has(interaction.user.id)) {
        return interaction.reply({ content: '🚫 You are **blacklisted** and cannot apply to this family.', ephemeral: true });
      }
      if (pendingApplications.has(interaction.user.id)) {
        return interaction.reply({ content: '⏳ You already have a **pending application**! Please wait for staff to review it.', ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId('application_modal').setTitle('Role Request Application');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('In Game Name').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('id').setLabel('Player ID').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('level').setLabel('Player Level').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('family').setLabel('Last Family').setStyle(TextInputStyle.Short).setRequired(true))
      );
      await interaction.showModal(modal);
    }

    // ── Name Change Form ──
    if (interaction.customId === 'name_change_form') {
      if (pendingNameChanges.has(interaction.user.id)) {
        return interaction.reply({ content: '⏳ You already have a **pending name change request**!', ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId('name_change_modal').setTitle('Name Change Request');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel('Your New In-Game Name').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_id').setLabel('Your Player ID').setStyle(TextInputStyle.Short).setRequired(true))
      );
      await interaction.showModal(modal);
    }

    // ── Approve Application ──
    if (interaction.customId.startsWith('approve_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      try {
        const userId = interaction.customId.split('_')[1];
        const member = await interaction.guild.members.fetch(userId);

        await member.roles.add(FAMILY_ROLE_ID);
        pendingApplications.delete(userId);

        const desc = interaction.message.embeds[0]?.description || '';
        let nickname = 'Family Member';
        const ignMatch = desc.match(/\*\*𝗜𝗚𝗡\*\* - (.+)/);
        const idMatch  = desc.match(/\*\*𝗜𝗗\*\* - (.+)/);
        if (ignMatch && idMatch) nickname = `${ignMatch[1].trim()} | ${idMatch[1].trim()}`;

        try { await member.setNickname(nickname); } catch {}

        await member.send(`✅ Your role request application to **Stormy Family** has been **approved**!\n\n**Roles Provided:**\n• Family Member\n\n**Nickname set to:** ${nickname}`).catch(() => {});

        // Log in staff channel
        const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
        if (staffCh) {
          const logEmbed = styledEmbed(
            '✅ Application Approved',
            `**Applicant:** <@${userId}>\n**Approved By:** ${interaction.user}\n**Roles Given:** Family Member\n**Nickname Set:** ${nickname}`,
            0x2ecc71
          );
          await staffCh.send({ embeds: [logEmbed] });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`more_roles_${userId}`).setLabel('Add More Roles').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`blacklist_${userId}`).setLabel('🚫 Blacklist').setStyle(ButtonStyle.Danger)
        );

        await interaction.update({ content: `✅ Approved by ${interaction.user.tag}`, embeds: interaction.message.embeds, components: [row] });

      } catch (err) {
        console.error(err);
        if (!interaction.replied) await interaction.reply({ content: '❌ Failed to approve.', ephemeral: true });
      }
    }

    // ── Reject Application ──
    if (interaction.customId.startsWith('reject_') && !interaction.customId.startsWith('reject_modal_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      const userId = interaction.customId.split('_')[1];
      const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${userId}`)
        .setTitle('Rejection Reason');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('reason').setLabel('Rejection Reason (Optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)
        )
      );
      await interaction.showModal(modal);
    }

    // ── Blacklist ──
    if (interaction.customId.startsWith('blacklist_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      const userId = interaction.customId.split('_')[1];
      blacklistedUsers.add(userId);
      pendingApplications.delete(userId);

      try {
        const member = await interaction.guild.members.fetch(userId);
        await member.send(`🚫 You have been **blacklisted** from applying to **Stormy Family**.\n\nIf you believe this is a mistake, please contact the leadership.`).catch(() => {});
      } catch {}

      // Log blacklist
      const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffCh) {
        const logEmbed = styledEmbed(
          '🚫 Member Blacklisted',
          `**Member:** <@${userId}>\n**Blacklisted By:** ${interaction.user}`,
          0xe74c3c
        );
        await staffCh.send({ embeds: [logEmbed] });
      }

      await interaction.update({
        content: `🚫 <@${userId}> has been blacklisted by ${interaction.user.tag}`,
        embeds: interaction.message.embeds,
        components: []
      });
    }

    // ── More Roles ──
    if (interaction.customId.startsWith('more_roles_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      const userId = interaction.customId.split('_')[2];
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`select_roles_${userId}`)
        .setPlaceholder('Select roles to add...')
        .setMinValues(1)
        .setMaxValues(EXTRA_ROLES.length)
        .addOptions(EXTRA_ROLES);

      await interaction.reply({ content: 'Select roles to provide:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
    }

    // ── Approve Name Change ──
    if (interaction.customId.startsWith('approve_name_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      try {
        const parts     = interaction.customId.split('_');
        const userId    = parts[2];
        const newName   = decodeURIComponent(parts.slice(3).join('_'));
        const member    = await interaction.guild.members.fetch(userId);
        const oldName   = member.displayName;

        await member.setNickname(newName);
        pendingNameChanges.delete(userId);

        await member.send(`✅ Your **name change request** has been **approved**!\n\n**Changed From:** ${oldName}\n**Changed To:** ${newName}`).catch(() => {});

        // Log
        const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
        if (staffCh) {
          const logEmbed = styledEmbed(
            '✏️ Name Change Approved',
            `**Member:** <@${userId}>\n**Approved By:** ${interaction.user}\n**Old Name:** ${oldName}\n**New Name:** ${newName}`,
            0x2ecc71
          );
          await staffCh.send({ embeds: [logEmbed] });
        }

        await interaction.update({ content: `✅ Name changed approved by ${interaction.user.tag}\n**${oldName}** → **${newName}**`, embeds: [], components: [] });

      } catch (err) {
        console.error(err);
        if (!interaction.replied) await interaction.reply({ content: '❌ Failed to change name.', ephemeral: true });
      }
    }

    // ── Reject Name Change ──
    if (interaction.customId.startsWith('reject_name_')) {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
      }

      const userId = interaction.customId.split('_')[2];
      const modal  = new ModalBuilder()
        .setCustomId(`reject_name_modal_${userId}`)
        .setTitle('Rejection Reason');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('reason').setLabel('Rejection Reason (Optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)
        )
      );
      await interaction.showModal(modal);
    }
  }

  // ═══════════════════════════════════════
  // SELECT MENU
  // ═══════════════════════════════════════
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('select_roles_')) {
      const userId        = interaction.customId.split('_')[2];
      const member        = await interaction.guild.members.fetch(userId);
      const selectedRoles = interaction.values;

      await member.roles.add(selectedRoles);

      const roleNames = selectedRoles.map(id => {
        const role = interaction.guild.roles.cache.get(id);
        return `• ${role?.name || id}`;
      }).join('\n');

      await member.send(`✅ Additional roles have been provided to you in **Stormy Family**!\n\n**Roles Added:**\n${roleNames}`).catch(() => {});

      // Log extra roles
      const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffCh) {
        const logEmbed = styledEmbed(
          '➕ Extra Roles Added',
          `**Member:** <@${userId}>\n**Added By:** ${interaction.user}\n**Roles:**\n${roleNames}`,
          0x3498db
        );
        await staffCh.send({ embeds: [logEmbed] });
      }

      await interaction.update({ content: `✅ Roles added successfully.`, components: [] });
    }
  }

  // ═══════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════
  if (interaction.isModalSubmit()) {

    // ── Application Modal ──
    if (interaction.customId === 'application_modal') {
      const ign    = interaction.fields.getTextInputValue('ign');
      const id     = interaction.fields.getTextInputValue('id');
      const level  = interaction.fields.getTextInputValue('level');
      const family = interaction.fields.getTextInputValue('family');

      pendingApplications.add(interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setThumbnail(STORMY_LOGO)
        .setTitle('📋 𝗥𝗢𝗟𝗘 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗔𝗣𝗣𝗟𝗜𝗖𝗔𝗧𝗜𝗢𝗡')
        .setDescription(
          `**𝗜𝗚𝗡** - ${ign}\n**𝗜𝗗** - ${id}\n**𝗟𝗲𝘃𝗲𝗹** - ${level}\n**𝗟𝗮𝘀𝘁 𝗙𝗮𝗺𝗶𝗹𝘆** - ${family}`
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `Application by ${interaction.user.tag}`, iconURL: STORMY_LOGO })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel('❌ Reject').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`blacklist_${interaction.user.id}`).setLabel('🚫 Blacklist').setStyle(ButtonStyle.Secondary)
      );

      const pingMentions = PING_ROLES.map(r => `<@&${r}>`).join(' ');
      const staffChannel = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffChannel) {
        await staffChannel.send({ content: `${pingMentions} — New application from <@${interaction.user.id}>!`, embeds: [embed], components: [buttons] });
      }

      await interaction.reply({ content: '✅ Your application has been submitted! Please wait for staff to review it.', ephemeral: true });
    }

    // ── Reject Application Modal ──
    if (interaction.customId.startsWith('reject_modal_') && !interaction.customId.startsWith('reject_modal_name')) {
      const userId = interaction.customId.split('_')[2];
      let reason   = interaction.fields.getTextInputValue('reason');
      if (!reason || reason.trim() === '') reason = 'Not mentioned';

      pendingApplications.delete(userId);

      try {
        const member = await interaction.guild.members.fetch(userId);
        await member.send(`❌ Your role request application to **Stormy Family** has been **rejected**.\n\n**Reason:** ${reason}`).catch(() => {});
      } catch {}

      // Log rejection
      const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffCh) {
        const logEmbed = styledEmbed(
          '❌ Application Rejected',
          `**Applicant:** <@${userId}>\n**Rejected By:** ${interaction.user}\n**Reason:** ${reason}`,
          0xe74c3c
        );
        await staffCh.send({ embeds: [logEmbed] });
      }

      await interaction.update({
        content: `❌ Rejected by ${interaction.user.tag} — Reason: ${reason}`,
        embeds: interaction.message.embeds,
        components: []
      });
    }

    // ── Name Change Modal ──
    if (interaction.customId === 'name_change_modal') {
      const newName = interaction.fields.getTextInputValue('new_name');
      const newId   = interaction.fields.getTextInputValue('new_id');
      const fullName = `${newName} | ${newId}`;

      pendingNameChanges.add(interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setThumbnail(STORMY_LOGO)
        .setTitle('✏️ Name Change Request')
        .setDescription(
          `**Requested By:** <@${interaction.user.id}>\n**Current Name:** ${interaction.member.displayName}\n**Requested Name:** ${fullName}`
        )
        .setFooter({ text: `Request by ${interaction.user.tag}`, iconURL: STORMY_LOGO })
        .setTimestamp();

      const encodedName = encodeURIComponent(fullName);
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_name_${interaction.user.id}_${encodedName}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_name_${interaction.user.id}`).setLabel('❌ Reject').setStyle(ButtonStyle.Danger)
      );

      const pingMentions = PING_ROLES.map(r => `<@&${r}>`).join(' ');
      const staffChannel = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffChannel) {
        await staffChannel.send({ content: `${pingMentions} — Name change request from <@${interaction.user.id}>!`, embeds: [embed], components: [buttons] });
      }

      await interaction.reply({ content: '✅ Your name change request has been submitted! Please wait for staff to review it.', ephemeral: true });
    }

    // ── Reject Name Change Modal ──
    if (interaction.customId.startsWith('reject_name_modal_')) {
      const userId = interaction.customId.split('_')[3];
      let reason   = interaction.fields.getTextInputValue('reason');
      if (!reason || reason.trim() === '') reason = 'Not mentioned';

      pendingNameChanges.delete(userId);

      try {
        const member = await interaction.guild.members.fetch(userId);
        await member.send(`❌ Your **name change request** has been **rejected**.\n\n**Reason:** ${reason}`).catch(() => {});
      } catch {}

      // Log
      const staffCh = await client.channels.fetch(STAFF_CHANNEL).catch(() => null);
      if (staffCh) {
        const logEmbed = styledEmbed(
          '❌ Name Change Rejected',
          `**Member:** <@${userId}>\n**Rejected By:** ${interaction.user}\n**Reason:** ${reason}`,
          0xe74c3c
        );
        await staffCh.send({ embeds: [logEmbed] });
      }

      await interaction.update({
        content: `❌ Name change rejected by ${interaction.user.tag} — Reason: ${reason}`,
        embeds: interaction.message.embeds,
        components: []
      });
    }
  }
});

client.login(TOKEN);