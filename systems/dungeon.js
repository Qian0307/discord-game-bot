// =======================================================================
//  Dungeon System（完整重寫最佳化版本）
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import eventsData from "../data/events.json" with { type: "json" };
import monstersData from "../data/monsters.json" with { type: "json" };
import floors from "../data/floors.json" with { type: "json" };

import { generateMonster } from "./monster.js";  // 使用新的怪物工廠
import { handleDeath } from "./death.js";         // 若你未做 death.js，我可以幫你補


// =======================================================================
//                           迷宮主入口
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

  // 初始樓層
  if (!player.currentFloor) player.currentFloor = 1;

  // 進入樓層主畫面
  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  // 玩家行動
  if (id.startsWith("dungeon_act_")) {
    const act = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, act);
  }
}



// =======================================================================
//                              樓層主畫面
// =======================================================================

async function enterFloor(interaction, player) {

  const floor = floors[player.currentFloor];

  const embed = new EmbedBuilder()
    .setTitle(`🌫 第 ${player.currentFloor} 層：${floor.name}`)
    .setDescription(floor.description)
    .setColor("#1e1b4b");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("前進").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dungeon_act_observe").setLabel("觀察").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("dungeon_act_use").setLabel("使用道具").setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                           樓層行動路由
// =======================================================================

async function processFloorAction(interaction, player, action) {
  const floor = floors[player.currentFloor];

  // 背包（未完成）
  if (action === "use") {
    return interaction.editReply({
      content: "（背包系統建構中……）",
      components: []
    });
  }

  // 觀察環境
  if (action === "observe") {
    return handleObservation(interaction, player, floor);
  }

  // 前進：事件 or 遭遇怪物
  if (action === "forward") {
    const rng = Math.random();

    // 觸發事件
    if (rng < floor.eventChance) {
      return triggerEvent(interaction, player, floor);
    }

    // 遇怪
    return triggerMonster(interaction, player, floor);
  }
}



// =======================================================================
//                           觀察（偵查）
—======================================================================

async function handleObservation(interaction, player, floor) {

  const lukBonus = player.luk * 0.03;
  const agiBonus = player.agi * 0.02;
  const chance = 0.15 + lukBonus + agiBonus;

  let description = "";

  if (Math.random() < chance) {
    description = `你停下腳步……  
黑霧像潮水般退去，你察覺到：  
**「有什麼在盯著你。」**`;

    if (player.class === "被詛咒的孩子" && Math.random() < 0.5) {
      description += `\n\n你耳邊竄出不存在的低語：**「右邊。」**`;
    }

  } else {
    description = "你什麼都沒看到……但脊背發冷。";
  }

  const embed = new EmbedBuilder()
    .setTitle("👁 觀察四周")
    .setDescription(description)
    .setColor("#3f3cbb");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("前進").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dungeon_act_use").setLabel("使用道具").setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                              隨機事件
// =======================================================================

async function triggerEvent(interaction, player, floor) {

  const pool = eventsData[floor.eventGroup];
  const event = pool[Math.floor(Math.random() * pool.length)];

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

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                                遇怪
// =======================================================================

async function triggerMonster(interaction, player, floor) {

  // 使用新的怪物系統（自動 scaling）
  const monster = generateMonster(player.currentFloor);

  player.currentMonster = monster;

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 遭遇：${monster.name}`)
    .setDescription(monster.intro)
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`battle_start`).setLabel("戰鬥").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Secondary)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                                下一層
// =======================================================================

export async function goToNextFloor(interaction, player) {

  player.currentFloor++;

  // 回復 20%
  player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.2));

  // 超過最後一層
  if (player.currentFloor > 20) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🌑 終章")
          .setDescription("你走出了森林……但靈魂已染上深淵。")
          .setColor("#1e1b4b")
      ],
      components: []
    });
  }

  return enterFloor(interaction, player);
}



// =======================================================================
//                                 死亡
// =======================================================================

export async function handleEventResult(interaction, players, id) {
  // 如果你要，我可以把這段也一起重寫成最乾淨版本
}

