// =======================================================================
//                         地城系統 Dungeon v1.0（修正版）
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
//                         主入口：處理所有地城交互
// =======================================================================

export async function handleDungeonAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.editReply({
      content: "你的靈魂尚未被詛咒……請輸入 `/start`。",
      components: []
    });
  }

  if (!player.currentFloor) player.currentFloor = 1;

  // 進入樓層主頁
  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  // 樓層行動
  if (id.startsWith("dungeon_act_")) {
    const act = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, act);
  }

  // 事件結果
  if (id.startsWith("dungeon_event_")) {
    return handleEventResult(interaction, player, id);
  }
}


// =======================================================================
//                          樓層主頁 UI
// =======================================================================

async function enterFloor(interaction, player) {

  const floor = floors[player.currentFloor];

  const embed = new EmbedBuilder()
    .setTitle(`🌫 第 ${player.currentFloor} 層：${floor.name}`)
    .setDescription(floor.description)
    .setColor("#312e81");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dungeon_act_forward")
      .setLabel("前進")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("dungeon_act_observe")
      .setLabel("觀察")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("dungeon_act_use")
      .setLabel("使用道具")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}


// =======================================================================
//                         樓層行動 Dispatcher
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

    if (rng < floor.eventChance) {
      return triggerEvent(interaction, player, floor);
    }

    return triggerMonster(interaction, player, floor);
  }
}


// =======================================================================
//                        觀察（偵查）系統
// =======================================================================

async function handleObservation(interaction, player, floor) {

  const chance = 0.15 + player.luk * 0.03 + player.agi * 0.02;

  let text = "";

  if (Math.random() < chance) {
    text =
      "你停下腳步…黑霧退散，你似乎察覺到什麼。\n" +
      "**「……有東西在盯著你。」**";

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
    new ButtonBuilder()
      .setCustomId("dungeon_act_forward")
      .setLabel("前進")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("dungeon_act_use")
      .setLabel("使用道具")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}


// =======================================================================
//                         隨機事件 trigger
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

  return interaction.editReply({ embeds: [embed], components: [row] });
}


// =======================================================================
//                        遭遇怪物（自動 scaling）
// =======================================================================

async function triggerMonster(interaction, player, floor) {

  const monster = generateMonster(player.currentFloor);
  player.currentMonster = monster;

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 遭遇：${monster.name}`)
    .setDescription(monster.intro)
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("battle_attack")
      .setLabel("攻擊")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("battle_skill")
      .setLabel("技能")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("battle_guard")
      .setLabel("防禦")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("battle_run")
      .setLabel("逃跑")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}


// =======================================================================
//                          事件結果處理
// =======================================================================

export async function handleEventResult(interaction, player, id) {

  const optionId = id.replace("dungeon_event_", "");
  const floor = floors[player.currentFloor];
  const list = eventsData[floor.eventGroup];

  let eventData = null;

  for (const evt of list) {
    const found = evt.options.find(o => o.id === optionId);
    if (found) {
      eventData = { event: evt, option: found };
      break;
    }
  }

  if (!eventData) {
    return interaction.editReply("⚠ 無法解析事件結果。");
  }

  const op = eventData.option;
  let result = op.result + "\n";

  ["hp", "mp", "str", "agi", "int", "luk"].forEach(attr => {
    if (op[attr]) {
      player[attr] += op[attr];
      result += `\n**${attr.toUpperCase()} ${op[attr] > 0 ? "+" : ""}${op[attr]}**`;
    }
  });

  if (op.curse) {
    player.hp = Math.max(1, player.hp - op.curse);
    result += `\n\n**詛咒侵蝕生命 ${op.curse} 點。**`;
  }

  if (player.hp <= 0) return sendDeath(interaction);

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

  return interaction.editReply({ embeds: [embed], components: [row] });
}


// =======================================================================
//                             死亡
// =======================================================================

async function sendDeath(interaction) {
  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("💀 你死了")
        .setDescription("黑霧將你完全吞噬……冒險結束。")
        .setColor("#000000")
    ],
    components: []
  });
}

