# Validation plan

## Verified fixture results

Run `node test.js` from the repository root to reproduce the engine results.

| Scenario | Unguarded failures | Guarded failures | Blocked files | Acceptance with protection |
| --- | ---: | ---: | ---: | --- |
| Product search | 4 | 0 | 2 | Pass |
| Free shipping | 1 | 0 | 1 | Pass |
| Mobile navigation | 2 | 0 | 2 | Pass |

Nine regression checks cover authentication, product listing, price formatting, quantity calculations, shipping totals, empty carts and navigation. Each scenario has a separate acceptance check. The test suite exercises all 16 lock selections for each of the three scenarios (48 combinations), verifies dependency protection for a shared pricing module, and rejects unknown files and non-matching patch contexts.

These are deterministic test results, not a sample of real AI-generated patches. The test count refers to lock configurations, not unique user sessions. A passing test suite does not establish the absence of other regressions.

## 0.3 comparison acceptance checks

- Product search: the matching product is displayed in both versions, but the unprotected version loses the Cart route and allows guest checkout. The protected version retains the route and denies checkout.
- Free shipping: two backpacks at ₹1,499 each produce ₹1,598 without protection and ₹2,998 with protection. The ₹1,400 shortfall is illustrative and calculated from the fixture, not revenue saved.
- Mobile navigation: the requested two-link menu is retained; the unprotected patch undercharges ₹99 for a cart with paid shipping and accepts unverified accounts.
- Vary quantity, account, search and mobile menu state across both evaluated versions; turn protection off to confirm that the benefit disappears.
- Browser verification covers the comparison, all three scenarios, shared controls, individual previews, patch application, code view, image loading and viewport widths from 320 to 1920 pixels.

## Next experiment: task-based usability test

Recruit five to eight people who have built and iterated on an app with an AI-assisted builder. Use the same sample app and change request in two conditions: unprotected editing and Anchor-assisted editing. Counterbalance the order, use equivalent tasks, and capture actual time, actions, errors and successful completion. Ask participants to explain why a proposed edit was blocked and what they would do next. Do not claim savings from the demo's credit estimator.

| Metric | Definition | Desired direction |
| --- | --- | --- |
| First-pass acceptance | Accepted changes without a repair attempt / attempted changes | Increase |
| Regression incidence | Changes introducing at least one regression / changes attempted | Decrease |
| Time to acceptance | Elapsed time from request to passing acceptance and regression checks | Decrease |
| Repair cost per accepted change | Actual repair credits consumed / accepted changes (only in a real instrumented pilot) | Decrease |
| False-block rate | Legitimate required patches blocked / legitimate required patches | Decrease |
| Review abandonment | Started reviews not completed / reviews started | Decrease |

A real integration is required to measure actual commercial credit savings. Report the sample size, baseline, median task time and observed failures; separate estimates from observed results. Test shared dependencies and cases where protecting a feature prevents satisfying the request.

## Release checks

- Run `node test.js`.
- Run `node build.js` and confirm the generated HTML matches the committed file.
- Open the standalone HTML and exercise all three scenarios, locks, review, code comparison and patch application.
- Verify that the browser makes no external requests and that desktop and mobile views remain usable.
