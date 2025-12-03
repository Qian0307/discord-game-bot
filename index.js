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

// ===== ESM 版 __dirname =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 匯入系統模組 =====
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

// ===== Slash Commands 註冊 =====
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("啟動《黑暗迷霧森林》冒險")
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

// ===== 指令集合 =====
client.commands = new Collection();

// ===== 載入 /commands 資料夾（如果你要用可以保留） =====
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`📌 Loaded command: ${command.data.name}`);
    } else {
      console.log(`⚠ 跳過：${file} 缺 data 或 execute`);
    }
  }
}

// ===== Bot 啟動 =====
client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});

// =============================
//         按鈕與互動核心
// =============================
client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }

    const cmd = client.commands.get(interaction.commandName);
    if (cmd) return cmd.execute(interaction, players);
  }

  // 非按鈕
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  // 🔥 start 系列不能 defer
  if (!id.startsWith("start_")) {
    try { await interaction.deferUpdate(); } catch {}
  }

  // 1️⃣ 戰鬥初始化
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

  // 7️⃣ 迷宮行動
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }
});

// ===== 登入 Bot =====
client.login(process.env.TOKEN);
