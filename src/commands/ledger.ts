import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { getSettledBets } from "../lib/db";
import { computeLedger, formatLedgerEmbed } from "../lib/format";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("ledger")
    .setDescription("Show who owes whom across all settled bets");

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const bets = await getSettledBets(guildId, 1000);
    const entries = computeLedger(bets);
    const embed = formatLedgerEmbed(entries);
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Error computing ledger:", err);
    await interaction.reply({
      content: "Failed to compute ledger.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
