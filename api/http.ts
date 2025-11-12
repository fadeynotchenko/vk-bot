import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { handleGetMaxCards } from "./endpoints/get-max-cards.ts";
import { handleCreateMaxCard } from "./endpoints/create-max-card.ts";
import { handleGetUserCards } from "./endpoints/get-user-cards.ts";
import { handleTrackCardView } from "./endpoints/track-card-view.ts";
import { handleGetViewedCards } from "./endpoints/get-viewed-cards.ts";
import { handleOnAppClose } from "./endpoints/on-app-close.ts";
import { handleDeleteMaxCard } from "./endpoints/delete-max-card.ts";
import { handleUpdateMaxCard } from "./endpoints/update-max-card.ts";
import { connectDB } from "../db/db-client.ts";

const LISTEN_URL = process.env.API_LISTEN_URL ?? "http://127.0.0.1:8788";
const u = new URL(LISTEN_URL);
const host = u.hostname;
const port = u.port ? Number(u.port) : 8788;

console.log(`🔧 API_LISTEN_URL: ${LISTEN_URL}`);
console.log(`🔧 Parsed host: ${host}, port: ${port}`);

const app = Fastify({
  logger: true,
});

async function startServer() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await connectDB();
    console.log('✅ База данных подключена');

    await app.register(cors, {
      origin: true,
      credentials: true,
    });

    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    });

    console.log('📝 Регистрация маршрутов...');
    app.get("/fetch-cards", handleGetMaxCards);
    app.get("/user-cards", handleGetUserCards);
    app.get("/viewed-cards", handleGetViewedCards);
    app.post("/create-card", handleCreateMaxCard);
    app.put("/update-card", handleUpdateMaxCard);
    app.delete("/delete-card", handleDeleteMaxCard);
    app.post("/track-card-view", handleTrackCardView);
    app.post("/on-app-close", handleOnAppClose);

    console.log(`🚀 Запуск сервера на ${host}:${port}...`);
    const address = await app.listen({ host, port });
    console.log(`✅ API успешно запущен: ${address}`);
  } catch (error) {
    console.error("❌ Не удалось запустить API:", error);
    if (error instanceof Error) {
      console.error("❌ Ошибка:", error.message);
      console.error("❌ Stack:", error.stack);
    }
    process.exit(1);
  }
}

void startServer();
