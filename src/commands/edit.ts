import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { editBetResult, getAcceptorRisk } from "../lib/db";
import { hasAdminRole } from "../lib/permissions";
import { formatBetEmbed, shortId } from "../lib/format";
import { findBetByPrefix } from "./helpers";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("edit")
    .setDescription("Edit/correct the result of a settled bet (admin only)")
    .addStringOption((opt) =>
      opt
        .setName("bet_id")
        .setDescription("The bet ID to edit")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("winner")
        .setDescription("Corrected winner: creator or acceptor")
        .setRequired(true)
        .addChoices(
          { name: "Creator", value: "creator" },
          { name: "Acceptor", value: "acceptor" }
        )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember | null;
  if (!hasAdminRole(member)) {
    await interaction.reply({
      content: `You need the **${process.env.ADMIN_ROLE_NAME ?? "Bet Admin"}** role to edit bet results.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

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

  if (existing.status !== "settled") {
    await interaction.reply({
      content: `That bet is **${existing.status}** — only settled bets can be edited.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const winnerId =
    winnerChoice === "creator" ? existing.creator_id : existing.acceptor_id!;

  try {
    const bet = await editBetResult(existing.id, winnerId, interaction.user.id);
    const embed = formatBetEmbed(bet);
    const loserId =
      winnerId === bet.creator_id ? bet.acceptor_id : bet.creator_id;
    const payout =
      winnerId === bet.creator_id ? getAcceptorRisk(bet) : bet.amount;

    await interaction.reply({
      content: `Bet \`${shortId(bet.id)}\` result corrected by <@${interaction.user.id}>. <@${winnerId}> wins **$${payout.toFixed(0)}** from <@${loserId}>.`,
      embeds: [embed],
    });
  } catch (err) {
    console.error("Error editing bet:", err);
    await interaction.reply({
      content: "Failed to edit bet result. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
