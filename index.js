import {
  Client,
  GatewayIntentBits,
  Routes,
  SlashCommandBuilder,
  Collection
} from "discord.js";

import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

// ===== 系統模組 =====
import { startGame } from "./systems/start.js";
import { handleDungeonAction, goToNextFloor } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleEventResult } from "./systems/dungeon.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";

// ===== 建立 Discord Client（你漏掉這個） =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== 玩家資料 =====
export const players = new Map();

// ===== Slash commands 註冊 =====
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("開始迷霧森林的詛咒"),
  new SlashCommandBuilder()
    .setName("skills")
    .setDescription("查看技能樹"),
  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("查看背包")
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

// ===== Bot啟動 =====
client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});

// ===== 按鈕 & 指令事件核心 =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  // ------ Slash commands ------
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players, null);
    }
    if (interaction.commandName === "skills") {
      return handleSkillMenu(interaction, players);
    }
    if (interaction.commandName === "inventory") {
      return handleInventoryAction(interaction, players);
    }
  }

  // ------ Start（職業 + 難度）------
  if (id && id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ------ 戰鬥 ------
  if (id.startsWith("battle_")) {
    await interaction.deferUpdate();
    return handleBattleAction(interaction, players, id);
  }

  // ------ 事件 ------
  if (id.startsWith("dungeon_event_")) {
    await interaction.deferUpdate();
    return handleEventResult(interaction, players, id);
  }

  // ------ 下一層 ------
  if (id === "dungeon_next") {
    await interaction.deferUpdate();
    const player = players.get(userId);
    return goToNextFloor(interaction, player);
  }

  // ------ 地城行動 ------
  if (id.startsWith("dungeon_")) {
    await interaction.deferUpdate();
    return handleDungeonAction(interaction, players, id);
  }

  // ------ 背包 ------
  if (id.startsWith("inv_")) {
    await interaction.deferUpdate();
    return handleInventoryAction(interaction, players, id);
  }
});

// ===== 登入 Bot =====
client.login(process.env.TOKEN);
