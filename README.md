# Anchor

Feature-level change protection for AI-assisted development.

AI-assisted builders can make a requested change and unintentionally break functionality that already works. Anchor explores a safer workflow: lock completed features, inspect proposed patches and their dependencies, run regression checks, and apply only changes that meet the acceptance criteria.

Anchor is an independent product prototype, not an integration with an existing app builder. It runs entirely in the browser with no accounts, dependencies, API keys or inference charges.

## Try it

Open `index.html` in a modern browser. No installation is required.

1. Select a scenario (Product search, Free shipping, Mobile navigation, Dark mode, Discount code or Price sorting) and click **Run demo**. The comparison opens by default with the same inputs in both versions.
2. Change the shared account, search query, backpack quantity, theme, coupon or sort direction to see the actual behavior of both evaluated versions. Red highlights indicate incorrect results and green highlights indicate preserved behavior.
3. For Dark mode, switch the shared theme selector between Light and Dark. The unprotected version globally inverts the storefront and photographs; the protected version preserves the original colors. For Free shipping, the default two-backpack order exposes an illustrative ₹1,400 shortfall without protection; the protected patch retains the correct total.
4. Open **Anchor** to lock or unlock features and inspect dependencies. Open **Review changes** for patch details and **Test results** for regression and acceptance checks.
5. Switch between **Before**, **Without Anchor** and **With Anchor** to use the complete storefront. Choose **Compare** to return to the side-by-side view.
6. Apply a patch only after the regression and acceptance checks pass.

## What the MVP demonstrates

| Scenario | Regression failures without protection | With recommended locks | Requested change passes |
| --- | ---: | ---: | --- |
| Add product search | 4 | 0 | Yes |
| Offer free shipping | 1 | 0 | Yes |
| Simplify mobile navigation | 2 | 0 | Yes |
| Enable dark mode | 1 | 0 | Yes |
| Add discount code | 2 | 0 | Yes |
| Sort products by price | 2 | 0 | Yes |

Results are from the bundled fixture and executable tests, not production measurements. The repair-credit estimator uses configurable assumptions; it does not represent observed savings from a commercial service. The order shortfall is calculated from the sample cart and intended shipping policy, not from real sales.

## Development

Node.js 22 is recommended. No npm packages are required.

```sh
node test.js
node build.js
```

`node test.js` checks six scenarios, all 1,536 scenario/lock combinations, 6,000 seeded input cases, 1,000 repeatability cycles and eight invalid-input cases. `node build.js` combines the editable sources into the standalone `index.html` used for static hosting. Commit the regenerated HTML whenever a source file changes.

| File | Purpose |
| --- | --- |
| `engine.js` | Fixture modules, dependency analysis, patch validation and regression tests |
| `app.js` | Workspace, guided demo, side-by-side comparison and interactive storefront |
| `assets.js` | Original generated, optimized WebP product photography bundled locally |
| `styles.css` | Responsive light and dark layouts |
| `template.html` | Editor markup |
| `build.js` | Standalone HTML generation |
| `test.js` | Deterministic exhaustive and seeded stress checks |
| `browser-stress.py` | Chromium interaction and responsive stress checks |
| `index.html` | Deployable, self-contained MVP |

To run the optional browser stress tests, install Python Playwright and Chromium, then run `python browser-stress.py` (set `CHROMIUM_PATH` if needed). Browser testing does not add runtime dependencies to the MVP.

## Product documentation

- [Product brief](docs/product-brief.md): problem, audience, hypothesis, scope and prioritization.
- [Validation plan](docs/validation.md): test evidence, success metrics and next experiments.
- [Changelog](CHANGELOG.md): release notes.

## Boundaries

AI-generated patches are predefined, not produced by an LLM. Dependency inspection and test execution are real for the bundled fixture; the evaluator executes application-owned fixture code only. Arbitrary prompts do not generate code. The demo does not process real transactions, connect to customer projects or publish to an external builder. The UI is independently implemented, not a copy of proprietary source code or branding.

Deploy `index.html` as a static site; no backend is required. The [live demo](https://anchor-gtc3.onrender.com/) is hosted on Render. The build runs tests and packages the self-contained HTML.
