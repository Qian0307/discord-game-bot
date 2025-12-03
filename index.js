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

// =============================
//         按鈕交互核心
// =============================
client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // 非按鈕
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  // 🔥 start_ 系列 不能 defer，會壞掉
  if (!id.startsWith("start_")) {
    try { await interaction.deferUpdate(); } catch {}
  }

  // 1️⃣ Boss 開始戰鬥
  if (id.startsWith("battle_start_")) {
    return handleBattleAction(interaction, players, id);
  }

  // 2️⃣ 事件
  if (id.startsWith("dungeon_event_")) {
    return routeEvent(interaction, players, id);
  }

  // 3️⃣ 下一層
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // 4️⃣ Start 選單（職業 & 難度）
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // 5️⃣ 戰鬥流程
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // 6️⃣ 背包
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }

  // 7️⃣ 迷宮行動（前進 / 觀察 / 使用道具）
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

}); 

// ===== 登入 bot =====
client.login(process.env.TOKEN);

client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands");
