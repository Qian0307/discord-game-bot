
import { handleEventResult } from "./dungeon.js";

/**
 * 事件按鈕路由器
 * 負責接住所有：
 * 
 * dungeon_event_xxx
 * 
 * 並把事件 ID 交給 dungeon.js 做真正的事件處理
 */

export async function routeEvent(interaction, players, id) {
  const userId = interaction.user.id;
  const player = players.get(userId);

  if (!player) {
    return interaction.reply({
      content: "你的靈魂尚未醒來……請先輸入 `/start`。",
      ephemeral: true
    });
  }

  // 呼叫 dungeon.js 的事件處理
  return handleEventResult(interaction, players, id);
}
