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
    .setDescription("啟動《黑暗迷霧森林》冒險"),
];

// ===== 註冊 Slash Command =====
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✔ Slash commands 已註冊");
  } catch (e) {
    console.log(e);
  }
})();

// ===== 玩家資料 =====
export const players = new Map();

// ===== Bot Ready =====
client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});

// ===== 按鈕互動處理 =====
client.on("interactionCreate", async (interaction) => {

  // ===== Slash Command =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // ===== 不是按鈕就不處理 =====
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  try { await interaction.deferUpdate(); } catch {}

  // ===== 必須優先處理 dungeon_enter =====
  if (id === "dungeon_enter") {
    return handleDungeonAction(interaction, players, id);
  }

  // ===== 下一層 =====
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // ===== Start 階段 =====
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ===== 事件 =====
  if (id.startsWith("dungeon_event_")) {
    return routeEvent(interaction, players, id);
  }

  // ===== 迷宮行動 =====
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

  // ===== 戰鬥 =====
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // ===== 背包 =====
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }
});

client.login(process.env.TOKEN);
