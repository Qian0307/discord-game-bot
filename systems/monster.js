// systems/monster.js

// 怪物模板（會依照樓層自動 scaling）
const monsterBase = [
  {
    name: "迷失影子",
    intro: "牠看起來不像你……但眼睛是空的。",
    hp: 40,
    atk: 6,
  },
  {
    name: "腐敗樹靈",
    intro: "腐爛的樹皮蠕動著，似乎正盯著你。",
    hp: 55,
    atk: 8,
  },
  {
    name: "深林怨魂",
    intro: "怨念凝成的霧氣在你周圍盤旋……",
    hp: 70,
    atk: 10,
  }
];


// ======= 怪物生成器 Monster Factory =======
export function generateMonster(floor = 1) {
  // 從模板中隨機挑一隻怪
  const base = monsterBase[Math.floor(Math.random() * monsterBase.length)];

  const level = floor; // ★ 怪物等級 = 樓層
  const hp = Math.floor(base.hp + floor * 12); // ★ HP 依樓層成長
  const atk = Math.floor(base.atk + floor * 1.8); // ★ 攻擊提升

  return {
    name: `${base.name}（Lv.${level}）`, // 顯示等級
    level,
    intro: base.intro,
    maxHp: hp,
    hp: hp,
    atk: atk
  };
}
