import { supabase } from "./supabase";

export interface Bet {
  id: string;
  guild_id: string;
  creator_id: string;
  acceptor_id: string | null;
  description: string;
  amount: number;
  odds_creator: number;
  odds_acceptor: number;
  status: "open" | "active" | "settled" | "cancelled";
  winner_id: string | null;
  reported_by: string | null;
  created_at: string;
  settled_at: string | null;
}

export async function createBet(
  guildId: string,
  creatorId: string,
  description: string,
  amount: number,
  oddsCreator: number,
  oddsAcceptor: number
): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .insert({
      guild_id: guildId,
      creator_id: creatorId,
      description,
      amount,
      odds_creator: oddsCreator,
      odds_acceptor: oddsAcceptor,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function acceptBet(
  betId: string,
  acceptorId: string
): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .update({ acceptor_id: acceptorId, status: "active" })
    .eq("id", betId)
    .eq("status", "open")
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function cancelBet(betId: string, userId: string): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .update({ status: "cancelled" })
    .eq("id", betId)
    .eq("creator_id", userId)
    .eq("status", "open")
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function reportBet(
  betId: string,
  winnerId: string,
  reportedBy: string
): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .update({
      winner_id: winnerId,
      reported_by: reportedBy,
      status: "settled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", betId)
    .eq("status", "active")
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function editBetResult(
  betId: string,
  winnerId: string,
  editedBy: string
): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .update({
      winner_id: winnerId,
      reported_by: editedBy,
      status: "settled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", betId)
    .eq("status", "settled")
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function getBet(betId: string): Promise<Bet | null> {
  const { data, error } = await supabase
    .from("bets")
    .select()
    .eq("id", betId)
    .single();

  if (error) return null;
  return data as Bet;
}

export async function getOpenBets(guildId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from("bets")
    .select()
    .eq("guild_id", guildId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Bet[];
}

export async function getActiveBets(guildId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from("bets")
    .select()
    .eq("guild_id", guildId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Bet[];
}

export async function getSettledBets(
  guildId: string,
  limit = 20
): Promise<Bet[]> {
  const { data, error } = await supabase
    .from("bets")
    .select()
    .eq("guild_id", guildId)
    .eq("status", "settled")
    .order("settled_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Bet[];
}

export function getAcceptorRisk(bet: Bet): number {
  return (bet.amount * bet.odds_acceptor) / bet.odds_creator;
}
