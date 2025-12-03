// systems/monster.js

// 基礎怪物模板（會隨樓層 scaling）
const monsterTemplates = [
  {
    name: "迷失影子",
    intro: "牠看起來不像你……但眼睛是空的。",
    baseHp: 40,
    baseAtk: 6
  },
  {
    name: "腐敗樹靈",
    intro: "腐爛的樹皮微微顫動……似乎正在凝視你。",
    baseHp: 55,
    baseAtk: 8
  },
  {
    name: "深林怨魂",
    intro: "怨念聚成的霧氣慢慢靠近你。",
    baseHp: 70,
    baseAtk: 10
  }
];

// ===== 怪物生成工廠 =====
export function generateMonster(floor = 1) {
  const base = monsterTemplates[Math.floor(Math.random() * monsterTemplates.length)];

  const level = floor;
  const hp = Math.floor(base.baseHp + floor * 12);
  const atk = Math.floor(base.baseAtk + floor * 2);

  return {
    name: `${base.name}（Lv.${level}）`,
    level,
    intro: base.intro,
    hp,
    maxHp: hp,
    atk
  };
}
