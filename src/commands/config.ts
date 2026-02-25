import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { getGuildSettings, setAdminRole } from "../lib/db";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("config")
    .setDescription("Configure the bet admin role (server admin only)")
    .addRoleOption((opt) =>
      opt
        .setName("admin_role")
        .setDescription("The role that can edit bet results")
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

  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  ) {
    await interaction.reply({
      content: "You need the **Manage Server** permission to configure the bot.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const role = interaction.options.getRole("admin_role", true);

  try {
    await setAdminRole(guildId, role.id);
    await interaction.reply({
      content: `Bet admin role set to **${role.name}**. Members with this role can now use \`/bet edit\`.`,
    });
  } catch (err) {
    console.error("Error saving config:", err);
    await interaction.reply({
      content: "Failed to save config. Please try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
