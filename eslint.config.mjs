import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Include standard JavaScript rules
  eslint.configs.recommended,

  // Include standard TypeScript rules
  ...tseslint.configs.recommended,

  // Hand off formatting rules to Prettier
  eslintPluginPrettierRecommended,

  // Custom rules specifically for your project
  {
    rules: {
      "no-console": "warn", // Warns you if you leave console.logs (great for prod)
      "@typescript-eslint/no-explicit-any": "warn", // Discourages using 'any'
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      // Errors if a variable is unused, unless you start it with an underscore (like _req)
    },
    ignores: ["build", "dist", "node_modules", "prisma/generated"],
  },
  {
    ignores: ["build/**", "dist/**", "node_modules/**", "prisma/generated/**"],
  },
);
