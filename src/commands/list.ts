import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { getOpenBets } from "../lib/db";
import { formatBetListEmbed } from "../lib/format";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("list").setDescription("Show all open bets in this server");

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
    const bets = await getOpenBets(guildId);
    const embed = formatBetListEmbed(bets, "Open Bets");
    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error("Error listing bets:", err);
    await interaction.reply({
      content: "Failed to fetch open bets.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
