import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import eventsData from "../data/events.json" with { type: "json" };
import monstersData from "../data/monsters.json" with { type: "json" };
import floors from "../data/floors.json" with { type: "json" };

// ======================
//  主要進入點
// ======================
export async function handleDungeonAction(interaction, players, id) {

  await interaction.deferUpdate(); // ★ 防 timeout

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.editReply({
      content: "你的靈魂尚未被詛咒……請輸入 `/start`。",
      embeds: [],
      components: []
    });
  }

  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  if (id.startsWith("dungeon_act_")) {
    const action = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, action);
  }
}

// ======================
//  進入樓層
// ======================
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

  return interaction.editReply({ embeds: [embed], components: [row] });
}

// ======================
//  樓層行動
// ======================
async function processFloorAction(interaction, player, action) {

  const floor = floors[player.currentFloor];

  if (action === "use") {
    return interaction.editReply({
      content: "打開背包中……",
      embeds: [],
      components: []
    });
  }

  if (action === "observe") {
    return handleObservation(interaction, player, floor);
  }

  if (action === "forward") {

    // Boss 層
    if (floor.boss) {
      return triggerBossBattle(interaction, player, floor.boss);
    }

    const rng = Math.random();

    // 事件 or 遭遇怪物
    if (rng < floor.eventChance) {
      return triggerRandomEvent(interaction, player, floor);
    } else {
      return triggerMonster(interaction, player, floor);
    }
  }
}

// ======================
//  觀察系統
// ======================
async function handleObservation(interaction, player, floor) {

  const lukBonus = player.luk * 0.03;
  const agiBonus = player.agi * 0.02;
  const chance = 0.15 + lukBonus + agiBonus;

  let description = "";

  if (Math.random() < chance) {
    description = `你停下腳步……  
黑霧像潮水般退去一瞬間，你察覺到：  
**「某個東西正在盯著你。」**`;

    if (player.class === "被詛咒的孩子" && Math.random() < 0.5) {
      description += `

……你還聽見不存在的低語：  
**「右邊。」**`;
    }

  } else {
    description = `你什麼也沒看到……  
但你總覺得 **有什麼在盯你。**`;
  }

  const embed = new EmbedBuilder()
    .setTitle("👁 觀察四周")
    .setDescription(description)
    .setColor("#3f3cbb");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("前進").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dungeon_act_use").setLabel("使用道具").setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}

// ======================
//  隨機事件
// ======================
async function triggerRandomEvent(interaction, player, floor) {

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

// ======================
//  遭遇怪物
// ======================
async function triggerMonster(interaction, player, floor) {

  const pool = monstersData[floor.monsterGroup];
  const monster = JSON.parse(JSON.stringify(
    pool[Math.floor(Math.random() * pool.length)]
  ));

  // 隨樓層難度上升
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
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("逃跑").setStyle(ButtonStyle.Secondary)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}

// ======================
//  Boss
// ======================
async function triggerBossBattle(interaction, player, bossId) {

  const boss = JSON.parse(JSON.stringify(monstersData["boss"][bossId]));

  boss.hp = Math.floor(boss.hp * (1 + player.currentFloor * 0.25));
  boss.atk = Math.floor(boss.atk * (1 + player.currentFloor * 0.25));

  player.currentMonster = boss;

  const embed = new EmbedBuilder()
    .setTitle(`💀 BOSS：${boss.name}`)
    .setDescription(boss.intro)
    .setColor("#450a0a");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`battle_start_${boss.id}`).setLabel("迎戰").setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}

// ======================
//  事件結果處理
// ======================
export async function handleEventResult(interaction, players, id) {

  await interaction.deferUpdate(); // ★ 超級重要

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

  let resultText = option.result;

  // 數值變化
  if (option.hp) player.hp += option.hp;
  if (option.mp) player.mp += option.mp;
  if (option.str) player.str += option.str;
  if (option.agi) player.agi += option.agi;
  if (option.int) player.int += option.int;
  if (option.luk) player.luk += option.luk;

  if (option.curse) {
    player.hp = Math.max(1, player.hp - option.curse);
    resultText += `\n\n**詛咒侵蝕你的生命 ${option.curse} 點。**`;
  }

  if (player.hp <= 0) {
    return handlePlayerDeath(interaction, player);
  }

  const embed = new EmbedBuilder()
    .setTitle("⚠ 事件結果")
    .setDescription(resultText)
    .setColor("#4c1d95");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("繼續前進").setStyle(ButtonStyle.Primary)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}

// ======================
//  下一層
// ======================
export async function goToNextFloor(interaction, player) {

  player.currentFloor++;

  if (player.currentFloor > 20) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🌑《黑暗迷霧森林》終章")
          .setDescription("你活著走了出來……  
但你不再是你自己。")
          .setColor("#1e1b4b")
      ],
      components: []
    });
  }

  return enterFloor(interaction, player);
}

// ======================
//  死亡
// ======================
async function handlePlayerDeath(interaction, player) {

  let text = "";

  switch (player.difficulty) {

    case "Easy":
      player.currentFloor = Math.max(1, player.currentFloor - 1);
      player.hp = Math.floor(player.hp * 0.5);
      text = "黑霧饒過你一次……但帶走了部分生命。";
      break;

    case "Normal":
      player.hp = Math.floor(player.hp * 0.5);
      text = "你再次醒來……這層迷宮似乎嘲笑著你的脆弱。";
      break;

    case "Hard":
      player.hp = Math.floor(player.hp * 0.4);
      player.str = Math.max(1, player.str - 2);
      player.int = Math.max(1, player.int - 2);
      text = "死亡侵蝕了你的力量。";
      break;

    case "Lunatic":
      player.currentFloor = 1;
      player.hp = 50;
      text = "你被撕碎、再重塑……  
你回到了最初。";
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle("💀 你死了")
    .setDescription(`${text}\n\n你現在位於：${player.currentFloor}F`)
    .setColor("#450a0a");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_enter").setLabel("再次進入迷霧").setStyle(ButtonStyle.Primary)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}
