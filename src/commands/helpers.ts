import { supabase } from "../lib/supabase";
import { Bet } from "../lib/db";

export async function findBetByPrefix(
  prefix: string,
  guildId: string
): Promise<Bet | null> {
  const needle = prefix.toLowerCase();
  const { data } = await supabase
    .from("bets")
    .select()
    .eq("guild_id", guildId);

  if (!data) return null;
  return (data.find((b) => b.id.toLowerCase().startsWith(needle)) as Bet) ?? null;
}
