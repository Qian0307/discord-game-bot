// =======================================================================
//                         雙月小機器人 index.js（穩定修正版）
// =======================================================================

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
  handleEventResult,
  goToNextFloor
} from "./systems/dungeon.js";

import { handleBattleAction } from "./systems/battle.js";
import { handleInventoryAction } from "./systems/inventory.js";
import { handleSkillMenu } from "./systems/skills.js";

// =======================================================================
//                      Discord Client + 玩家資料
// =======================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

export const players = new Map();

// =======================================================================
//                         Slash Commands 註冊
// =======================================================================

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


// =======================================================================
//                                Ready
// =======================================================================

client.once("ready", () => {
  console.log(`🌑 黑暗迷霧森林運行中：${client.user.tag}`);
});


// =======================================================================
//                       🔥 安全互動回覆函式
// =======================================================================

async function safeReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied)
      return interaction.editReply(payload);
    return interaction.reply({ ...payload, ephemeral: true });
  } catch {
    return interaction.followUp({ ...payload, ephemeral: true });
  }
}


// =======================================================================
//                      Interaction 核心處理
// =======================================================================

client.on("interactionCreate", async (interaction) => {

  // ------------------------------------------
  // Slash Commands
  // ------------------------------------------

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "start")
      return startGame(interaction, players);

    if (interaction.commandName === "skills")
      return handleSkillMenu(interaction, players);

    if (interaction.commandName === "inventory")
      return handleInventoryAction(interaction, players);

    return;
  }


  // ------------------------------------------
  // 其他互動：按鈕 Interaction
  // ------------------------------------------

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;
  const player = players.get(userId);

  // --- 2.4：如果玩家不存在（重開 bot 或 map 重置）
  if (!player && !id.startsWith("start_")) {
    return safeReply(interaction, {
      content: "⚠ 你還沒開始冒險，請輸入 **/start**。"
    });
  }

  // ---------------- START 系列 -----------------
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ---------------- Dungeon 系列 ----------------
  if (id === "dungeon_enter" || id.startsWith("dungeon_act_")) {
    return handleDungeonAction(interaction, players, id);
  }

  if (id.startsWith("dungeon_event_")) {
    return handleEventResult(interaction, player, id);
  }

  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // ---------------- 戰鬥系列 --------------------
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // ---------------- 背包 ------------------------
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }

});


// =======================================================================
//                            Login
// =======================================================================

client.login(process.env.TOKEN);
