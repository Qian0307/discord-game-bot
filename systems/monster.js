import monsters from "../data/monsters.json" with { type: "json" };

/**
 * 產生怪物物件
 * @param {object} floorData - 來自 floors.json 的樓層設定
 */
export function generateMonster(floorData) {

  // 1️⃣ 取得樓層指定怪物群組
  const group = floorData.monsterGroup || "forest";

  // 2️⃣ 取得怪物清單
  const list = monsters[group];
  if (!list || list.length === 0) {
    console.error("❌ [Monster] 找不到怪物資料 group =", group);
    return null;
  }

  // 3️⃣ 隨機挑怪
  const monster = JSON.parse(
    JSON.stringify(list[Math.floor(Math.random() * list.length)])
  );

  // 4️⃣ 自動 scaling（依樓層難度）
  const lv = floorData.level || 1;
  monster.hp = Math.floor(monster.hp * (1 + lv * 0.1));
  monster.atk = Math.floor(monster.atk * (1 + lv * 0.1));

  // 5️⃣ 必要屬性補齊（避免 battle.js 崩潰）
  monster.maxHp = monster.hp;
  monster.maxMp = 0;
  monster.level = lv;

  return monster;
}
