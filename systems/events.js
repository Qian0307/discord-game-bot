import { handleEventResult } from "./dungeon.js";

/**
 * 事件按鈕路由器
 * 負責所有：
 * 
 *    dungeon_event_xxx
 * 
 * 並把事件交給 dungeon.js 的 handleEventResult() 處理
 */

export async function routeEvent(interaction, players, id) {

  await interaction.deferUpdate(); // ★ 超級重要：所有事件先 defer，不會 timeout

  const userId = interaction.user.id;
  const player = players.get(userId);

  // 玩家不存在（尚未 /start）
  if (!player) {
    return interaction.editReply({
      content: "你的靈魂尚未與森林連結……請先輸入 `/start`。",
      embeds: [],
      components: []
    });
  }

  // 將事件丟給 dungeon.js 的事件處理器
  return handleEventResult(interaction, players, id);
}
