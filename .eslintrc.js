module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "airbnb-base",
    "prettier",
    "plugin:prettier/recommended",
    "eslint-config-prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "import/extensions": 0,
    "@typescript-eslint/no-use-before-define": ["error", { variables: false }],
    "import/no-unresolved": "off",
    "no-console": 1,
    "consistent-return": 0,
    "func-names": 0,
    "global-require": 0,
    "no-restricted-globals": 0,
    "no-underscore-dangle": 0,
    "prefer-arrow-callback": 0,
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "@typescript-eslint/no-shadow": ["error"],
        "no-shadow": "off",
        "no-undef": "off",
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": ["error"]
      }
    }
  ]
};
