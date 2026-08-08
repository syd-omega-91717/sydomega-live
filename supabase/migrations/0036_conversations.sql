CREATE TABLE conversations (
 id UUID PRIMARY KEY,
 user_id UUID,
 created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
 id UUID PRIMARY KEY,
 conversation_id UUID,
 role TEXT,
 content TEXT,
 created_at TIMESTAMP DEFAULT NOW()
);
