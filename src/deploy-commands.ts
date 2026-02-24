import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

import * as create from "./commands/create";
import * as accept from "./commands/accept";
import * as cancel from "./commands/cancel";
import * as list from "./commands/list";
import * as active from "./commands/active";
import * as report from "./commands/report";
import * as edit from "./commands/edit";
import * as history from "./commands/history";
import * as ledger from "./commands/ledger";

const command = new SlashCommandBuilder()
  .setName("bet")
  .setDescription("Smash Bros tournament side bets");

command.addSubcommand(create.data);
command.addSubcommand(accept.data);
command.addSubcommand(cancel.data);
command.addSubcommand(list.data);
command.addSubcommand(active.data);
command.addSubcommand(report.data);
command.addSubcommand(edit.data);
command.addSubcommand(history.data);
command.addSubcommand(ledger.data);

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  throw new Error(
    "Missing DISCORD_TOKEN or DISCORD_CLIENT_ID environment variables"
  );
}

const rest = new REST().setToken(token);

async function main() {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(clientId!), {
    body: [command.toJSON()],
  });
  console.log("Done! /bet command registered globally.");
}

main().catch((err) => {
  console.error("Failed to register commands:", err);
  process.exit(1);
});
