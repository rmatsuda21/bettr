import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { acceptBet, getAcceptorRisk } from "../lib/db";
import { formatBetEmbed } from "../lib/format";
import { findBetByPrefix } from "./helpers";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("accept")
    .setDescription("Accept an open bet")
    .addStringOption((opt) =>
      opt
        .setName("bet_id")
        .setDescription("The bet ID (first 8 characters is enough)")
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
      content: `No open bet found matching \`${betIdInput}\`.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (existing.creator_id === interaction.user.id) {
    await interaction.reply({
      content: "You can't accept your own bet.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (existing.status !== "open") {
    await interaction.reply({
      content: `That bet is already **${existing.status}**.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const bet = await acceptBet(existing.id, interaction.user.id);
    const embed = formatBetEmbed(bet);
    const risk = getAcceptorRisk(bet);
    await interaction.reply({
      content: `<@${interaction.user.id}> accepted the bet! They risk **$${risk.toFixed(0)}** against <@${bet.creator_id}>'s **$${Number(bet.amount).toFixed(0)}**.`,
      embeds: [embed],
    });
  } catch (err) {
    console.error("Error accepting bet:", err);
    await interaction.reply({
      content: "Failed to accept bet. It may have already been taken or cancelled.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
