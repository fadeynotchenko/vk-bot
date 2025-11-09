import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { handleGetMaxCards } from "./endpoints/get-max-cards.ts";
import { handleCreateMaxCard } from "./endpoints/create-max-card.ts";
import { handleGetUserCards } from "./endpoints/get-user-cards.ts";
import { connectDB } from "../db/db-client.ts";

const LISTEN_URL = process.env.API_LISTEN_URL ?? "http://127.0.0.1:8788";
const u = new URL(LISTEN_URL);
const host = u.hostname;
const port = Number(u.port)

const app = Fastify({
  logger: true,
});

async function startServer() {
  try {
    await connectDB();

    await app.register(cors, {
      origin: true,
      credentials: true,
    });

    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    });

    app.get("/fetch-cards", handleGetMaxCards);
    app.get("/user-cards", handleGetUserCards);
    app.post("/create-card", handleCreateMaxCard);

    const address = await app.listen({ host, port });
    console.log(`✅ API успешно запущен: ${address}`);
  } catch (error) {
    console.error("❌ Не удалось запустить API:", error);
    process.exit(1);
  }
}

void startServer();
