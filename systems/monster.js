import monsters from "../data/monsters.json" with { type: "json" };

export function generateMonster(floorData) {
  // 1️⃣ 從樓層資料取得 monsterGroup
  const group = floorData.monsterGroup || "forest";

  // 2️⃣ 拿到 monsters.json 對應的怪物清單
  const list = monsters[group];

  if (!list || list.length === 0) {
    console.error("❌ [Monster] 找不到怪物資料 group =", group);
    return null;
  }

  // 3️⃣ 隨機選怪
  const monster = { ...list[Math.floor(Math.random() * list.length)] };

  // 4️⃣ 自動 scaling（依樓層數加成）
  monster.hp = Math.floor(monster.hp * (1 + floorData.level * 0.1));
  monster.atk = Math.floor(monster.atk * (1 + floorData.level * 0.1));
  export function generateMonster(floor) {
  const pool = monsters.forest; // or pick by floor
  const monster = JSON.parse(JSON.stringify(
    pool[Math.floor(Math.random() * pool.length)]
  ));

  // ★★★ 修補必須屬性 ★★★
  monster.maxHp = monster.hp;
  monster.maxMp = 0;
  monster.level = floor;

  return monster;
}


  return monster;
}
