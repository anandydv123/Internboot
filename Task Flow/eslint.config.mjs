import pluginFirebaseRules from "eslint-plugin-firebase-rules";

export default [
  {
    plugins: {
      "firebase-rules": pluginFirebaseRules,
    },
    rules: {
      "firebase-rules/no-syntax-error": "error",
      "firebase-rules/no-unresolved-variable": "error",
      "firebase-rules/no-unresolved-function": "error"
    }
  }
];
