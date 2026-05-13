import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webhookScript = path.resolve(__dirname, "../mock-n8n-webhook.js");

const waitForServerReady = (proc) =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Timeout waiting for mock webhook server"));
    }, 5000);

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      if (text.includes("Mock n8n webhook listening")) {
        clearTimeout(timeoutId);
        resolve(undefined);
      }
    });

    proc.once("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    proc.once("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timeoutId);
        reject(new Error(`Mock server exited early with code ${code}`));
      }
    });
  });

test("mock n8n webhook returns laptop recommendation for budget query", async () => {
  const port = 5688;
  const proc = spawn(process.execPath, [webhookScript], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServerReady(proc);

    const response = await fetch(`http://localhost:${port}/webhook/laptop-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "toi co 1tr" }),
    });

    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(typeof data.answer, "string");
    assert.ok(Array.isArray(data.products));
    assert.ok(data.products.length > 0);
  } finally {
    proc.kill();
  }
});
