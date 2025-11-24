import { handleEventResult } from "./dungeon.js";

export async function routeEvent(interaction, players, id) {

  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.reply({
      content: "你的靈魂尚未醒來……請先輸入 `/start`。",
      ephemeral: true
    });
  }

  // ❌ 不要 deferUpdate()（會與 dungeon.js 衝突）
  // 這裡讓 dungeon.js 的更新做最後一次 interaction.update()

  return handleEventResult(interaction, players, id);
}
