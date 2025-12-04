import monsters from "../data/monsters.json" with { type: "json" };

// 安全取得怪物資料（保證不會 undefined）
function getMonsterList(floor) {
  const key = floor.toString();

  if (!monsters[key] || monsters[key].length === 0) {
    // 如果該層沒有怪物 → 強制使用第 1 層怪物
    return monsters["1"];
  }

  return monsters[key];
}

export function generateMonster(floor) {
  const monsterList = getMonsterList(floor);

  // 隨機挑選怪物
  const data = monsterList[Math.floor(Math.random() * monsterList.length)];

  return {
    name: data.name,
    intro: data.intro,
    hp: data.hp,
    atk: data.atk
  };
}
