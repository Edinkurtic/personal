-- Schema for chat application
BEGIN TRANSACTION;
DROP TABLE messages;
CREATE TABLE messages (
                          id INTEGER PRIMARY KEY AUTOINCREMENT ,
                          session_id TEXT NOT NULL,
                          message TEXT,
                          role TEXT,
                          timestamp INTEGER
);

CREATE INDEX idx_session ON messages(session_id);
commit
