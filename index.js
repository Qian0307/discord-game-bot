client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  // ================================
  //       Slash commands
  // ================================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "start") {
      return startGame(interaction, players, null);
    }
    if (interaction.commandName === "skills") {
      return handleSkillMenu(interaction, players);
    }
    if (interaction.commandName === "inventory") {
      return handleInventoryAction(interaction, players);
    }
  }

  // ================================
  //      Start 系列按鈕 (職業 + 難度)
  // ================================
  if (interaction.isButton() && id.startsWith("start_")) {
    return startGame(interaction, players, id);
  }

  // ================================
  //      戰鬥系統
  // ================================
  if (interaction.isButton() && id.startsWith("battle_")) {
    await interaction.deferUpdate();
    return handleBattleAction(interaction, players, id);
  }

  // ================================
  //      事件
  // ================================
  if (id.startsWith("dungeon_event_")) {
    await interaction.deferUpdate();
    return handleEventResult(interaction, players, id);
  }

  // ================================
  //      下一層
  // ================================
  if (id === "dungeon_next") {
    await interaction.deferUpdate();
    const player = players.get(userId);
    return goToNextFloor(interaction, player);
  }

  // ================================
  //      迷宮行動 (前進 / 觀察 / 物品)
  // ================================
  if (id.startsWith("dungeon_")) {
    await interaction.deferUpdate();
    return handleDungeonAction(interaction, players, id);
  }

  // ================================
  //      背包
  // ================================
  if (id.startsWith("inv_")) {
    await interaction.deferUpdate();
    return handleInventoryAction(interaction, players, id);
  }
});
