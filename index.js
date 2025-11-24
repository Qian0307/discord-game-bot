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
import { handleDungeonAction, goToNextFloor } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { routeEvent } from "./systems/events.js";

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
    .setDescription("啟動《黑暗迷霧森林》冒險")
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ===== 註冊 Slash Command =====
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✔ Slash commands 已註冊");
  } catch (e) {
    console.error(e);
  }
})();

// ===== 玩家資料 =====
export const players = new Map();

// ===== Bot Ready =====
client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});


// =======================================================================
//                        互 動 主 路 由（最重要）
// =======================================================================

client.on("interactionCreate", async (interaction) => {

  // -------------------------------
  // Slash Command /start
  // -------------------------------
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // -------------------------------
  // 按鈕互動（Button）
  // -------------------------------
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const player = players.get(interaction.user.id);

  // ===== Start 流程 =====
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ===== 下一層 =====
  if (id === "dungeon_next") {
    if (!player) return;
    return goToNextFloor(interaction, player);
  }

  // ===== 戰鬥 =====
  if (id.startsWith("battle_")) {
    if (!player) return;
    return handleBattleAction(interaction, players, id);
  }

  // ===== 背包 =====
  if (id.startsWith("inv_")) {
    if (!player) return;
    return handleInventoryAction(interaction, players, id);
  }

  // ===== 隨機事件 =====
  if (id.startsWith("dungeon_event_")) {
    if (!player) return;
    return routeEvent(interaction, players, id);
  }

  // ===== 迷宮行動（最後處理）=====
  if (id.startsWith("dungeon_")) {
    if (!player) return;
    return handleDungeonAction(interaction, players, id);
  }
});

client.login(process.env.TOKEN);
