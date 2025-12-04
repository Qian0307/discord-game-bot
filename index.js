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
import {
  handleDungeonAction,
  goToNextFloor,
  handleEventResult
} from "./systems/dungeon.js";
import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 玩家資料
export const players = new Map();

// Slash commands
const commands = [
  new SlashCommandBuilder().setName("start").setDescription("開始迷霧森林的詛咒"),
  new SlashCommandBuilder().setName("skills").setDescription("查看技能樹"),
  new SlashCommandBuilder().setName("inventory").setDescription("查看背包")
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

// Ready
client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});

// =======================================================================
//                            所有互動處理
// =======================================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  // ---------------- Slash Commands ----------------
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start")
      return startGame(interaction, players, null);

    if (interaction.commandName === "skills")
      return handleSkillMenu(interaction, players);

    if (interaction.commandName === "inventory")
      return handleInventoryAction(interaction, players);
  }

  // ================= Start 系列 =================
if (id?.startsWith("start_")) {
  return startGame(interaction, players, id);
}

// ================= 戰鬥 =================
if (id?.startsWith("battle_")) {
  await interaction.deferUpdate();
  return handleBattleAction(interaction, players, id);
}

// ================= 事件結果（一定要在這裡）=================
if (id?.startsWith("dungeon_event_")) {
  await interaction.deferUpdate();
  return handleEventResult(interaction, players, id);
}

// ================= 進入迷霧 =================
if (id === "dungeon_enter")) {
  await interaction.deferUpdate();
  return handleDungeonAction(interaction, players, id);
}

// ================= 地城行動 =================
if (id?.startsWith("dungeon_act_")) {
  await interaction.deferUpdate();
  return handleDungeonAction(interaction, players, id);
}


  // ---------------- 下一層 ----------------
  if (id === "dungeon_next") {
    await interaction.deferUpdate();
    const player = players.get(userId);
    return goToNextFloor(interaction, player);
  }

  // ---------------- 背包 ----------------
  if (id?.startsWith("inv_")) {
    await interaction.deferUpdate();
    return handleInventoryAction(interaction, players, id);
  }
});

client.login(process.env.TOKEN);

