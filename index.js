// =======================================================================
//                        《黑暗迷霧森林 v1.0》
//                        主入口 index.js（最終版）
// =======================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

// ESM 版 dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 系統模組 =====
import { startGame } from "./systems/start.js";
import { handleDungeonAction, goToNextFloor } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu, handleSkillSelect } from "./systems/skills.js";

// ===== Discord Client =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== Slash Commands =====
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("啟動《黑暗迷霧森林》冒險"),

  new SlashCommandBuilder()
    .setName("skills")
    .setDescription("查看技能樹"),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("查看背包")
].map(cmd => cmd.toJSON());

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

// ===== 玩家資料 =====
export const players = new Map();

// ===== Bot Ready =====
client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林 v1.0》啟動：${client.user.tag}`);
});

// =======================================================================
//                         互動事件 router
// =======================================================================

client.on("interactionCreate", async (interaction) => {

  // Slash Command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") return startGame(interaction, players);
    if (interaction.commandName === "skills") return handleSkillMenu(interaction, players);
    if (interaction.commandName === "inventory") return handleInventoryAction(interaction, players);
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!id.startsWith("start_")) {
    try { await interaction.deferUpdate(); } catch {}
  }

  // ================== 戰鬥 ==================
  if (id.startsWith("battle_")) return handleBattleAction(interaction, players, id);

  // ================== 地城 ==================
  if (id.startsWith("dungeon_")) {

    if (id === "dungeon_next") return goToNextFloor(interaction, player);

    return handleDungeonAction(interaction, players, id);
  }

  // ================== 背包 ==================
  if (id.startsWith("inv_")) return handleInventoryAction(interaction, players, id);

  // ================== 技能樹 ==================
  if (id.startsWith("skill_")) return handleSkillSelect(interaction, players, id);

});

// ===== 登入 bot =====
client.login(process.env.TOKEN);
