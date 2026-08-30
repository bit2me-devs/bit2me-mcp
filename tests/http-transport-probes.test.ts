import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";

import { readyJwtApp } from "./http-transport-app.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await readyJwtApp();
});

describe("HTTP transport — public health probes", () => {
    it("/livez is reachable without credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/livez" });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { status: string; timestamp: string };
        expect(body.status).toBe("ok");
        expect(typeof body.timestamp).toBe("string");
    });

    it("/livez does not expose runtime stats", async () => {
        const res = await app.inject({ method: "GET", url: "/livez" });
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("runtime");
        expect(body).not.toHaveProperty("components");
        expect(body).not.toHaveProperty("version");
    });

    it("/readyz is reachable without credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/readyz" });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { status: string };
        expect(["ok", "degraded"]).toContain(body.status);
    });

    it("/readyz does not expose runtime stats", async () => {
        const res = await app.inject({ method: "GET", url: "/readyz" });
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("runtime");
        expect(body).not.toHaveProperty("components");
    });
});

describe("HTTP transport — authenticated diagnostics", () => {
    it("/health requires credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/health" });
        expect(res.statusCode).toBe(401);
    });

    it("/metrics requires credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/metrics" });
        expect(res.statusCode).toBe(401);
    });

    it("/health returns the full snapshot when authenticated", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/health",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as {
            status: string;
            version: string;
            uptime_seconds: number;
            components: { circuit_breaker: { state: string } };
            runtime?: unknown;
        };
        expect(["ok", "degraded"]).toContain(body.status);
        expect(typeof body.version).toBe("string");
        expect(typeof body.uptime_seconds).toBe("number");
        expect(body.components.circuit_breaker.state).toBeTruthy();
        expect(body.runtime).toBeDefined();
    });

    it("/metrics returns Prometheus when authenticated", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/metrics",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toMatch(/^text\/plain/);
    });

    it("/health does not call the upstream API (no axios is needed)", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/health",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("components.bit2me_server");
        expect(body).not.toHaveProperty("components.mcp_server");
    });
});
