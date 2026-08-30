import type { FastifyInstance } from "fastify";
import { buildHttpServer } from "../src/transport/http.js";

export async function readyJwtApp(): Promise<FastifyInstance> {
    const app = await buildHttpServer({ authMode: "jwt" });
    await app.ready();
    return app;
}
