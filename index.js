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
import { handleDungeonAction } from "./systems/dungeon.js";
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

// ===== 事件處理 =====
client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  // Buttons
  if (interaction.isButton()) {
    const id = interaction.customId;

    // ===== START =====
    if (id.startsWith("start_"))
      return startGame(interaction, players, id);

    // ===== EVENT（必須放在最上面）=====
    if (id.startsWith("dungeon_event_"))
      return routeEvent(interaction, players, id);

    // ===== DUNGEON =====
    if (id.startsWith("dungeon_"))
      return handleDungeonAction(interaction, players, id);

    // ===== BATTLE =====
    if (id.startsWith("battle_"))
      return handleBattleAction(interaction, players, id);

    // ===== INVENTORY =====
    if (id.startsWith("inv_"))
      return handleInventoryAction(interaction, players, id);
  }
});

client.login(process.env.TOKEN);
