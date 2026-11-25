# Product brief: Anchor

Status: functional concept prototype, v0.4.0

## Problem and target user

AI-assisted app builders lower the cost of shipping an initial feature. Subsequent edits can introduce unrelated regressions in completed functionality. Users then spend time inspecting changes and potentially spend additional credits correcting errors. The initial target is an independent builder or small product team that iterates on an existing app and has limited engineering and inference budgets.

This is a product hypothesis based on the change-management problem. No customer interviews, live platform tests or measured commercial savings are claimed.

## Job to be done

When I ask an AI builder to change one feature, help me preserve the features I have already accepted, so I can ship the requested change without discovering unrelated breakages or paying to repair them.

## Proposed experience

Select the completed features to protect before submitting a request. Inspect proposed patches and automatically identified dependencies. Block changes to protected files unless the user revises the protection policy. Execute regression and acceptance tests before allowing an update. Show what changed, what was prevented and the estimated cost of avoided rework.

The feature is integrated into the editing workflow rather than presented as a separate analytics dashboard.

## Prioritization

| Priority | Capability | State |
| --- | --- | --- |
| P0 | Feature locks and transitive dependency protection | Implemented for fixtures |
| P0 | Patch-context validation and code diff | Implemented |
| P0 | Regression and acceptance test gate | Implemented |
| P0 | Protected versus unprotected storefront comparison | Implemented with shared inputs and component highlights |
| P0 | Guided demo and immediately visible regression/financial effects | Implemented across six scenarios |
| P0 | Theme, discount and catalog sorting regression coverage | Implemented |
| P0 | Exhaustive lock and input stress testing | Implemented and reproducible |
| P1 | Configurable repair-credit estimate | Implemented; illustrative |
| P1 | Responsive editor, version history and appearance controls | Implemented for demo |
| P1 | Validate workflow with real builders and collect task outcomes | Not started |
| P2 | Parse real project dependency graphs and test externally supplied patches safely | Proposed |
| P2 | Integrate with a builder or repository after validating demand | Proposed |

## Success criteria

The MVP must block unauthorized fixture changes while retaining the requested behavior, show the specific reason a patch was blocked, and run without paid inference or a server. If protection also blocks the requested feature, the system must refuse to apply the patch rather than silently remove the requirement.

For a future pilot, compare first-pass acceptance, regression incidence, repair credits per accepted change and time to acceptance against the existing workflow. Measure friction and false blocks as guardrails; do not trade excessive review overhead for fewer regressions. Targets are hypotheses until baseline data are collected.

## Non-goals and trade-offs

The MVP does not generate arbitrary code, guarantee correctness in real projects, replace end-to-end testing or integrate with a commercial platform. A deterministic fixture makes the interaction immediately usable and reproducible without recurring inference cost, but cannot establish production effectiveness. Dependency protection may be too broad for some legitimate edits; the review flow exposes this trade-off rather than allowing a silent override.
