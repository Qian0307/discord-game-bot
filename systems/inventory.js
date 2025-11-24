import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import items from "../data/items.json" assert { type: "json" };

// ===== 顯示背包 =====
export async function handleInventoryAction(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.reply({ content: "靈魂未被詛咒……請輸入 `/start`。", ephemeral: true });
  }

  // 開啟背包
  if (id === "inv_open" || id === "dungeon_act_use") {
    return openInventory(interaction, player);
  }

  // 使用道具
  if (id.startsWith("inv_use_")) {
    const itemId = id.replace("inv_use_", "");
    return useItem(interaction, player, itemId);
  }
}



// ===== 打開背包介面 =====
async function openInventory(interaction, player) {

  if (!player.inventory || player.inventory.length === 0) {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎒 背包是空的")
          .setDescription("黑霧輕聲嘲笑你……「什麼都沒有。」")
          .setColor("#1e1b4b")
      ],
      components: []
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🎒 背包")
    .setDescription("黑暗中，你摸索著你的物品……")
    .setColor("#312e81");

  const row = new ActionRowBuilder();

  player.inventory.forEach((itemId) => {
    const item = items[itemId];
    if (!item) return;

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`inv_use_${itemId}`)
        .setLabel(`${item.icon} ${item.name}`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return interaction.update({ embeds: [embed], components: [row] });
}



// ===== 使用道具 =====
async function useItem(interaction, player, itemId) {

  const item = items[itemId];

  if (!item) {
    return interaction.reply({ content: "道具不存在。", ephemeral: true });
  }

  let result = `你使用了 **${item.name}**。\n`;

  // ===== 回復系統 =====
  if (item.hp) {
    player.hp += item.hp;
    result += `你的 HP 回復了 **${item.hp}** 點。\n`;
  }

  if (item.mp) {
    player.mp += item.mp;
    result += `你的 MP 回復了 **${item.mp}** 點。\n`;
  }

  // ===== 屬性變化 =====
  if (item.str) {
    player.str += item.str;
    result += `力量增加 **${item.str}**。\n`;
  }

  if (item.agi) {
    player.agi += item.agi;
    result += `敏捷增加 **${item.agi}**。\n`;
  }

  if (item.int) {
    player.int += item.int;
    result += `智慧增加 **${item.int}**。\n`;
  }

  if (item.luk) {
    player.luk += item.luk;
    result += `幸運增加 **${item.luk}**。\n`;
  }

  // ===== 解詛咒 =====
  if (item.removeCurse) {
    result += "**某些詛咒從你體內脫落……**\n";
    player.hp += 15;
    player.mp += 5;
  }

  // ===== 裝備系統 (武器 / 防具 / 飾品) =====
  if (item.equip) {
    const eq = item.equip;

    result += `\n你裝備了 **${item.name}**。\n`;

    if (eq.hp) player.hp += eq.hp;
    if (eq.mp) player.mp += eq.mp;
    if (eq.str) player.str += eq.str;
    if (eq.agi) player.agi += eq.agi;
    if (eq.int) player.int += eq.int;
    if (eq.luk) player.luk += eq.luk;
  }

  // ===== 使用後移除道具 =====
  const index = player.inventory.indexOf(itemId);
  if (index !== -1) {
    player.inventory.splice(index, 1);
  }

  const embed = new EmbedBuilder()
    .setTitle("🎒 使用道具")
    .setDescription(result)
    .setColor("#0f172a");

  return interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("dungeon_act_forward")
          .setLabel("繼續前進")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}
