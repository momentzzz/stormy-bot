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

/*
==================================
CHANNELS
==================================
*/

const ROLE_REQUEST_CHANNEL =
'1508517254210256956';

const STAFF_CHANNEL =
'1508507337030373496';

/*
==================================
MAIN ROLE
==================================
*/

const FAMILY_ROLE_ID =
'1508101062161207437';

/*
==================================
STAFF ROLES
==================================
*/

const STAFF_ROLES = [

'1193690559341133955',
'1509596474462179468',
'1508100262206636125',
'1509213861205508148'
];

/*
==================================
EXTRA ROLES
==================================
*/

const EXTRA_ROLES = [

{
label: 'Stormy',
value: '1508100615006453810'
},

{
label: 'Under Deputy',
value: '1508118610978144447'
},

{
label: 'Event Speaker',
value: '1508476640789921994'
},

{
label: 'Media',
value: '1508479963266027651'
},

{
label: 'Fam war',
value: '1508482889577402368'
},

{
label: 'Turfer',
value: '1508114263372464138'
},

{
label: 'Shooter',
value: '1508100871190216811'
},

{
label: 'Family Member',
value: '1508101062161207437'
}
];

/*
==================================
STAFF CHECK
==================================
*/

function isStaff(member) {

return STAFF_ROLES.some(role =>
member.roles.cache.has(role)
);
}

/*
==================================
BOT READY
==================================
*/

client.once(
Events.ClientReady,
async () => {

console.log(
`${client.user.tag} is online`
);

const channel =
await client.channels.fetch(
ROLE_REQUEST_CHANNEL
);

const embed =
new EmbedBuilder()

.setColor('#2b2d31')

.setDescription(

`:clipboard: **📋 𝗥𝗢𝗟𝗘 𝗥𝗘𝗤𝗨𝗘𝗦𝗧**

Click the button below to apply for the family.`
);

const button =
new ActionRowBuilder()

.addComponents(

new ButtonBuilder()

.setCustomId('apply_form')

.setLabel('Apply')

.setStyle(ButtonStyle.Primary)
);

await channel.send({

embeds: [embed],

components: [button]
});
});

/*
==================================
INTERACTIONS
==================================
*/

