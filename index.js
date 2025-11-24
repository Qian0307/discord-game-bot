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

// ===== 註冊 Slash Commands =====
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

// ===== 互動處理 =====
client.on("interactionCreate", async (interaction) => {

  // Slash Command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // 按鈕互動
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const player = players.get(interaction.user.id);

  // 安全檢查（所有按鈕互動都先 defer，避免 3 秒 timeout）
  try {
    await interaction.deferUpdate();
  } catch (e) {
    // 已經 defer 過就忽略
  }

  // 下一層（勝利畫面按鈕）
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // Start 階段
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // 迷宮行動
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

  // 事件選項
  if (id.startsWith("dungeon_event_")) {
    return routeEvent(interaction, players, id);
  }

  // 戰鬥
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // 背包
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }
});

client.login(process.env.TOKEN);
