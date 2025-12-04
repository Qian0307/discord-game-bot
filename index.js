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

// 系統模組
import { startGame } from "./systems/start.js";
import { handleDungeonAction } from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleEventResult, goToNextFloor } from "./systems/dungeon.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";


// ⭐⭐ 這一行你漏掉了：建立 client ⭐⭐
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

export const players = new Map();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  // ================================
  //       Slash commands
  // ================================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players, null);
    }
    if (interaction.commandName === "skills") {
      return handleSkillMenu(interaction, players);
    }
    if (interaction.commandName === "inventory") {
      return handleInventoryAction(interaction, players);
    }
  }

  // ================================
  //      Start 系列按鈕 (職業 + 難度)
  // ================================
  if (interaction.isButton() && id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ================================
  //      戰鬥系統
  // ================================
  if (interaction.isButton() && id.startsWith("battle_")) {
    await interaction.deferUpdate();
    return handleBattleAction(interaction, players, id);
  }

  // ================================
  //      事件
  // ================================
  if (id.startsWith("dungeon_event_")) {
    await interaction.deferUpdate();
    return handleEventResult(interaction, players, id);
  }

  // ================================
  //      下一層
  // ================================
  if (id === "dungeon_next") {
    await interaction.deferUpdate();
    const player = players.get(userId);
    return goToNextFloor(interaction, player);
  }

  // ================================
  //      迷宮行動 (前進 / 觀察 / 物品)
  // ================================
  if (id.startsWith("dungeon_")) {
    await interaction.deferUpdate();
    return handleDungeonAction(interaction, players, id);
  }

  // ================================
  //      背包
  // ================================
  if (id.startsWith("inv_")) {
    await interaction.deferUpdate();
    return handleInventoryAction(interaction, players, id);
  }
});

