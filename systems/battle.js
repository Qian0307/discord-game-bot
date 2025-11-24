import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { goToNextFloor } from "./dungeon.js";


// ===== 實際對外匯出 =====
export async function handleBattleAction(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  const monster = player.currentMonster;
  if (!monster) {
    return interaction.reply({ content: "沒有敵人可戰鬥。", ephemeral: true });
  }

  // ===== 開始戰鬥 =====
  if (id.startsWith("battle_start_")) {
    return showBattleMenu(interaction, player, monster);
  }

  // ===== 普攻 =====
  if (id === "battle_attack") {
    return playerAttack(interaction, players, player, monster);
  }

  // ===== 技能 =====
  if (id === "battle_skill") {
    return playerSkill(interaction, players, player, monster);
  }

  // ===== 防禦 =====
  if (id === "battle_defend") {
    return playerDefend(interaction, players, player, monster);
  }

  // ===== 逃跑 =====
  if (id === "battle_run") {
    return playerRun(interaction, players, player, monster);
  }
}



// ===== 戰鬥選單 =====
async function showBattleMenu(interaction, player, monster) {
  const embed = new EmbedBuilder()
    .setTitle(`⚔ 戰鬥開始：${monster.name}`)
    .setDescription(
      `${monster.intro}\n\n` +
      `**你的 HP：${player.hp}**\n` +
      `**敵方 HP：${monster.hp}**`
    )
    .setColor("#7f1d1d");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("🗡 普攻").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("🔮 技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_defend").setLabel("🛡 防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("🏃‍♂️ 逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 計算暴擊 =====
function isCrit(luk) {
  return Math.random() < (0.05 + luk * 0.002);
}

// ===== 計算閃避 =====
function isDodge(agi) {
  return Math.random() < (0.03 + agi * 0.002);
}



// ===== 普攻 =====
async function playerAttack(interaction, players, player, monster) {

  let damage = Math.floor(player.str * (0.8 + Math.random() * 0.6));

  let crit = false;
  if (isCrit(player.luk)) {
    damage = Math.floor(damage * 1.8);
    crit = true;
  }

  monster.hp -= damage;

  let result = crit
    ? `你發動了 **暴擊**！造成 **${damage}** 傷害！`
    : `你造成 **${damage}** 傷害。`;

  // 敵人死亡
  if (monster.hp <= 0) {
    return battleWin(interaction, players, player, monster);
  }

  return enemyTurn(interaction, players, player, monster, result);
}



// ===== 技能攻擊（INT + MP）=====
async function playerSkill(interaction, players, player, monster) {

  const mpCost = 15;

  if (player.mp < mpCost) {
    return interaction.reply({
      content: "你的魔力不足……黑霧嘲笑著你的無力。",
      ephemeral: true
    });
  }

  player.mp -= mpCost;

  let damage = Math.floor(player.int * (1.3 + Math.random() * 0.7));
  monster.hp -= damage;

  let result = `你釋放禁咒，造成 **${damage}** 魔法傷害。`;

  if (monster.hp <= 0) {
    return battleWin(interaction, players, player, monster);
  }

  return enemyTurn(interaction, players, player, monster, result);
}



// ===== 防禦 =====
async function playerDefend(interaction, players, player, monster) {
  player.defending = true;

  return enemyTurn(interaction, players, player, monster, "你架起防禦姿態，黑霧在你周圍纏繞……");
}



// ===== 逃跑 =====
async function playerRun(interaction, players, player, monster) {

  const chance = 0.25 + player.agi * 0.01;

  if (Math.random() < chance) {
    delete player.currentMonster;
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏃‍♂️ 你逃脫了")
          .setDescription("你從黑霧中跌跌撞撞跑出來……")
          .setColor("#1e3a8a")
      ],
      components: []
    });
  }

  return enemyTurn(interaction, players, player, monster, "你試圖逃跑……但黑霧抓住了你。");
}



// ===== 敵人反擊 =====
async function enemyTurn(interaction, players, player, monster, previousActionText) {

  let enemyDamage = Math.floor(monster.atk * (0.8 + Math.random() * 0.4));

  if (player.defending) {
    enemyDamage = Math.floor(enemyDamage * 0.4);
    player.defending = false;
  }

  if (isDodge(player.agi)) {
    enemyDamage = 0;
  }

  player.hp -= enemyDamage;

  let result =
    previousActionText +
    (enemyDamage === 0
      ? `\n\n敵人的攻擊被你閃過！`
      : `\n\n敵人造成 **${enemyDamage}** 傷害！`);

  // 玩家死亡
  if (player.hp <= 0) {
    return handlePlayerDeath(interaction, players, player);
  }

  return showBattleMenuAfterHit(interaction, player, monster, result);
}



// ===== 顯示攻擊後的戰鬥選單 =====
async function showBattleMenuAfterHit(interaction, player, monster, text) {

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 與 ${monster.name} 的戰鬥`)
    .setDescription(
      `${text}\n\n` +
      `**你的 HP：${player.hp}**   MP：${player.mp}\n` +
      `**敵方 HP：${monster.hp}**`
    )
    .setColor("#7f1d1d");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("🗡 普攻").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("🔮 技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_defend").setLabel("🛡 防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("🏃‍♂️ 逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 戰鬥勝利 =====
async function battleWin(interaction, players, player, monster) {
  delete player.currentMonster;

  const embed = new EmbedBuilder()
    .setTitle(`💀 擊敗 ${monster.name}`)
    .setDescription(
      `黑霧被撕開……\n你擊敗了 **${monster.name}**。\n\n` +
      `一道看不見的力量推著你前往下一層……`
    )
    .setColor("#14532d");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("dungeon_next").setLabel("前往下一層").setStyle(ButtonStyle.Primary)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 玩家死亡 =====
function handlePlayerDeath(interaction, players, player) {
  players.delete(interaction.user.id);

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("💀 你倒下了")
        .setDescription("黑霧將你完全吞噬……\n《冒險結束》")
        .setColor("#000000")
    ],
    components: []
  });
}

