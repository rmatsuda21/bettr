import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("create").setDescription("Create an open bet");

export async function execute(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("create_bet_modal")
    .setTitle("Create a Bet");

  const descriptionInput = new TextInputBuilder()
    .setCustomId("bet_description")
    .setLabel("What's the bet?")
    .setPlaceholder("MkLeo wins Grand Finals")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  const amountInput = new TextInputBuilder()
    .setCustomId("bet_amount")
    .setLabel("Your wager ($)")
    .setPlaceholder("10")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const oddsInput = new TextInputBuilder()
    .setCustomId("bet_odds")
    .setLabel("Odds (creator:acceptor)")
    .setPlaceholder("1:2")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(oddsInput)
  );

  await interaction.showModal(modal);
}
