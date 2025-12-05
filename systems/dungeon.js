// =======================================================================
//                         地城系統 Dungeon v1.0（最終完整修正版）
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import floors from "../data/floors.json" with { type: "json" };
import eventsData from "../data/events.json" with { type: "json" };
import { generateMonster } from "./monster.js";
import { handleInventoryAction } from "./inventory.js";


// =======================================================================
//          主入口：所有地城按鈕事件（由 index.js 呼叫）
// =======================================================================

export async function handleDungeonAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.update({
      content: "⚠ 你還沒開始冒險。請輸入 `/start`。",
      components: []
    });
  }

  if (!player.currentFloor) player.currentFloor = 1;

  // ---- 進入樓層 ----
  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  // ---- 前進 / 觀察 / 使用道具 ----
  if (id.startsWith("dungeon_act_")) {
    const act = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, act);
  }

  // ---- 事件結果（在 index.js 也會呼叫 handleEventResult）----
  if (id.startsWith("dungeon_event_")) {
    return handleEventResult(interaction, player, id);
  }
}



// =======================================================================
//                     樓層主頁畫面
// =======================================================================

async function enterFloor(interaction, player) {

  const floor = floors[player.currentFloor];

  const embed = new EmbedBuilder()
    .setTitle(`🌫 第 ${player.currentFloor} 層：${floor.name}`)
    .setDescription(floor.description)
    .setColor("#312e81");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("前進").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dungeon_act_observe").setLabel("觀察").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("dungeon_act_use").setLabel("使用道具").setStyle(ButtonStyle.Success)
  );

  // ★ 若是已經回覆過的互動，必須使用 update()
  if (interaction.replied || interaction.deferred) {
    return interaction.update({ embeds: [embed], components: [row] });
  }

  // ★ 第一次進迷霧（dungeon_enter）一定要用 reply()
  return interaction.reply({ embeds: [embed], components: [row] });
}




// =======================================================================
//                      前進 / 觀察 / 使用道具
// =======================================================================

async function processFloorAction(interaction, player, action) {

  const floor = floors[player.currentFloor];

  if (action === "use") {
    return handleInventoryAction(interaction, player);
  }

  if (action === "observe") {
    return handleObservation(interaction, player, floor);
  }

  if (action === "forward") {
    const rng = Math.random();

    // ---- 遇到事件 ----
    if (rng < floor.eventChance) {
      return triggerEvent(interaction, player, floor);
    }

    // ---- 遇到怪 ----
    return triggerMonster(interaction, player, floor);
  }
}



// =======================================================================
//                     下一層 — ★你少的就是這個★
// =======================================================================

export async function goToNextFloor(interaction, player) {

  player.currentFloor++;

  const embed = new EmbedBuilder()
    .setTitle("⬆ 你前往下一層……")
    .setDescription(`你踏入 **第 ${player.currentFloor} 層**。\n黑霧的低語似乎更靠近了。`)
    .setColor("#1e1b4b");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_enter").setLabel("繼續探索").setStyle(ButtonStyle.Primary)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// =======================================================================
//                           觀察系統
// =======================================================================

async function handleObservation(interaction, player, floor) {

  const chance = 0.15 + player.luk * 0.03 + player.agi * 0.02;

  let text = "";

  if (Math.random() < chance) {
    text = "你停下腳步…黑霧退散，你似乎察覺到什麼。\n**「……有東西在盯著你。」**";

    if (player.class === "被詛咒的孩子" && Math.random() < 0.5) {
      text += "\n\n一個不存在的聲音在你耳邊低語：**「右邊。」**";
    }

  } else {
    text = "你什麼也沒看到，但背後一陣發冷。";
  }

  const embed = new EmbedBuilder()
    .setTitle("👁 觀察四周")
    .setDescription(text)
    .setColor("#4338ca");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("前進").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dungeon_act_use").setLabel("使用道具").setStyle(ButtonStyle.Success)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// =======================================================================
//                           事件系統
// =======================================================================

async function triggerEvent(interaction, player, floor) {

  const list = eventsData[floor.eventGroup];
  const event = list[Math.floor(Math.random() * list.length)];

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${event.title}`)
    .setDescription(event.description)
    .setColor("#6d28d9");

  const row = new ActionRowBuilder();
  event.options.forEach(opt => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`dungeon_event_${opt.id}`)
        .setLabel(opt.label)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return interaction.update({ embeds: [embed], components: [row] });
}



// =======================================================================
//                        遭遇怪物
// =======================================================================

async function triggerMonster(interaction, player, floor) {

  const floorData = floors[player.currentFloor];
  const monster = generateMonster(floorData);
  player.currentMonster = monster;

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 遭遇：${monster.name}`)
    .setDescription(monster.intro)
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("攻擊").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_guard").setLabel("防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// =======================================================================
//                       事件結果處理
// =======================================================================

// =======================================================================
//                       事件結果處理（修正版）
// =======================================================================

export async function handleEventResult(interaction, player, id) {

  const optionId = id.replace("dungeon_event_", "");
  const floor = floors[player.currentFloor];
  const list = eventsData[floor.eventGroup];

  let eventData = null;

  for (const evt of list) {
    const found = evt.options.find(opt => opt.id === optionId);
    if (found) {
      eventData = { evt, opt: found };
      break;
    }
  }

  if (!eventData) {
    return safeReply(interaction, "⚠ 無法解析事件結果。");
  }

  const { opt } = eventData;
  let result = opt.result + "\n";

  const attrs = ["hp", "mp", "str", "agi", "int", "luk", "maxHp"];
  attrs.forEach(attr => {
    if (opt[attr] !== undefined) {
      player[attr] = (player[attr] || 0) + opt[attr];
      result += `\n**${attr.toUpperCase()} ${opt[attr] > 0 ? "+" : ""}${opt[attr]}**`;
    }
  });

  if (player.hp > player.maxHp) player.hp = player.maxHp;

  if (player.hp <= 0) {
    return sendDeath(interaction);
  }

  const embed = new EmbedBuilder()
    .setTitle("⚠ 事件結果")
    .setDescription(result)
    .setColor("#4c1d95");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dungeon_act_forward")
      .setLabel("繼續前進")
      .setStyle(ButtonStyle.Primary)
  );

  return safeUpdate(interaction, { embeds: [embed], components: [row] });
}



// =======================================================================
//                 ★★★ 安全更新工具：永不交互失敗 ★★★
// =======================================================================

function safeUpdate(interaction, data) {
  if (interaction.replied || interaction.deferred) {
    return interaction.editReply(data).catch(() => {});
  }
  return interaction.update(data).catch(() => {});
}

function safeReply(interaction, msg) {
  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({ content: msg, components: [] }).catch(() => {});
  }
  return interaction.reply({ content: msg, components: [] }).catch(() => {});
}



// =======================================================================
//                           死亡畫面
// =======================================================================

async function sendDeath(interaction) {

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("💀 你死了")
        .setDescription("黑霧將你完全吞噬……冒險結束。")
        .setColor("#000")
    ],
    components: []
  });
}
