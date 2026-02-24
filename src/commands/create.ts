import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { createBet } from "../lib/db";
import { acceptButtonRow, formatBetEmbed } from "../lib/format";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("create")
    .setDescription("Create an open bet")
    .addStringOption((opt) =>
      opt
        .setName("description")
        .setDescription('What the bet is about (e.g. "MkLeo wins Grand Finals")')
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("amount")
        .setDescription("How much you are wagering")
        .setRequired(true)
        .setMinValue(0.01)
    )
    .addStringOption((opt) =>
      opt
        .setName("odds")
        .setDescription("Odds as creator:acceptor (e.g. 1:2, 1:3, 2:1)")
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
  const description = interaction.options.getString("description", true);
  const amount = interaction.options.getNumber("amount", true);
  const oddsStr = interaction.options.getString("odds", true);

  const oddsMatch = oddsStr.match(/^(\d+):(\d+)$/);
  if (!oddsMatch) {
    await interaction.reply({
      content: "Invalid odds format. Use `X:Y` (e.g. `1:2`, `3:1`).",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const oddsCreator = parseInt(oddsMatch[1]);
  const oddsAcceptor = parseInt(oddsMatch[2]);

  if (oddsCreator < 1 || oddsAcceptor < 1) {
    await interaction.reply({
      content: "Odds values must be at least 1.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const bet = await createBet(
      guildId,
      interaction.user.id,
      description,
      amount,
      oddsCreator,
      oddsAcceptor
    );

    const embed = formatBetEmbed(bet);
    const row = acceptButtonRow(bet.id);
    await interaction.reply({
      content: "Bet created! Who wants to take the other side?",
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.error("Error creating bet:", err);
    await interaction.reply({
      content: "Failed to create bet. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
