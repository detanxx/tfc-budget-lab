# GA4 implementation and rollout

This checkout is the React/Vite **Budget Lab**, not a multi-tool application. No GA4, GTM, or existing consent manager was present. The implementation adds a reusable client without installing another analytics SDK. It does not modify the main website, other tool repositories, DNS, redirects, or GA4 Admin.

## Vercel configuration (before enabling)

1. Confirm that `G-552JP2ZLZH` is the intended web stream in the existing Teen Finance Club GA4 property.
2. In that stream's Enhanced measurement settings, **disable automatic enhanced-measurement events for this manual integration**, especially history page views, form interactions, outbound clicks and file downloads. Otherwise Google's remotely configured automatic events can duplicate page views or capture form/link details outside this module's allowlist. This is a shared-stream setting: review its impact on the main website, whose route tracker is also manual. Do not enable this deployment until this prerequisite is reviewed.
3. Vercel → project → Settings → Environment Variables: add **`VITE_GA4_MEASUREMENT_ID=G-552JP2ZLZH`**, selecting **Production only**, then redeploy.
4. Vercel's built-in `VERCEL_ENV` must be exposed during build. `vite.config.ts` injects it as `__TFC_DEPLOYMENT_ENV__`. Missing/preview/development values fail closed. No user-defined deployment override is required.
5. Optional temporary QA: set `VITE_GA4_DEBUG=true` for Production and redeploy. Remove it after testing. Debug mode cannot bypass consent or production restrictions.

The Measurement ID is intentionally public in the client build. Localhost, file://, missing IDs, Vercel preview deployments and unrecognized hostnames cannot load GA. Currently only tools.teenfinanceclub.com and the canonical tfc-budget-lab.vercel.app hostname are allowed. Add other production hostnames deliberately when adopting the module in other repositories.

## Consent and privacy

Basic opt-in: no Google script, requests, or pre-consent event queue. Unknown/refused consent leaves the tool fully usable. The in-flow privacy notice has equally available Allow analytics and No thanks controls, plus persistent Analytics privacy settings for withdrawal. Google advertising consent stays denied; Google Signals and ad personalization are disabled.

`tfc_analytics_consent_v1` stores only granted/denied for 180 days, Secure and SameSite=Lax. On tools.teenfinanceclub.com it uses Domain=teenfinanceclub.com so the main site can adopt the same preference. On Vercel it is host-only. No existing consent preference or CMP was found in this checkout or the inspected main-site bundle; do not infer consent from `_ga` cookies. If the main site adopts a CMP, connect its analytics category to `setAnalyticsConsent()` and use one source of truth. This implementation alone does not make the existing main-site tag consent-aware.

Withdrawal sets Google's disable flag, updates analytics consent to denied, deletes readable `_ga` cookies and stops subsequent application events. Already transmitted data cannot be recalled. The Google script is not unloaded once loaded. Preferences are rechecked when the window regains focus. If cookies are blocked, the current tab remembers the choice, but the banner may return next visit.

Event payloads contain fixed screen titles/paths and tool names only. Query strings, hashes, raw referrer URLs, financial values, category/goal names, reflections, backup contents and user IDs are never supplied. Application events are not replayed after accepting later. Auto-collected GA protocol/device metadata is still part of GA; this is not a claim of anonymous or zero-data analytics.

## Events and deduplication

| Event | Budget Lab trigger |
|---|---|
| `page_view` | Current allowlisted screen on consented entry; once on each changed screen, including Back. |
| `tool_opened` | Consented entry to a tool, once per tool transition; not on re-render or every step. Accepting consent records the currently open tool only. |
| `simulation_started` | User selects a starting example/own numbers, or confirms restoring a backup. Once per run. |
| `simulation_completed` | User locks their first plan, or reaches Reflect via navigation. Once per run, including when they later revisit Reflect. |
| `simulation_reset` | User confirms replacing an existing plan or restoring over it. Cancellation does not count. A new run then emits started. |

Each custom event has `tool_name: budget_lab`. Initialization lives outside React's render/effect lifecycle. Script/config initialize once. Automatic initial page_view is disabled. The core deduplicates repeated screen calls, consent updates and completion attempts. Existing gtag/GTM scripts cause initialization to fail closed to avoid a second owner.

For a shared shell, reuse `lib/analytics.ts`, add fixed routes to `screens`, and call `analytics.page(routeKey)` from the router. The browser adapter also watches pushState/replaceState/popstate for allowlisted tool paths. State-only screens must call page explicitly, as Budget Lab does. Do not pass arbitrary URLs or user data. Call start/complete/reset only in action handlers. Other tools are not instrumented merely by adding their routes to the registry.

## Main site → tools continuity

Use the same web stream ID and cookie_domain:auto. When the tools truly run under tools.teenfinanceclub.com, compatible consent/cookie preferences allow a shared root-domain GA cookie (subject to browser restrictions).

The audited /budget-lab, /invest-lab and /compound-lab URLs currently **redirect to separate vercel.app hosts**, and the tools homepage returned 403. This code cannot fix that hosting configuration. Preferred: serve tool apps on the tools subdomain. If retaining Vercel hostnames, configure cross-domain measurement in the same stream for the main site and each actual tool hostname; verify that redirects preserve `_gl`, or link directly to the final destination. Cookie consent cannot be shared with Vercel through a parent-domain cookie, so ask independently there. Same Measurement ID alone does not guarantee a continuous cross-domain session.

## Test in production without entering personal data

- Confirm no gtag script/Google collect requests before consent, after No thanks, on localhost or on a Vercel preview (even if an ID is accidentally supplied).
- Allow analytics: one gtag script, one config, one page_view and one tool_opened for the current screen. Navigate between steps: one page_view per transition, no repeated tool_opened.
- Choose an example → simulation_started. Lock it → simulation_completed. Visit Reflect repeatedly → no second completion. Confirm Start a fresh plan → simulation_reset then simulation_started. Cancel reset → neither.
- Withdraw consent → no further application measurement; reaccept → no historical simulation replay. Verify no budget field values or free text in collection payloads.
- GA4 → Reports → Realtime: inspect event names. GA4 → Admin → Data display → DebugView: with temporary VITE_GA4_DEBUG=true, inspect tool_name and sanitized page_location/title. Ad blockers/denied consent prevent events by design.
- Verify main-site → tool continuity using the same client/session identifiers in Tag Assistant/DebugView after consenting; check for self-referrals. Do not assume continuity from seeing events alone.
- Register tool_name as an event-scoped custom dimension for standard exploration/reporting. Real ingestion and GA settings require access to the GA4 property and are not proven by unit tests.

Automated validation: `npm test` includes core and actual browser-adapter tests with mocked Google transport (no real test traffic), checking eligibility, consent, duplicate prevention, withdrawal, navigation and data allowlists. `npm run build` typechecks and bundles production code. If dependencies are symlinked, use `npm run build -- --configLoader runner`.

References:
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications
- https://developers.google.com/tag-platform/security/guides/customize-cookies
- https://support.google.com/analytics/answer/10071811
