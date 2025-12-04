// =======================================================================
//                      背包系統 Inventory v1.0
// =======================================================================

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import items from "../data/items.json" with { type: "json" };


// =======================================================================
//                         主入口 /inventory
// =======================================================================

export async function handleInventoryAction(interaction, player, id) {

  // 第一次進來（slash command）
  if (!id) {
    return showInventory(interaction, player);
  }

  // 使用道具
  if (id.startsWith("inv_use_")) {
    const itemId = id.replace("inv_use_", "");
    return useItem(interaction, player, itemId);
  }

  // 裝備物品
  if (id.startsWith("inv_equip_")) {
    const itemId = id.replace("inv_equip_", "");
    return equipItem(interaction, player, itemId);
  }
}



// =======================================================================
//                         顯示背包 UI
// =======================================================================

async function showInventory(interaction, player) {

  if (!player.inventory || player.inventory.length === 0) {
    return interaction.reply({
      content: "你的背包是空的。",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🎒 背包")
    .setColor("#0ea5e9")
    .setDescription(
      player.inventory
        .map(i => `• **${i.name}**（${i.type}）`)
        .join("\n")
    );

  const row = new ActionRowBuilder();

  player.inventory.forEach(item => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          item.type === "potion"
            ? `inv_use_${item.id}`
            : `inv_equip_${item.id}`
        )
        .setLabel(`${item.name}`)
        .setStyle(
          item.type === "potion"
            ? ButtonStyle.Success
            : ButtonStyle.Primary
        )
    );
  });

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}



// =======================================================================
//                          使用道具（藥水）
// =======================================================================

async function useItem(interaction, player, itemId) {

  const item = items[itemId];
  if (!item) {
    return interaction.editReply(`⚠ 找不到道具：${itemId}`);
  }

  if (item.type !== "potion") {
    return interaction.editReply("這個道具不能使用。");
  }

  let text = "";

  if (item.restoreHp) {
    const heal = Math.min(item.restoreHp, player.maxHp - player.hp);
    player.hp += heal;
    text += `❤️ 回復 **${heal} HP**！\n`;
  }

  if (item.restoreMp) {
    const heal = Math.min(item.restoreMp, player.maxMp - player.mp);
    player.mp += heal;
    text += `🔵 回復 **${heal} MP**！\n`;
  }

  // 用完後移除
  player.inventory = player.inventory.filter(i => i.id !== itemId);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🧪 使用：${item.name}`)
        .setDescription(text)
        .setColor("#22c55e")
    ],
    components: []
  });
}



// =======================================================================
//                          裝備系統（武器 防具 飾品）
// =======================================================================

async function equipItem(interaction, player, itemId) {

  const item = items[itemId];
  if (!item || item.type === "potion") {
    return interaction.editReply("這個物品不能裝備。");
  }

  const slot = item.slot;

  // 卸下舊裝備
  const previous = player.equipment[slot];
  if (previous) {
    player.inventory.push(previous);
  }

  // 裝備新物品
  player.equipment[slot] = item;

  // 從背包移除
  player.inventory = player.inventory.filter(i => i.id !== itemId);

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛡 裝備成功")
        .setDescription(
          `你裝備了 **${item.name}**！\n\n` +
          (previous ? `卸下：${previous.name}` : "")
        )
        .setColor("#8b5cf6")
    ],
    components: []
  });
}



// =======================================================================
//                      套用裝備加成（由 battle.js 呼叫）
// =======================================================================

export function applyEquipmentBonus(player) {

  const eq = player.equipment;

  Object.values(eq).forEach(item => {
    if (!item) return;

    if (item.bonusHp) player.hp += item.bonusHp;
    if (item.bonusMp) player.mp += item.bonusMp;
    if (item.bonusStr) player.str += item.bonusStr;
    if (item.bonusAgi) player.agi += item.bonusAgi;
    if (item.bonusInt) player.int += item.bonusInt;
    if (item.bonusLuk) player.luk += item.bonusLuk;
  });
}
