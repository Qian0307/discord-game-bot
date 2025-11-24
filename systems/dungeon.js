import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import eventsData from "../data/events.json" with { type: "json" };
import monstersData from "../data/monsters.json" with { type: "json" };
import floors from "../data/floors.json" with { type: "json" };

// ====== 進入迷宮 / 進入樓層 ======
export async function handleDungeonAction(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.reply({
      content: "你的靈魂尚未被詛咒……請輸入 `/start`。",
      ephemeral: true
    });
  }

  // 玩家按下「進入迷霧」
  if (id === "dungeon_enter") {
    return enterFloor(interaction, player);
  }

  // 樓層內行動
  if (id.startsWith("dungeon_act_")) {
    const action = id.replace("dungeon_act_", "");
    return processFloorAction(interaction, player, action);
  }
}


// ====== 進入樓層（依據 floor.json） ======
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

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}

// ====== 處理玩家樓層行動 ======
async function processFloorAction(interaction, player, action) {

  const floor = floors[player.currentFloor];

  // ===== 1. 使用道具 =====
  if (action === "use") {
    return interaction.update({
      content: "打開背包中……",
      components: [],
      embeds: []
    });
    // 真正背包選單會由 inventory.js 生成
  }

  // ===== 2. 觀察 =====
  if (action === "observe") {
    return handleObservation(interaction, player, floor);
  }

  // ===== 3. 前進 =====
  if (action === "forward") {

    // Boss 層
    if (floor.boss) {
      return triggerBossBattle(interaction, player, floor.boss);
    }

    // 隨機事件 vs 遇怪機率
    const rng = Math.random();

    if (rng < floor.eventChance) {
      return triggerRandomEvent(interaction, player, floor);
    } else {
      return triggerMonster(interaction, player, floor);
    }
  }
}

// ===== 觀察（敏捷/幸運影響結果） =====
async function handleObservation(interaction, player, floor) {

  const lukBonus = player.luk * 0.03;    // 增加「察覺」成功率
  const agiBonus = player.agi * 0.02;    // 反應更快
  const chance = 0.15 + lukBonus + agiBonus;

  let description = "";

  if (Math.random() < chance) {
    description = `你停下腳步……  
黑霧像潮水般退去一瞬間，你察覺到：

**「某個東西正在盯著你。」**`;

    // 被詛咒的孩子（高 LUK）有機率看到隱藏提示
    if (player.class === "被詛咒的孩子" && Math.random() < 0.5) {
      description += `

        ……你還聽到了別人聽不見的聲音：

        **「右邊。」**`;
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

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 隨機事件 =====
async function triggerRandomEvent(interaction, player, floor) {
  const list = eventsData[floor.eventGroup];
  const event = list[Math.floor(Math.random() * list.length)];

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${event.title}`)
    .setDescription(event.description)
    .setColor("#6d28d9");

  const row = new ActionRowBuilder();

  event.options.forEach((opt) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`dungeon_event_${opt.id}`)
        .setLabel(opt.label)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}



// ===== 遇怪：依樓層自動提升難度 =====
async function triggerMonster(interaction, player, floor) {

  const pool = monstersData[floor.monsterGroup];
  const monster = JSON.parse(JSON.stringify(
    pool[Math.floor(Math.random() * pool.length)]
  ));

  // ===== 難度倍率（依樓層提升） =====
  const lvMultiplier = 1 + (player.currentFloor * 0.15);
  monster.hp = Math.floor(monster.hp * lvMultiplier);
  monster.atk = Math.floor(monster.atk * lvMultiplier);

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 遭遇：${monster.name}`)
    .setDescription(monster.intro)
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`battle_start_${monster.id}`).setLabel("戰鬥").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("逃跑").setStyle(ButtonStyle.Secondary)
  );

  // 將怪物暫存進玩家資料
  player.currentMonster = monster;

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}



// ===== Boss 戰 =====
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

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}

// ===== 隨機事件結果處理 =====
export async function handleEventResult(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  const eventId = id.replace("dungeon_event_", "");
  const floor = floors[player.currentFloor];
  const list = eventsData[floor.eventGroup];

  // 找出觸發的事件
  let targetEvent;
  for (const e of list) {
    if (e.options.some(opt => opt.id === eventId)) {
      targetEvent = e;
      break;
    }
  }

  const option = targetEvent.options.find(o => o.id === eventId);

  // ===== 結果 =====
  let resultText = option.result;

  // 數值變化
  if (option.hp) player.hp += option.hp;
  if (option.mp) player.mp += option.mp;
  if (option.str) player.str += option.str;
  if (option.agi) player.agi += option.agi;
  if (option.int) player.int += option.int;
  if (option.luk) player.luk += option.luk;

  // 詛咒（持續效果扣最大 HP）
  if (option.curse) {
    player.hp = Math.max(1, player.hp - option.curse);
    resultText += `\n\n**詛咒纏上你，最大生命被侵蝕 ${option.curse} 點。**`;
  }

  // 死亡檢查
  if (player.hp <= 0) {
    return handlePlayerDeath(interaction, player);
  }

  const embed = new EmbedBuilder()
    .setTitle(`⚠ 事件結果`)
    .setDescription(resultText)
    .setColor("#4c1d95");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_act_forward").setLabel("繼續前進").setStyle(ButtonStyle.Primary)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 移動到下一層 =====
export async function goToNextFloor(interaction, player) {

  player.currentFloor++;

  // 20F 通關
  if (player.currentFloor > 20) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("🌑《黑暗迷霧森林》終章")
          .setDescription(
            "你從黑霧中走出……卻不再是你自己。\n" +
            "森林讓你活著走出去，它一定有什麼打算。"
          )
          .setColor("#1e1b4b")
      ],
      components: []
    });
  }

  // 其他樓層
  return enterFloor(interaction, player);
}



// ===== 死亡懲罰（依難度） =====
async function handlePlayerDeath(interaction, player) {

  let penaltyText = "";

  switch (player.difficulty) {

    case "Easy":
      // 回上一層
      player.currentFloor = Math.max(1, player.currentFloor - 1);
      player.hp = Math.floor(player.hp * 0.5);
      penaltyText = "黑霧饒過你一次……但帶走了部分生命。";
      break;

    case "Normal":
      // 重玩本層
      player.hp = Math.floor(player.hp * 0.5);
      penaltyText = "你再次醒來……這層迷宮似乎嘲笑著你的脆弱。";
      break;

    case "Hard":
      // 屬性下降
      player.hp = Math.floor(player.hp * 0.4);
      player.str = Math.max(1, player.str - 2);
      player.int = Math.max(1, player.int - 2);
      penaltyText = "死亡的代價……侵蝕你的力量。";
      break;

    case "Lunatic":
      // 回到 1F
      player.currentFloor = 1;
      player.hp = 50;
      penaltyText = "你被撕碎、再組合……你回到了最初。";
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle("💀 你死了")
    .setDescription(
      `${penaltyText}\n\n` +
      `**你的靈魂再次甦醒……**\n` +
      `你現在位於：${player.currentFloor}F`
    )
    .setColor("#450a0a");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dungeon_enter")
      .setLabel("再次進入迷霧")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}
