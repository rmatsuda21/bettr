import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { getSettledBets } from "../lib/db";
import { formatBetListEmbed } from "../lib/format";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("history").setDescription("Show recently settled bets");

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
    const bets = await getSettledBets(guildId);
    const embed = formatBetListEmbed(bets, "Bet History (Recent)");
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Error fetching history:", err);
    await interaction.reply({
      content: "Failed to fetch bet history.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
