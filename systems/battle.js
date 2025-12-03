import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { addXP } from "./level.js";   // ⚠ 記得你要有這個檔案

export async function handleBattleAction(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player || !player.currentMonster) {
    return interaction.editReply({
      content: "⚠ 無有效戰鬥對象。",
      components: []
    });
  }

  const monster = player.currentMonster;

  let action = id.replace("battle_", "");
  let battleLog = "";

  // =========================
  //       玩家行動
  // =========================

  // 普攻
  if (action === "attack") {
    const dmg = Math.max(1, player.str + Math.floor(Math.random() * 4));
    monster.hp -= dmg;
    battleLog = `你對 **${monster.name}** 造成 **${dmg} 點傷害**！`;
  }

  // 技能
  else if (action === "skill") {
    if (player.mp < 10) {
      battleLog = "你的 MP 不足，無法施放技能。";
    } else {
      const dmg = player.int * 2 + Math.floor(Math.random() * 6);
      monster.hp -= dmg;
      player.mp -= 10;
      battleLog = `你施放咒術，對 **${monster.name}** 造成 **${dmg} 點傷害**！`;
    }
  }

  // 防禦
  else if (action === "guard") {
    player.isGuard = true;
    battleLog = "你提高防禦，本回合受到的傷害減少 40%。";
  }

  // 逃跑
  else if (action === "run") {
    if (Math.random() < 0.5) {
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
      battleLog = "逃跑失敗！";
    }
  }

  // =========================
  //   怪物死亡 → 結算獎勵
  // =========================

  if (monster.hp <= 0) {
    const xpGain = monster.level * 20;
    const coinGain = monster.level * 5;

    const levelUps = addXP(player, xpGain);
    player.coins += coinGain;

    let msg = `你擊敗了 **${monster.name}**！\n`;
    msg += `獲得 **${xpGain} XP**、**${coinGain} 金幣**。\n`;

    if (levelUps.length > 0) {
      msg += `\n🎉 **升級了！** → ${levelUps.map(l => `Lv.${l}`).join(", ")}`;
      msg += `\n+1 STR、+10 HP、+1 Skill Point`;
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

  // =========================
  //       怪物反擊
  // =========================

  let enemyDmg = Math.floor(monster.atk * 0.8);

  if (player.isGuard) {
    enemyDmg = Math.floor(enemyDmg * 0.6);
    player.isGuard = false;
  }

  enemyDmg = Math.max(1, enemyDmg);
  player.hp -= enemyDmg;

  battleLog += `\n**${monster.name}** 對你造成 **${enemyDmg} 點傷害**！`;

  // =========================
  //       玩家死亡？
  // =========================

  if (player.hp <= 0) {
    player.hp = 0;

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

  // =========================
  //       回合結束 UI
  // =========================

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`⚔ 與 ${monster.name} 的戰鬥`)
        .setDescription(
          `${monster.intro}\n\n` +
          `你方 HP：**${player.hp}**　MP：**${player.mp}**\n` +
          `敵方 HP：**${monster.hp}**\n\n` +
          battleLog
        )
        .setColor("#b91c1c")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("battle_attack")
          .setLabel("普攻")
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
      )
    ]
  });
}
