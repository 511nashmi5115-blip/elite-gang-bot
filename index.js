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
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("إنشاء لوحة إرسال الرسائل");

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(bot.user.id),
    { body: [command.toJSON()] }
  );

  console.log("✅ /setup جاهز");
});

client.on(Events.InteractionCreate, async (interaction) => {

  // أمر setup
  if (interaction.isChatInputCommand() && interaction.commandName === "setup") {

    const button = new ButtonBuilder()
      .setCustomId("gang_send")
      .setLabel("📢 إرسال رسالة للعصابة")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: "اضغط الزر لإرسال رسالة لأعضاء رول معين.",
      components: [row]
    });

    return;
  }

  // زر الإرسال
  if (interaction.isButton() && interaction.customId === "gang_send") {

    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("gang_role")
        .setPlaceholder("اختر الرول")
        .setMinValues(1)
        .setMaxValues(1)
    );

    await interaction.reply({
      content: "اختر الرول الذي تريد إرسال الرسالة لأعضائه:",
      components: [row],
      ephemeral: true
    });

    return;
  }

  // اختيار الرول
  if (interaction.isRoleSelectMenu() && interaction.customId === "gang_role") {

    const roleId = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`gang_message_${roleId}`)
      .setTitle("إرسال رسالة");

    const input = new TextInputBuilder()
      .setCustomId("message")
      .setLabel("اكتب الرسالة")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder("اكتب الرسالة هنا...");

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);

    return;
  }

  // إرسال DM
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("gang_message_")
  ) {

    const roleId = interaction.customId.replace("gang_message_", "");
    const message = interaction.fields.getTextInputValue("message");

    await interaction.deferReply({ ephemeral: true });

    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      await interaction.editReply("❌ الرول غير موجود.");
      return;
    }

    let sent = 0;

    for (const member of role.members.values()) {
      try {
        await member.send(message);
        sent++;
      } catch {
        // العضو مانع الرسائل الخاصة
      }
    }

    await interaction.editReply(
      `✅ تم إرسال الرسالة إلى ${sent} عضو من رول ${role.name}.`
    );
  }
});

client.login(TOKEN);
