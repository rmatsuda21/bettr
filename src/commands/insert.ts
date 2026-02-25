import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { hasAdminRole } from "../lib/permissions";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("insert")
    .setDescription("Manually insert a finished bet (admin only)")
    .addUserOption((opt) =>
      opt
        .setName("creator")
        .setDescription("The user who created the bet")
        .setRequired(true)
    )
    .addUserOption((opt) =>
      opt
        .setName("acceptor")
        .setDescription("The user who accepted the bet")
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!(await hasAdminRole(interaction.member as any, guildId))) {
    await interaction.reply({
      content:
        "You need admin permissions or the configured bet admin role to insert bets.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const creator = interaction.options.getUser("creator", true);
  const acceptor = interaction.options.getUser("acceptor", true);

  const modal = new ModalBuilder()
    .setCustomId(`insert_bet_modal:${creator.id}:${acceptor.id}`)
    .setTitle("Insert a Finished Bet");

  const descriptionInput = new TextInputBuilder()
    .setCustomId("insert_description")
    .setLabel("What was the bet?")
    .setPlaceholder("MkLeo wins Grand Finals")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  const amountAndOddsInput = new TextInputBuilder()
    .setCustomId("insert_amount_odds")
    .setLabel("Creator's wager and odds")
    .setPlaceholder("10 at 1:2")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const winnerInput = new TextInputBuilder()
    .setCustomId("insert_winner")
    .setLabel("Winner (creator or acceptor)")
    .setPlaceholder("creator")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(amountAndOddsInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(winnerInput)
  );

  await interaction.showModal(modal);
}
