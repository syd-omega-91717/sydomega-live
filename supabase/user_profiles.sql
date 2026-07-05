CREATE TABLE user_profiles (
 user_id UUID PRIMARY KEY,
 display_name TEXT,
 bio TEXT,
 avatar_url TEXT,
 level INTEGER DEFAULT 1,
 xp INTEGER DEFAULT 0
 approval_expires_at timestamptz
last_access_at timestamptz
access_state text default 'pending'
);
