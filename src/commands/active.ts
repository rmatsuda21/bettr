import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { getActiveBets } from "../lib/db";
import { formatBetListEmbed } from "../lib/format";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("active")
    .setDescription("Show all active (accepted, unsettled) bets");

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
    const bets = await getActiveBets(guildId);
    const embed = formatBetListEmbed(bets, "Active Bets");
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Error listing active bets:", err);
    await interaction.reply({
      content: "Failed to fetch active bets.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
