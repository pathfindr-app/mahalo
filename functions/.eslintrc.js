module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "max-len": ["error", {"code": 120}],
    "no-unused-vars": "warn",
    "comma-dangle": "warn",
    "no-trailing-spaces": "warn",
    "quotes": ["warn", "double", {"allowTemplateLiterals": true}],
    "indent": ["warn", 2],
    "object-curly-spacing": ["warn", "never"],
    "require-jsdoc": "off",
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
