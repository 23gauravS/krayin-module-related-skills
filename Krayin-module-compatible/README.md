# krayin-compat

> Make a **Krayin CRM** module compatible with the latest Krayin version — with a security audit, a UI
> pass, a performance pass and a documentation pass — while guaranteeing that **no file outside the
> module package is changed**.

Part of [krayin-module-related-skills](../README.md). See also the companion skill
[`krayin-blog`](../Krayin-module-blog/README.md).

---

## Table of contents

- [What it does](#what-it-does)
- [When it activates](#when-it-activates)
- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
- [The five standing requirements](#the-five-standing-requirements)
- [Core principle — everything lives in the module](#core-principle--everything-lives-in-the-module)
- [The single exception — installation registration](#the-single-exception--installation-registration)
- [Absolutely forbidden](#absolutely-forbidden)
- [Module-side answers](#module-side-answers)
- [The gate protocol](#the-gate-protocol)
- [Resume — a gate stop is a pause](#resume--a-gate-stop-is-a-pause)
- [The workflow](#the-workflow)
- [Configuration rule](#configuration-rule)
- [Translation rule](#translation-rule)
- [Security audit (G11)](#security-audit-g11)
- [UI quality (G12)](#ui-quality-g12)
- [Code optimisation (G13)](#code-optimisation-g13)
- [Documentation (G14)](#documentation-g14)
- [Outputs — the file-changes directory](#outputs--the-file-changes-directory)
- [Report honesty (G16)](#report-honesty-g16)
- [Commands the skill runs](#commands-the-skill-runs)
- [Red flags](#red-flags)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What it does

Point it at a Krayin module and it will:

1. **Gate on reality first** — is a module actually here? Is it really a Krayin package? Is the host app
   really Krayin (not Bagisto)? Is the toolchain adequate?
2. **Read the module's README** for intent, then reconcile it against the containment rules — producing a
   "move this into the module" task list.
3. **Analyse the module's real-world flow** — every file, every route, every trust boundary.
4. **Compare it against the latest Krayin** structure and build a compatibility matrix.
5. **Fix every issue inside the module**, with a path guard before every write.
6. **Verify in a running app** — admin config, ACL and menu, security, UI in both themes, query counts.
7. **Update the module's own docs** — README, CHANGELOG, composer metadata.
8. **Produce a `file-changes/` directory** documenting and mirroring every modification.
9. **Report honestly** — it cannot say *compatible*, *secure*, *optimised* or *verified* unless the
   corresponding gate actually ran.

## When it activates

Triggers on *compatimize module*, *make compatible*, *upgrade module*, *module compatibility*,
*fix module for latest Krayin*, *update module to latest version* — or when a module is dropped into the
working directory and has to run on the current Krayin codebase. Also triggers when a Krayin module needs
a **security audit**, a **UI pass**, or a **performance pass** before release.

---

## Installation

### npx (recommended)

```bash
npx krayin-module-skills compat
```

Installs `krayin-compat` into `~/.claude/skills/`. Nothing is installed globally, no clone is left behind.

Until the package is published to npm, run it straight from GitHub — same installer, same result:

```bash
npx github:23gauravS/krayin-module-related-skills compat
```

Other options:

| Command | What it does |
|---|---|
| `npx krayin-module-skills compat` | Install `krayin-compat` for your user |
| `npx krayin-module-skills compat --project` | Install into `./.claude/skills/` so your team gets it |
| `npx krayin-module-skills compat --dir <path>` | Install into an explicit skills directory |
| `npx krayin-module-skills compat --force` | Overwrite an existing install without a warning |
| `npx krayin-module-skills --list` | Show which skills are installed and where |
| `npx krayin-module-skills --uninstall compat` | Remove it |
| `npx krayin-module-skills` | Install **both** skills (this one and its companion) |

Node 16+ is required for the installer — the skill itself needs no Node at all.

### Manual install

The folder name becomes the skill name, so rename it to `krayin-compat` on install.

**Personal install (all projects):**

```bash
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills \
  && mkdir -p ~/.claude/skills \
  && cp -r /tmp/krayin-skills/Krayin-module-compatible ~/.claude/skills/krayin-compat \
  && rm -rf /tmp/krayin-skills \
  && echo "installed: krayin-compat"
```

**Project install (shared with your team):**

```bash
cd /path/to/your/krayin-project
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills
mkdir -p .claude/skills
cp -r /tmp/krayin-skills/Krayin-module-compatible .claude/skills/krayin-compat
rm -rf /tmp/krayin-skills
git add .claude/skills && git commit -m "Add krayin-compat skill"
```

**Symlink install (auto-updates on `git pull`):**

```bash
git clone https://github.com/23gauravS/krayin-module-related-skills.git ~/src/krayin-module-related-skills
mkdir -p ~/.claude/skills
ln -sfn ~/src/krayin-module-related-skills/Krayin-module-compatible ~/.claude/skills/krayin-compat
```

### Verify

```bash
npx krayin-module-skills --list
head -3 ~/.claude/skills/krayin-compat/SKILL.md   # -> name: krayin-compat
```

Restart your Claude Code session — skills are discovered at session start.

### Uninstall

```bash
npx krayin-module-skills --uninstall compat

# or by hand
rm -rf ~/.claude/skills/krayin-compat
```

---

## Requirements

| Check | Requirement | Missing → |
|---|---|---|
| **PHP** | 8.3+ (Krayin 2.2.x root `composer.json` requires `php: ^8.3`) | **STOP** |
| **Composer** | 2.5+ | **STOP** |
| **MySQL / MariaDB** | MySQL 8.0.32+ or MariaDB 11.4 LTS+, reachable | **DEGRADE** — steps 4c–4g cannot run |
| **git** | available in the host app | **DEGRADE** — containment falls back to a manual file list |
| **Node + npm** | only if the module ships Vite assets | **DEGRADE** — asset build unverified |
| **A Krayin host app** | must have `artisan` **and** `packages/Webkul/Core/` | **STOP** |
| **A module** | in the current working directory | **STOP** |

A DEGRADE is never silent — it travels all the way to the final report as `NOT VERIFIED — <reason>` and
blocks any claim of compatibility, security, UI quality or performance.

---

## Usage

Run it **from the directory that contains the module**:

```bash
cd /path/to/krayin
```

```text
Make this module compatible with the latest Krayin version.
```

Other phrasings that work:

```text
Compatimize packages/Webkul/WhatsApp for Krayin 2.2.6
Run a security audit on this Krayin module
Upgrade this module to the latest Krayin and fix the UI
```

The skill then asks, **every fresh run**:

1. **Module confirmation** — the module path it found (or which one, if several)
2. **Krayin target version** — e.g. `2.2.6` or `master`
3. **Krayin host app location** — it needs the latest Krayin source for comparison
4. **Module purpose** — integration, channel, reporting, automation… to understand integration points

It does not proceed until the interview is complete.

---

## The five standing requirements

Every run is judged against these. None is optional and none may be traded away to finish a run.

| # | Requirement | Enforced by |
|---|---|---|
| 1 | **All changes live inside the module only** — no file outside the module package is changed, ever, beyond the three installation entries | G5, G7 |
| 2 | **The code is optimised** — no N+1 queries, no unindexed lookups, no work in a request that belongs in a queue | G13 |
| 3 | **The UI is perfect** — Krayin admin components, dark mode, responsive, RTL, loading/empty/error states, zero raw translation keys | G12 |
| 4 | **No vulnerability or security issue** — ACL enforced, no injection, no XSS, no IDOR, no mass assignment, no hard-coded secrets | G11 |
| 5 | **The module's own docs are current** — `README.md`, `CHANGELOG.md` and module metadata updated in the same change | G14 |

---

## Core principle — everything lives in the module

**No matter what happens, no file outside the module package is changed.**

Every fix, config field, ACL entry, menu entry, translation string, asset and route lives inside
`packages/Webkul/<ModuleName>/`.

If a compatibility problem *seems* to require editing a core file, that is a signal the fix belongs
somewhere else in the module — not a licence to edit core. Krayin's `mergeConfigFrom()` accepts
**dot-notation keys**, which lets a module register into `core_config`, `acl`, `menu.admin` and even
`krayin-vite.viters` entirely from its own service provider. There is almost always a module-side answer.

### G5 — the pre-write path guard

Before **every single** `Edit` or `Write`:

1. Resolve the target to an **absolute path**.
2. Allow it only if it is inside the module package root, **or** is exactly one of the three install files.
3. Anything else → **do not write.** Re-solve the problem inside the module.

Watch for paths that *look* safe but are not: `../` escapes, and symlinks pointing out of the module —
Krayin's path repository symlinks `packages/*/*` into `vendor/`, so `vendor/krayin/<module>` may resolve
back into your module. Write through the real `packages/` path, never through `vendor/`.

---

## The single exception — installation registration

A package cannot install itself. These three registration touch-points are the **only** files outside the
module that may be written:

| File | Purpose |
|---|---|
| Root `composer.json` | PSR-4 autoload entry for the module namespace |
| `config/concord.php` | Concord module registration (`Webkul\<Module>\Providers\ModuleServiceProvider::class`) |
| `bootstrap/providers.php` | Service provider registration |

**Krayin runs on Laravel 12 — providers live in `bootstrap/providers.php`, not `config/app.php`.**
Krayin's `config/app.php` has no `providers` array. Never add one.

Rules:

- These are **installation steps**, not compatibility fixes.
- Keep them **minimal** — one autoload line, one concord entry, one provider entry. No other edits inside
  those files.
- Each is recorded in `CHANGES.md` under a separate **"Installation registration"** section, so you can
  see they are install steps and not module changes.
- Everything else a module README may ask for — env vars, `config/services.php`, admin `core_config.php`,
  admin lang, root `krayin-vite.php` — is **not** allowed and must be re-implemented inside the module.

**A module can avoid even the provider entry.** Krayin's root `composer.json` declares a path repository:

```json
"repositories": [
    { "type": "path", "url": "packages/*/*", "options": { "symlink": true } }
]
```

If the module's own `composer.json` carries its provider under `extra.laravel.providers`, Laravel package
discovery registers it without any root edit — but only when the package is actually `require`d. Krayin
core instead lists PSR-4 + `bootstrap/providers.php` directly. Keep the `extra.laravel.providers` block in
the module's own `composer.json` either way.

---

## Absolutely forbidden

Never read-for-editing, never write, never suggest edits to:

- `packages/Webkul/Admin/` — including its `src/Config/core_config.php`, `acl.php`, `menu.php` and
  `src/Resources/lang/*/app.php`
- `packages/Webkul/Core/`, `packages/Webkul/Attribute/`, `packages/Webkul/DataGrid/`
- Any other `packages/Webkul/*` that is not the module itself — `Activity`, `Automation`, `Contact`,
  `DataTransfer`, `Email`, `EmailTemplate`, `GoogleContact`, `Installer`, `Lead`, `Marketing`, `Product`,
  `Quote`, `Tag`, `User`, `Warehouse`, `WebForm`
- `.env` and `.env.example`
- `config/services.php`, `config/krayin-vite.php`, and every other root config file except the two
  registration files above
- Root `resources/`, `public/`, `routes/`, `database/`, `app/`
- Any file anywhere outside the module package

If the module currently *depends* on such an edit, that dependency is **moved into the module** as part of
the compatibility work.

---

## Module-side answers

Whenever a fix looks like it needs a core edit, the answer is here. Every row is verified against
Krayin 2.2.x.

| The module wants to… | Module-side answer |
|---|---|
| Read a setting from `.env` | Ship `src/Config/core_config.php`, `mergeConfigFrom(..., 'core_config')`, read with `core()->getConfigData()` |
| Add an admin settings screen | Same — the field group renders itself under **Configure** |
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

`mergeConfigFrom()` in Laravel 12 calls
`$config->set($key, array_merge(require $path, $config->get($key, [])))`, and both `set()` and `get()`
understand dot notation — which is why `'menu.admin'` and `'krayin-vite.viters'` work as merge targets.
This is the same mechanism Krayin's own `AdminServiceProvider` and `WebFormServiceProvider` use.

**Caveat:** `mergeConfigFrom` is a no-op when the host app has a cached config
(`php artisan config:cache`). Krayin core has the same constraint — this is expected behaviour, not a
module bug. Always run `php artisan optimize:clear` before verifying.

---

## The gate protocol

The skill is gated: at every phase boundary there is a precondition with a defined consequence. It either
does the work correctly or says clearly why it cannot.

### Outcomes

| Outcome | Meaning |
|---|---|
| **STOP** | Print the message, end the run. No further tool calls, no analysis, no workaround. |
| **BLOCK** | Cannot advance or claim completion. Fix the cause, re-run the gate. |
| **CONFIRM** | Ask the user before proceeding. |
| **DEGRADE** | Proceed, but the item is recorded as `NOT VERIFIED — <reason>` in the final report. |

### All gates

| # | Gate | Where | Fails when | Outcome |
|---|---|---|---|---|
| **R** | Resume | STEP -2 | A previous run stopped at a gate | CONFIRM |
| **G0** | Module presence | STEP -1 | No module in the working directory | STOP |
| **G1** | Module shape | STEP -1 | Not a Krayin package (no `composer.json` / no ServiceProvider) | STOP |
| **G2** | Host app valid | 1c-B | Host path is not a Krayin installation | STOP |
| **G3** | Version match | 1c-B | Host's real `KRAYIN_VERSION` ≠ interview target | CONFIRM |
| **G4** | Toolchain | 1c-A | PHP < 8.3 / no composer → STOP; no MySQL / no git → DEGRADE | STOP / DEGRADE |
| **G5** | Pre-write path guard | Every Edit/Write | Target resolves outside the module + 3 install files | BLOCK |
| **G6** | Leak scan | 3d | Module still reads env / core config / core lang keys | BLOCK |
| **G7** | Containment | 3e, before 5, before 6 | Anything modified outside the module + 3 install files | BLOCK → STOP if unrevertable |
| **G8** | Destructive-action confirm | 4a | About to run `migrate` / `vendor:publish --force` on the host | CONFIRM → DEGRADE if declined |
| **G9** | Admin config | 4c | No module-side `core_config.php`, or a raw lang key visible in the admin UI | BLOCK |
| **G10** | ACL & menu | 4d | An admin route or action is not ACL-guarded, or menu/ACL keys mismatch | BLOCK |
| **G11** | Security audit | 4e | Any checklist finding unresolved | BLOCK |
| **G12** | UI quality | 4f | Any UI checklist item fails in the running admin panel | BLOCK |
| **G13** | Code optimisation | 4g | N+1 query, unindexed FK, or blocking external call in a request | BLOCK |
| **G14** | Documentation | 4h | Module `README.md` / `CHANGELOG.md` not updated for this change | BLOCK |
| **G15** | file-changes completeness | 5d | Modified files ≠ copied files ≠ CHANGES.md rows | BLOCK |
| **G16** | Report honesty | 6 | Success wording while a gate is red or verification never ran | BLOCK |

**Never route around a gate. A red gate is the answer, not an obstacle.**

### G0 — what counts as a module

Looks in the current working directory only, in this order:

1. `packages/Webkul/<Module>/` — a package that is **not** one of Krayin's core packages
2. `src/` containing a module package
3. The working directory itself being a module package

Core package names excluded from detection: `Activity`, `Admin`, `Attribute`, `Automation`, `Contact`,
`Core`, `DataGrid`, `DataTransfer`, `Email`, `EmailTemplate`, `GoogleContact`, `Installer`, `Lead`,
`Marketing`, `Product`, `Quote`, `Tag`, `User`, `Warehouse`, `WebForm`.

Zero modules found → it prints this and the run is **over**. No interview, no analysis, no searching
elsewhere:

```text
❌ Module is not available in this directory.

Working directory: <cwd>

Place the module inside this directory (e.g. ./packages/Webkul/<ModuleName>)
and run the skill again — it will resume from this gate.
```

Multiple found → it lists them and asks which.

### G1 — module shape

The path must have **both** a `composer.json` with a `Webkul\<Module>\` PSR-4 entry **and** a
`src/Providers/*ServiceProvider.php`. Missing either → STOP. This gate exists so a half-copied folder does
not consume a full interview and analysis before the problem surfaces.

### G2 — the Bagisto near-miss

A Bagisto checkout also has `artisan` and `packages/Webkul/Core/`. Krayin is confirmed by requiring one
of: root `composer.json` name `krayin/laravel-crm`; `packages/Webkul/Core/src/Core.php` defining
`KRAYIN_VERSION`; or `config/krayin-vite.php` existing. Bagisto where Krayin was expected → STOP. Use
`bagisto-compat` for Bagisto.

---

## Resume — a gate stop is a pause

A gate stopping the run is a **pause with a known position**, not a dead end. State is written to
`.krayin-compat-state.json` at the **workspace root** — a skill artifact, never inside the module.

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

It is written **every time a gate changes state** — on STOP, BLOCK, DEGRADE and each completed step. A
state file written only at the end is worthless, because the runs that need resuming are exactly the ones
that never reached the end.

On the next run you get three choices: **Resume from \<gate\>**, **Start fresh** (the state file is
archived to `.krayin-compat-state.<n>.json`), or **Show details**.

**Always re-run, even on resume:** G0, G1 (the filesystem may have changed), G5 (per-write, never "already
done"), G7 (containment must be true *now*), G11 (a security finding is never already handled), and the
failed gate itself.

**Safe to reuse from state**, if you confirm it still holds: interview answers, module flow analysis and
file inventory, and the compatibility matrix for issues already fixed and verified.

Resuming means **retrying** the gate, not skipping it. A corrupt, incomplete or stale state file is
treated as no state file — it never guesses. On a clean finish through step 6 the file is deleted.

---

## The workflow

### STEP -2 → -1 — Resume gate, then G0 + G1

Before the interview, before reading any README, before any analysis.

### STEP 0 — Read the module's README (mandatory)

The README tells you what the author *intended* — useful context, **not an authorization list**. It is
reconciled against the rules:

| README asks for | What happens |
|---|---|
| composer.json autoload / concord / `bootstrap/providers.php` entry | Applied (the single exception) |
| `.env` variables | Re-implemented as module admin config fields |
| `config/services.php` entries | Re-implemented as module admin config fields |
| Admin `core_config.php` entries | Re-implemented in the module's own `src/Config/core_config.php` |
| Admin `acl.php` / `menu.php` entries | Re-implemented in the module's own files |
| Root `config/krayin-vite.php` viter | Re-implemented as a module `src/Config/krayin-vite.php` merged into `krayin-vite.viters` |
| Admin lang keys | Re-implemented in the module's own lang files |
| `config/app.php` providers array | Not applicable — Laravel 12 uses `bootstrap/providers.php` |
| Any other core edit | Not applied — solved inside the module |

Whatever this table says "re-implement", **G14 requires correcting the README**. A README that still tells
users to edit `.env` after the setting moved into admin config is a documentation bug the run introduced.

### STEP 0b / 1b — Analyse module flow

Reads **every** file and documents: file inventory, the admin user flow, API endpoints, third-party
integrations, configuration dependencies (and where the values come from today), translation
dependencies, **trust boundaries** (every point where data enters from outside — request input, route
parameters, uploads, webhooks, API responses; this becomes the G11 audit surface), integration points
into Krayin core (lead pipelines, Person/Organization contacts, Activities, Quotes, Attributes, DataGrid,
Bouncer/ACL, the Automation workflow engine) and the overall architecture.

### Step 2 — Analyse against the latest Krayin

**2a** maps every part of the module: service provider, Concord provider, routes, controllers, models,
contracts, repositories, DataGrids, config, views, migrations, events/listeners, commands, assets, lang,
database, docs.

**2b** reads the corresponding latest-Krayin patterns — **read only, never edited**:

| Want the pattern for… | Read |
|---|---|
| A full module with views, assets, routes, ACL and menu | `packages/Webkul/WebForm/` |
| Service provider + config merging + middleware aliases | `packages/Webkul/Admin/src/Providers/AdminServiceProvider.php` |
| Admin config field definitions | `packages/Webkul/Admin/src/Config/core_config.php` |
| Config resolution and `core()->getConfigData()` | `packages/Webkul/Core/src/Core.php`, `src/SystemConfig.php` |
| Repository base class | `packages/Webkul/Core/src/Eloquent/Repository.php` |
| Concord model binding | `packages/Webkul/Core/src/Providers/BaseModuleServiceProvider.php` |
| DataGrid | `packages/Webkul/DataGrid/`, `packages/Webkul/Admin/src/DataGrids/` |
| Admin Blade components | `packages/Webkul/Admin/src/Resources/views/components/` |
| Route + middleware conventions | `packages/Webkul/Admin/src/Routes/Admin/` |
| Attribute-driven entities | `packages/Webkul/Attribute/` |

**2c** produces the compatibility matrix: namespace, service provider, Concord provider, base classes,
route registration (`['web', 'admin_locale', 'user']`, `admin.*` names, `config('app.admin_path')`
prefix), admin config, ACL, menu, config reads, translations, view components, Vite/assets, migration
syntax, event pattern, dependencies, deprecated methods, type hints, return types, plus the five hard-gate
rows: **Security**, **UI**, **Performance**, **Docs**, **Containment**.

### Step 3 — Fix, then prove containment

Fixes are applied inside the module, preserving its code style, finishing with:

```bash
./vendor/bin/pint packages/Webkul/<Module>
```

**3d — G6 leak scan**, run inside the module directory:

```bash
# config leaks — values must come from the module's own admin config
grep -rn "env(\|getenv(\|\$_ENV\|config('services\|config(\"services" src/

# root-config leaks
grep -rn "config('krayin-vite\|config('concord\|config('app.providers" src/

# translation leaks — keys must be module-namespaced
grep -rnE "(admin|core|lead|contact|activity|quote|product|user|attribute|datagrid|email|email_template|marketing|tag|warehouse|web_form|automation|installer|data_transfer)::" src/

# hard-coded endpoints and secrets
grep -rniE "https?://|api[_-]?key\s*=|secret\s*=|token\s*=|password\s*=" src/
```

Any hit → BLOCK, with a defined fix per category. Legitimate exceptions (a vendor SDK's fixed API base
URL, a URL in a comment, a `@lang` key genuinely in the module's own namespace) are allowed — but each is
listed explicitly in `CHANGES.md` under Notes, so the exception is a decision on the record rather than an
oversight.

**3e — G7 containment**, which runs **three times** per run (after step 3, before step 5, before the step
6 report) — because step 4's UI debugging is exactly where a stray core edit creeps in:

```bash
git -C <host-app> status --porcelain
```

Only the module directory and the three install files may appear. Anything else → revert and re-implement
inside the module; unrevertable → STOP and report it, with no `file-changes/` and no compatibility claim.

### Step 4 — Verify, harden, optimise

**4a install** (behind **G8 — destructive-action confirm**: `migrate` changes the database and
`vendor:publish --force` overwrites published assets; on a live CRM holding real leads that is destructive
and not trivially reversible):

```bash
composer dump-autoload
php artisan optimize:clear
php artisan migrate
php artisan vendor:publish --provider="Webkul\<Module>\Providers\<Module>ServiceProvider" --force
```

Declined → DEGRADE: all of step 4 is skipped, every verification item becomes
`NOT VERIFIED — install declined`, and the report must not claim compatibility, security, UI quality or
performance.

**4b routes:**

```bash
php artisan route:list --path=<module-prefix>
```

Then **4c** (G9 admin config), **4d** (G10 ACL & menu), **4e** (G11 security), **4f** (G12 UI),
**4g** (G13 performance), **4h** (G14 docs) — detailed below. **4i** handles errors: read the message,
check `storage/logs/laravel.log`, find the root cause in the module, fix it inside the module, re-verify,
and re-run the gate that surfaced it.

### Steps 5–6 — file-changes directory, then the report

---

## Configuration rule

**All configuration the module needs is exposed through the module's own admin configuration UI**, so it
can be read anywhere via `core()->getConfigData()`. No `.env` variables. No entries in Admin's
`core_config.php`. No root `config/*.php`. No hard-coded credentials, URLs or toggles.

Krayin's admin configuration file is **`core_config.php`** merged into the **`core_config`** key — it is
*not* `system.php` and *not* merged into `core`. That is Bagisto's naming.

`packages/Webkul/<Module>/src/Config/core_config.php`:

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
                'name'          => 'api_secret',
                'title'         => '<module>::app.configuration.settings.api-secret',
                'type'          => 'password',
                'depends'       => 'active:1',
                'channel_based' => false,
                'locale_based'  => false,
                'validation'    => 'required_if:active,1',
            ],
        ],
    ],
];
```

Field keys `SystemConfig\Item` understands: `name`, `title`, `info`, `type`, `depends`, `path`,
`validation`, `default`, `channel_based`, `locale_based`, `options` (array or `Class@method`), `tinymce`.

Field `type` values rendered by `field-type.blade.php`: `text`, `password`, `boolean`, `checkbox`,
`select`, `multiselect`, `textarea`, `editor`, `image`, `file`, `color`. There is **no** `date`/`datetime`
type — use `text` with validation.

**Credentials need two things, not one.**

> Krayin stores `core_config` values **in plain text** in the `core_config` table. `type => password`
> masks the input control; it does **not** encrypt the value at rest. Verified against
> `packages/Webkul/Core/src/Repositories/CoreConfigRepository.php` and `SystemConfig.php` in 2.2.x —
> neither encrypts.

So a module storing third-party credentials must encrypt them itself: `Crypt::encryptString()` on write
and `Crypt::decryptString()` on read, or an `'encrypted'` cast if the credentials live on the module's own
model. Both the mask and the encryption are G11 items, not niceties.

Registration:

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

Reading it anywhere in the project:

```php
$apiKey = core()->getConfigData('general.<module_key>.settings.api_key');
```

Choose a `key` path that lands in a group that exists in the running Krayin version. Krayin 2.2.x ships
two top-level groups — **`general`** and **`email`**. A module may nest under one, or declare its own
top-level group by shipping the parent row itself.

---

## Translation rule

Every string the module renders comes from the module's own translation files.

- Location: `packages/Webkul/<Module>/src/Resources/lang/<locale>/app.php`
- Registered with `$this->loadTranslationsFrom(__DIR__.'/../Resources/lang', '<module>');`
- Every key namespaced: `<module>::app.configuration.title`
- Never add or edit keys in `packages/Webkul/Admin/src/Resources/lang/*/app.php` or any other core lang
  file.
- If the module references a core key that no longer exists in the latest Krayin, **add the string to the
  module's own lang file** and point the code at the module key — do not restore the core key.
- Ship at minimum `en`; mirror any other locales the module already supported. Krayin ships RTL locales
  (`ar`, `fa`) — if the module ships either, the G12 RTL check applies.

**On the host repo's `AGENTS.md`:** it says a package gets its own `Resources/lang/` only if it also has
`Resources/views/`, and that view-less packages keep strings in the Admin package. That rule is for
**core packages inside the Krayin monorepo**. A module this skill works on is a third-party extension;
writing to `packages/Webkul/Admin/` is forbidden by requirement 1 regardless. AGENTS.md is not grounds to
write into `Admin`.

---

## Security audit (G11)

Every trust boundary found during analysis is audited. Every row must be resolved — a row that cannot be
resolved is a BLOCK, not a note.

**Authorisation & access**

- Every admin route behind the `user` middleware **and** an ACL check
- No IDOR — every lookup scoped to what the current user may see
  (`auth()->guard('user')->user()`), never a bare `find($request->id)` on a user-supplied id
- Mass actions re-check permission and ownership for **every** id in the batch, not just the first
- Public/webhook routes are deliberately public, documented as such, and verify a signature or shared
  secret before doing any work
- No route added to a CSRF exclusion list

**Injection**

- No string interpolation into `DB::raw`, `whereRaw`, `orderByRaw`, `havingRaw`, `selectRaw` — bind
  parameters
- DataGrid sort/filter columns validated against an allow-list, never straight from the query string into
  `orderBy`
- No user input reaching `exec`, `shell_exec`, `proc_open`, `system`, `eval`, `unserialize`

**Output / XSS**

- `{{ }}` everywhere; every `{!! !!}` justified in writing with a sanitised source
- Values in inline `<script>` blocks go through `@json()` / `json_encode`, never raw echo
- Rich-text/editor config fields sanitised on output
- SVG uploads pass through `enshrined/svg-sanitize` (already a Krayin dependency)

**Mass assignment & models**

- Every model declares an explicit `$fillable`; none uses `$guarded = []`
- No `->update($request->all())` / `->create($request->all())` — use `$request->validated()` or explicit
  `only([...])`
- Sensitive attributes in `$hidden`, casts applied (`'encrypted'` for stored secrets)

**Input validation**

- Every write route validated through a FormRequest or `$request->validate()`
- Uploads constrained with `mimes:`/`mimetypes:` **and** `max:`; stored via the `Storage` facade with a
  generated name — never `getClientOriginalName()` into a public path
- Redirect targets internal or allow-listed; use the `sanitize_url` middleware where Krayin does
- No unbounded `per_page` / `limit` from the request

**Secrets & transport**

- No credential, token or private key anywhere in the module source, config defaults, seeders or tests
- Secrets live in admin config as `type => password`, read via `core()->getConfigData()`
- Stored credentials encrypted by the module — `type => password` alone is not protection
- Outbound HTTP uses TLS with verification on — never `'verify' => false` or
  `CURLOPT_SSL_VERIFYPEER => false`
- No secret, or request/response body containing one, written to `Log::` or `storage/logs`
- Third-party webhook payloads treated as untrusted input

**Dependencies**

```bash
composer audit --locked
```

Every finding and its fix is recorded in `CHANGES.md` under **Security**. A deliberately accepted risk
needs your explicit approval and a Notes entry — never a silent pass.

---

## UI quality (G12)

Checked in a browser on every screen the module adds, not inferred from Blade source.

**Krayin component conventions** — `<x-admin::layouts>` with `<x-slot:title>`;
`<x-admin::breadcrumbs>` on every page; `<x-admin::datagrid>` with `<x-admin::shimmer.datagrid />` as the
loading state (not a hand-rolled table); `<x-admin::form>` + `<x-admin::form.control-group>` with
`label`/`control`/`error` slots; `<x-admin::modal>` / `<x-admin::drawer>`; `primary-button` /
`secondary-button`; Krayin's `icon-*` font; the core flash-message pattern
(`session()->flash('success', ...)` → `<x-admin::flash-group>`).

**Presentation** — **dark mode**: every colour utility has its `dark:` counterpart, verified by toggling
the theme on each screen (the single most common miss). **Responsive**: no horizontal scroll at 1280px,
1024px and 768px. **RTL**: if the module ships `ar` or `fa`, switch locale and confirm the layout mirrors
(logical spacing utilities, not hard `ml-`/`mr-`). Spacing, font sizes and radii match surrounding admin
pages.

**States** — a loading state for every async region; an empty state with a meaningful message, not a blank
table; an error state that surfaces a readable message, never a raw exception or a silent no-op;
confirmation on destructive actions; long-running actions disable their trigger against double-submit.

**Content & accessibility** — **zero raw translation keys visible anywhere** (`<module>::app...` on screen
is an automatic BLOCK); every control labelled; validation errors inline next to their field; visible
keyboard focus and sane tab order; no console errors or failed network requests in DevTools.

**Verification** — every screen checked in the running app, and `storage/logs/laravel.log` clean after the
walkthrough.

---

## Code optimisation (G13)

Measured, not assumed — via `barryvdh/laravel-debugbar` (already a Krayin dev dependency) or query logging
while walking the module's screens.

- **No N+1 queries.** Every relation touched in a loop or Blade template is eager-loaded. Watch DataGrid
  column closures and activity/lead relation rendering especially.
- No queries inside a Blade loop
- `select()` narrows to the columns actually used on list screens
- Filtering, sorting and pagination in SQL — never `->get()` then `->filter()` in PHP
- Every FK and every column used in a `where`/`orderBy` on a large table has an index in the module's
  migration
- Migrations declare FK constraints with explicit `onDelete` behaviour
- `CacheableRepository` used where reads are hot, invalidated on write
- **No blocking third-party HTTP call inside a web request** — dispatch a queued job; set explicit
  connect/read timeouts on every outbound call
- Bulk writes use `insert`/`upsert`/`chunk`, not a loop of `save()`
- Long-running imports/exports run through a queue or a chunked command
- Config read once per request where used repeatedly, not per row
- Assets built through the module's Vite config; no unminified or duplicated vendor bundle
- `./vendor/bin/pint packages/Webkul/<Module>` clean
- `php artisan test --compact` passes

The before/after query count for the module's heaviest screen is recorded in `CHANGES.md`.

---

## Documentation (G14)

All of these live inside the module, so they are always allowed — and leaving them stale is a defect.

- **`README.md`** — every correction from the reconcile step applied: install steps reflect the three real
  registration entries; `.env` / `config/services.php` instructions replaced with the admin-config path
  (**Configure → …**); requirements say PHP 8.3+ / Laravel 12 / the verified Krayin version.
- **`CHANGELOG.md`** — an entry under the topmost unreleased heading. Created if the module has none.
  Never invent a PR number, never bump a version outside a release change.
- **`composer.json`** — `require` constraints reflect PHP `^8.3` and the Krayin/Laravel packages actually
  used; `extra.laravel.providers` present and correct.
- Any other shipped doc (`UPGRADE.md`, `docs/`, install guide, screenshots of a changed screen).
- The module's lang files carry every new string added by the work.

Changelog format:

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

---

## Outputs — the file-changes directory

Created at the workspace root after all fixes are applied and verified.

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

**`CHANGES.md` contains:** summary · **containment statement** · installation registration (listed
separately from module changes) · files modified · configuration moved into the module (old source → old
key → new admin config path) · translations moved into the module · security findings with severity and
fix · performance before/after query counts · UI issues and fixes · detailed before/after code per file ·
environment (requested target version, host's real `KRAYIN_VERSION`, host path, PHP version) · the full
**gate status table** (R, G0–G16) · a compatibility verification checklist · notes and accepted risks.

Every modified module file is copied into `file-changes/<module-name>/`, preserving structure, so you have
a complete, ready-to-apply set.

**G15** then requires three sets to match **exactly**: files reported modified by
`git status --porcelain`, files present under `file-changes/<module-name>/`, and rows in the
**Files Modified** table. A file in one set but not the others → BLOCK. A missing copy means you cannot
apply the change; a missing row means the change is undocumented; an extra copy means a file was touched
without being recorded. The final count is stated in the report — e.g. *"9 files modified, 9 copied,
9 documented."*

---

## Report honesty (G16)

Words like *compatible*, *verified*, *secure*, *optimised*, *working* or *passing* may be used **only if**
G7 is green at its third checkpoint, G9–G15 are green, and steps 4b–4h actually ran.

- Never **secure** unless G11 ran against a running install. A static read is
  `PARTIALLY VERIFIED — static review only, no runtime testing`.
- Never **perfect UI** unless each screen was opened in a browser, in both themes.
- Never **optimised** unless query counts were measured.

Anything that did not run — a G4 DEGRADE, a declined G8, any other reason — appears verbatim as:

```text
NOT VERIFIED — <reason>
```

The final report covers: gate status (R, G0–G16) · containment confirmation · files created/updated ·
compatibility issues found and fixed, by category · security findings by severity with fixes ·
measured performance improvements · UI issues fixed · config keys moved into module admin config ·
translations moved, by locale · docs updated · UI verification status · any decisions needing approval.

---

## Commands the skill runs

| Command | When |
|---|---|
| `php -v`, `composer --version` | G4 toolchain gate |
| `composer dump-autoload` | 4a install |
| `php artisan optimize:clear` | before **every** verification pass — mandatory |
| `php artisan migrate` | 4a install (behind G8 confirm) |
| `php artisan vendor:publish --provider="…" --force` | 4a install (behind G8 confirm) |
| `php artisan route:list --path=<module-prefix>` | 4b route verification |
| `php artisan serve` | 4f UI walkthrough |
| `grep -rn …` (four leak scans) | 3d G6 |
| `git -C <host-app> status --porcelain` | 3e G7, ×3 |
| `composer audit --locked` | 4e G11 |
| `./vendor/bin/pint packages/Webkul/<Module>` | 3c and 4g |
| `php artisan test --compact` | 4g G13 |

---

## Red flags

If the agent catches itself thinking any of these, the gate is right and it is wrong.

| Thought | Reality |
|---|---|
| "Just this one line in Admin's `core_config.php`" | Requirement 1. Ship the module's own `core_config.php` and merge it. |
| "The module's README says to edit `.env`, so it's sanctioned" | The README is context, not authorization. Move it to admin config, then fix the README. |
| "There's no module-side way to register a Vite viter" | There is. `mergeConfigFrom(..., 'krayin-vite.viters')`. |
| "It's a small module, the UI checks are overkill" | G12 is a requirement, not a suggestion. |
| "The code looks safe, I don't need to audit it" | G11 is a checklist you complete, not an impression you form. |
| "I'll note the N+1 and let them fix it later" | G13 BLOCKs. Fix it now or the run is not complete. |
| "Docs aren't really part of compatibility" | G14. A README that lies about installation is a shipped defect. |
| "Tests/UI couldn't run, but it's probably fine" | `NOT VERIFIED — <reason>`. Never a plausible-sounding substitute. |
| "The gate is blocking progress" | A red gate *is* the progress. It found the thing. |
| "This is Bagisto's pattern, close enough" | It is not. `system.php`/`core` is Bagisto; `core_config.php`/`core_config` is Krayin. |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| The skill does not activate | Run `npx krayin-module-skills --list`. The folder must be named `krayin-compat` and contain `SKILL.md`. Restart the session. |
| `npx: command not found` | Install Node 16+ (npx ships with npm), or use the manual install above. |
| "❌ Module is not available in this directory." | By design, it only looks in the current working directory. `cd` to the directory holding `packages/Webkul/<Module>` and re-run — it resumes from that gate. |
| "❌ This is not a Krayin module package." | The folder needs both a `composer.json` with a `Webkul\<Module>\` PSR-4 entry and `src/Providers/*ServiceProvider.php`. |
| "❌ No Krayin installation found at …" | The host path needs `artisan` **and** `packages/Webkul/Core/`, plus one Krayin marker (`krayin/laravel-crm` in composer.json, `KRAYIN_VERSION`, or `config/krayin-vite.php`). |
| It stopped because the host is Bagisto | Use `bagisto-compat` instead. These are different codebases with different config file names. |
| The module's config section does not appear under Configure | `php artisan optimize:clear`. `mergeConfigFrom` is skipped entirely while the config cache is warm, which makes a correct module look broken. Also check it merged into `core_config` (not `core`) and that the `key` path targets a group that exists. |
| A raw `<module>::app…` key shows in the admin UI | Missing lang entry — add it to the **module's** own lang file. Automatic G12 BLOCK. |
| Config values do not persist | Field definition wrong — check `name`, `type`, `validation`. |
| `core()->getConfigData()` returns null | Key path mismatch between `core_config.php` and the calling code. |
| The version gate keeps asking | The host's real `KRAYIN_VERSION` differs from your interview target. Targeting `master` against a `2.2.6` checkout is legitimate — confirm and continue. |
| It won't call the module compatible | A gate is red or a verification never ran. The report names which, verbatim. That is the feature. |
| It stopped and I fixed the cause | Re-run it. `.krayin-compat-state.json` at the workspace root lets it resume from exactly that gate instead of redoing the work. |
| Git is unavailable in the host app | G4 DEGRADE — containment falls back to a manually tracked file list, and the report says so. |

---

## License

MIT. Free and open source.
