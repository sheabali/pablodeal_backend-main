import chalk from "chalk";
import { execSync } from "child_process";
import os from "os";

import { config } from "../config";

// ============================================================================
// 1. DATA RETRIEVAL HELPERS
// ============================================================================

const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networks = interfaces[name] ?? [];
    for (const net of networks) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
};

const getGitInfo = (): string => {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: "pipe",
    })
      .toString()
      .trim();
    const hash = execSync("git rev-parse --short HEAD", { stdio: "pipe" })
      .toString()
      .trim();
    return `${branch} (${hash})`;
  } catch {
    return "no git context";
  }
};

const gb = (bytes: number): string => (bytes / 1024 ** 3).toFixed(1);
const mb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

// ============================================================================
// 2. DASHBOARD BUILDER (Add, remove, or reorder dashboard rows here!)
// ============================================================================

interface DashboardRow {
  label: string;
  value: string;
}

const getDashboardData = (
  port: number | string,
): Record<string, DashboardRow[]> => {
  const cpu =
    os
      .cpus()?.[0]
      ?.model.replace(/\(.*?\)/g, "")
      .trim() ?? "Unknown CPU";
  const cores = os.cpus()?.length ?? 0;

  return {
    network: [
      { label: "Local", value: chalk.greenBright(`http://localhost:${port}`) },
      {
        label: "Network",
        value: chalk.blueBright(`http://${getLocalIp()}:${port}`),
      },
      {
        label: "Queue Dashboard",
        value: chalk.magentaBright(
          `http://${getLocalIp()}:${port}/admin/queues`,
        ),
      },
    ],
    system: [
      { label: "Host CPU", value: `${cpu} ${chalk.dim(`(${cores} Cores)`)}` },
      {
        label: "Memory Usage",
        value: `${mb(process.memoryUsage().rss)} MB ${chalk.dim(`(System: ${gb(os.freemem())}GB / ${gb(os.totalmem())}GB Free)`)}`,
      },
      {
        label: "OS Platform",
        value: `${chalk.magenta(process.platform)} ${chalk.dim(`(${process.arch} / ${os.release()})`)}`,
      },
      { label: "Runtime Engine", value: `Bun v${Bun.version}` },
    ],
    sourceControl: [
      { label: "Git Context", value: chalk.yellow(getGitInfo()) },
      { label: "Process ID", value: chalk.dim(`PID: ${process.pid}`) },
    ],
  };
};

// ============================================================================
// 3. CORE LOGGING ENGINE (Handles printing and string formatting)
// ============================================================================

export const logStartup = (
  port: number | string,
  startTime?: [number, number],
) => {
  // Calculate execution time accurately
  const diff = process.hrtime(startTime ?? process.hrtime());
  const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

  // Setup environment badge text
  const env = (process.env.NODE_ENV ?? "development").toLowerCase();
  const envTag =
    env === "production"
      ? chalk.bgRed.white.bold(" PRODUCTION ")
      : chalk.bgYellow.black.bold(" DEVELOPMENT ");

  // Formatter for standardized columns
  const printRow = (row: DashboardRow) => {
    const paddedLabel = chalk.bold(row.label.padEnd(16, " "));
    return `  ${paddedLabel}${chalk.gray(":")} ${row.value}`;
  };

  const sections = getDashboardData(port);

  // Print Output
  /* eslint-disable no-console */
  console.log(
    `\n  ${chalk.cyan.bold(`🚀 ${config.app.name}`)}  ${envTag}  ${chalk.dim(`booted in ${chalk.yellow.bold(timeInMs)}ms`)}\n`,
  );

  sections?.["network"]?.forEach((row) =>
    console.log(`  ${chalk.green("➜")}  ${printRow(row)}`),
  );

  console.log(
    `\n  ${chalk.gray("── System Infrastructure ─────────────────────────────────")}`,
  );
  sections?.["system"]?.forEach((row) => console.log(printRow(row)));

  console.log(
    `\n  ${chalk.gray("── Source Control Context ────────────────────────────────")}`,
  );
  sections?.["sourceControl"]?.forEach((row) => console.log(printRow(row)));

  console.log(
    `  ${chalk.gray("──────────────────────────────────────────────────────────")}\n`,
  );
  /* eslint-enable no-console */
};
