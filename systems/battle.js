// =======================================================================
//                          戰鬥系統（重寫最終版）
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { addXP } from "./level.js";


// =======================================================================
//                          主入口
// =======================================================================

export async function handleBattleAction(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);
  const monster = player.currentMonster;

  if (!monster) {
    return interaction.editReply("⚠ 找不到戰鬥對象。");
  }

  const action = id.replace("battle_", "");
  let log = "";

  // -------------------------------------------------------------------
  //                             玩家行動
  // -------------------------------------------------------------------

  if (action === "attack") {
    log = playerAttack(player, monster);
  }

  if (action === "skill") {
    log = playerSkill(player, monster);
  }

  if (action === "guard") {
    player.isGuard = true;
    log = "你舉起防禦姿態，本回合受到傷害減少 **40%**！";
  }

  if (action === "run") {
    const result = tryRun();
    if (result.success) {
      return interaction.editReply({
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


  // -------------------------------------------------------------------
  //                        檢查怪物是否死亡
  // -------------------------------------------------------------------

  if (monster.hp <= 0) {
    return handleMonsterDeath(interaction, player, monster);
  }


  // -------------------------------------------------------------------
  //                            怪物反擊
  // -------------------------------------------------------------------

  const enemyLog = monsterAttack(player, monster);
  log += `\n${enemyLog}`;

  // 玩家死亡？
  if (player.hp <= 0) {
    return sendDeath(interaction);
  }

  // -------------------------------------------------------------------
  //                            更新戰鬥 UI
  // -------------------------------------------------------------------

  return updateBattleUI(interaction, player, monster, log);
}



// =======================================================================
//                            玩家普攻
// =======================================================================

function playerAttack(player, monster) {

  const critChance = 0.1 + player.luk * 0.01; // 暴擊率
  const isCrit = Math.random() < critChance;

  let dmg = Math.floor(player.str + Math.random() * 3);

  if (isCrit) dmg = Math.floor(dmg * 1.7);

  monster.hp -= dmg;

  return isCrit
    ? `你施展猛烈的一擊！造成 **${dmg} 暴擊傷害**！`
    : `你攻擊了 **${monster.name}**，造成 **${dmg} 傷害**。`;
}



// =======================================================================
//                            玩家技能：咒術
// =======================================================================

function playerSkill(player, monster) {

  if (player.mp < 10) {
    return "你的 MP 不足，無法施放技能。";
  }

  player.mp -= 10;

  const dmg = Math.floor(player.int * 2 + Math.random() * 6);

  monster.hp -= dmg;

  return `你施放咒術！黑霧爆裂，對 **${monster.name}** 造成 **${dmg} 傷害**！`;
}



// =======================================================================
//                            嘗試逃跑
// =======================================================================

function tryRun() {
  return {
    success: Math.random() < 0.5
  };
}



// =======================================================================
//                         怪物攻擊邏輯
// =======================================================================

function monsterAttack(player, monster) {

  let dmg = Math.floor(monster.atk * 0.8 + Math.random() * 3);

  if (player.isGuard) {
    dmg = Math.floor(dmg * 0.6);
    player.isGuard = false;
  }

  dmg = Math.max(1, dmg);
  player.hp -= dmg;

  return `**${monster.name}** 反擊！造成你 **${dmg} 傷害**！`;
}



// =======================================================================
//                     怪物死亡 → 發放獎勵與按鈕
// =======================================================================

async function handleMonsterDeath(interaction, player, monster) {

  const xpGain = monster.level * 20;
  const coinGain = monster.level * 5;

  const levelUps = addXP(player, xpGain);
  player.coins += coinGain;

  let msg = `你擊敗了 **${monster.name}**！\n`;
  msg += `獲得 **${xpGain} XP**、**${coinGain} 金幣**。\n`;

  if (levelUps.length > 0) {
    msg += `\n🎉 **升級！** → ${levelUps.map(l => `Lv.${l}`).join(", ")}`;
  }

  player.currentMonster = null;

  return interaction.editReply({
    content: msg,
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
//                         玩家死亡
// =======================================================================

async function sendDeath(interaction) {
  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("💀 你死亡了")
        .setDescription("黑霧將你吞噬……冒險結束。")
        .setColor("#000000")
    ],
    components: []
  });
}



// =======================================================================
//                         更新戰鬥 UI
// =======================================================================

async function updateBattleUI(interaction, player, monster, log) {

  const embed = new EmbedBuilder()
    .setTitle(`⚔ 與 ${monster.name} 的戰鬥`)
    .setDescription(
      `${monster.intro}\n\n` +
      `你方 HP：**${player.hp}**　MP：**${player.mp}**\n` +
      `敵方 HP：**${monster.hp}/${monster.maxHp}**\n\n` +
      log
    )
    .setColor("#b91c1c");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("battle_attack").setLabel("攻擊").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("battle_skill").setLabel("技能").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("battle_guard").setLabel("防禦").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}
