import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { initializeStats } from "./stats.js";
import floors from "../data/floors.json" with { type: "json" };

const text = {
  intro: `**「……醒來吧。」**

黑霧像蛇一樣纏上你的腳踝。
低語聲在你的骨縫間震盪。

**「選擇……你的形體。」**
五道扭曲的影子在你面前凝結——每一道，都象徵不同的詛咒。`,

  difficulty: `黑霧再次靠近你的耳朵——  
**「那麼……你想承受多少痛苦呢？」**`
};


// =======================================================
//                      Start 主功能
// =======================================================

export async function startGame(interaction, players, id = null) {

  // -----------------------
  // 第一次 /start → 選職業
  // -----------------------
  if (!id) {

    const embed = new EmbedBuilder()
      .setTitle("🌑 《黑暗迷霧森林》")
      .setDescription(text.intro)
      .setColor("#3b0764");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("start_class_A").setLabel("詛咒祭司").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("start_class_B").setLabel("失落旅人").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("start_class_C").setLabel("被詛咒的孩子").setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("start_class_D").setLabel("墮落魔法使").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("start_class_E").setLabel("暗月刺客").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row, row2]
    });
  }

  // -----------------------
  // ★ 選職業
  // -----------------------
  if (id.startsWith("start_class_")) {

    const classMap = {
      "start_class_A": "詛咒祭司",
      "start_class_B": "失落旅人",
      "start_class_C": "被詛咒的孩子",
      "start_class_D": "墮落魔法使",
      "start_class_E": "暗月刺客",
    };

    const chosenClass = classMap[id];

    players.set(interaction.user.id, {
      class: chosenClass,
      pending: true
    });

    const embed = new EmbedBuilder()
      .setTitle("⚠ 選擇你的痛苦")
      .setDescription(text.difficulty)
      .setColor("#581c87");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("start_diff_Easy").setLabel("輕微的痛苦").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("start_diff_Normal").setLabel("正常的折磨").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("start_diff_Hard").setLabel("深層腐蝕").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("start_diff_Lunatic").setLabel("……你真的要這樣？").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

  // -----------------------
  // ★ 選難度
  // -----------------------
  if (id.startsWith("start_diff_")) {

    const userId = interaction.user.id;
    const temp = players.get(userId);

    const diff = id.replace("start_diff_", "");
    const stats = initializeStats(temp.class);

    stats.maxHp = stats.hp;
    stats.maxMp = stats.mp;

    players.set(userId, {
      id: userId,
      class: temp.class,
      difficulty: diff,
      ...stats,
      inventory: [],
      currentFloor: 1
    });

    const embed = new EmbedBuilder()
      .setTitle("🌫 詛咒開始蔓延")
      .setDescription(
        `你的形體已被決定： **${temp.class}**  
你選擇了承受： **${diff}**  

你墜入 **第 1 層：${floors["1"].name}**`
      )
      .setColor("#4c1d95");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("dungeon_enter").setLabel("進入迷霧").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [embed],
      components: [row]
    });
  }

} // ← ★★★ 這裡才是 startGame 正確結束的大括號
