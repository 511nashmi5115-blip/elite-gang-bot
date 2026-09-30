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
const GUILD_ID = "1554474480192065642";

client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const command = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("إنشاء لوحة إرسال الرسائل");

  await rest.put(
    Routes.applicationGuildCommands(bot.user.id, GUILD_ID),
    {
      body: [command.toJSON()]
    }
  );

  console.log("✅ /setup تم تسجيله في السيرفر");
});

client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isChatInputCommand() && interaction.commandName === "setup") {

    const button = new ButtonBuilder()
      .setCustomId("gang_send")
      .setLabel("📢 إرسال رسالة للعصابة")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    return interaction.reply({
      content: "📢 لوحة إرسال الرسائل",
      components: [row]
    });
  }

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

  if (
    interaction.isRoleSelectMenu() &&
    interaction.customId === "gang_role"
  ) {

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

    return interaction.showModal(modal);
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("gang_message_")
  ) {

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
      } catch {}
    }

    return interaction.editReply(
      `✅ تم إرسال الرسالة إلى ${sent} عضو من رول ${role.name}.`
    );
  }
});

client.login(TOKEN);
