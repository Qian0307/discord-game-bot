// systems/level.js

export function addXP(player, amount) {
  player.xp += amount;

  let nextLevelXP = 100 * player.level; // 升級需求

  const levelUps = []; // 用來記錄一次升幾級

  while (player.xp >= nextLevelXP) {
    player.xp -= nextLevelXP;
    player.level++;

    // 升級獎勵
    player.str += 1;
    player.maxHp += 10;
    player.hp = player.maxHp; // 回滿血
    player.skillPoints += 1;

    levelUps.push(player.level);
    nextLevelXP = 100 * player.level;
  }

  return levelUps; // ex: [2] 或 [2,3]
}
