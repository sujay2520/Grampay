# GramPay - BharatVoice Shield Prototype

GramPay is a Zero-Trust Voice Shield prototype designed for senior citizens and vernacular users, protecting against AI voice cloning, deepfake fraud, and unauthorized fund transfers.

### Features
- **Phone 1 (Farmer View)**: Simple, high-contrast vernacular interface for elderly users (Kannada, Hindi, English).
- **Phone 2 (Scammer View)**: Impostor simulation simulating AI voice clones and unauthorized calls.
- **Laptop Screen (Judge Telemetry Console)**: Real-time biometric verification telemetry, Nemotron intent analysis, and DetectifAI deepfake detection.
- **Stage Studio**: Tri-device synchronized stage mode for live demonstrations.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
