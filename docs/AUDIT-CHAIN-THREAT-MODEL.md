# What the audit hash chain does and does not prove

Loki's wedge is a receipt the buyer verifies without trusting us. That claim is
only worth making if we are precise about what the current chain actually
proves. This document states the limit, with a reproduction, because a
tamper-evidence claim that does not hold is worse than no claim: a buyer may
rely on it.

## Measured: the chain is re-forgeable

`src/audit/log.js` computes each entry hash as an unkeyed SHA-256 over public
fields, with a constant genesis:

- genesis is the literal string `GENESIS` (`src/audit/log.js:16`)
- `_computeHash` (`:127-134`) hashes `{seq,timestamp,who,what,where,why,metadata,previousHash}`
- every input to that hash is present in the file the attacker is editing

Nothing in the recipe is secret, so anyone who can write the log can recompute a
complete, internally consistent chain over invented history. Reproduced on
v9.28.1:

```
honest verify   : {"valid":true,"entries":2,"brokenAt":null,"error":null}
forged verify   : {"valid":true,"entries":2,"brokenAt":null,"error":null}
forged contents : NEVER HAPPENED | ALSO FORGED
```

The history was replaced wholesale and `verifyChain()` reported `valid: true`.

### The same holds for the dashboard chain

`dashboard/audit.py` is a separate implementation with the same property:
genesis is the constant `"0" * 64` (`:58`, `:115`), and `_compute_chain_hash`
(`:194-200`) is an unkeyed `sha256(prev_hash + entry_json)`. Its own docstring
at `:197` calls the result tamper-evident. Forged with the writer's exact recipe
(`json.dumps(entry, sort_keys=True, default=str)`, field `_integrity_hash`,
`:369-371`), `verify_log_integrity` reports:

```
forged verdict: {'valid': True, 'entries_checked': 2, 'first_tampered_line': None, ...}
contents      : NEVER HAPPENED | ALSO FORGED
```

One methodological note, because it nearly produced a false all-clear here: a
first forgery attempt using a guessed field name returned `valid: False` with
`entries_checked: 0`. That was the verifier rejecting the probe's SCHEMA, not
detecting tampering. A failed exploit can mean the probe was wrong rather than
the target is sound, and `entries_checked: 0` is the tell. Any future test of
this property must assert that entries were actually checked.

## What this means

The chain detects **accidental corruption and truncation**: a partial write, a
dropped line, a byte flip. Those are real failure modes and catching them has
value.

It does **not** detect a deliberate rewrite by anyone with write access to the
log, which is the threat an audit trail exists to address. Under the standard
audit-log threat model the writer is the adversary, and an unkeyed chain the
writer can recompute offers that adversary no obstacle.

Note the failure direction. A broken chain is strong evidence of a problem. An
intact chain is NOT evidence of integrity, because it is exactly what both an
honest run and a competent forgery produce. Absence of evidence is not evidence
of absence.

## What would actually close it

Tamper-evidence requires something the log's writer cannot reproduce. In
increasing order of strength:

1. **A keyed MAC** with a key the agent cannot read. Moves the problem to key
   custody; on a developer laptop where the agent runs as the user, there is
   often nowhere to put such a key that the agent cannot reach.
2. **An external witness**: periodically pin the chain tip somewhere append-only
   that the agent cannot rewrite. `writeWitness` already exists at
   `src/audit/crosslink.js:234` and has zero production callers.
3. **A signature over the tip** with a key held off the machine.

Only 2 and 3 survive an adversary who controls the machine, which is the case
that matters for a receipt a third party is meant to trust.

## Current honest claim

Until a witness or off-machine signature is wired, the supportable claim is:

> The audit log is hash-chained, which detects corruption and truncation. It is
> not tamper-proof against an adversary with write access to the log.

Do not describe the current chain as tamper-proof, tamper-resistant, or as
evidence a third party can rely on for integrity against a motivated writer.
