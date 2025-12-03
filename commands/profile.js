
// commands/profile.js
import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("查看角色狀態");

export async function execute(interaction, players) {
  const id = interaction.user.id;
  const player = players.get(id);

  if (!player) return interaction.reply("你還沒有角色。");

  const embed = {
    title: `${interaction.user.username} 的角色資訊`,
    color: 0x836FFF,
    fields: [
      { name: "Level", value: `Lv.${player.level}`, inline: true },
      { name: "XP", value: `${player.xp} / ${player.level * 100}`, inline: true },
      { name: "STR", value: `${player.str}`, inline: true },
      { name: "HP", value: `${player.hp} / ${player.maxHp}`, inline: true },
      { name: "MP", value: `${player.mp}`, inline: true },
      { name: "技能點", value: `${player.skillPoints}`, inline: true },
      { name: "金幣", value: `${player.coins}`, inline: true }
    ]
  };

  await interaction.reply({ embeds: [embed] });
}
