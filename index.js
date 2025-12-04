import {
  Client,
  GatewayIntentBits,
  Routes,
  SlashCommandBuilder
} from "discord.js";

import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

// 系統模組
import { startGame } from "./systems/start.js";
import { handleDungeonAction, goToNextFloor, handleEventResult } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";

// 玩家資料
export const players = new Map();

// Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Slash commands
const commands = [
  new SlashCommandBuilder().setName("start").setDescription("開始迷霧森林"),
  new SlashCommandBuilder().setName("skills").setDescription("查看技能樹"),
  new SlashCommandBuilder().setName("inventory").setDescription("查看背包")
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands
    });
    console.log("✔ Slash commands 已註冊");
  } catch (err) {
    console.error(err);
  }
})();

client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});

// Interaction handler
client.on("interactionCreate", async (interaction) => {

  // Slash commands
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

  // 必須是按鈕
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  await interaction.deferUpdate();

  // ===== Start 系列 =====
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ===== 戰鬥 =====
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // ===== 地城事件 =====
  if (id.startsWith("dungeon_event_")) {
    return handleEventResult(interaction, players, id);
  }

  // ===== 下一層 =====
  if (id === "dungeon_next") {
    const player = players.get(userId);
    return goToNextFloor(interaction, player);
  }

  // ===== 地城行動（前進 / 觀察 / 使用）=====
  if (id.startsWith("dungeon_act_") || id === "dungeon_enter") {
    return handleDungeonAction(interaction, players, id);
  }

  // ===== 背包 =====
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }
});

// 登入
client.login(process.env.TOKEN);
