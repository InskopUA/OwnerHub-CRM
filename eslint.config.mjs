import js from "@eslint/js";

export default [
  {
    ignores: [".next/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    files: ["app/**/*.js", "app/**/*.jsx", "lib/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: "readonly",
        crypto: "readonly",
        document: "readonly",
        event: "readonly",
        FormData: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        structuredClone: "readonly",
        TextEncoder: "readonly",
        URL: "readonly",
        window: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];
