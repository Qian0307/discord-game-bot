import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import eventsData from "../data/events.json" with { type: "json" };
import monstersData from "../data/monsters.json" with { type: "json" };
import floors from "../data/floors.json" with { type: "json" };


// =======================================================================
//                           迷宮主入口
// =======================================================================

export async function handleDungeonAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.editReply({
      content: "你的靈魂尚未被詛咒……請輸入 `/start`。",
      embeds: [],
      components: []
    });
  }

  // 進入樓層
  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  // 行動
  if (id.startsWith("dungeon_act_")) {
    const act = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, act);
  }
}



// =======================================================================
//                              進入樓層
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
//                           樓層行動分配
// =======================================================================

async function processFloorAction(interaction, player, action) {

  const floor = floors[player.currentFloor];

  // 背包
  if (action === "use") {
    return interaction.editReply({
      content: "（背包系統啟動……）",
      embeds: [],
      components: []
    });
  }

  // 觀察
  if (action === "observe") {
    return handleObservation(interaction, player, floor);
  }

  // 前進（無 Boss 版 → 永遠不觸發 boss）
  if (action === "forward") {

    const rng = Math.random();

    if (rng < floor.eventChance) {
      return triggerEvent(interaction, player, floor);
    } else {
      return triggerMonster(interaction, player, floor);
    }
  }
}



// =======================================================================
//                               觀察
// =======================================================================

async function handleObservation(interaction, player, floor) {

  const lukBonus = player.luk * 0.03;
  const agiBonus = player.agi * 0.02;
  const chance = 0.15 + lukBonus + agiBonus;

  let description = "";

  if (Math.random() < chance) {
    description = `你停下腳步……  
黑霧像潮水般退去，你察覺到：  
**「某個東西正在盯著你。」**`;

    if (player.class === "被詛咒的孩子" && Math.random() < 0.5) {
      description += `\n\n**「右邊。」** 你聽到了不存在的聲音。`;
    }

  } else {
    description = `你什麼也沒看見。  
但你總覺得……**有什麼在看你。**`;
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
//                              事件
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

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                            遇怪（一般怪物）
// =======================================================================

async function triggerMonster(interaction, player, floor) {

  const pool = monstersData[floor.monsterGroup];
  const monster = JSON.parse(JSON.stringify(
    pool[Math.floor(Math.random() * pool.length)]
  ));

  const lvMultiplier = 1 + player.currentFloor * 0.15;

  monster.hp = Math.floor(monster.hp * lvMultiplier);
  monster.atk = Math.floor(monster.atk * lvMultiplier);

  player.currentMonster = monster;

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 遭遇：${monster.name}`)
    .setDescription(monster.intro)
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`battle_start_${monster.id}`).setLabel("戰鬥").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Secondary)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                        事件結果處理（給 events.js 用）
// =======================================================================

export async function handleEventResult(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  const eventId = id.replace("dungeon_event_", "");
  const floor = floors[player.currentFloor];
  const list = eventsData[floor.eventGroup];

  let targetEvent;

  for (const e of list) {
    if (e.options.some(o => o.id === eventId)) {
      targetEvent = e;
      break;
    }
  }

  const option = targetEvent.options.find(o => o.id === eventId);

  let result = option.result + "\n";

  ["hp", "mp", "str", "agi", "int", "luk"].forEach(attr => {
    if (option[attr]) {
      player[attr] += option[attr];
      result += `\n**${attr.toUpperCase()} ${option[attr] > 0 ? "+" : ""}${option[attr]}**`;
    }
  });

  if (option.curse) {
    player.hp = Math.max(1, player.hp - option.curse);
    result += `\n\n**詛咒侵蝕生命 ${option.curse} 點。**`;
  }

  if (player.hp <= 0) {
    return handleDeath(interaction);
  }

  const embed = new EmbedBuilder()
    .setTitle("⚠ 事件結果")
    .setDescription(result)
    .setColor("#4c1d95");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("繼續前進").setStyle(ButtonStyle.Primary)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                               下一層
// =======================================================================

export async function goToNextFloor(interaction, player) {

  player.currentFloor++;

  if (player.currentFloor > 20) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🌑 終章")
          .setDescription("你成功走出森林……但你已經不再是從前的你。")
          .setColor("#1e1b4b")
      ],
      components: []
    });
  }

  return enterFloor(interaction, player);
}



// =======================================================================
//                               死亡
// =======================================================================

async function handleDeath(interaction) {

  const embed = new EmbedBuilder()
    .setTitle("💀 你死了")
    .setDescription("黑霧將你完全吞噬……冒險結束。")
    .setColor("#000");

  return interaction.editReply({
    embeds: [embed],
    components: []
  });
}

