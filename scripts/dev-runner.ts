import { logger } from "@/core";

const server = Bun.spawn(
  ["bun", "--watch", "--env-file=.env", "src/server.ts"],
  {
    stdio: ["inherit", "pipe", "pipe"],
  },
);

const worker = Bun.spawn(
  ["bun", "--watch", "--env-file=.env", "src/worker.ts"],
  {
    stdio: ["inherit", "pipe", "pipe"],
  },
);

async function pipeStream(stream: ReadableStream<Uint8Array>, prefix: string) {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      logger.info(`${prefix}${line}`);
    }
  }
  if (buffer) logger.info(`${prefix}${buffer}`);
}

pipeStream(server.stdout, "");
pipeStream(server.stderr, "");
pipeStream(worker.stdout, "[worker] ");
pipeStream(worker.stderr, "[worker] ");

function killAll() {
  server.kill();
  worker.kill();
}

process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);

const code = await Promise.race([server.exited, worker.exited]);
killAll();
process.exit(code ?? 0);
