// =======================================================================
//                         戰鬥系統 v1.1（最終修正版）
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { addXP } from "./level.js";
import { applyEquipmentBonus } from "./inventory.js";
import { triggerSkill } from "./skills.js";


// =======================================================================
//                       主入口：所有戰鬥交互
// =======================================================================

export async function handleBattleAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);
  const monster = player?.currentMonster;

  if (!monster) {
    return interaction.update({
      content: "⚠ 找不到戰鬥對象。",
      components: []
    });
  }

  const action = id.replace("battle_", "");
  let log = "";

  // ------- 套用裝備加成（一次性） -------
  applyEquipmentBonus(player);


  // ===================================================================
  //                             玩家行動
  // ===================================================================

  if (action === "attack") {
    log = playerAttack(player, monster);
  }

  else if (action === "skill") {
    return triggerSkill(interaction, player, monster); 
  }

  else if (action === "guard") {
    player.isGuard = true;
    log = "你舉起防禦姿態，本回合受到傷害減少 **40%**！";
  }

  else if (action === "run") {
    const result = tryRun(player, monster);
    if (result.success) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏃 逃跑成功")
            .setDescription("你成功逃離戰鬥。")
            .setColor("#6ee7b7")
        ],
        components: []
      });
    } else {
      log = "你試著逃跑……但黑霧把你拉了回來。";
    }
  }


  // ===================================================================
  //                        檢查怪物死亡
  // ===================================================================

  if (monster.hp <= 0) {
    return handleMonsterDeath(interaction, player, monster);
  }


  // ===================================================================
  //                        怪物反擊
  // ===================================================================

  const enemyLog = monsterAttack(player, monster);
  log += `\n${enemyLog}`;

  if (player.hp <= 0) {
    return sendDeath(interaction);
  }


  // ===================================================================
  //                        回傳戰鬥狀態 UI
  // ===================================================================

  return updateBattleUI(interaction, player, monster, log);
}



// =======================================================================
//                         玩家普攻（含暴擊）
// =======================================================================

function playerAttack(player, monster) {

  const critRate = 0.1 + player.luk * 0.01;    // LUK 影響暴擊
  const isCrit = Math.random() < critRate;

  let dmg = Math.floor(player.str + Math.random() * 3);

  if (isCrit) dmg = Math.floor(dmg * 1.7);

  monster.hp -= dmg;

  return isCrit
    ? `你發動猛烈的暴擊！造成 **${dmg} 傷害**！`
    : `你攻擊了 **${monster.name}**，造成 **${dmg} 傷害**。`;
}



// =======================================================================
//                         怪物攻擊（含防禦）
// =======================================================================

function monsterAttack(player, monster) {

  let dmg = Math.floor(monster.atk * (0.8 + Math.random() * 0.4));

  if (player.isGuard) {
    dmg = Math.floor(dmg * 0.6);
    player.isGuard = false;
  }

  dmg = Math.max(1, dmg);
  player.hp -= dmg;

  return `**${monster.name}** 對你造成 **${dmg} 傷害**！`;
}



// =======================================================================
//                     怪物死亡 → 發放獎勵
// =======================================================================

async function handleMonsterDeath(interaction, player, monster) {

  const xpGain = monster.level * 20;
  const coinGain = monster.level * 5;

  const levelUps = addXP(player, xpGain);
  player.coins += coinGain;

  let msg = `✔ 你擊敗了 **${monster.name}**！\n`;
  msg += `獲得：**${xpGain} XP**、**${coinGain} 金幣**。\n`;

  if (levelUps.length > 0) {
    msg += `\n🎉 升級！→ ${levelUps.map(x => `Lv.${x}`).join("、")}`;
    msg += `\n獲得 **1 技能點**！`;
  }

  player.currentMonster = null;

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚔ 勝利")
        .setDescription(msg)
        .setColor("#4ade80")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("dungeon_next")
          .setLabel("前往下一層")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}



// =======================================================================
//                            玩家死亡
// =======================================================================

async function sendDeath(interaction) {

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("💀 你死了")
        .setDescription("黑霧將你完全吞噬。冒險於此終結。")
        .setColor("#000000")
    ],
    components: []
  });
}



// =======================================================================
//                         更新戰鬥畫面 UI
// =======================================================================

async function updateBattleUI(interaction, player, monster, log) {

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 與 ${monster.name} 的戰鬥`)
    .setDescription(
      `${monster.intro}\n\n` +
      `你 HP：**${player.hp}/${player.maxHp}**　MP：**${player.mp}/${player.maxMp}**\n` +
      `敵 HP：**${monster.hp}/${monster.maxHp}**\n\n` +
      log
    )
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("攻擊").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_guard").setLabel("防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}
