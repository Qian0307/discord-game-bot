import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

// ====== 建立 Discord Client ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// ====== 設定 Slash Command ======
const commands = [
  new SlashCommandBuilder()
    .setName("adventure")
    .setDescription("開始魔導書文字冒險遊戲"),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// === 註冊 Slash Commands ===
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

// ===== 遊戲狀態 =====
const playerStates = new Map();

// ===== Bot Ready =====
client.once("ready", () => {
  console.log(`🤖 已登入：${client.user.tag}`);
});

// ====== 互動處理 ======
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {

    // 初始場景
    const embed = new EmbedBuilder()
      .setTitle("📖《雙月魔導書》開啟")
      .setDescription(
        "你站在**雙月森林**的入口。\n" +
        "微光在黑暗中閃爍，彷彿在召喚你向前。\n\n" +
        "你想怎麼做？"
      )
      .setColor("#8b5cf6");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_forward")
        .setLabel("🔮 前進")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("start_look")
        .setLabel("🛡 觀察四周")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("start_back")
        .setLabel("🔙 返回村莊")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  // ========== 按鈕處理 ==========
  if (interaction.isButton()) {

    // ====== 分支：前進 ======
    if (interaction.customId === "start_forward") {
      const embed = new EmbedBuilder()
        .setTitle("🌕 雙月光照亮前方")
        .setDescription(
          "你走進森林，忽然看見一個漂浮的光球。\n" +
          "它似乎在等待你的選擇…"
        )
        .setColor("#7dd3fc");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("orb_touch")
          .setLabel("✨ 觸碰光球")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("orb_ignore")
          .setLabel("🚶‍♀️ 繼續前進")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    // ====== 分支：觀察四周 ======
    if (interaction.customId === "start_look") {
      const embed = new EmbedBuilder()
        .setTitle("👁 你仔細觀察四周…")
        .setDescription(
          "四周安靜得不自然。\n" +
          "樹葉沒有風卻微微顫動，你感覺到某種東西正在注視你。"
        )
        .setColor("#fbbf24");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("look_call")
          .setLabel("🔊 呼喚它")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("look_hide")
          .setLabel("🥷 躲起來")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    // ====== 分支：返回村莊（結局） ======
    if (interaction.customId === "start_back") {
      const embed = new EmbedBuilder()
        .setTitle("🏘 你回到了村莊")
        .setDescription("你選擇了安全而非冒險。冒險到此結束。")
        .setColor("#a1a1aa");

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    // ==========================
    // 第二階段：光球分支
    // ==========================
    if (interaction.customId === "orb_touch") {
      const embed = new EmbedBuilder()
        .setTitle("✨ 光球破裂！")
        .setDescription(
          "強光包裹你，你獲得了神秘力量。\n" +
          "**結局：你成為森林的新守護者。**"
        )
        .setColor("#fde047");

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    if (interaction.customId === "orb_ignore") {
      const embed = new EmbedBuilder()
        .setTitle("🚶‍♀️ 你選擇忽略光球…")
        .setDescription(
          "前方是未知的深林。\n" +
          "**結局：你迷失在黑暗之中，再也沒有回來。**"
        )
        .setColor("#525252");

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    // ==========================
    // 第二階段：觀察分支
    // ==========================
    if (interaction.customId === "look_call") {
      const embed = new EmbedBuilder()
        .setTitle("🦉 某物回應了你…")
        .setDescription(
          "一隻巨大的夜梟降落在你面前。\n" +
          "它願意帶你飛向雙月之巔。\n" +
          "**結局：你成為夜梟的夥伴。**"
        )
        .setColor("#60a5fa");

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    if (interaction.customId === "look_hide") {
      const embed = new EmbedBuilder()
        .setTitle("🥷 你藏在樹後…")
        .setDescription(
          "黑影靠近，但沒有發現你。\n" +
          "**結局：你悄悄離開森林，保住了性命。**"
        )
        .setColor("#4ade80");

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }
  }
});

// ====== 登入 ======
client.login(process.env.TOKEN);
