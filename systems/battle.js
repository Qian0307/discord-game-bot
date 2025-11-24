import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { goToNextFloor } from "./dungeon.js";

// =====================================================
//                對外入口
// =====================================================
export async function handleBattleAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player || !player.currentMonster) {
    return interaction.editReply({
      content: "沒有敵人可戰鬥。",
      embeds: [],
      components: []
    });
  }

  const monster = player.currentMonster;

  // 開戰
  if (id === "battle_start_boss" || id.startsWith("battle_start_")) {

    const monster = player.currentMonster;

    if (!monster) {
        return interaction.update({
            content: "沒有敵人可戰鬥。",
            embeds: [],
            components: []
        });
    }

    return showBattleMenu(interaction, player, monster);
}


  // 普攻
  if (id === "battle_attack") {
    return playerAttack(interaction, players, player, monster);
  }

  // 技能
  if (id === "battle_skill") {
    return playerSkill(interaction, players, player, monster);
  }

  // 防禦
  if (id === "battle_defend") {
    return playerDefend(interaction, players, player, monster);
  }

  // 逃跑
  if (id === "battle_run") {
    return playerRun(interaction, players, player, monster);
  }
}



// =====================================================
//                共用：暴擊 / 閃避
// =====================================================
function isCrit(luk) {
  return Math.random() < (0.05 + luk * 0.002);
}

function isDodge(agi) {
  return Math.random() < (0.03 + agi * 0.002);
}



// =====================================================
//                顯示戰鬥選單
// =====================================================
async function showBattleMenu(interaction, player, monster) {

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 戰鬥：${monster.name}`)
    .setDescription(
      `${monster.intro}\n\n` +
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

  return interaction.editReply({ embeds: [embed], components: [row] });
}



// =====================================================
//                普攻
// =====================================================
async function playerAttack(interaction, players, player, monster) {

  let damage = Math.floor(player.str * (0.8 + Math.random() * 0.6));
  let crit = false;

  if (isCrit(player.luk)) {
    damage = Math.floor(damage * 1.8);
    crit = true;
  }

  monster.hp -= damage;

  let resultText = crit
    ? `你觸發 **暴擊**！造成 **${damage}** 傷害！`
    : `你造成 **${damage}** 傷害。`;

  if (monster.hp <= 0) {
    return battleWin(interaction, players, player, monster);
  }

  return enemyTurn(interaction, players, player, monster, resultText);
}



// =====================================================
//                技能攻擊（INT + MP）
// =====================================================
async function playerSkill(interaction, players, player, monster) {

  const mpCost = 15;

  if (player.mp < mpCost) {
    return interaction.followUp({
      content: "魔力不足，技能無法施展。",
      ephemeral: true
    });
  }

  player.mp -= mpCost;

  let damage = Math.floor(player.int * (1.3 + Math.random() * 0.7));
  monster.hp -= damage;

  let resultText = `你釋放咒術，造成 **${damage}** 魔法傷害。`;

  if (monster.hp <= 0) {
    return battleWin(interaction, players, player, monster);
  }

  return enemyTurn(interaction, players, player, monster, resultText);
}



// =====================================================
//                防禦
// =====================================================
async function playerDefend(interaction, players, player, monster) {
  player.defending = true;

  return enemyTurn(
    interaction,
    players,
    player,
    monster,
    "你提高防禦，黑霧在你周圍聚集……"
  );
}



// =====================================================
//                逃跑
// =====================================================
async function playerRun(interaction, players, player, monster) {

  const chance = 0.25 + player.agi * 0.01;

  if (Math.random() < chance) {
    delete player.currentMonster;

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏃‍♂️ 成功逃脫")
          .setDescription("你從黑霧中跌跌撞撞逃離……")
          .setColor("#1e3a8a")
      ],
      components: []
    });
  }

  return enemyTurn(interaction, players, player, monster, "你試圖逃跑，但黑霧抓住你。");
}



// =====================================================
//                敵人反擊
// =====================================================
async function enemyTurn(interaction, players, player, monster, previousText) {

  let dmg = Math.floor(monster.atk * (0.8 + Math.random() * 0.4));

  if (player.defending) {
    dmg = Math.floor(dmg * 0.4);
    player.defending = false;
  }

  if (isDodge(player.agi)) {
    dmg = 0;
  }

  player.hp -= dmg;

  let fullText =
    previousText +
    (dmg === 0
      ? `\n\n你成功閃避敵人的攻擊！`
      : `\n\n敵人造成 **${dmg}** 傷害！`);

  if (player.hp <= 0) {
    return handlePlayerDeath(interaction, players, player);
  }

  return showBattleMenuAfterHit(interaction, player, monster, fullText);
}



// =====================================================
//      顯示攻擊後的戰鬥選單（不會 timeout）
// =====================================================
async function showBattleMenuAfterHit(interaction, player, monster, text) {

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 與 ${monster.name} 的戰鬥`)
    .setDescription(
      `${text}\n\n**你的 HP：${player.hp}**   MP：${player.mp}\n` +
      `**敵方 HP：${monster.hp}**`
    )
    .setColor("#7f1d1d");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("🗡 普攻").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("🔮 技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_defend").setLabel("🛡 防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("🏃‍♂️ 逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =====================================================
//                戰鬥勝利
// =====================================================
async function battleWin(interaction, players, player, monster) {

  delete player.currentMonster;

  const embed = new EmbedBuilder()
    .setTitle(`💀 擊敗 ${monster.name}`)
    .setDescription(
      `你擊敗了 **${monster.name}**，黑霧為你讓路。\n\n` +
      `你被推向下一層……`
    )
    .setColor("#14532d");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dungeon_next")
      .setLabel("前往下一層")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.editReply({ embeds: [embed], components: [row] });
}



// =====================================================
//                  玩家死亡
// =====================================================
async function handlePlayerDeath(interaction, players, player) {

  players.delete(player.id);

  const embed = new EmbedBuilder()
    .setTitle("💀 你死了")
    .setDescription("黑霧將你吞噬……\n冒險結束。")
    .setColor("#000");

  return interaction.editReply({
    embeds: [embed],
    components: []
  });
}
