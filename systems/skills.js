
// =======================================================================
//                     技能樹系統 Skills v1.0
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import skills from "../data/skills.json" with { type: "json" };


// =======================================================================
//                       /skills → 顯示技能樹
// =======================================================================

export async function handleSkillMenu(interaction, players) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  const embed = new EmbedBuilder()
    .setTitle("🌟 技能樹")
    .setColor("#e879f9")
    .setDescription(
      `技能點數：**${player.skillPoints}**\n\n` +
      skills.list
        .map(s => `• **${s.name}**（${s.type}）`)
        .join("\n")
    );

  const row = new ActionRowBuilder();

  skills.list.forEach(skill => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`skill_select_${skill.id}`)
        .setLabel(skill.name)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}



// =======================================================================
//                 玩家點選技能 → 顯示詳細資訊 + 升級
// =======================================================================

export async function handleSkillSelect(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  const skillId = id.replace("skill_select_", "");
  const skill = skills.map[skillId];

  if (!skill) {
    return interaction.editReply("⚠ 找不到技能。");
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔮 ${skill.name}`)
    .setColor("#d946ef")
    .setDescription(
      `類型：${skill.type}\n` +
      `消耗：${skill.cost} MP\n` +
      `效果：${skill.description}\n\n` +
      `需要技能點：1`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`skill_learn_${skill.id}`)
      .setLabel("學習技能")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}



// =======================================================================
//                     施放主動技能（battle.js 會呼叫）
// =======================================================================

export async function triggerSkill(interaction, player, monster) {

  const embed = new EmbedBuilder()
    .setTitle("🪄 選擇技能")
    .setColor("#c084fc")
    .setDescription("選擇要使用的技能：");

  const row = new ActionRowBuilder();

  (player.skills || []).forEach(skillId => {
    const s = skills.map[skillId];
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`skill_cast_${s.id}`)
        .setLabel(s.name)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return interaction.editReply({ embeds: [embed], components: [row] });
}



// =======================================================================
//                玩家施放技能（skill_cast_X）
// =======================================================================

export async function castSkill(player, monster, skillId) {

  const skill = skills.map[skillId];

  if (player.mp < skill.cost) {
    return { text: "你的 MP 不足，無法施放技能。" };
  }

  player.mp -= skill.cost;

  // 這裡根據技能類型決定效果
  switch (skillId) {

    case "fireball":
      const dmg = Math.floor(player.int * 2.5 + Math.random() * 10);
      monster.hp -= dmg;
      return { text: `🔥 你施放 **火球術**！造成 **${dmg} 傷害**！` };

    case "heal":
      const heal = Math.floor(player.int * 1.5 + 20);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      return { text: `💚 你施放 **治癒術**，回復 **${heal} HP**！` };

    case "curse_burst":
      const curse = Math.floor(player.luk * 3 + Math.random() * 20);
      monster.hp -= curse;
      return { text: `🕯 你引爆詛咒能量，造成 **${curse} 傷害**！` };

    default:
      return { text: "技能尚未實作。" };
  }
}
