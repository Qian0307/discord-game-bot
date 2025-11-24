client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players);
    }
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const player = players.get(interaction.user.id);

  // ★★★ 不要對 start_* 按鈕做 deferUpdate()
  if (
    !id.startsWith("start_") &&
    !interaction.deferred &&
    !interaction.replied
  ) {
    try { await interaction.deferUpdate(); } catch (e) {}
  }

  // 1️⃣ 事件
  if (id.startsWith("dungeon_event_")) {
    return routeEvent(interaction, players, id);
  }

  // 2️⃣ 下一層
  if (id === "dungeon_next") {
    return goToNextFloor(interaction, player);
  }

  // 3️⃣ Start 系統
  if (id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // 4️⃣ 戰鬥
  if (id.startsWith("battle_")) {
    return handleBattleAction(interaction, players, id);
  }

  // 5️⃣ 背包
  if (id.startsWith("inv_")) {
    return handleInventoryAction(interaction, players, id);
  }

  // 6️⃣ 迷宮
  if (id.startsWith("dungeon_")) {
    return handleDungeonAction(interaction, players, id);
  }

});
