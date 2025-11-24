import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

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

  // ======= 操作種類 =======
  let action = id.replace("battle_", "");

  // ======= 處理行動 =======
  let battleLog = "";

  // ---- 普攻 ----
  if (action === "attack") {
    const dmg = Math.max(1, player.str + Math.floor(Math.random() * 4));
    monster.hp -= dmg;
    battleLog = `你對 **${monster.name}** 造成 **${dmg} 點傷害**！`;
  }

  // ---- 技能 ----
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

  // ---- 防禦 ----
  else if (action === "guard") {
    player.isGuard = true;
    battleLog = "你提高防禦，減少本回合受到的傷害。";
  }

  // ---- 逃跑 ----
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

  // ======= 檢查怪物是否死亡 =======
  if (monster.hp <= 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`✔ 戰勝：${monster.name}`)
          .setDescription("你擊敗了敵人！")
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

  // ======= 怪物反擊 =======
  let enemyDmg = monster.atk + Math.floor(Math.random() * 4);

  if (player.isGuard) {
    enemyDmg = Math.floor(enemyDmg / 2);
    player.isGuard = false;
  }

  player.hp -= enemyDmg;
  battleLog += `\n**${monster.name}** 對你造成 **${enemyDmg} 點傷害**！`;

  // ======= 玩家死亡：展示死亡畫面，不 return null =======
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

  // ======= 正常更新戰鬥 UI =======
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
        new ButtonBuilder().setCustomId("battle_attack").setLabel("普攻").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("battle_skill").setLabel("技能").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("battle_guard").setLabel("防禦").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("battle_run").setLabel("逃跑").setStyle(ButtonStyle.Danger)
      )
    ]
  });
}
