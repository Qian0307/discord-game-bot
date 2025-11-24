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

// ===== 事件處理 =====
client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // 按鈕事件
if (interaction.isButton()) {
  try {
    const id = interaction.customId;
    const player = players.get(interaction.user.id);

    if (id === "dungeon_next") {
      return await goToNextFloor(interaction, player);
    }

    if (id.startsWith("start_")) return await startGame(interaction, players, id);
    if (id.startsWith("dungeon_")) return await handleDungeonAction(interaction, players, id);
    if (id.startsWith("battle_")) return await handleBattleAction(interaction, players, id);
    if (id.startsWith("inv_")) return await handleInventoryAction(interaction, players, id);
    if (id.startsWith("dungeon_event_")) return await routeEvent(interaction, players, id);

  } catch (err) {
    console.error("❌ Interaction error:", err);

    return interaction.reply({
      content: "⚠ 出現錯誤，請重新輸入 `/start`。",
      ephemeral: true
    });
  }
}

    // 其他 startsWith 判斷
    if (id.startsWith("start_")) return startGame(interaction, players, id);
    if (id.startsWith("dungeon_")) return handleDungeonAction(interaction, players, id);
    if (id.startsWith("battle_")) return handleBattleAction(interaction, players, id);
    if (id.startsWith("inv_")) return handleInventoryAction(interaction, players, id);
    if (id.startsWith("dungeon_event_")) return routeEvent(interaction, players, id);
  }
});

client.login(process.env.TOKEN);

