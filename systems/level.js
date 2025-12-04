// =======================================================================
//                           等級系統 Level v1.0
// =======================================================================

// 等級需求表（可自行調整）
const xpTable = [
  0,      // Lv0
  100,    // Lv1 → Lv2
  250,    // Lv2 → Lv3
  450,    // Lv3 → Lv4
  700,    // Lv4 → Lv5
  1000,   // Lv5 → Lv6
  1400,   // …
  1900,
  2500,
  3200,
];

export function addXP(player, amount) {

  player.xp += amount;

  const levelUps = [];

  while (player.level + 1 < xpTable.length &&
         player.xp >= xpTable[player.level + 1]) {

    player.level++;

    // 每升一級：
    player.maxHp += 10;
    player.hp = player.maxHp;
    player.str += 1;
    player.int += 1;

    // 技能點數
    player.skillPoints = (player.skillPoints || 0) + 1;

    levelUps.push(player.level);
  }

  return levelUps;
}


// =======================================================================
//                  建立玩家初始屬性（start.js 會用到）
// =======================================================================

export function createPlayer(userId, jobClass) {

  // 不同職業可不同初始值（可擴充）
  const classes = {
    "咒術師": { str: 4, agi: 5, int: 9, luk: 4, hp: 60 },
    "影行者": { str: 6, agi: 9, int: 4, luk: 6, hp: 60 },
    "被詛咒的孩子": { str: 5, agi: 5, int: 5, luk: 10, hp: 50 }
  };

  const c = classes[jobClass] || classes["咒術師"];

  return {
    id: userId,
    class: jobClass,
    level: 1,
    xp: 0,
    skillPoints: 0,

    // 戰鬥屬性
    str: c.str,
    agi: c.agi,
    int: c.int,
    luk: c.luk,

    maxHp: c.hp,
    hp: c.hp,

    maxMp: 30,
    mp: 30,

    coins: 0,

    // 冒險進度
    currentFloor: 1,
    currentMonster: null,

    // 背包 & 裝備
    inventory: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    }
  };
}
