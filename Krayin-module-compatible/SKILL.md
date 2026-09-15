---
name: krayin-compat
description: Use when a Krayin CRM module or package must be made compatible with the latest Krayin version. Triggers on "compatimize module", "make compatible", "upgrade module", "module compatibility", "fix module for latest Krayin", "update module to latest version", or when a module is dropped into the working directory and has to run on the current Krayin codebase. Also triggers when a Krayin module needs a security audit, a UI pass, or a performance pass before release.
---

# KrayinCompat — Module Compatibility with Latest Krayin CRM

Make a Krayin CRM module fully compatible with the **latest Krayin version** —
analyse the module code, fix compatibility issues, harden it against security
vulnerabilities, verify the admin UI workflow, optimise the code, update the
module's own documentation, and produce a **file-changes** directory
documenting every modification.

## The four standing requirements

Every run of this skill is judged against these four, in addition to
compatibility. None of them is optional and none of them may be traded away
to get a run finished.

| # | Requirement | Enforced by |
|---|---|---|
| 1 | **All changes live inside the module only** — no file outside the module package is changed, ever, beyond the three installation entries | G5, G7 |
| 2 | **The code is optimised** — no N+1 queries, no unindexed lookups, no work in a request that belongs in a queue | G13 |
| 3 | **The UI is perfect** — Krayin admin components, dark mode, responsive, RTL, loading/empty/error states, zero raw translation keys | G12 |
| 4 | **The module has no vulnerability or security issue** — ACL enforced, no injection, no XSS, no IDOR, no mass assignment, no hard-coded secrets | G11 |

And one delivery requirement:

| 5 | **The module's own docs are current** — `README.md`, `CHANGELOG.md`, and module metadata updated in the same change | G14 |

## Core principle — EVERYTHING LIVES IN THE MODULE

**No matter what happens, no file outside the module package is changed.**

Every fix, every config field, every ACL entry, every menu entry, every
translation string, every asset, every route — all of it lives inside
`packages/Webkul/<ModuleName>/` (or wherever the module package sits).

The **only** exception is the module's own installation registration
(see "The single exception" below). Nothing else. Ever.

If a compatibility problem seems to require editing a core file, that is a
signal the fix belongs somewhere else in the module — not a licence to edit
core. Find the module-side solution. Krayin's `mergeConfigFrom()` accepts
**dot-notation keys**, which means a module can register into `core_config`,
`acl`, `menu.admin` and even `krayin-vite.viters` entirely from its own
service provider. There is almost always a module-side answer.

## Gate protocol

The skill is gated. At every phase boundary there is a precondition with a
defined consequence — the skill either does the work correctly or says clearly
why it cannot.

### Outcomes

| Outcome | Meaning |
|---|---|
| **STOP** | Print the message, end the run. No further tool calls, no analysis, no workaround. |
| **BLOCK** | Cannot advance to the next phase or claim completion. Fix the cause, re-run the gate. |
| **CONFIRM** | Ask the user with `AskUserQuestion` before proceeding. |
| **DEGRADE** | Proceed, but the affected item is recorded as `NOT VERIFIED — <reason>` in the final report. |

### Gate summary

| # | Gate | Where | Fails when | Outcome |
|---|---|---|---|---|
| **R** | Resume | STEP -2 | A previous run stopped at a gate | CONFIRM |
| **G0** | Module presence | STEP -1 | No module in the working directory | STOP |
| **G1** | Module shape | STEP -1 | Not a Krayin package (no `composer.json` / no ServiceProvider) | STOP |
| **G2** | Host app valid | 1c-B | Host path is not a Krayin installation | STOP |
| **G3** | Version match | 1c-B | Host's real `KRAYIN_VERSION` ≠ interview target | CONFIRM |
| **G4** | Toolchain | 1c-A | PHP < 8.3 / no composer → STOP; no MySQL / no git → DEGRADE | STOP / DEGRADE |
| **G5** | Pre-write path guard | Every Edit/Write | Target path resolves outside the module + 3 install files | BLOCK |
| **G6** | Leak scan | 3d | Module still reads env / core config / core lang keys | BLOCK |
| **G7** | Containment | 3e, and before steps 5 and 6 | Anything modified outside the module + 3 install files | BLOCK → STOP if unrevertable |
| **G8** | Destructive-action confirm | 4a | About to run `migrate` / `vendor:publish --force` on the host app | CONFIRM → DEGRADE if declined |
| **G9** | Admin config | 4c | No module-side `core_config.php`, or raw lang key visible in admin UI | BLOCK |
| **G10** | ACL & menu | 4d | An admin route or action is not ACL-guarded, or menu/ACL keys mismatch | BLOCK |
| **G11** | Security audit | 4e | Any finding in the security checklist is unresolved | BLOCK |
| **G12** | UI quality | 4f | Any item in the UI checklist fails in the running admin panel | BLOCK |
| **G13** | Code optimisation | 4g | N+1 query, unindexed FK, or blocking external call in a request | BLOCK |
| **G14** | Documentation | 4h | Module `README.md` / `CHANGELOG.md` not updated for this change | BLOCK |
| **G15** | file-changes completeness | 5d | Modified files ≠ copied files ≠ CHANGES.md rows | BLOCK |
| **G16** | Report honesty | 6 | Success wording while a gate is red or verification never ran | BLOCK |

**Never route around a gate.** A red gate is the answer, not an obstacle.

## The single exception — module installation registration

A package cannot install itself. These three registration touch-points are
the ONLY files outside the module you may write to:

| File | Purpose |
|------|---------|
| Root `composer.json` | PSR-4 autoload entry for the module namespace |
| `config/concord.php` | Concord module registration (`Webkul\<Module>\Providers\ModuleServiceProvider::class` in the `modules` array) |
| `bootstrap/providers.php` | Service provider registration (`Webkul\<Module>\Providers\<Module>ServiceProvider::class`) |

**Krayin runs on Laravel 12 — providers live in `bootstrap/providers.php`, not
`config/app.php`.** Krayin's `config/app.php` has no `providers` array. Never
add one.

Rules for the exception:

- These are **installation steps**, not compatibility fixes. Apply them so the
  module can boot and be tested — nothing more.
- Keep them **minimal**: one autoload line, one concord entry, one provider
  entry. No other edits inside these files.
- Record each one in `CHANGES.md` under a separate **"Installation registration"**
  section so the user can see they are install steps, not module changes.
- Everything else that the module's README.md may ask you to change — env vars,
  `config/services.php`, admin `core_config.php`, admin lang, root
  `krayin-vite.php` — is **NOT** allowed. Those requirements must be
  re-implemented inside the module.

### A module can avoid even the provider entry

Krayin's root `composer.json` declares a path repository:

```json
"repositories": [
    { "type": "path", "url": "packages/*/*", "options": { "symlink": true } }
]
```

If the module's own `composer.json` carries its provider under
`extra.laravel.providers`, Laravel package discovery registers it without any
root edit — but only when the package is actually `require`d. Krayin core
instead lists PSR-4 + `bootstrap/providers.php` directly. **Keep the
`extra.laravel.providers` block in the module's own `composer.json` either
way** (that file is inside the module, so it is always allowed), and use the
three install entries to make the module boot in the host app.

## ABSOLUTELY FORBIDDEN — no exceptions

Never read-for-editing, never write, never suggest edits to:

- `packages/Webkul/Admin/` — including `src/Config/core_config.php`,
  `src/Config/acl.php`, `src/Config/menu.php` and
  `src/Resources/lang/*/app.php`
- `packages/Webkul/Core/`
- `packages/Webkul/Attribute/`, `packages/Webkul/DataGrid/`
- Any other `packages/Webkul/*` package that is not the module itself —
  `Activity`, `Automation`, `Contact`, `DataTransfer`, `Email`,
  `EmailTemplate`, `GoogleContact`, `Installer`, `Lead`, `Marketing`,
  `Product`, `Quote`, `Tag`, `User`, `Warehouse`, `WebForm`
- `.env` and `.env.example`
- `config/services.php`, `config/krayin-vite.php`, and every other root config
  file except the two registration files named above
- Root `resources/`, `public/`, root `routes/`, root `database/`, root `app/`
- Any file anywhere outside the module package

