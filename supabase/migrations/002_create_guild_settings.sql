CREATE TABLE guild_settings (
  guild_id TEXT PRIMARY KEY,
  admin_role_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
