# Anchor

Feature-level change protection for AI-assisted development.

AI-assisted builders can make a requested change and unintentionally break functionality that already works. Anchor explores a safer workflow: lock completed features, inspect proposed patches and their dependencies, run regression checks, and apply only changes that meet the acceptance criteria.

Anchor is an independent product prototype, not an integration with an existing app builder. It runs entirely in the browser with no accounts, dependencies, API keys or inference charges.

## Try it

Open `index.html` in a modern browser. No installation is required.

1. Compare **Before**, **Without Anchor** and **With Anchor** in the storefront preview.
2. Open **Anchor** to lock or unlock features and inspect protected dependencies.
3. Open **Review changes** to examine allowed and blocked patches.
4. Open **Tests & impact** to compare regression results and adjust repair-credit assumptions.
5. Apply the patch only when the regression and acceptance checks pass.
6. Try the product search, free shipping and mobile navigation scenarios.

## What the MVP demonstrates

| Scenario | Regression failures without protection | With recommended locks | Requested change passes |
| --- | ---: | ---: | --- |
| Add product search | 4 | 0 | Yes |
| Offer free shipping | 1 | 0 | Yes |
| Simplify mobile navigation | 2 | 0 | Yes |

Results are from the bundled fixture and executable tests, not production measurements. The repair-credit estimator uses configurable assumptions; it does not represent observed savings from a commercial service.

## Development

Node.js 22 is recommended. No npm packages are required.

```sh
node test.js
node build.js
```

`node test.js` checks the three scenarios, all 48 feature-lock combinations, dependency protection and invalid patch handling. `node build.js` combines the editable sources into the standalone `index.html` used for static hosting. Commit the regenerated HTML whenever a source file changes.

| File | Purpose |
| --- | --- |
| `engine.js` | Fixture modules, dependency analysis, patch validation and regression tests |
| `app.js` | Workspace, scenario routing, review flow and interactive storefront |
| `styles.css` | Responsive light and dark layouts |
| `template.html` | Editor markup |
| `build.js` | Standalone HTML generation |
| `test.js` | Deterministic engine checks |
| `index.html` | Deployable, self-contained MVP |

## Product documentation

- [Product brief](docs/product-brief.md): problem, audience, hypothesis, scope and prioritization.
- [Validation plan](docs/validation.md): test evidence, success metrics and next experiments.
- [Changelog](CHANGELOG.md): release notes.

## Boundaries

AI-generated patches are predefined, not produced by an LLM. Dependency inspection and test execution are real for the bundled fixture; the evaluator executes application-owned fixture code only. Arbitrary prompts do not generate code. The demo does not process real transactions, connect to customer projects or publish to an external builder. The UI is independently implemented, not a copy of proprietary source code or branding.

Deploy `index.html` as a static site; no backend is required. GitHub Pages can serve the repository root when configured.
