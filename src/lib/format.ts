import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { Bet, getAcceptorRisk } from "./db";

const STATUS_COLORS = {
  open: 0x3498db,
  active: 0xf39c12,
  settled: 0x2ecc71,
  cancelled: 0x95a5a6,
} as const;

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function formatBetEmbed(bet: Bet): EmbedBuilder {
  const acceptorRisk = getAcceptorRisk(bet);
  const embed = new EmbedBuilder()
    .setTitle(bet.description)
    .setColor(STATUS_COLORS[bet.status])
    .addFields(
      {
        name: "Bet ID",
        value: `\`${shortId(bet.id)}\``,
        inline: true,
      },
      {
        name: "Status",
        value: bet.status.toUpperCase(),
        inline: true,
      },
      {
        name: "Odds",
        value: `${bet.odds_creator}:${bet.odds_acceptor}`,
        inline: true,
      },
      {
        name: "Creator",
        value: `<@${bet.creator_id}> risks **$${Number(bet.amount).toFixed(0)}**`,
        inline: false,
      }
    );

  if (bet.acceptor_id) {
    embed.addFields({
      name: "Acceptor",
      value: `<@${bet.acceptor_id}> risks **$${acceptorRisk.toFixed(0)}**`,
      inline: false,
    });
  } else {
    embed.addFields({
      name: "Acceptor",
      value: `Open — accept to risk **$${acceptorRisk.toFixed(0)}**`,
      inline: false,
    });
  }

  if (bet.winner_id) {
    embed.addFields({
      name: "Winner",
      value: `<@${bet.winner_id}>`,
      inline: true,
    });
  }

  embed.setTimestamp(new Date(bet.created_at));
  return embed;
}

export function acceptButtonRow(
  betId: string
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_bet:${betId}`)
      .setLabel("Accept Bet")
      .setStyle(ButtonStyle.Success)
  );
}

export function formatBetListEmbed(
  bets: Bet[],
  title: string
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(0x3498db);

  if (bets.length === 0) {
    embed.setDescription("No bets found.");
    return embed;
  }

  const lines = bets.map((bet) => {
    const acceptorRisk = getAcceptorRisk(bet);
    const creator = `<@${bet.creator_id}>`;
    const acceptor = bet.acceptor_id ? `<@${bet.acceptor_id}>` : "???";
    return (
      `\`${shortId(bet.id)}\` **${bet.description}**\n` +
      `${creator} $${Number(bet.amount).toFixed(0)} vs ${acceptor} $${acceptorRisk.toFixed(0)} @ ${bet.odds_creator}:${bet.odds_acceptor}`
    );
  });

  embed.setDescription(lines.join("\n\n"));
  return embed;
}

export interface LedgerEntry {
  from: string;
  to: string;
  amount: number;
}

export function computeLedger(bets: Bet[]): LedgerEntry[] {
  const netOwed = new Map<string, number>();

  for (const bet of bets) {
    if (!bet.winner_id || !bet.acceptor_id) continue;

    const creatorRisk = bet.amount;
    const acceptorRisk = getAcceptorRisk(bet);

    let payer: string;
    let payee: string;
    let payout: number;

    if (bet.winner_id === bet.creator_id) {
      payer = bet.acceptor_id;
      payee = bet.creator_id;
      payout = acceptorRisk;
    } else {
      payer = bet.creator_id;
      payee = bet.acceptor_id;
      payout = creatorRisk;
    }

    const key = [payer, payee].sort().join(":");
    const direction = payer < payee ? 1 : -1;
    const current = netOwed.get(key) ?? 0;
    netOwed.set(key, current + payout * direction);
  }

  const entries: LedgerEntry[] = [];
  for (const [key, amount] of netOwed) {
    if (Math.abs(amount) < 0.01) continue;
    const [userA, userB] = key.split(":");
    if (amount > 0) {
      entries.push({ from: userA, to: userB, amount });
    } else {
      entries.push({ from: userB, to: userA, amount: Math.abs(amount) });
    }
  }

  return entries.sort((a, b) => b.amount - a.amount);
}

export function formatLedgerEmbed(entries: LedgerEntry[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("Bet Ledger — Who Owes Whom")
    .setColor(0x9b59b6);

  if (entries.length === 0) {
    embed.setDescription("All square! No outstanding debts.");
    return embed;
  }

  const lines = entries.map(
    (e) => `<@${e.from}> owes <@${e.to}> **$${e.amount.toFixed(0)}**`
  );

  embed.setDescription(lines.join("\n"));
  return embed;
}
