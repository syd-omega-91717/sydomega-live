CREATE TABLE academy_progress (
 id UUID PRIMARY KEY,
 user_id UUID,
 node_id TEXT,
 completed BOOLEAN DEFAULT FALSE,
 xp_awarded INTEGER DEFAULT 0
);
