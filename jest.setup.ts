process.env["DATABASE_URL"] =
  process.env["DATABASE_URL"] ||
  "postgresql://user:pass@localhost:5432/test_db";
process.env["STRIPE_SECRET_KEY"] =
  process.env["STRIPE_SECRET_KEY"] || "sk_test_mock";
process.env["STRIPE_WEBHOOK_SECRET"] =
  process.env["STRIPE_WEBHOOK_SECRET"] || "whsec_mock";

globalThis.Bun = {
  password: {
    hash: async () => "hashed-password",
    verify: async () => true,
  },
  version: "1.0.0",
} as any;

jest.mock("chalk", () => {
  const fn: any = (s: string) => s;
  fn.green = fn;
  fn.yellowBright = fn;
  fn.redBright = fn;
  fn.greenBright = fn;
  fn.level = 0;
  return {
    __esModule: true,
    default: fn,
  };
});
