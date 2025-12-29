import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// BullMQ exige maxRetriesPerRequest = null para lidar com reconexões
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("⚙️  Redis conectado em", redis.options?.host ?? redisUrl);
});

redis.on("error", (error) => {
  console.error("❌ Erro no Redis:", error);
});
