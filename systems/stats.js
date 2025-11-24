// ====== 角色初始屬性 ======
export function initializeStats(chosenClass) {
  const base = {
    hp: 100,
    mp: 30,
    str: 10,
    agi: 10,
    int: 10,
    luk: 5
  };

  // ====== 職業天賦（黑暗詛咒加成） ======
  switch (chosenClass) {
    case "詛咒祭司":
      return {
        hp: base.hp - 20,
        mp: base.mp + 40,
        str: base.str - 5,
        agi: base.agi,
        int: base.int + 25,
        luk: base.luk + 5
      };

    case "失落旅人":
      return {
        ...base,
        hp: base.hp + 10,
        luk: base.luk + 2
      };

    case "被詛咒的孩子":
      return {
        hp: base.hp - 10,
        mp: base.mp - 5,
        str: base.str,
        agi: base.agi + 5,
        int: base.int + 5,
        luk: base.luk + 25
      };

    case "墮落魔法使":
      return {
        hp: base.hp - 40,
        mp: base.mp + 50,
        str: base.str - 10,
        agi: base.agi,
        int: base.int + 35,
        luk: base.luk
      };

    case "暗月刺客":
      return {
        hp: base.hp - 10,
        mp: base.mp,
        str: base.str,
        agi: base.agi + 30,
        int: base.int - 5,
        luk: base.luk + 10
      };

    default:
      return base;
  }
}


// ====== 升級系統（若你之後想加入等級） ======
export function levelUp(player) {
  // 成長倍率依照職業不同
  const growth = {
    hp: 12,
    mp: 6,
    str: 3,
    agi: 3,
    int: 4,
    luk: 2
  };

  player.hp += growth.hp;
  player.mp += growth.mp;
  player.str += growth.str;
  player.agi += growth.agi;
  player.int += growth.int;
  player.luk += growth.luk;

  return player;
}
