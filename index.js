import { Client, GatewayIntentBits, SlashCommandBuilder, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

// ====== 建立 Discord Client ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ====== 註冊 Slash Command ======
const commands = [
  new SlashCommandBuilder()
    .setName("guess")
    .setDescription("開始 1~100 猜數字遊戲"),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✔ Slash commands 已註冊");
  } catch (err) {
    console.error(err);
  }
})();

// ====== 遊戲資料暫存 ======
const gameState = new Map();

// ====== Bot ready ======
client.once("ready", () => {
  console.log(`🤖 已登入：${client.user.tag}`);
});

// ====== 互動邏輯 ======
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    // 產生隨機數字
    const answer = Math.floor(Math.random() * 100) + 1;

    gameState.set(interaction.user.id, answer);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("higher").setLabel("猜大一點").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("lower").setLabel("猜小一點").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("reveal").setLabel("公布答案").setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎮 猜數字遊戲開始")
          .setDescription("答案介於 **1 到 100**\n按按鈕來猜！")
      ],
      components: [row],
      ephemeral: false,
    });
  }

  // ====== 按鈕處理 ======
  if (interaction.isButton()) {
    const answer = gameState.get(interaction.user.id);

    if (!answer) {
      return interaction.reply({ content: "你還沒有開始遊戲。請輸入 `/guess`", ephemeral: true });
    }

    if (interaction.customId === "higher") {
      await interaction.reply(`答案比 **${Math.floor(answer / 2)}** 還大嗎？你猜大了喔`);
    }
    if (interaction.customId === "lower") {
      await interaction.reply(`答案比某個數更小喔！你猜小了`);
    }
    if (interaction.customId === "reveal") {
      await interaction.reply(`🎉 正確答案是： **${answer}**`);
      gameState.delete(interaction.user.id);
    }
  }
});

// ====== 登入 ======
client.login(process.env.TOKEN);
