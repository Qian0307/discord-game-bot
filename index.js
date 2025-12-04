import {
  Client,
  GatewayIntentBits,
  Routes,
  SlashCommandBuilder
} from "discord.js";

import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

// ===== 系統模組 =====
import { startGame } from "./systems/start.js";
import { handleDungeonAction, goToNextFloor, handleEventResult } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";

// ===== 玩家資料 =====
export const players = new Map();

// ===== 建立 Discord Client =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== Slash commands =====
const commands = [
  new SlashCommandBuilder().setName("start").setDescription("開始迷霧森林的詛咒"),
  new SlashCommandBuilder().setName("skills").setDescription("查看技能樹"),
  new SlashCommandBuilder().setName("inventory").setDescription("查看背包")
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

// ===== Bot 啟動 =====
client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});

// ===== 按鈕 & 指令事件核心 =====
client.on("interactionCreate", async (interaction) => {

  console.log("收到事件 →", {
    type: interaction.type,
    isButton: interaction.isButton(),
    customId: interaction.customId
  });

  // 補：不接受非按鈕/非指令
  if (!interaction.isChatInputCommand() && !interaction.isButton()) {
    console.log("被擋住：不是指令也不是按鈕");
    return;
  }

  // -------- Slash 指令 --------
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "start")
      return startGame(interaction, players, null);

    if (interaction.commandName === "skills")
      return handleSkillMenu(interaction, players);

    if (interaction.commandName === "inventory")
      return handleInventoryAction(interaction, players);
  }

  // -------- 按鈕 --------
  const id = interaction.customId;
  const userId = interaction.user.id;

  console.log("按鈕 ID →", id);

  if (id.startsWith("start_"))
    return startGame(interaction, players, id);

  if (id.startsWith("battle_"))
    return handleBattleAction(interaction, players, id);

  if (id.startsWith("dungeon_event_"))
    return handleEventResult(interaction, players, id);

  if (id === "dungeon_next")
    return goToNextFloor(interaction, players.get(userId));

  if (id.startsWith("dungeon_"))
    return handleDungeonAction(interaction, players, id);

  if (id.startsWith("inv_"))
    return handleInventoryAction(interaction, players, id);
});

// ===== 登入 Bot =====
client.login(process.env.TOKEN);
