import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      ".bmad-core/**",
      "mcp/**",
      "docs/**",
      ".ai/**",
      "database/**",
      "docker/**",
      "build/**",
      "dist/**",
      ".next/**",
      "out/**",
    ],
  },
];

export default eslintConfig;
