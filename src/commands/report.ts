import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { reportBet, getAcceptorRisk } from "../lib/db";
import { formatBetEmbed, shortId } from "../lib/format";
import { findBetByPrefix } from "./helpers";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("report")
    .setDescription("Report the winner of an active bet")
    .addStringOption((opt) =>
      opt
        .setName("bet_id")
        .setDescription("The bet ID")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("winner")
        .setDescription("Who won: creator or acceptor")
        .setRequired(true)
        .addChoices(
          { name: "Creator", value: "creator" },
          { name: "Acceptor", value: "acceptor" }
        )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
  const betIdInput = interaction.options.getString("bet_id", true).trim();
  const winnerChoice = interaction.options.getString("winner", true);
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

  if (existing.status !== "active") {
    await interaction.reply({
      content: `That bet is **${existing.status}** — only active bets can be reported.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const isParticipant =
    interaction.user.id === existing.creator_id ||
    interaction.user.id === existing.acceptor_id;

  if (!isParticipant) {
    await interaction.reply({
      content: "Only participants in the bet can report the result.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const winnerId =
    winnerChoice === "creator" ? existing.creator_id : existing.acceptor_id!;

  try {
    const bet = await reportBet(existing.id, winnerId, interaction.user.id);
    const embed = formatBetEmbed(bet);
    const loserId =
      winnerId === bet.creator_id ? bet.acceptor_id : bet.creator_id;
    const payout =
      winnerId === bet.creator_id
        ? getAcceptorRisk(bet)
        : bet.amount;

    await interaction.reply({
      content: `Bet \`${shortId(bet.id)}\` settled! <@${winnerId}> wins **$${payout.toFixed(2)}** from <@${loserId}>.`,
      embeds: [embed],
    });
  } catch (err) {
    console.error("Error reporting bet:", err);
    await interaction.reply({
      content: "Failed to report bet result. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
