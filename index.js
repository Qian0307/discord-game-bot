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


// ===== Discord Client 建立 =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});


// ===== Slash commands =====
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("啟動《黑暗迷霧森林》冒險")
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


// ===== 玩家資料 =====
export const players = new Map();


// ===== Bot 啟動 =====
client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});


// ===== 按鈕交互 =====
// 按鈕互動
if (!interaction.isButton()) return;

const id = interaction.customId;
const player = players.get(interaction.user.id);

// === 以下全部保持原本的順序 ===

// Boss 戰鬥開始
if (id.startsWith("battle_start_")) {
  return handleBattleAction(interaction, players, id);
}

// 事件（放最前）
if (id.startsWith("dungeon_event_")) {
  return routeEvent(interaction, players, id);
}

// 下一層
if (id === "dungeon_next") {
  return goToNextFloor(interaction, player);
}

// Start 選單
if (id.startsWith("start_")) {
  return startGame(interaction, players, id);
}

// 戰鬥
if (id.startsWith("battle_")) {
  return handleBattleAction(interaction, players, id);
}

// 背包
if (id.startsWith("inv_")) {
  return handleInventoryAction(interaction, players, id);
}

// 迷宮行動（最後）
if (id.startsWith("dungeon_")) {
  return handleDungeonAction(interaction, players, id);
}




// ===== 登入 bot =====
client.login(process.env.TOKEN);