client.on(
Events.InteractionCreate,
async interaction => {

/*
==================================
BUTTONS
==================================
*/

if (interaction.isButton()) {

/*
APPLY
*/

if (
interaction.customId ===
'apply_form'
) {

const modal =
new ModalBuilder()

.setCustomId(
'application_modal'
)

.setTitle(
'Role Request Application'
);

const ignInput =
new TextInputBuilder()

.setCustomId('ign')

.setLabel(
'In Game Name'
)

.setStyle(
TextInputStyle.Short
)

.setRequired(true);

const idInput =
new TextInputBuilder()

.setCustomId('id')

.setLabel(
'Player ID'
)

.setStyle(
TextInputStyle.Short
)

.setRequired(true);

const levelInput =
new TextInputBuilder()

.setCustomId('level')

.setLabel(
'Player Level'
)

.setStyle(
TextInputStyle.Short
)

.setRequired(true);

const familyInput =
new TextInputBuilder()

.setCustomId('family')

.setLabel(
'Last Family'
)

.setStyle(
TextInputStyle.Short
)

.setRequired(true);

modal.addComponents(

new ActionRowBuilder()
.addComponents(ignInput),

new ActionRowBuilder()
.addComponents(idInput),

new ActionRowBuilder()
.addComponents(levelInput),

new ActionRowBuilder()
.addComponents(familyInput)
);

await interaction.showModal(
modal
);
}

/*
==================================
APPROVE
==================================
*/

if (
interaction.customId.startsWith(
'approve_'
)
) {

try {

const userId =
interaction.customId.split('_')[1];

const member =
await interaction.guild.members.fetch(
userId
);

await member.roles.add(
FAMILY_ROLE_ID
);

const embedDescription =
interaction.message.embeds[0]
.description;

let nickname =
"Family Member";

const ignMatch =
embedDescription.match(
/\*\*𝗜𝗚𝗡\*\* - (.+)/
);

const idMatch =
embedDescription.match(
/\*\*𝗜𝗗\*\* - (.+)/
);

if (
ignMatch &&
idMatch
) {

const ign =
ignMatch[1].trim();

const id =
idMatch[1].trim();

nickname =
`${ign} | ${id}`;
}

try {

await member.setNickname(
nickname
);

} catch {}

/*
DM APPROVED
*/

await member.send(

`✅ Your role request application to Stormy Family has been approved.

Roles Provided:
• Family Member`
).catch(() => {});

const row =
new ActionRowBuilder()

.addComponents(

new ButtonBuilder()

.setCustomId(
`more_roles_${userId}`
)

.setLabel(
'Add More Roles'
)

.setStyle(
ButtonStyle.Secondary
)
);

await interaction.update({

content:
`✅ Approved by ${interaction.user.tag}`,

embeds:
interaction.message.embeds,

components: [row]
});

} catch (error) {

console.log(error);

if (!interaction.replied) {

await interaction.reply({

content:
'❌ Failed to approve application.',

ephemeral: true
});
}
}
}

/*
==================================
REJECT
==================================
*/

if (
interaction.customId.startsWith(
'reject_'
)
) {

const modal =
new ModalBuilder()

.setCustomId(
`reject_modal_${interaction.customId.split('_')[1]}`
)

.setTitle(
'Rejection Reason'
);

const reasonInput =
new TextInputBuilder()

.setCustomId(
'reason'
)

.setLabel(
'Rejection Reason (Optional)'
)

.setStyle(
TextInputStyle.Paragraph
)

.setRequired(false);

modal.addComponents(

new ActionRowBuilder()
.addComponents(reasonInput)
);

await interaction.showModal(
modal
);
}

/*
==================================
MORE ROLES
==================================
*/

if (
interaction.customId.startsWith(
'more_roles_'
)
) {

if (
!isStaff(interaction.member)
) {

return interaction.reply({

content:
'❌ You cannot use this.',

ephemeral: true
});
}

const userId =
interaction.customId.split('_')[2];

const menu =
new StringSelectMenuBuilder()

.setCustomId(
`select_roles_${userId}`
)

.setPlaceholder(
'Select roles'
)

.setMinValues(1)

.setMaxValues(
EXTRA_ROLES.length
)

.addOptions(
EXTRA_ROLES
);

const row =
new ActionRowBuilder()
.addComponents(menu);

await interaction.reply({

content:
'Select roles to provide.',

components: [row],

ephemeral: true
});
}
}

/*
==================================
ROLE MENU
==================================
*/

if (
interaction.isStringSelectMenu()
) {

if (
interaction.customId.startsWith(
'select_roles_'
)
) {

const userId =
interaction.customId.split('_')[2];

const member =
await interaction.guild.members.fetch(
userId
);

const selectedRoles =
interaction.values;

await member.roles.add(
selectedRoles
);

const roleNames =
selectedRoles.map(id => {

const role =
interaction.guild.roles.cache.get(id);

return `• ${role?.name}`;
}).join('\n');

/*
DM EXTRA ROLES
*/

await member.send(

`✅ Additional roles have been provided to you.

Roles Added:
${roleNames}`
).catch(() => {});

await interaction.update({

content:
`✅ Roles added successfully.`,

components: []
});
}
}

/*
==================================
MODAL SUBMIT
==================================
*/

if (
interaction.isModalSubmit()
) {

/*
APPLICATION
*/

if (
interaction.customId ===
'application_modal'
) {

const ign =
interaction.fields.getTextInputValue(
'ign'
);

const id =
interaction.fields.getTextInputValue(
'id'
);

const level =
interaction.fields.getTextInputValue(
'level'
);

const family =
interaction.fields.getTextInputValue(
'family'
);

const embed =
new EmbedBuilder()

.setColor('#3498db')

.setDescription(

`:clipboard: **𝗥𝗢𝗟𝗘 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗔𝗣𝗣𝗟𝗜𝗖𝗔𝗧𝗜𝗢𝗡**

**𝗜𝗚𝗡** - ${ign}
**𝗜𝗗** - ${id}
**𝗟𝗲𝘃𝗲𝗹** - ${level}
**𝗟𝗮𝘀𝘁 𝗙𝗮𝗺𝗶𝗹𝘆** - ${family}`
)

.setThumbnail(
interaction.user.displayAvatarURL()
)

.setFooter({

text:
`Application by ${interaction.user.tag}`
})

.setTimestamp();

const buttons =
new ActionRowBuilder()

.addComponents(

new ButtonBuilder()

.setCustomId(
`approve_${interaction.user.id}`
)

.setLabel('Approve')

.setStyle(
ButtonStyle.Success
),

new ButtonBuilder()

.setCustomId(
`reject_${interaction.user.id}`
)

.setLabel('Reject')

.setStyle(
ButtonStyle.Danger
)
);

const staffChannel =
await client.channels.fetch(
STAFF_CHANNEL
);

await staffChannel.send({

embeds: [embed],

components: [buttons]
});

await interaction.reply({

content:
'✅ Your application has been submitted.',

ephemeral: true
});
}

/*
==================================
REJECT MODAL
==================================
*/

if (
interaction.customId.startsWith(
'reject_modal_'
)
) {

const userId =
interaction.customId.split('_')[2];

const member =
await interaction.guild.members.fetch(
userId
);

let reason =
interaction.fields.getTextInputValue(
'reason'
);

if (!reason || reason.trim() === '') {

reason =
'Not mentioned';
}

/*
DM REJECT
*/

await member.send(

`❌ Your role request application to Stormy Family has been rejected.

Reason:
${reason}`
).catch(() => {});

await interaction.update({

content:
`❌ Rejected by ${interaction.user.tag}`,

embeds:
interaction.message.embeds,

components: []
});
}
}
});

client.login(TOKEN);