If the module currently *depends* on such an edit (e.g. its README says "add
this to `config/services.php`" or "add your viter to `config/krayin-vite.php`"),
that dependency must be **moved into the module** as part of the compatibility
work. The "Module-side answers" table below gives the replacement for each.

### G5 — Pre-write path guard (BLOCK)

Every rule above is prose until it is checked. **Before every single `Edit` or
`Write` call**, run this pre-flight:

1. Resolve the target to an **absolute path**.
2. Allow the write only if the path is:
   - inside the module package root (`<module-root>/**`), **or**
   - exactly one of the three install files: root `composer.json`,
     `config/concord.php`, `bootstrap/providers.php`.
3. Anything else → **do not write.** Re-solve the problem inside the module.

Watch for paths that *look* safe but are not: `../`, symlinks pointing out of
the module (Krayin's path repository symlinks `packages/*/*` into `vendor/`,
so `vendor/krayin/<module>` may resolve back into your module — write through
the real `packages/` path, never through `vendor/`), and publish targets under
root `public/` or `resources/`.

## Module-side answers — the replacement table

Whenever a compatibility fix looks like it needs a core edit, find it here
first. Every row is verified against Krayin 2.2.x.

| The module wants to… | Module-side answer |
|---|---|
| Read a setting from `.env` | Ship `src/Config/core_config.php`, `mergeConfigFrom(..., 'core_config')`, read with `core()->getConfigData()` |
| Add an admin settings screen | Same as above — the field group renders itself under **Configure** |
| Add a permission | Ship `src/Config/acl.php`, `mergeConfigFrom(..., 'acl')` |
| Add a sidebar / settings menu item | Ship `src/Config/menu.php`, `mergeConfigFrom(..., 'menu.admin')` |
| Register a Vite asset namespace | Ship `src/Config/krayin-vite.php`, `mergeConfigFrom(..., 'krayin-vite.viters')` |
| Register models with Concord | `src/Providers/ModuleServiceProvider.php` extending `BaseModuleServiceProvider` with `$models` |
| Add a translation string | `src/Resources/lang/<locale>/app.php`, `loadTranslationsFrom(..., '<module>')` |
| Add a Blade view or component | `src/Resources/views/`, `loadViewsFrom(...)` + `Blade::anonymousComponentPath(...)` |
| Add a DB table or column | `src/Database/Migrations/`, `loadMigrationsFrom(...)` |
| Add an admin route | `src/Routes/`, `loadRoutesFrom(...)`, wrapped in Krayin's admin middleware |
| Extend a core model's relations | `Relation::morphMap()` / `resolveRelationUsing()` from the module's provider |
| React to a core action | Event listener registered from the module's provider |

`mergeConfigFrom()` in Laravel 12 calls `$config->set($key, array_merge(require $path, $config->get($key, [])))`,
and both `set()` and `get()` understand dot notation. That is why
`'menu.admin'` and `'krayin-vite.viters'` work as merge targets — this is the
same mechanism Krayin's own `AdminServiceProvider` and `WebFormServiceProvider`
use.

One caveat, state it in the report if relevant: `mergeConfigFrom` is a no-op
when the host app has a cached config (`php artisan config:cache`). Krayin core
has the same constraint, so this is expected behaviour, not a module bug — but
always run `php artisan optimize:clear` before verifying.

## Configuration rule — module's own admin config only

**All configuration the module needs must be exposed through the module's own
admin configuration UI**, so it can be read anywhere in the project via
`core()->getConfigData()`.

- No `.env` variables.
- No entries added to `packages/Webkul/Admin/src/Config/core_config.php`.
- No root `config/*.php` files.
- No hard-coded credentials, URLs, or toggles in code.

### How the module ships its own admin config

Krayin's admin configuration file is **`core_config.php`** merged into the
**`core_config`** key. (It is *not* called `system.php` and *not* merged into
`core` — that is Bagisto's naming.)

`packages/Webkul/<Module>/src/Config/core_config.php`

```php
<?php

return [
    [
        'key'  => 'general.<module_key>',
        'name' => '<module>::app.configuration.title',
        'info' => '<module>::app.configuration.info',
        'icon' => 'icon-setting',
        'sort' => 10,
    ], [
        'key'  => 'general.<module_key>.settings',
        'name' => '<module>::app.configuration.settings.title',
        'info' => '<module>::app.configuration.settings.info',
        'sort' => 1,

        'fields' => [
            [
                'name'       => 'active',
                'title'      => '<module>::app.configuration.settings.active',
                'type'       => 'boolean',
                'default'    => 0,
                'validation' => 'required',
            ], [
                'name'       => 'api_key',
                'title'      => '<module>::app.configuration.settings.api-key',
                'type'       => 'text',
                'depends'    => 'active:1',
                'validation' => 'required_if:active,1',
            ], [
                'name'         => 'api_secret',
                'title'        => '<module>::app.configuration.settings.api-secret',
                'type'         => 'password',
                'depends'      => 'active:1',
                'channel_based' => false,
                'locale_based'  => false,
                'validation'   => 'required_if:active,1',
            ],
        ],
    ],
];
```

Field keys Krayin's `SystemConfig\Item` understands: `name`, `title`, `info`,
`type`, `depends`, `path`, `validation`, `default`, `channel_based`,
`locale_based`, `options` (array or `Class@method`), `tinymce`.

Field `type` values rendered by
`packages/Webkul/Admin/src/Resources/views/configuration/field-type.blade.php`:
`text`, `password`, `boolean`, `checkbox`, `select`, `multiselect`, `textarea`,
`editor`, `image`, `file`, `color`. There is no `date`/`datetime` field type —
use `text` with validation if you need one.

**Credentials need two things, not one.** Any field holding a credential must
be `'type' => 'password'` so it renders masked in the admin panel — but be
clear about what that does and does not buy you:

> Krayin stores `core_config` values **in plain text** in the `core_config`
> table. `type => password` masks the input control; it does **not** encrypt
> the value at rest. Verified against
> `packages/Webkul/Core/src/Repositories/CoreConfigRepository.php` and
> `SystemConfig.php` in 2.2.x — neither encrypts.

So a module that stores third-party credentials must encrypt them itself:
`Crypt::encryptString()` on write and `Crypt::decryptString()` on read, or an
`'encrypted'` cast if the module keeps credentials on its own model rather than
in `core_config`. Both the mask and the encryption are G11 items, not niceties.

`packages/Webkul/<Module>/src/Providers/<Module>ServiceProvider.php`

```php
public function register(): void
{
    $this->registerConfig();
}

protected function registerConfig(): void
{
    $this->mergeConfigFrom(dirname(__DIR__).'/Config/core_config.php', 'core_config');

    $this->mergeConfigFrom(dirname(__DIR__).'/Config/acl.php', 'acl');

    $this->mergeConfigFrom(dirname(__DIR__).'/Config/menu.php', 'menu.admin');
}
```

### How the rest of the project reads it

```php
$apiKey = core()->getConfigData('general.<module_key>.settings.api_key');
```

Choose the config `key` path so it lands in a group that exists in the running
Krayin version. Krayin 2.2.x ships two top-level groups in
`packages/Webkul/Admin/src/Config/core_config.php`: **`general`** and
**`email`**. A module may nest under one of those, or declare its own
top-level group by shipping the parent row itself. Verify the group by
**reading** core config (reading for reference is fine — editing is not).

## Translation rule — module's own lang files only

Every string the module renders — admin config titles, ACL labels, menu
labels, admin pages, validation messages, error messages — comes from the
module's own translation files.

- Location: `packages/Webkul/<Module>/src/Resources/lang/<locale>/app.php`
- Registered in the service provider:

```php
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__.'/../Resources/lang', '<module>');
}
```

- Every key is namespaced: `<module>::app.configuration.title`
- Never add or edit keys in `packages/Webkul/Admin/src/Resources/lang/*/app.php`
  or any other core lang file.
- If the module currently references a core translation key that no longer
  exists in the latest Krayin, **add the string to the module's own lang file**
  and point the code at the module key — do not restore the core key.
- Ship at minimum `en`; mirror any other locales the module already supported.
  Krayin ships RTL locales (`ar`, `fa`) — if the module ships either, the RTL
  layout check in G12 applies.

### Reconciling with the repository's AGENTS.md

The host repository's `AGENTS.md` states that a package gets its own
`Resources/lang/` **only if** it also has `Resources/views/`, and that
view-less packages keep their strings in the Admin package under `admin::app.*`.

That rule is for **core packages inside the Krayin monorepo**. It does not
apply here, and there is no conflict in practice:

- A module this skill works on is a third-party extension. Writing to
  `packages/Webkul/Admin/` is forbidden by requirement 1 regardless.
- A module with any admin UI has its own `Resources/views/`, so it satisfies
  the AGENTS.md condition anyway.
- A genuinely view-less module (a pure API/service package) still needs its
  own lang namespace here, because the Admin package is off limits.

Do not use AGENTS.md as grounds to write into `Admin`. Requirement 1 wins.

## STEP -2 — Resume gate R (CONFIRM)

A gate stopping the run is not the end of the work — it is a **pause with a
known position**. When the user fixes the cause and re-runs the skill, offer to
continue from exactly where it stopped instead of redoing everything.

### The run state file

`.krayin-compat-state.json` at the **workspace root** — a skill artifact, like
`file-changes/`, not part of the module and never inside it.

```json
{
  "module_path": "packages/Webkul/WhatsApp",
  "module_type": "integration",
  "target_version": "2.2.6",
  "host_app": "/path/to/krayin",
  "host_version": "2.2.6",
  "stopped_at": "G2",
  "outcome": "STOP",
  "reason": "No Krayin installation found at /path/to/phpmyadmin",
  "completed_steps": ["G0", "G1", "interview", "1a", "1b", "G4"],
  "degraded": ["G4: MySQL unreachable"],
  "notes": "module flow analysis complete, compatibility matrix not started"
}
```

**Write it every time a gate changes state** — on STOP, on BLOCK, on DEGRADE,
and on each completed step. A state file that is only written at the end is
worthless, because the runs that need resuming are exactly the ones that did
not reach the end.

Delete it when the run finishes cleanly through step 6.

### Resume flow — the very first action of the skill

1. No state file → normal run, straight to STEP -1.
2. State file present → read it and **CONFIRM** with the user:

```text
⏸  Previous run stopped at G2 (STOP)
   Reason:  No Krayin installation found at /path/to/phpmyadmin
   Module:  packages/Webkul/WhatsApp (integration, target 2.2.6)
   Done:    G0, G1, interview, module analysis
```

Offer three choices with `AskUserQuestion`:

| Option | Behaviour |
|---|---|
| **Resume from G2** | Re-validate the cheap gates, reuse stored answers and analysis, retry the failed gate |
| **Start fresh** | Archive the state file to `.krayin-compat-state.<n>.json` and run from STEP -1 |
| **Show details** | Print the stored state, then ask again |

### What a resume may and may not skip

**Always re-run, every time, even on resume** — these are cheap and the
filesystem may have changed underneath:

- **G0, G1** — the module may have moved, been replaced, or half-deleted
- **G5** — it is per-write, so it can never be "already done"
- **G7** — containment must be true *now*, not when the previous run checked it
- **G11** — a security finding is never "already handled" from a prior run
- The **failed gate itself** — that is the entire point of resuming

**Safe to reuse from state** — as long as the user confirms it still holds:

- Interview answers (module path, target version, host app, module type)
- Module flow analysis and file inventory (1b)
- The compatibility matrix (2c), for issues already fixed and verified

**Rules:**

- On resume, still show the interview answers and let the user change them —
  a G2 stop usually means the *host app answer itself* was wrong.
- Never resume past a gate that is still red. Resuming means retrying the
  gate, not skipping it.
- If the state file is missing fields, unreadable, or points at a path that no
  longer exists → treat it as no state file and start fresh. Never guess.

## STEP -1 — Module gates G0 + G1 (RUN AFTER THE RESUME GATE)

**Runs immediately after the resume gate.** Before the interview, before
reading any README, before any analysis — check that a module actually exists
in the current working directory, and that it is really a Krayin package.

Both gates run on every run, including resumed ones. Record the outcome of each
to `.krayin-compat-state.json` before stopping, so the next run can resume.

### G0 — How to detect a module

Look in the current working directory for any of these, in order:

1. `packages/Webkul/<Module>/` — a package directory that is **not** one of
   Krayin's own core packages
2. `src/` containing a module package (e.g. `src/Webkul/<Module>/`, or a folder
   with its own `composer.json` + `src/Providers/`)
3. The working directory itself being a module package — a `composer.json` with
   a `Webkul\<Module>\` PSR-4 namespace plus a `src/` directory

**Never count a Krayin core package as "the module".** These names are core and
are excluded from G0 detection: `Activity`, `Admin`, `Attribute`, `Automation`,
`Contact`, `Core`, `DataGrid`, `DataTransfer`, `Email`, `EmailTemplate`,
`GoogleContact`, `Installer`, `Lead`, `Marketing`, `Product`, `Quote`, `Tag`,
`User`, `Warehouse`, `WebForm`.

### G0 outcomes

**Zero modules found → STOP IMMEDIATELY.**

Print exactly this and exit. Do not ask the interview questions. Do not read
any other file. Do not search other directories. Do not offer to continue.

```text
❌ Module is not available in this directory.

Working directory: <cwd>

Place the module inside this directory (e.g. ./packages/Webkul/<ModuleName>)
and run the skill again — it will resume from this gate.
```

Then the skill run is **over**. No further tool calls, no analysis, no
suggestions about where else the module might be.

**Exactly one module found →** proceed to STEP 0 with that path.

**Multiple modules found →** list them and ask the user which one to work on,
then proceed to STEP 0.

**Rule: never go hunting for modules outside the current working directory.**
The module must be in the directory the skill was invoked from. If it is not
there, the answer is the message above — not a search.

### G1 — Module shape gate (STOP)

A folder is not a module just because it exists. Once G0 has picked a path,
confirm it is actually a Krayin package. It must have **both**:

1. A `composer.json` with a `Webkul\<Module>\` (or equivalent vendor) PSR-4
   autoload entry
2. A service provider — `src/Providers/*ServiceProvider.php`

Missing either → **STOP.** Print this and exit; do not start the interview, do
not read files, do not try to scaffold the missing pieces:

```text
❌ This is not a Krayin module package.

Path found: <module-path>
Missing:    <composer.json | src/Providers/*ServiceProvider.php>

KrayinCompat works on an existing Krayin package. Place a complete module
in this directory and run the skill again.
```

This gate exists because a half-copied folder or a stray `src/` will otherwise
consume a full interview and analysis before the problem surfaces.

## STEP 0 — Read the Module's README.md (MANDATORY)

**Before doing anything else, read the module's `README.md`.** It tells you
what the module author *intended* — which is useful context, but it is **not**
an authorization list.

Read it to learn:

- What the module is supposed to do
- What configuration values it expects
- What integration points it assumes
- What external services it talks to

**Then reconcile it with the rules above:**

| README asks for | What you do |
|---|---|
| composer.json autoload / concord / `bootstrap/providers.php` entry | Apply it (the single exception) |
| `.env` variables | Re-implement as module admin config fields |
| `config/services.php` entries | Re-implement as module admin config fields |
| Admin `core_config.php` entries | Re-implement in the module's own `src/Config/core_config.php` |
| Admin `acl.php` / `menu.php` entries | Re-implement in the module's own `src/Config/acl.php` / `menu.php` |
| Root `config/krayin-vite.php` viter | Re-implement as a module `src/Config/krayin-vite.php` merged into `krayin-vite.viters` |
| Admin lang keys | Re-implement in the module's own lang files |
| `config/app.php` providers array | Not applicable — Laravel 12 uses `bootstrap/providers.php` |
| Any other core edit | Do not apply — solve it inside the module |

Note what the README claims, because G14 will require you to **correct the
README** wherever this table says "re-implement". A README that still tells
users to edit `.env` after you moved the setting into admin config is a
documentation bug you introduced, and G14 blocks on it.

## STEP 0b — Analyze Module Flow and Functionality (MANDATORY)

After reading the README.md, analyze the module's real-world workflow:

1. **Read every file** in the module — Controllers, Views, Routes, Config, etc.
2. **Trace the user flow** — What does the admin user see? What happens on click?
3. **Map API endpoints** — What does each route do? What third-party services?
4. **Identify integration points** — How does it connect to Krayin core?
   (Lead pipelines, Person/Organization contacts, Activities, Quotes,
   Attributes, DataGrid, Bouncer/ACL, the Automation workflow engine.)
5. **Note configuration dependencies** — What config keys does it read, and
   where do those values currently come from (env? core config? hard-coded)?
6. **Note translation dependencies** — Which lang keys does it use, and are
   they module-namespaced or core keys?
7. **Note the trust boundaries** — every point where data enters from outside:
   request input, route parameters, uploaded files, third-party webhooks,
   API responses. These become the G11 audit surface.
8. **Document the architecture** — How do the pieces fit together?

Anything found in 5 and 6 that lives outside the module becomes a
compatibility task: **move it into the module.**

## Workflow

### 0. Gather information — EVERY time (mandatory)

**Only runs if STEP -1 found a module.** If the gate printed
"Module is not available in this directory", the run already ended — never
reach this step.

**Ask before any analysis or modification.** Use the `AskUserQuestion`
tool. This is not optional — repeat the full interview on every fresh run.

**On a resumed run** (gate R), show the stored answers and ask whether they
still hold, rather than asking from scratch. Always allow changing them — a
G2/G3 stop usually means one of these answers was the problem. Write the
confirmed answers back to `.krayin-compat-state.json`.

Ask, at minimum:

1. **Module confirmation** — confirm the module path found by STEP -1
   (e.g. `packages/Webkul/WhatsApp`). If STEP -1 found several, ask which one.
2. **Krayin target version** — the latest Krayin version the module
   must be compatible with (e.g. `2.2.6` or `master`).
3. **Krayin host app location** — where is the Krayin installation?
   Is it in the workspace or elsewhere? The skill needs access to the
   latest Krayin source for comparison.
4. **Module purpose** — brief description of what the module does
   (integration, channel, reporting, automation, etc.) to understand its
   integration points.

Rules:

- Ask every field **every time**; never assume from prior runs.
- Do not proceed until the interview is complete.

### 1. Read README.md & Analyze Module (MANDATORY — before any changes)

**This step must happen BEFORE any code analysis or modification.**

#### 1a. Read the module's README.md

See STEP 0. Produce three lists:

- **Install steps** — the three registration entries only.
- **Migration tasks** — every README instruction that touches a forbidden
  file, restated as "move X into the module".
- **README corrections** — every instruction that will be false once the
  migration tasks are done. G14 consumes this list.

#### 1b. Analyze module flow and functionality

Read EVERY file in the module and document:

1. **File inventory** — list all files with their purpose
2. **User flow** — trace the admin journey from start to finish
3. **API endpoints** — what each route does, parameters, responses
4. **Third-party integrations** — external APIs, SDKs, services
5. **Configuration dependencies** — every config/env key the module reads
6. **Translation dependencies** — every lang key the module renders
7. **Trust boundaries** — every external input point (G11 audit surface)
8. **Integration points** — how it connects to Krayin core
9. **Architecture** — how the pieces fit together

#### 1c. Environment setup & prerequisites

**A. G4 — Toolchain gate (STOP / DEGRADE)**

| Check | Missing / wrong → |
|---|---|
| `php -v` — must be **8.3+** for current Krayin 2.2.x (root `composer.json` requires `php: ^8.3`) | **STOP** — the module cannot be verified on this PHP |
| `composer --version` — 2.5+ | **STOP** — autoload and install steps are impossible |
| MySQL 8.0.32+ / MariaDB 11.4 LTS+ reachable | **DEGRADE** — steps 4c–4g cannot run; every UI item becomes `NOT VERIFIED — no database` |
| `git` available in the host app | **DEGRADE** — G7 falls back to a manually tracked file list; say so in the report |
| `node` + `npm` (only if the module ships Vite assets) | **DEGRADE** — asset build unverified |

STOP message format:

```text
❌ Prerequisite not met: <what> (found: <version/absent>, needed: <requirement>)

KrayinCompat cannot verify the module in this environment.
```

DEGRADE is never silent — it is carried all the way to G16 and printed in the
final report.

**B. G2 — Host app gate (STOP) and G3 — Version gate (CONFIRM)**

**G2** — the host app path from the interview must actually be a Krayin
installation. Require **both** `artisan` and `packages/Webkul/Core/`. Neither
present → **STOP**:

```text
❌ No Krayin installation found at: <path>

Expected `artisan` and `packages/Webkul/Core/`.
Give a valid Krayin host app path and run the skill again.
```

Guard against the near miss: a Bagisto checkout also has `artisan` and
`packages/Webkul/Core/`. Confirm it is Krayin by requiring **one** of:

- root `composer.json` `name` is `krayin/laravel-crm`
- `packages/Webkul/Core/src/Core.php` defines `KRAYIN_VERSION`
- `config/krayin-vite.php` exists

A Bagisto install where Krayin was expected → **STOP** with the message above.
Do not run this skill against Bagisto; that is what `bagisto-compat` is for.

**G3** — read the host's *actual* version, in this order:

1. `packages/Webkul/Core/src/Core.php` — the `KRAYIN_VERSION` constant
   (authoritative; `2.2.6` in this checkout)
2. Root `composer.json` — `krayin/laravel-crm` constraint
3. `composer.lock` — resolved version

If it does not match the target version given in the interview → **CONFIRM**
with the user before continuing. Do not silently proceed and do not stop on
your own: targeting `master` against a `2.2.6` checkout is a legitimate choice,
but comparing a module against the wrong reference wastes the whole run.

Record both the target and the host's real version in `CHANGES.md`.

Then read (reference only, never edit):

- Root `composer.json` — Laravel / PHP / package constraints
- `config/` — core configuration files (`concord.php`, `krayin-vite.php`)
- `bootstrap/providers.php` — provider registration shape
- `packages/Webkul/` — core package structure for pattern reference

### 2. Analyse the module against latest Krayin

**This is the critical step.** The skill must deeply understand both the
module's code AND the latest Krayin structure to identify incompatibilities.

#### 2a. Module structure analysis

Read and map every file in the module:

- **Service Provider** — `src/Providers/<Module>ServiceProvider.php`: how it
  registers config, routes, views, migrations, translations, Blade component
  paths, commands, events. Compare with `WebFormServiceProvider` and
  `AdminServiceProvider`.
- **Concord Module Provider** — `src/Providers/ModuleServiceProvider.php`:
  must extend `Webkul\Core\Providers\BaseModuleServiceProvider` and declare
  `protected $models = [...]`.
- **Routes** — `src/Routes/*.php`: definitions, middleware, naming conventions.
- **Controllers** — namespace, base class, DI pattern, request handling,
  response format.
- **Models** — namespace, base class, Contracts + `*Proxy` classes,
  relationships, casts, `$fillable`.
- **Contracts** — `src/Contracts/`: one interface per model, bound by Concord.
- **Repositories** — extend `Webkul\Core\Eloquent\Repository` (prettus
  `BaseRepository` + `CacheableRepository`), with a `model()` method returning
  the Contract FQCN.
- **DataGrids** — `src/DataGrids/`: extend `Webkul\DataGrid\DataGrid`,
  `prepareQueryBuilder()`, `prepareColumns()`, `prepareActions()`,
  `prepareMassActions()`.
- **Config** — `src/Config/*.php`: `core_config.php`, `acl.php`, `menu.php`,
  and `krayin-vite.php` as applicable.
- **Views** — Blade templates: `x-admin::layouts`, admin components,
  Vue 3 inline templates via `@pushOnce('scripts')`.
- **Migrations** — `src/Database/Migrations/`: schema builder syntax, FK
  constraints, indexes.
- **Events/Listeners** — dispatching pattern, listener registration.
- **Commands** — Artisan signature and handle pattern.
- **Assets** — JS/CSS: `vite.config.js`, `tailwind.config.js`,
  `postcss.config.js`, viter registration, `krayin-vite` usage.
- **Lang** — `src/Resources/lang/`: namespace registration, key coverage.
- **Database** — seeders, factories if present.
- **Docs** — `README.md`, `CHANGELOG.md`, `composer.json` metadata.

#### 2b. Latest Krayin structure reference

Read the corresponding files from the latest Krayin core packages to learn the
current patterns. The best reference targets:

| Want the pattern for… | Read |
|---|---|
| A full module with its own views, assets, routes, ACL and menu | `packages/Webkul/WebForm/` |
| Service provider + config merging + middleware aliases | `packages/Webkul/Admin/src/Providers/AdminServiceProvider.php` |
| Admin config field definitions | `packages/Webkul/Admin/src/Config/core_config.php` |
| Config resolution and `core()->getConfigData()` | `packages/Webkul/Core/src/Core.php`, `src/SystemConfig.php` |
| Repository base class | `packages/Webkul/Core/src/Eloquent/Repository.php` |
| Concord model binding | `packages/Webkul/Core/src/Providers/BaseModuleServiceProvider.php` |
| DataGrid | `packages/Webkul/DataGrid/`, `packages/Webkul/Admin/src/DataGrids/` |
| Admin Blade components | `packages/Webkul/Admin/src/Resources/views/components/` |
| Route + middleware conventions | `packages/Webkul/Admin/src/Routes/Admin/` |
| Attribute-driven entities | `packages/Webkul/Attribute/` |

**Read only. These files are never edited.**

#### 2c. Compatibility matrix

Produce a checklist of potential compatibility issues:

| Area | Check For | Status |
|------|-----------|--------|
| **Namespace** | PSR-4 autoloading matches composer.json | |
| **Service Provider** | Registration matches latest pattern, `: void` return types | |
| **Concord Provider** | Extends `BaseModuleServiceProvider`, `$models` populated | |
| **Base Classes** | Controllers/Models/Repositories extend correct base | |
| **Route Registration** | `['web', 'admin_locale', 'user']` middleware, `admin.*` names, `config('app.admin_path')` prefix | |
| **Admin Config** | Defined in module `src/Config/core_config.php`, merged into `core_config` | |
| **ACL** | Module `src/Config/acl.php` merged into `acl`, every route covered | |
| **Menu** | Module `src/Config/menu.php` merged into `menu.admin`, keys match ACL | |
| **Config Reads** | All values via `core()->getConfigData()`, none from env | |
| **Translations** | All keys module-namespaced, no core lang dependency | |
| **View Components** | `x-admin::*` components match latest, dark-mode classes present | |
| **Vite / Assets** | Viter registered from the module, build output resolves | |
| **Migration Syntax** | Schema builder compatible with Laravel 12; FKs indexed | |
| **Event Pattern** | Event/listener registration correct | |
| **Dependencies** | module composer.json constraints current (PHP ^8.3, Laravel ^12) | |
| **Deprecated Methods** | No calls to removed/renamed Krayin or Laravel methods | |
| **Type Hints** | PHP 8.3 compatibility; no implicit nullable params | |
| **Return Types** | Method signatures match expected interfaces | |
| **Security** | Every G11 checklist row clear | |
| **UI** | Every G12 checklist row clear | |
| **Performance** | Every G13 checklist row clear | |
| **Docs** | README/CHANGELOG updated (G14) | |
| **Containment** | Zero references requiring edits outside the module | |

The **Containment**, **Security**, **UI**, **Performance** and **Docs** rows are
hard gates: all five must be green before you report completion.

### 3. Identify and fix compatibility issues

For each issue found in step 2c:

#### 3a. Document the issue

Note the file, line number, what is wrong, and what the latest Krayin
pattern expects.

#### 3b. Fix the issue inside the module

**RULE: only files inside the module package are modified.**

Common fixes:

1. **Namespace updates** — PSR-4 namespace in the module's `composer.json`.
2. **Service Provider** — update registration to the latest pattern; add
   `mergeConfigFrom` for `core_config`/`acl`/`menu.admin`,
   `loadTranslationsFrom`, `loadViewsFrom`, `Blade::anonymousComponentPath`,
   `loadMigrationsFrom`, and register the Concord `ModuleServiceProvider`.
3. **Concord registration** — `$models` array on the module's
   `ModuleServiceProvider`; add missing `*Proxy` classes and `Contracts`.
4. **Base class changes** — update `extends` to current base classes
   (`Webkul\Core\Eloquent\Repository`, `Webkul\DataGrid\DataGrid`).
5. **Route updates** — middleware aliases (`user`, `admin_locale`,
   `sanitize_url`), route group structure, `admin.`-prefixed names.
6. **Config migration** — move every env/core/hard-coded value into the
   module's `src/Config/core_config.php` and read it with
   `core()->getConfigData()`.
7. **ACL & menu migration** — move permission and menu entries into the
   module's own `acl.php` / `menu.php`.
8. **Translation migration** — move every string into the module's lang files
   under the module namespace.
9. **View updates** — Blade/Vue patterns to match latest admin components.
10. **Migration fixes** — schema syntax for Laravel 12; add indexes.
11. **Method signature fixes** — return/parameter types match current interfaces.
12. **Event updates** — dispatching and listener registration.
13. **Asset build updates** — module `vite.config.js` and viter registration.
14. **Dependency updates** — version constraints in the module's `composer.json`.
15. **Security fixes** — everything G11 turns up.
16. **Performance fixes** — everything G13 turns up.

#### 3c. Apply fixes

Edit each file that needs changes. Preserve the module's original code
style and conventions while making it compatible. Run `./vendor/bin/pint`
scoped to the module path before finishing — Krayin's CI applies Pint (PSR-12).

```bash
./vendor/bin/pint packages/Webkul/<Module>
```

#### 3d. G6 — Leak scan gate (BLOCK)

The Configuration and Translation rules are only real if you check them. Run
these greps **inside the module directory**:

```bash
# config leaks — values must come from the module's own admin config
grep -rn "env(\|getenv(\|\$_ENV\|config('services\|config(\"services" src/

# root-config leaks — the module must not depend on root config files
grep -rn "config('krayin-vite\|config('concord\|config('app.providers" src/

# translation leaks — keys must be module-namespaced
grep -rnE "(admin|core|lead|contact|activity|quote|product|user|attribute|datagrid|email|email_template|marketing|tag|warehouse|web_form|automation|installer|data_transfer)::" src/

# hard-coded endpoints and secrets
grep -rniE "https?://|api[_-]?key\s*=|secret\s*=|token\s*=|password\s*=" src/
```

Any hit → **BLOCK.** Do not advance to step 4:

- config leak → add the field to the module's `src/Config/core_config.php` and
  read it with `core()->getConfigData()`
- root-config leak → merge the module's own config file into the dotted key
  from its service provider (see "Module-side answers")
- lang leak → add the string to the module's own lang file and switch the code
  to the module-namespaced key
- hard-coded endpoint/secret → make it an admin config field

Re-run the greps until they are clean. Legitimate exceptions (a vendor SDK's
fixed API base URL, a URL inside a comment or README, a `@lang` key that is
genuinely the module's own namespace) are allowed — but list each one
explicitly in `CHANGES.md` under Notes, so the exception is a decision on the
record rather than an oversight.

#### 3e. G7 — Containment gate (BLOCK → STOP)

Run a status check over the host app:

```bash
git -C <host-app> status --porcelain
```

The **only** paths allowed to appear are the module directory and the three
install files (root `composer.json`, `config/concord.php`,
`bootstrap/providers.php`).

- Anything else → **BLOCK.** Revert that file and move the logic into the
  module.
- Cannot be reverted, or the module genuinely cannot work without the core
  edit → **STOP** and report it. Do not produce `file-changes/`, do not claim
  compatibility, do not leave the edit in place quietly.

**G7 runs three times**, not once:

1. Here, after step 3
2. Before step 5 — step 4's UI debugging is exactly where a stray core edit
   creeps in
3. Before the step 6 report

If git is unavailable (G4 DEGRADE), track the file list manually and say so in
the report.

### 4. Verify, harden, optimise

#### 4a. Install the module

Apply only the three registration entries (root `composer.json` autoload,
`config/concord.php` modules array, `bootstrap/providers.php`).

**G8 — Destructive-action confirm (CONFIRM → DEGRADE)**

Before running the commands below, **ask the user**. `migrate` changes the
database and `vendor:publish --force` overwrites already-published assets and
config — on a live CRM holding real leads and contacts that is destructive and
not trivially reversible.

Confirm that the host app is a disposable/test install, or that the database is
backed up. Ask before the first run of the skill against a given host app; the
answer holds for the rest of that run.

- Approved → run them.
- Declined → **DEGRADE.** Skip the install commands and all of step 4. Every
  verification item becomes `NOT VERIFIED — install declined` in the report,
  and the report must not claim compatibility, security, UI quality, or
  performance.

```bash
composer dump-autoload
php artisan optimize:clear
php artisan migrate
php artisan vendor:publish --provider="Webkul\<Module>\Providers\<Module>ServiceProvider" --force
```

`php artisan optimize:clear` is mandatory before every verification pass —
`mergeConfigFrom` is skipped entirely while the config cache is warm, which
makes a correct module look broken.

Nothing else outside the module is touched at any point.

#### 4b. Route verification

```bash
php artisan route:list --path=<module-prefix>
```

- Check middleware is correctly applied (`web`, `admin_locale`, `user`)
- Verify named routes resolve and follow the `admin.<module>.*` convention
- Confirm no admin route is reachable without the `user` (Bouncer) middleware

#### 4c. G9 — Admin configuration gate (BLOCK)

Static check first — if the module has **any** configurable value, it must ship
its own `src/Config/core_config.php` merged into `core_config` from its service
provider. Missing → **BLOCK**; go back to 3b and add it.

Then verify in the running admin panel:

- Log into the admin panel (`/admin/login`)
- Navigate to **Configure** and find the section the module registers
- Confirm the module's section appears with the correct **translated** title
- Save values, reload, confirm persistence
- Confirm the values are readable in code via `core()->getConfigData()`
- Confirm credential fields render masked (`type => password`) **and** that
  the value in the `core_config` table is not readable plain text

**BLOCK conditions:**

| Symptom | Meaning |
|---|---|
| Section does not appear | `mergeConfigFrom` missing, merged into the wrong key (`core` instead of `core_config`), config cache warm, or the `key` path targets a group that does not exist in this Krayin version |
| Raw `<module>::app...` key visible instead of a label | Missing lang entry — fix in the module's own lang file |
| Values do not persist | Field definition wrong (`name`, `type`, `validation`) |
| `core()->getConfigData()` returns null | Config key path mismatch between `core_config.php` and the calling code |
| A secret renders in plain text | Field is not `type => password` — a G11 finding too |
| A secret is plain text in the `core_config` table | Krayin does not encrypt config at rest; the module must encrypt it itself — a G11 finding |

None of these may be waved through. Fix inside the module and re-verify.

#### 4d. G10 — ACL & menu gate (BLOCK)

Krayin gates admin access through the Bouncer (`user` middleware) and the
`acl` config. A module that skips this ships an authorisation hole, and the
UI will render actions the user cannot perform.

Check every one:

- [ ] Module ships `src/Config/acl.php`, merged into `acl`
- [ ] Every admin route the module adds has a matching ACL `key` + `route`
      entry — including `store`, `update`, `delete` and mass-action routes,
      not just `index`
- [ ] ACL `key`s follow the dotted hierarchy of the section the module lives
      in (e.g. `settings.other_settings.<module>.create`)
- [ ] Menu entries in `src/Config/menu.php` use `key`s that line up with the
      ACL keys, so the menu hides itself for users without permission
- [ ] Every action in a Blade view is wrapped in
      `@if (bouncer()->hasPermission('<key>'))`
- [ ] The permission is checked **server-side in the controller too**, not
      only in the view — a hidden button is not an authorisation control
- [ ] **Admin → Settings → Roles** shows the module's permissions with
      translated labels, and a custom role without them really is denied

Any unchecked box → **BLOCK.**

#### 4e. G11 — Security audit gate (BLOCK)

**The module must have no vulnerability or security issue.** Audit every trust
boundary found in 1b-7. Every row must be resolved; a row you cannot resolve is
a BLOCK, not a note.

**Authorisation & access**

- [ ] Every admin route behind the `user` middleware and an ACL check
- [ ] No IDOR: every record lookup is scoped to what the current user may see
      (`auth()->guard('user')->user()`), never a bare `find($request->id)` on a
      user-supplied id
- [ ] Mass actions re-check permission and ownership for **every** id in the
      batch, not just the first
- [ ] Public/webhook routes are deliberately public, documented as such, and
      verify a signature or shared secret before doing any work
- [ ] No route added to a CSRF exclusion list

**Injection**

- [ ] No string interpolation into `DB::raw`, `whereRaw`, `orderByRaw`,
      `havingRaw`, `selectRaw` — bind parameters instead
- [ ] DataGrid sort/filter columns validated against an allow-list, never
      taken straight from the query string into `orderBy`
- [ ] No user input reaching `exec`, `shell_exec`, `proc_open`, `system`,
      `eval`, `unserialize`

**Output / XSS**

- [ ] Blade escapes by default — `{{ }}` everywhere; every `{!! !!}` is
      justified in writing and its source is sanitised
- [ ] Values interpolated into inline `<script>` blocks go through
      `@json()` / `json_encode`, never raw echo
- [ ] Rich-text/editor config fields are sanitised on output
- [ ] SVG uploads pass through `enshrined/svg-sanitize` (already a Krayin
      dependency) — never trust an uploaded SVG

**Mass assignment & models**

- [ ] Every model declares an explicit `$fillable`; none uses `$guarded = []`
- [ ] No `->update($request->all())` / `->create($request->all())` — use
      `$request->validated()` or an explicit `only([...])`
- [ ] Sensitive attributes listed in `$hidden`, and casts applied
      (`'encrypted'` for stored secrets)

**Input validation**

- [ ] Every write route validated through a FormRequest or `$request->validate()`
- [ ] File uploads constrained with `mimes:`/`mimetypes:` **and** `max:`;
      stored via the `Storage` facade with a generated name — never
      `getClientOriginalName()` into a public path
- [ ] Redirect targets are internal or allow-listed (open-redirect); use the
      `sanitize_url` middleware where Krayin does
- [ ] No unbounded `per_page` / `limit` accepted from the request

**Secrets & transport**

- [ ] No credential, token, or private key anywhere in the module source,
      config defaults, seeders, or tests
- [ ] Secrets live in admin config as `type => password` and are read via
      `core()->getConfigData()`
- [ ] Stored credentials are encrypted by the module (`Crypt::encryptString()`
      or an `'encrypted'` cast) — Krayin writes `core_config` values to the
      database in plain text, so `type => password` alone is not protection
- [ ] Outbound HTTP uses TLS with verification on — never
      `'verify' => false` or `CURLOPT_SSL_VERIFYPEER => false`
- [ ] No secret, token, or full request/response body containing one is
      written to `Log::` or `storage/logs`
- [ ] Third-party webhook payloads are treated as untrusted input and
      validated before use

**Dependencies**

```bash
composer audit --locked
```

- [ ] No known-vulnerable package introduced by the module's own `require`

Record every finding and its fix in `CHANGES.md` under a **Security** section.
If a finding is a deliberate accepted risk, it needs the user's explicit
approval via `AskUserQuestion` and a Notes entry — never a silent pass.

#### 4f. G12 — UI quality gate (BLOCK)

**The UI must be perfect.** Start the app (`php artisan serve`), log in, and
walk every screen the module adds. Every row is checked in the browser, not
inferred from the code.

**Krayin component conventions**

- [ ] Pages wrap in `<x-admin::layouts>` with a `<x-slot:title>`
- [ ] `<x-admin::breadcrumbs name="..." />` present on every page
- [ ] Lists use `<x-admin::datagrid>` with `<x-admin::shimmer.datagrid />`
      as the loading state — not a hand-rolled table
- [ ] Forms use `<x-admin::form>` + `<x-admin::form.control-group>` with
      `label`, `control`, and `error` slots
- [ ] Modals/drawers use `<x-admin::modal>` / `<x-admin::drawer>`
- [ ] Buttons use `primary-button` / `secondary-button`, not ad-hoc classes
- [ ] Icons come from Krayin's icon font (`icon-*`), consistent with core
- [ ] Feedback uses the flash-message pattern core uses
      (`session()->flash('success', ...)` → `<x-admin::flash-group>`)

**Presentation**

- [ ] **Dark mode**: every colour utility has its `dark:` counterpart. Toggle
      the theme and check each screen — this is the single most common miss.
- [ ] **Responsive**: no horizontal scroll at 1280px, 1024px, and 768px
- [ ] **RTL**: if the module ships `ar` or `fa`, switch locale and confirm the
      layout mirrors correctly (use logical spacing utilities, not hard `ml-`/`mr-`)
- [ ] Spacing, font sizes and border radii match the surrounding admin pages

**States**

- [ ] Loading state for every async region (shimmer or spinner)
- [ ] Empty state with a meaningful message, not a blank table
- [ ] Error state — a failed API call surfaces a readable message, never a
      raw exception or a silent no-op
- [ ] Destructive actions ask for confirmation
- [ ] Long-running actions disable their trigger so they cannot double-submit

**Content & accessibility**

- [ ] Zero raw translation keys visible anywhere (`<module>::app...` on screen
      is an automatic BLOCK)
- [ ] Every form control has an associated label
- [ ] Validation errors render inline next to their field
- [ ] Keyboard focus is visible and tab order is sane
- [ ] No console errors and no failed network requests in DevTools

**Verification**

- [ ] Every screen checked in the running app
- [ ] `storage/logs/laravel.log` clean after the walkthrough

Any unchecked box → **BLOCK.** Fix inside the module and re-walk the screen.

#### 4g. G13 — Code optimisation gate (BLOCK)

**The code must be optimised.** Measure, do not assume — install
`barryvdh/laravel-debugbar` (already a Krayin dev dependency) or log queries
while walking the module's screens.

- [ ] **No N+1 queries.** Every relation touched in a loop or a Blade template
      is eager-loaded (`with()`, or `load()` after the fact). Watch DataGrid
      column closures and activity/lead relation rendering especially.
- [ ] No queries issued inside a Blade loop
- [ ] `select()` narrows to the columns actually used on list screens
- [ ] Filtering, sorting and pagination happen in SQL — never `->get()` then
      `->filter()` in PHP
- [ ] Every foreign key and every column used in a `where`/`orderBy` on a
      large table has an index in the module's migration
- [ ] Migrations declare FK constraints with explicit `onDelete` behaviour
- [ ] Repository caching (`CacheableRepository`) used where reads are hot and
      invalidated on write
- [ ] **No blocking third-party HTTP call inside a web request** — dispatch a
      queued job; set an explicit connect/read timeout on every outbound call
- [ ] Bulk writes use `insert`/`upsert`/`chunk`, not a loop of `save()`
- [ ] Long-running imports/exports run through a queue or a chunked command
- [ ] Config read once per request where it is used repeatedly, not per row
- [ ] Assets built through the module's Vite config; no unminified or
      duplicated vendor bundle shipped
- [ ] `./vendor/bin/pint packages/Webkul/<Module>` reports clean
- [ ] Module test suite passes: `php artisan test --compact`

Record the before/after query count for the module's heaviest screen in
`CHANGES.md`. Any unchecked box → **BLOCK.**

#### 4h. G14 — Documentation gate (BLOCK)

**Update the module's own documentation files in the same change.** All of
these live inside the module, so they are always allowed — and leaving them
stale is a defect, not a cosmetic issue.

- [ ] **`README.md`** — every correction from 1a applied: install steps reflect
      the three real registration entries, the `.env`/`config/services.php`
      instructions are replaced with the admin-config path
      (**Configure → …**), requirements say PHP 8.3+ / Laravel 12 / the
      verified Krayin version, and any removed or renamed feature is updated
- [ ] **`CHANGELOG.md`** — an entry under the topmost unreleased version
      heading describing this change. Create the file if the module has none.
      Never invent a PR number and never bump a version outside a release
      change.
- [ ] **`composer.json`** — `require` constraints reflect PHP `^8.3` and any
      Krayin/Laravel packages the module actually uses; `extra.laravel.providers`
      present and correct
- [ ] Any other doc the module ships (`UPGRADE.md`, `docs/`, install guide,
      screenshots referencing a changed screen) updated for what changed
- [ ] The module's lang files carry every new string added by this work

Changelog entry format:

```markdown
## [Unreleased]

### Fixed
- Compatibility with Krayin CRM 2.2.6: service provider registration, route
  middleware, and Laravel 12 migration syntax.

### Changed
- Moved API credentials from `.env` into admin configuration
  (**Configure → General → <Module>**).

### Security
- Added ACL checks to every admin route and fixed mass assignment on
  `<Module>` model.
```

Any unchecked box → **BLOCK.**

#### 4i. Error detection

If any error appears during 4b–4h:

1. Read the error message carefully
2. Check `storage/logs/laravel.log` for stack traces
3. Identify the root cause in the module code
4. Fix it — still only inside the module
5. Re-verify, and re-run the gate that surfaced it

### 5. Create file-changes directory

After all fixes are applied and verified, create a `file-changes/`
directory at the workspace root with a complete record of every modification.

#### 5a. Directory structure

```text
file-changes/
├── CHANGES.md              # Summary of all changes (mandatory)
├── <module-name>/          # Mirrors the module's directory structure
│   ├── src/
│   │   ├── Config/
│   │   │   ├── core_config.php
│   │   │   ├── acl.php
│   │   │   └── menu.php
│   │   ├── Providers/
│   │   │   ├── <Module>ServiceProvider.php
│   │   │   └── ModuleServiceProvider.php
│   │   └── Resources/lang/en/app.php
│   ├── CHANGELOG.md
│   ├── README.md
│   └── composer.json
└── patches/                # Individual change files (optional)
    ├── 001-fix-service-provider.patch
    └── 002-update-routes.patch
```

#### 5b. CHANGES.md format

````markdown
# Module Compatibility Changes — <module-name>

**Target Krayin Version:** <version>
**Module:** <module-path>

## Summary

<brief overview of what was changed and why>

## Containment Statement

All changes are inside `packages/Webkul/<Module>/`.
Files touched outside the module: only the installation registration entries
listed below. No core package, env, or root config file was modified.

## Installation Registration (outside the module — install steps only)

| # | File | Entry Added |
|---|------|-------------|
| 1 | composer.json | PSR-4: `"Webkul\\<Module>\\": "packages/Webkul/<Module>/src"` |
| 2 | config/concord.php | `\Webkul\<Module>\Providers\ModuleServiceProvider::class` |
| 3 | bootstrap/providers.php | `Webkul\<Module>\Providers\<Module>ServiceProvider::class` |

## Files Modified (inside the module)

| # | File | Change Type | Description |
|---|------|-------------|-------------|
| 1 | src/Providers/<Module>ServiceProvider.php | Modified | Merged module config into `core_config`, `acl`, `menu.admin`; registered translations and views |
| 2 | src/Config/core_config.php | Added | Module's own admin configuration fields |
| 3 | src/Config/acl.php | Added | Module permissions |
| 4 | src/Resources/lang/en/app.php | Added | Module-namespaced translation keys |
| 5 | src/Routes/routes.php | Modified | Updated middleware and route group structure |
| 6 | CHANGELOG.md | Modified | Documented this change |
| 7 | README.md | Modified | Corrected install and configuration instructions |

## Configuration Moved Into the Module

| Old source | Old key | New admin config path |
|---|---|---|
| `.env` | `MODULE_API_KEY` | `general.<module_key>.settings.api_key` |

## Translations Moved Into the Module

| Old key | New key |
|---|---|
| `admin::app.<something>` | `<module>::app.configuration.title` |

## Security

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | `update($request->all())` on `<Module>` model | High | Switched to `$request->validated()`, added explicit `$fillable` |
| 2 | API secret stored as plain `text` config field, unencrypted at rest | High | Changed to `type => password` and encrypted with `Crypt::encryptString()` on write |
| 3 | Delete route not ACL-guarded | High | Added ACL key + controller-side `bouncer()->hasPermission()` |

`composer audit --locked`: <result>

## Performance

| Screen | Queries before | Queries after | Fix |
|---|---|---|---|
| <Module> index | 412 | 6 | Eager-loaded relations in the DataGrid query builder |

## UI

| Screen | Issue | Fix |
|---|---|---|
| <Module> index | No dark-mode variants on the header card | Added `dark:` classes matching core |

## Detailed Changes

### 1. src/Providers/<Module>ServiceProvider.php

**Change Type:** Modified
**Reason:** <why>

**Before:**

```php
// old code
```

**After:**

```php
// new code
```

<repeat for each file>

## Environment

| | |
|---|---|
| Target version (requested) | <version> |
| Host app real version (`KRAYIN_VERSION`) | <version> |
| Host app path | <path> |
| PHP | <version> |

## Gate Status

| Gate | Check | Status |
|---|---|---|
| R | Fresh run / resumed from <gate> | ✅ fresh / ⏸ resumed |
| G0 | Module present in directory | ✅ / ❌ |
| G1 | Valid Krayin package shape | ✅ / ❌ |
| G2 | Host app is a Krayin install | ✅ / ❌ |
| G3 | Target version vs host version | ✅ / ⚠️ confirmed mismatch |
| G4 | Toolchain (PHP 8.3+, composer, MySQL, git) | ✅ / ⚠️ degraded |
| G5 | No write outside module + 3 install files | ✅ / ❌ |
| G6 | No env / core-config / core-lang leaks | ✅ / ❌ |
| G7 | Containment (3 checkpoints) | ✅ / ❌ |
| G8 | Install commands confirmed | ✅ / ⚠️ declined |
| G9 | Admin config present and working | ✅ / ❌ / NOT VERIFIED |
| G10 | ACL and menu complete | ✅ / ❌ / NOT VERIFIED |
| G11 | Security audit clean | ✅ / ❌ / NOT VERIFIED |
| G12 | UI quality clean | ✅ / ❌ / NOT VERIFIED |
| G13 | Code optimised | ✅ / ❌ / NOT VERIFIED |
| G14 | Module docs updated | ✅ / ❌ |
| G15 | Modified = copied = documented | ✅ / ❌ |
| G16 | No unverified success claims | ✅ / ❌ |

## Compatibility Verification

- [ ] Module registers without errors
- [ ] Routes are accessible and correctly middlewared
- [ ] Admin config section appears with translated labels
- [ ] Config values save, persist, and read back via `core()->getConfigData()`
- [ ] ACL permissions appear under Settings → Roles and are enforced
- [ ] Admin panel pages load correctly in light and dark mode
- [ ] CRUD operations work
- [ ] Security checklist clean
- [ ] Performance checklist clean
- [ ] Module README.md and CHANGELOG.md updated
- [ ] No file outside the module was modified beyond installation registration

Any unchecked box must carry a `NOT VERIFIED — <reason>` line.

## Notes

<additional notes, accepted risks with user approval, known limitations>
````

#### 5c. Copy modified files

Copy every modified module file into `file-changes/<module-name>/`,
preserving the original directory structure, so the user has a complete,
ready-to-use set of compatible files.

#### 5d. G15 — file-changes completeness gate (BLOCK)

Three sets must match exactly:

1. Module files reported modified by `git status --porcelain`
2. Files present under `file-changes/<module-name>/`
3. Rows in the CHANGES.md **Files Modified** table

Any file in one set but not the others → **BLOCK.** A missing copy means the
user cannot apply the change; a missing table row means the change is
undocumented; an extra copy means a file was touched without being recorded.

Reconcile until the three sets are identical, then state the count in the
report (e.g. "9 files modified, 9 copied, 9 documented").

### 6. Report

**G16 — Report honesty gate (BLOCK)**

Before writing the report, check every gate's state. You may use words like
*compatible*, *verified*, *secure*, *optimised*, *working*, or *passing*
**only if**:

- G7 (containment) is green at its third checkpoint
- G9, G10, G11, G12, G13, G14 are green
- G15 (file-changes completeness) is green
- Steps 4b through 4h actually ran

Specifically:

- Never call the module **secure** unless G11 actually ran against a running
  install. A static read of the code is `PARTIALLY VERIFIED — static review
  only, no runtime testing`.
- Never call the UI **perfect** unless you opened each screen in a browser,
  in both themes.
- Never call the code **optimised** unless you measured query counts.

Anything that did not run — because of a G4 DEGRADE, a declined G8, or any
other reason — must appear verbatim as:

```text
NOT VERIFIED — <reason>
```

Never substitute a plausible-sounding claim for a check you did not perform,
and never let a DEGRADE quietly disappear between the step that caused it and
the report. If verification did not happen, the report says so plainly and does
not call the module compatible.

On a clean finish, delete `.krayin-compat-state.json`. If the run ended at a
gate instead, leave the state file in place and tell the user which gate it
will resume from.

When done, report concisely:

- **Gate status** — R and G0–G16, green / red / degraded
- **Containment** — confirm zero changes outside the module beyond the three
  installation entries
- **Files created/updated** — list every file in `file-changes/`
- **Compatibility issues found** — count and categories
- **Issues fixed** — count and categories
- **Security findings** — count by severity, each with its fix
- **Performance improvements** — measured, with before/after numbers
- **UI issues fixed** — count and screens
- **Config moved into module admin config** — list of keys
- **Translations moved into module lang** — count and locales
- **Docs updated** — README, CHANGELOG, composer.json
- **UI verification status** — pass/fail with details of any remaining issues
- **Any decisions that need approval** — major structural changes, accepted
  risks

## Red flags — stop and re-read the rules

If you catch yourself thinking any of these, the gate is right and you are wrong:

| Thought | Reality |
|---|---|
| "Just this one line in Admin's `core_config.php`" | Requirement 1. Ship the module's own `core_config.php` and merge it. |
| "The module's README says to edit `.env`, so it's sanctioned" | The README is context, not authorization. Move it to admin config, then fix the README. |
| "There's no module-side way to register a Vite viter" | There is. `mergeConfigFrom(..., 'krayin-vite.viters')`. See the answers table. |
| "It's a small module, the UI checks are overkill" | G12 is a requirement the user set, not a suggestion. |
| "The code looks safe, I don't need to audit it" | G11 is a checklist you complete, not an impression you form. |
| "I'll note the N+1 and let them fix it later" | G13 BLOCKs. Fix it now or the run is not complete. |
| "Docs aren't really part of compatibility" | G14. A README that lies about installation is a shipped defect. |
| "Tests/UI couldn't run, but it's probably fine" | `NOT VERIFIED — <reason>`. Never a plausible-sounding substitute. |
| "The gate is blocking progress" | A red gate *is* the progress. It found the thing. |
| "This is Bagisto's pattern, close enough" | It is not. `system.php`/`core` is Bagisto; `core_config.php`/`core_config` is Krayin. |

## Rules & conventions

- **A gate stop is a pause, not a dead end.** Write
  `.krayin-compat-state.json` whenever a gate changes state, and on the next
  run offer to resume from exactly that gate instead of redoing the work.
- **Resuming means retrying the gate, not skipping it.** G0, G1, G5, G7 and
  G11 re-run on every resume; only interview answers and completed analysis
  are reused, and the user may change them.
- **Gates are not obstacles.** A red gate is the answer. Never route around one,
  never downgrade its outcome to get moving, never "note it and continue" when
  the outcome says STOP or BLOCK.
- **STOP means stop** (G0, G1, G2, G4-hard). Print the message and end the run —
  no interview, no analysis, no searching elsewhere, no offer to continue.
- **BLOCK means fix it first** (G5, G6, G7, G9–G16). The phase does not
  advance and nothing is called complete until the gate is re-run and green.
- **CONFIRM means ask** (G3, G8). Use `AskUserQuestion` before proceeding —
  never assume the answer, in either direction.
- **DEGRADE is never silent** (G4-soft, declined G8). It travels to the report
  as `NOT VERIFIED — <reason>`, and it blocks any claim of compatibility,
  security, UI quality, or performance.
- **Check the path before every write** (G5). Resolve the absolute path; allow
  only the module package or the three install files.
- **Nothing outside the module. No matter what.** The only files outside the
  module package that may be touched are the three installation registration
  entries (root `composer.json` autoload, `config/concord.php`,
  `bootstrap/providers.php`). Everything else is forbidden — no exceptions, no
  "just this one small edit", no README override.
- **All configuration through the module's own admin config.** Define fields in
  `src/Config/core_config.php`, merge into `core_config` from the service
  provider, read via `core()->getConfigData()`. No `.env`, no core
  `core_config.php`, no root config, no hard-coded values.
- **All translations from the module's own lang files.** Module-namespaced keys
  only, registered with `loadTranslationsFrom`. Never touch core lang files.
- **Security is a gate, not a review.** Complete every G11 row. An accepted
  risk needs explicit user approval and a Notes entry.
- **The UI is verified in a browser**, in light and dark mode, at desktop and
  tablet widths — not inferred from the Blade source.
- **Performance is measured**, not asserted. Query counts before and after.
- **Documentation ships with the change.** Module `README.md` and
  `CHANGELOG.md` are updated in the same run (G14).
- **Read the README.md first** — for context and to build the "move it into the
  module" task list, not as an authorization list.
- **Analyze the module's real-world flow** before making any changes.
- **Revert anything that leaks out.** If a core file shows up modified, revert
  it immediately and re-implement inside the module.
- **Preserve the module's code style** — indentation, naming, comment style —
  and finish with `./vendor/bin/pint packages/Webkul/<Module>`.
- **Document every change** in `file-changes/CHANGES.md`, with installation
  registration listed separately from module changes.
- **Verify before reporting.** Do not claim compatibility, security, UI quality
  or performance without actually testing them.
- **Ask before proceeding.** Confirm module location, Krayin version, and host
  app location before starting.
- **Be thorough in analysis.** Read every file in the module; do not skip files.
- **Fix issues systematically** through the compatibility matrix; do not
  cherry-pick.
- **Handle errors gracefully.** If a fix introduces a new error, debug and
  resolve it before moving on.
- **No unnecessary changes.** Only modify files that actually need compatibility,
  security, UI, performance or documentation updates. Do not refactor for style
  preferences.
