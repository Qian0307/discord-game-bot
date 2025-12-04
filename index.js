// =======================================================================
//                         雙月小機器人 index.js（最終穩定版）
// =======================================================================

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
import {
  handleDungeonAction,
  handleEventResult,
  goToNextFloor
} from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";


// =======================================================================
//                            Discord Client
// =======================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 玩家資料
export const players = new Map();


// =======================================================================
//                             Slash Commands
// =======================================================================

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


// =======================================================================
//                             Bot Ready
// =======================================================================

client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});


// =======================================================================
//                           互動事件處理核心
// =======================================================================

client.on("interactionCreate", async (interaction) => {

  // =============== Chat Command ===============
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "start")
      return startGame(interaction, players);

    if (interaction.commandName === "skills")
      return handleSkillMenu(interaction, players);

    if (interaction.commandName === "inventory")
      return handleInventoryAction(interaction, players);

    return;
  }


  // =============== Button Interaction ===============

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  // ---- Start 系列（職業、難度）----
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ---- 地城入口 / 前進 / 觀察 / 使用道具 ----
  if (id === "dungeon_enter" || id.startsWith("dungeon_act_")) {
    return handleDungeonAction(interaction, players, id);
  }

  // ---- 地城事件結果 ----
  if (id.startsWith("dungeon_event_")) {
    return handleEventResult(interaction, player, id);
  }

  // ---- 下一層 ----
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // ---- 戰鬥 ----
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // ---- 背包 ----
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }

});


// =======================================================================
//                             Login
// =======================================================================

client.login(process.env.TOKEN);
