const config = {
  printWidth: 120,
  trailingComma: "es5",
  overrides: [
    {
      files: ["eslint.config.js", "prettier.config.js", "*.json", "*.md"],
      options: {
        printWidth: 80,
      },
    },
    {
      files: ["tsconfig.json"],
      options: {
        trailingComma: "none",
      },
    },
  ],
};

export default config;
