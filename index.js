const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

  // زر إرسال الرسالة
  if (interaction.isButton() && interaction.customId === "gang_send") {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("gang_role")
        .setPlaceholder("اختر الرول")
        .setMinValues(1)
        .setMaxValues(1)
    );

    return interaction.reply({
      content: "اختر الرول الذي تريد إرسال الرسالة لأعضائه:",
      components: [row],
      ephemeral: true
    });
  }

  // اختيار الرول
  if (interaction.isRoleSelectMenu() && interaction.customId === "gang_role") {
    const roleId = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`gang_message_${roleId}`)
      .setTitle("إرسال رسالة للعصابة");

    const input = new TextInputBuilder()
      .setCustomId("message")
      .setLabel("اكتب الرسالة")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder("اكتب رسالتك هنا...");

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  // إرسال الرسالة
  if (interaction.isModalSubmit() && interaction.customId.startsWith("gang_message_")) {
    const roleId = interaction.customId.replace("gang_message_", "");
    const message = interaction.fields.getTextInputValue("message");

    await interaction.deferReply({ ephemeral: true });

    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.editReply("❌ الرول غير موجود.");
    }

    let sent = 0;

    for (const member of role.members.values()) {
      try {
        await member.send(message);
        sent++;
      } catch {
        // بعض الأعضاء قد يمنعون الرسائل الخاصة
      }
    }

    return interaction.editReply(
      `✅ تم إرسال الرسالة إلى ${sent} عضو من رول ${role.name}.`
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
