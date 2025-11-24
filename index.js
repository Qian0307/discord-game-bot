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

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("啟動《黑暗迷霧森林》冒險"),
];

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

export const players = new Map();

client.once("ready", () => {
  console.log(`🌑《黑暗迷霧森林》運行中：${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const player = players.get(interaction.user.id);

  // ⭐⭐⭐ 只有 start 系列按鈕要 deferUpdate
  if (id.startsWith("start_")) {
    try { await interaction.deferUpdate(); } catch {}
    return startGame(interaction, players, id);
  }

  // 下一層
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // 迷宮行動
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

  // 事件選擇
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
