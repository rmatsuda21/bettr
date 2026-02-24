import { GuildMember } from "discord.js";

const ADMIN_ROLE_NAME = process.env.ADMIN_ROLE_NAME ?? "Bet Admin";

export function hasAdminRole(member: GuildMember | null): boolean {
  if (!member) return false;
  return member.roles.cache.some(
    (role) => role.name.toLowerCase() === ADMIN_ROLE_NAME.toLowerCase()
  );
}
