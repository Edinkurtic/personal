import express from 'express'
import { Database } from "sqlite";
import { DB } from "./src/database";
import { chatRouter } from "./router/chat-router";
import cors from "cors"
import {userRouter} from "./router/user-router";

const app = express();

app.use(express.json());
app.use(cors())

const db: Database = await DB.getConnection();
console.log('Database initialized and tables ensured.');



app.use('/api/chat', chatRouter);
app.use('/user', userRouter);
const server = app.listen(3000, () => {
  console.log(`App listening on port 3000`);
});

const shutdown = async (signal: string) => {
  try {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
    });
    await DB.closeDb();
    console.log('Database connection closed.');
  } catch (e) {
    console.error('Error during shutdown:', e);
  } finally {
    process.exit(0);
  }
};

['SIGINT', 'SIGTERM']
  .forEach(sig => process.on(sig as NodeJS.Signals, () => { void shutdown(sig); }));