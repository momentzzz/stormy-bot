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
    Events
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.TOKEN;

const ROLE_REQUEST_CHANNEL = '1508517254210256956';
const STAFF_CHANNEL = '1508507337030373496';
const FAMILY_ROLE_ID = '1508101062161207437';

client.once(Events.ClientReady, async () => {
    console.log(`${client.user.tag} is online`);

    const channel = await client.channels.fetch(ROLE_REQUEST_CHANNEL);

    const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setDescription(`
:clipboard: **📋 𝗥𝗢𝗟𝗘 𝗥𝗘𝗤𝗨𝗘𝗦𝗧**

Click the button below to apply for the family.
`);

    const button = new ActionRowBuilder().addComponents(
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

client.on(Events.InteractionCreate, async interaction => {

    /*
    APPLY BUTTON
    */

    if (interaction.isButton()) {

        if (interaction.customId === 'apply_form') {

            const modal = new ModalBuilder()
                .setCustomId('application_modal')
                .setTitle('Role Request Application');

            const ignInput = new TextInputBuilder()
                .setCustomId('ign')
                .setLabel('In Game Name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const idInput = new TextInputBuilder()
                .setCustomId('id')
                .setLabel('Player ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const levelInput = new TextInputBuilder()
                .setCustomId('level')
                .setLabel('Player Level')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const familyInput = new TextInputBuilder()
                .setCustomId('family')
                .setLabel('Last Family')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ignInput),
                new ActionRowBuilder().addComponents(idInput),
                new ActionRowBuilder().addComponents(levelInput),
                new ActionRowBuilder().addComponents(familyInput)
            );

            await interaction.showModal(modal);
        }

        /*
        APPROVE BUTTON
        */

        if (interaction.customId.startsWith('approve_')) {

    try {

        const userId = interaction.customId.split('_')[1];

        const member = await interaction.guild.members.fetch(userId);

        await member.roles.add(FAMILY_ROLE_ID);

        const embedDescription = interaction.message.embeds[0].description;

        let nickname = "Family Member";

const ignMatch = embedDescription.match(/\*\*𝗜𝗚𝗡\*\* - (.+)/);
const idMatch = embedDescription.match(/\*\*𝗜𝗗\*\* - (.+)/);

if (ignMatch && idMatch) {

    const ign = ignMatch[1].trim();
    const id = idMatch[1].trim();

    nickname = `${ign} | ${id}`;
}

        try {
            await member.setNickname(nickname);
        } catch (err) {
            console.log("Could not change nickname.");
        }

        await interaction.update({
            content: `✅ Approved by ${interaction.user.tag}`,
            embeds: interaction.message.embeds,
            components: []
        });

    } catch (error) {

        console.log(error);

        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Failed to approve application.',
                ephemeral: true
            });
        }
    }
}

if (interaction.customId.startsWith('reject_')) {

    try {

        await interaction.update({
            content: `❌ Rejected by ${interaction.user.tag}`,
            embeds: interaction.message.embeds,
            components: []
        });

    } catch (error) {

        console.log(error);

        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Failed to reject application.',
                ephemeral: true
            });
        }
    }
}

        /*
        REJECT BUTTON
        */

        if (interaction.customId.startsWith('reject_')) {

            await interaction.reply({
                content: `❌ Application rejected.`,
                ephemeral: true
            });
        }
    }

    /*
    FORM SUBMIT
    */

    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'application_modal') {

            const ign = interaction.fields.getTextInputValue('ign');
            const id = interaction.fields.getTextInputValue('id');
            const level = interaction.fields.getTextInputValue('level');
            const family = interaction.fields.getTextInputValue('family');

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setDescription(`
:clipboard: **𝗥𝗢𝗟𝗘 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗔𝗣𝗣𝗟𝗜𝗖𝗔𝗧𝗜𝗢𝗡**

**𝗜𝗚𝗡** - ${ign}
**𝗜𝗗** - ${id}
**𝗟𝗲𝘃𝗲𝗹** - ${level}
**𝗟𝗮𝘀𝘁 𝗙𝗮𝗺𝗶𝗹𝘆** - ${family}
`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({
                    text: `Application by ${interaction.user.tag}`
                })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${interaction.user.id}`)
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`reject_${interaction.user.id}`)
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger)
            );

            const staffChannel = await client.channels.fetch(STAFF_CHANNEL);

            await staffChannel.send({
                embeds: [embed],
                components: [buttons]
            });

            await interaction.reply({
                content: '✅ Your application has been submitted.',
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);