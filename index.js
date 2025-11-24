import {
  Client,
  GatewayIntentBits,
  Routes,
  SlashCommandBuilder
} from "discord.js";

import { REST } from "@discordjs/rest";
import dotenv from "dotenv";
dotenv.config();

import { startGame } from "./systems/start.js";
import { handleDungeonAction, goToNextFloor } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { routeEvent } from "./systems/events.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("啟動《黑暗迷霧森林》冒險"),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// 註冊 Slash 指令
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

export const players = new Map();

client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});

// ========== 互動處理 ==========
client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // 按鈕互動
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const player = players.get(interaction.user.id);

  // 防 timeout
  try { await interaction.deferUpdate(); } catch (e) { }

  // 1️⃣ 事件（放在最前面）
  if (id.startsWith("dungeon_event_")) {
    return routeEvent(interaction, players, id);
  }

  // 2️⃣ 下一層
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // 3️⃣ Start 選單
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // 4️⃣ 戰鬥
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // 5️⃣ 背包
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }

  // 6️⃣ 迷宮行動（最後）
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

}); // ★ 正確結束 interactionCreate

// ====== 最後這一行必須在所有括號外 ======
client.login(process.env.TOKEN);
