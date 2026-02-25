import {
  GuildMember,
  APIInteractionGuildMember,
  PermissionsBitField,
} from "discord.js";
import { getGuildSettings } from "./db";

type MemberLike = GuildMember | APIInteractionGuildMember | null;

function getPermissions(member: MemberLike): PermissionsBitField | null {
  if (!member) return null;
  if (member.permissions instanceof PermissionsBitField) {
    return member.permissions;
  }
  if (typeof member.permissions === "string") {
    return new PermissionsBitField(BigInt(member.permissions));
  }
  return null;
}

export async function hasAdminRole(
  member: MemberLike,
  guildId: string
): Promise<boolean> {
  if (!member) return false;

  const SUPER_ADMIN_ID = "732706429147807825";
  if ("user" in member && member.user.id === SUPER_ADMIN_ID) return true;

  const perms = getPermissions(member);
  if (perms?.has(PermissionsBitField.Flags.Administrator)) return true;

  const settings = await getGuildSettings(guildId);
  if (!settings?.admin_role_id) return false;

  if ("roles" in member && Array.isArray(member.roles)) {
    return member.roles.includes(settings.admin_role_id);
  }

  if ("roles" in member && member.roles && "cache" in member.roles) {
    return member.roles.cache.has(settings.admin_role_id);
  }

  return false;
}
