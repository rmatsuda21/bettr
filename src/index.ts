import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  ChatInputCommandInteraction,
  MessageFlags,
  ButtonInteraction,
} from "discord.js";
import { acceptBet, getBet, getAcceptorRisk } from "./lib/db";
import { formatBetEmbed } from "./lib/format";

import * as create from "./commands/create";
import * as accept from "./commands/accept";
import * as cancel from "./commands/cancel";
import * as list from "./commands/list";
import * as active from "./commands/active";
import * as report from "./commands/report";
import * as edit from "./commands/edit";
import * as history from "./commands/history";
import * as ledger from "./commands/ledger";

const subcommands: Record<
  string,
  { execute: (i: ChatInputCommandInteraction) => Promise<void> }
> = {
  create,
  accept,
  cancel,
  list,
  active,
  report,
  edit,
  history,
  ledger,
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    await handleButton(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "bet") return;

  const subcommand = interaction.options.getSubcommand();
  const handler = subcommands[subcommand];

  if (!handler) {
    await interaction.reply({
      content: `Unknown subcommand: ${subcommand}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await handler.execute(interaction);
  } catch (err) {
    console.error(`Error handling /bet ${subcommand}:`, err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Something went wrong.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "Something went wrong.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

async function handleButton(interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith("accept_bet:")) return;

  const betId = interaction.customId.slice("accept_bet:".length);
  const existing = await getBet(betId);

  if (!existing) {
    await interaction.reply({
      content: "That bet no longer exists.",
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

  if (existing.creator_id === interaction.user.id) {
    await interaction.reply({
      content: "You can't accept your own bet.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const bet = await acceptBet(existing.id, interaction.user.id);
    const embed = formatBetEmbed(bet);
    const risk = getAcceptorRisk(bet);

    await interaction.update({
      content: `<@${interaction.user.id}> accepted the bet! They risk **$${risk.toFixed(2)}** against <@${bet.creator_id}>'s **$${bet.amount}**.`,
      embeds: [embed],
      components: [],
    });
  } catch (err) {
    console.error("Error accepting bet via button:", err);
    await interaction.reply({
      content: "Failed to accept bet. It may have already been taken.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("Missing DISCORD_TOKEN environment variable");
}

client.login(token);
