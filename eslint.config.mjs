import js from "@eslint/js";

export default [
  {
    ignores: [".next/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    files: ["app/**/*.jsx", "lib/**/*.js"],
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
        document: "readonly",
        event: "readonly",
        FormData: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        structuredClone: "readonly",
        window: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];
