import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import items from "../data/items.json" with { type: "json" };

// ===== 顯示背包 =====
export async function handleInventoryAction(interaction, players, id) {

  await interaction.deferUpdate(); // ★ 防止 3 秒 timeout

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.editReply({
      content: "靈魂尚未成形……請先輸入 `/start`。",
      embeds: [],
      components: []
    });
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



// ===== 打開背包界面 =====
async function openInventory(interaction, player) {

  if (!player.inventory || player.inventory.length === 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎒 背包空無一物")
          .setDescription("黑霧低語：**「什麼都沒有。」**")
          .setColor("#1e1b4b")
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("dungeon_act_forward")
            .setLabel("返回迷霧")
            .setStyle(ButtonStyle.Secondary)
        )
      ]
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🎒 背包")
    .setDescription("黑霧之中，你摸索著你的物品……")
    .setColor("#312e81");

  const row = new ActionRowBuilder();

  // 為每個物品建立按鈕
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

  return interaction.editReply({ embeds: [embed], components: [row] });
}



// ===== 使用道具 =====
async function useItem(interaction, player, itemId) {

  const item = items[itemId];

  if (!item) {
    return interaction.editReply({
      content: "此道具不存在。",
      embeds: [],
      components: []
    });
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
    result += `力量提升 **${item.str}**。\n`;
  }

  if (item.agi) {
    player.agi += item.agi;
    result += `敏捷提升 **${item.agi}**。\n`;
  }

  if (item.int) {
    player.int += item.int;
    result += `智慧提升 **${item.int}**。\n`;
  }

  if (item.luk) {
    player.luk += item.luk;
    result += `幸運提升 **${item.luk}**。\n`;
  }

  // ===== 解詛咒 =====
  if (item.removeCurse) {
    result += "**某些詛咒從你體內脫落……**\n";
    player.hp += 15;
    player.mp += 5;
  }

  // ===== 裝備系統 =====
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

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("dungeon_act_forward")
      .setLabel("繼續前進")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}
