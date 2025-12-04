// =======================================================================
//                           怪物生成系統 v1.0
// =======================================================================

import monstersData from "../data/monsters.json" with { type: "json" };

// 怪物 scaling：等比成長（你的選擇 A）
// HP = baseHp + floor * 12
// ATK = baseAtk + floor * 2
// level = floor

export function generateMonster(floor = 1) {

  // 從怪物池中挑一隻
  const list = monstersData.normal;
  const base = list[Math.floor(Math.random() * list.length)];

  // 成長倍率（等比）
  const hp = Math.floor(base.hp + floor * 12);
  const atk = Math.floor(base.atk + floor * 2);

  return {
    id: base.id,
    name: `${base.name}（Lv.${floor}）`,
    intro: base.intro,
    level: floor,
    maxHp: hp,
    hp,
    atk,
    tags: base.tags || []
  };
}
