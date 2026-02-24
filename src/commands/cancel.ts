import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { cancelBet } from "../lib/db";
import { shortId } from "../lib/format";
import { findBetByPrefix } from "./helpers";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("cancel")
    .setDescription("Cancel your own open bet")
    .addStringOption((opt) =>
      opt
        .setName("bet_id")
        .setDescription("The bet ID to cancel")
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
  const betIdInput = interaction.options.getString("bet_id", true).trim();
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const existing = await findBetByPrefix(betIdInput, guildId);
  if (!existing) {
    await interaction.reply({
      content: `No bet found matching \`${betIdInput}\`.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (existing.creator_id !== interaction.user.id) {
    await interaction.reply({
      content: "Only the creator can cancel a bet.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (existing.status !== "open") {
    await interaction.reply({
      content: `That bet is **${existing.status}** and can't be cancelled.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await cancelBet(existing.id, interaction.user.id);
    await interaction.reply({
      content: `Bet \`${shortId(existing.id)}\` has been cancelled.`,
    });
  } catch (err) {
    console.error("Error cancelling bet:", err);
    await interaction.reply({
      content: "Failed to cancel bet. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
