# contract-scaffold (M1: the contract-first codegen spine)

The single load-bearing mechanism behind "a real, wired app, not a static shell."
See `artifacts/beat-replit-engineering-plan.md` (studied from Replit's Adopt) and
`artifacts/replit-adopt-study.md`.

## What it does

`scaffold.sh <out_dir> <resource> [field:type ...]` emits a **contract-first**
project skeleton:

1. An **OpenAPI contract** (`openapi.yaml`) as a first-class artifact -- the single
   source of truth for the API.
2. An **Orval config** that generates typed react-query hooks FROM the contract.
3. `package.json` + `tsconfig.json` with a real codegen + typecheck script.

The point: after `npm run codegen`, a page can only call hooks that the contract
defines. A page referencing an endpoint the backend does not implement **fails
typecheck** -- so a static-shell-passed-off-as-wired becomes impossible.

## Proven (tests/test-contract-scaffold.sh, 7/7)

- scaffold -> real `openapi.yaml`
- real Orval codegen -> `useListBookmark` / `useCreateBookmark` / `useDeleteBookmark`
- a page on a REAL endpoint typechecks
- a page on a NON-CONTRACT endpoint **fails typecheck** (drift blocked)

Proven on a throwaway `bookmark` resource -- **general by construction, no
knowledge of any specific PRD** (anti-teaching-to-the-test).

## Status: STANDALONE + ADDITIVE -- wired into NO build lane

This is a capability module, like FV-1 was. It changes zero existing build
behavior. **Wiring it into the default build lane is the gated next step** (the
M1->"M1-wire" fork, analogous to FV-1->FV-2): that step touches the parity-locked
`run.sh`/`build_prompt.ts` core, reclassifies what every build produces, and
requires bash+bun parity work + council review + founder sign-off. Do NOT wire it
in as a solo/rushed action.

## Scope

Gap A (the generated app's own quality). NOT Gap B (Replit's managed cloud:
hosted DB provisioning, auth, secrets, deploy infra -- multi-quarter, out).

## Next (M2/M3, see the plan)

- M2: real Express+Drizzle+DB backend as the FLOOR of every full-stack scaffold.
- M3: design tokens + dark + skeleton/empty/first-run states.
- Then wire M1-M3 into the build lane (gated) and wire FV into the verdict (FV-2).
