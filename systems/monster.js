import monsters from "../data/monsters.json" with { type: "json" };

export function generateMonster(floorData) {

const monster = generateMonster(floorData);

// ★★ 最重要：一定要寫回 Map，否則戰鬥無法持續 ★★
player.currentMonster = monster;
players.set(player.id ?? interaction.user.id, player);

  if (!list || list.length === 0) {
    console.error("❌ [Monster] 找不到怪物資料 group =", group);
    return null;
  }

  const base = JSON.parse(JSON.stringify(
    list[Math.floor(Math.random() * list.length)]
  ));

  // 樓層等級
  const level = floorData.level || 1;

  // 等級 scaling
  base.hp = Math.floor(base.hp * (1 + level * 0.1));
  base.atk = Math.floor(base.atk * (1 + level * 0.1));

  // 必要屬性
  base.maxHp = base.hp;
  base.maxMp = 0;
  base.level = level;

  return base;
}
