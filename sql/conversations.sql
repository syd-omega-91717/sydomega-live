CREATE TABLE conversations (
 id UUID PRIMARY KEY,
 user_id UUID,
 created_at TIMESTAMP DEFAULT NOW()
);
