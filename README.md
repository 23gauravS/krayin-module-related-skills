# Krayin Module Related Skills

Free and open-source [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for working on
**[Krayin CRM](https://krayincrm.com/)** modules and packages.

Two skills live in this repository. Both are plain Markdown — no build step, no dependencies to compile,
no runtime of their own. They activate automatically when your request matches their trigger phrases.

```bash
npx krayin-module-skills
```

That installs both skills into `~/.claude/skills/`. Restart your Claude Code session and they are live.

| Skill | Folder | What it does |
|---|---|---|
| **`krayin-blog`** | [`Krayin-module-blog/`](Krayin-module-blog/) | Writes a deep, step-by-step blog post for a Krayin module in the exact structure of a reference blog, with **real** Playwright screenshots from the running admin panel, output as WordPress Gutenberg HTML. |
| **`krayin-compat`** | [`Krayin-module-compatible/`](Krayin-module-compatible/) | Makes a Krayin module compatible with the latest Krayin version — plus a security audit, a UI pass, a performance pass and a documentation pass — while guaranteeing **no file outside the module package is changed**. |

Each folder has its own detailed README:

- [Krayin-module-blog/README.md](Krayin-module-blog/README.md) — full guide to `krayin-blog`
- [Krayin-module-compatible/README.md](Krayin-module-compatible/README.md) — full guide to `krayin-compat`

---

## Table of contents

- [Why these skills exist](#why-these-skills-exist)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Option 1 — npx (recommended)](#option-1--npx-recommended)
  - [Option 2 — manual, personal install](#option-2--manual-personal-install)
  - [Option 3 — manual, project install](#option-3--manual-project-install)
  - [Option 4 — symlink install (stay up to date)](#option-4--symlink-install-stay-up-to-date)
  - [Windows (PowerShell)](#windows-powershell)
- [Verifying the install](#verifying-the-install)
- [Usage](#usage)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Repository layout](#repository-layout)
- [What is not committed or published](#what-is-not-committed-or-published)
- [Krayin facts both skills encode](#krayin-facts-both-skills-encode)
- [Safety guarantees](#safety-guarantees)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Related](#related)
- [License](#license)

---

## Why these skills exist

Krayin shares a vendor (Webkul) and a Laravel lineage with Bagisto, so a general-purpose assistant
constantly guesses **Bagisto** file names into a **Krayin** codebase: `system.php` instead of
`core_config.php`, `admin-menu.php` instead of `menu.php`, a storefront and a seller panel that Krayin
does not have. Both skills encode the verified Krayin 2.2.x reality so the agent stops guessing.

They also encode the two things that go wrong in practice:

1. **Blog posts drift from the code** — screenshots of empty lists, invented config fields, features that
   do not exist. `krayin-blog` forbids every claim that cannot be traced back to code it actually read,
   and seeds demo CRM data before capturing anything.
2. **Compatibility work leaks into core** — "just one line in `packages/Webkul/Admin/`" and the module is
   no longer installable by anyone else. `krayin-compat` runs a **path guard before every single write**
   and a containment check three times per run.

---

## Requirements

| | Needed for | Notes |
|---|---|---|
| **Claude Code** (or any Agent-Skills-compatible harness) | both | Skills are read from `~/.claude/skills/` and `<project>/.claude/skills/` |
| **A Krayin CRM installation** | both | Krayin **2.2.x** is what these skills are verified against |
| **PHP 8.3+** | both | Krayin 2.2.x root `composer.json` requires `php: ^8.3` |
| **Composer 2.5+** | `krayin-compat` | autoload + install steps |
| **MySQL 8.0.32+ / MariaDB 11.4 LTS+** | both | `krayin-compat` degrades without it; `krayin-blog` needs it to seed demo data |
| **Node + npm** | `krayin-compat` | only if the module ships Vite assets |
| **git** | `krayin-compat` | used for the containment check; degrades to a manual file list without it |
| **Playwright** | `krayin-blog` | real screenshot capture from the running admin panel |
| **ImageMagick or Pillow** | `krayin-blog` | the 1440px image-width assertion |
| **Python 3** | `krayin-blog` | the three verification scripts shipped in the skill |

---

## Installation

Skills are installed by placing a folder containing a `SKILL.md` under a skills directory —
`~/.claude/skills/` for your user, or `<project>/.claude/skills/` for a project. The **folder name becomes
the skill name**, so the installer renames them to match the `name:` in each `SKILL.md` (`krayin-blog`,
`krayin-compat`).

### Option 1 — npx (recommended)

```bash
npx krayin-module-skills
```

Installs **both** skills into `~/.claude/skills/`. Nothing is installed globally and no clone is left
behind.

Until the package is published to npm, run it straight from GitHub — same installer, same result:

```bash
npx github:23gauravS/krayin-module-related-skills
```

**All installer options:**

| Command | What it does |
|---|---|
| `npx krayin-module-skills` | Install both skills into `~/.claude/skills/` |
| `npx krayin-module-skills blog` | Install only `krayin-blog` |
| `npx krayin-module-skills compat` | Install only `krayin-compat` |
| `npx krayin-module-skills --project` | Install into `./.claude/skills/` so your team gets them |
| `npx krayin-module-skills --dir <path>` | Install into an explicit skills directory |
| `npx krayin-module-skills --force` | Overwrite an existing install without a warning |
| `npx krayin-module-skills --list` | Show which skills are installed and where |
| `npx krayin-module-skills --uninstall` | Remove both (add `blog` or `compat` to remove one) |
| `npx krayin-module-skills --help` | Full usage |

Node 16+ is required for the installer — the skills themselves need no Node at all.

Team install, committed to the repo:

```bash
cd /path/to/your/krayin-project
npx krayin-module-skills --project
git add .claude/skills && git commit -m "Add Krayin module skills"
```

### Option 2 — manual, personal install

If you would rather not run `npx`, copy the folders yourself.

```bash
git clone https://github.com/23gauravS/krayin-module-related-skills.git
cd krayin-module-related-skills

mkdir -p ~/.claude/skills
cp -r Krayin-module-blog       ~/.claude/skills/krayin-blog
cp -r Krayin-module-compatible ~/.claude/skills/krayin-compat
```

One-liner, no clone left behind:

```bash
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills \
  && mkdir -p ~/.claude/skills \
  && cp -r /tmp/krayin-skills/Krayin-module-blog       ~/.claude/skills/krayin-blog \
  && cp -r /tmp/krayin-skills/Krayin-module-compatible ~/.claude/skills/krayin-compat \
  && rm -rf /tmp/krayin-skills \
  && echo "installed: krayin-blog, krayin-compat"
```

Install a single skill by copying only the folder you want.

### Option 3 — manual, project install

```bash
cd /path/to/your/krayin-project

git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills
mkdir -p .claude/skills
cp -r /tmp/krayin-skills/Krayin-module-blog       .claude/skills/krayin-blog
cp -r /tmp/krayin-skills/Krayin-module-compatible .claude/skills/krayin-compat
rm -rf /tmp/krayin-skills

git add .claude/skills && git commit -m "Add Krayin module skills"
```

### Option 4 — symlink install (stay up to date)

Keep the clone and symlink it, so `git pull` updates the installed skills instantly.

```bash
git clone https://github.com/23gauravS/krayin-module-related-skills.git ~/src/krayin-module-related-skills

mkdir -p ~/.claude/skills
ln -sfn ~/src/krayin-module-related-skills/Krayin-module-blog       ~/.claude/skills/krayin-blog
ln -sfn ~/src/krayin-module-related-skills/Krayin-module-compatible ~/.claude/skills/krayin-compat
```

Update later with:

```bash
git -C ~/src/krayin-module-related-skills pull
```

### Windows (PowerShell)

`npx krayin-module-skills` works unchanged on Windows. For a manual install:

```powershell
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git $env:TEMP\krayin-skills
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item "$env:TEMP\krayin-skills\Krayin-module-blog"       "$env:USERPROFILE\.claude\skills\krayin-blog"   -Recurse -Force
Copy-Item "$env:TEMP\krayin-skills\Krayin-module-compatible" "$env:USERPROFILE\.claude\skills\krayin-compat" -Recurse -Force
Remove-Item "$env:TEMP\krayin-skills" -Recurse -Force
```

---

## Verifying the install

```bash
npx krayin-module-skills --list
```

Or check the files directly:

```bash
ls ~/.claude/skills/krayin-blog/SKILL.md ~/.claude/skills/krayin-compat/SKILL.md
head -3 ~/.claude/skills/krayin-blog/SKILL.md      # should print: name: krayin-blog
head -3 ~/.claude/skills/krayin-compat/SKILL.md    # should print: name: krayin-compat
```

Then start Claude Code and run `/help` — or simply ask for one of the tasks below. Restart the session
after installing; skills are discovered at session start.

---

## Usage

Both skills activate from natural language. You do not need a slash command.

**`krayin-blog`**

```text
Write a blog post for the Krayin WhatsApp module.
Use /path/to/reference-blog.html as the reference structure.
```

It will then **ask you for everything** — module name, reference blog path, module/Krayin version, output
path, and whether the app is running for screenshots. Nothing is assumed, on every run.

**`krayin-compat`**

```text
Make this module compatible with the latest Krayin version.
```

Run it from a directory that contains the module (e.g. `./packages/Webkul/WhatsApp`). If no module is
there, the skill stops immediately with an explicit message rather than hunting around your filesystem.

See each skill's own README for the full walkthrough, gates, outputs and troubleshooting.

---

## Updating

```bash
# npx install — just run it again
npx krayin-module-skills --force

# manual copy install
cd /path/to/krayin-module-related-skills && git pull
cp -r Krayin-module-blog/.       ~/.claude/skills/krayin-blog/
cp -r Krayin-module-compatible/. ~/.claude/skills/krayin-compat/

# symlink install — nothing to copy
git -C ~/src/krayin-module-related-skills pull
```

## Uninstalling

```bash
npx krayin-module-skills --uninstall

# or by hand
rm -rf ~/.claude/skills/krayin-blog ~/.claude/skills/krayin-compat
# project install
rm -rf .claude/skills/krayin-blog .claude/skills/krayin-compat
```

---

## Repository layout

```text
krayin-module-related-skills/
├── README.md                        # this file — common overview + install
├── LICENSE                          # MIT
├── .gitignore                       # skill run artifacts, secrets, tooling noise
├── package.json                     # npm metadata for the npx installer
├── bin/
│   └── install.js                   # the `npx krayin-module-skills` installer
├── Krayin-module-blog/
│   ├── SKILL.md                     # the krayin-blog skill
│   └── README.md                    # full guide to krayin-blog
└── Krayin-module-compatible/
    ├── SKILL.md                     # the krayin-compat skill
    └── README.md                    # full guide to krayin-compat
```

That is the whole repository. There is no build step and no dependency to install — the skills are the
two `SKILL.md` files, and the npx installer copies them into place.

---

## What is not committed or published

Both skills write output as they run. None of it belongs in this repository, and some of it contains live
data, so [`.gitignore`](.gitignore) excludes it up front rather than after someone pushes a customer's
phone number.

**Skill run artifacts**

| Ignored | Why |
|---|---|
| `.krayin-compat-state.json`, `.krayin-compat-state.*.json` | `krayin-compat`'s resume state. Records the host app path and the module in progress — noise, and mildly sensitive. |
| `file-changes/`, `patches/` | `krayin-compat`'s per-run output. It belongs to the module being fixed, not to this repo. |
| `blog-images/`, `blog-output/`, `screenshots/` | `krayin-blog`'s captures. **These come from a real admin panel** and can contain live CRM data — customer names, email addresses, phone numbers. |
| `Module-Analysis-Notes*.md`, `*-blog.html`, `blog-*.html` | The analysis doc and generated blog, produced per module run. |
| `paragraph-check.py`, `image-width-check.py`, `image-order-check.py` | Written out at run time. The copies inside `SKILL.md` are the source of truth. |
| `seed-*.sql`, `seed-*.php` | Demo-data seed files the blog skill writes before capturing screenshots. |

**Secrets** — `.env` and `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*.p12`, `*.pfx`,
`credentials.json`, `secrets.json`, `auth.json`, `.npmrc`, `.netrc`.

**Tooling and noise** — `node_modules/`, npm debug logs, `*.tgz`, `vendor/`, `__pycache__/`, virtualenvs,
Playwright leftovers (`playwright-report/`, `test-results/`, `trace.zip`), `*.log`, `tmp/`, `scratchpad/`,
`.claude/settings.local.json`, editor directories (`.idea/`, `.vscode/`, swap files) and OS files
(`.DS_Store`, `Thumbs.db`, `desktop.ini`).

`package-lock.json` is **not** ignored — it is committed on purpose, as it should be for a published
package. The installer has zero runtime dependencies, so the lockfile stays trivial.

**What npm publishes** is controlled separately by the `files` whitelist in `package.json`, so a stray
local file can never reach the registry even if it escapes `.gitignore`. The published tarball is exactly
eight files:

```text
bin/install.js
Krayin-module-blog/SKILL.md          Krayin-module-blog/README.md
Krayin-module-compatible/SKILL.md    Krayin-module-compatible/README.md
README.md   LICENSE   package.json
```

Verify before publishing with:

```bash
npm pack --dry-run
```

**If you commit a project install** of the skills (`npx krayin-module-skills --project` inside your Krayin
app), commit `.claude/skills/` and leave `.claude/settings.local.json` ignored — it is machine-specific.

---

## Krayin facts both skills encode

These are the mistakes a general-purpose assistant makes on a Krayin codebase. Both skills are written
against the verified Krayin 2.2.x source.

| Do not assume | Krayin reality |
|---|---|
| `src/Config/system.php` merged into `core` | **`src/Config/core_config.php`** merged into **`core_config`**. There is no `system.php` in Krayin — that is Bagisto. |
| `src/Config/admin-menu.php` | **`src/Config/menu.php`**, merged into **`menu.admin`** |
| `admin-routes.php` + `shop-routes.php` | Route files are **domain-named**: `leads-routes.php`, `contacts-routes.php`, `activities-routes.php`, `quote-routes.php`, `products-routes.php`, `mail-routes.php`, `settings-routes.php`, `configuration-routes.php`. Third-party modules commonly ship a single `web.php`. |
| An admin panel + seller panel + storefront | **Admin panel only.** No seller dashboard, no customer account area, no storefront. |
| Customers placing orders | The CRM records **leads**, **persons**, **organizations**, **quotes**, **products**, **activities**, **campaigns**. |
| Shop themes | Not applicable. One admin UI. Talk about **locales and RTL** instead. |
| A hardcoded `/admin` prefix | `config('app.admin_path')`, default `admin`, overridable with `APP_ADMIN_PATH`. |
| Providers in `config/app.php` | Krayin runs **Laravel 12** — providers live in `bootstrap/providers.php`. `config/app.php` has no `providers` array. |
| `core_config` values are encrypted | They are stored **plain text**. `type => password` masks the input only; a module storing credentials must encrypt them itself. |
| A translations-check artisan command | **Does not exist.** Krayin ships `krayin-crm:install` and `krayin-crm:version`. |
| Docs at another vendor's domain | [devdocs.krayincrm.com](https://devdocs.krayincrm.com/) · [docs.krayincrm.com](https://docs.krayincrm.com/) · [forums.krayincrm.com](https://forums.krayincrm.com/) |

The only public, non-admin surface in Krayin is **Web Forms** — an embeddable lead-capture form at
`web-forms/forms/{id}/form.js`.

Krayin core ships ten locales — `ar`, `en`, `es`, `fa`, `ja`, `ko`, `pt_BR`, `tr`, `vi`, `zh_CN` — of
which `ar` and `fa` are RTL.

**Cache caveat, true for both skills:** `mergeConfigFrom()` is a no-op while the host app has a cached
config. Run `php artisan optimize:clear` before concluding a module's config section or menu entry is
broken.

---

## Safety guarantees

Both skills are written so an agent cannot quietly do the wrong thing.

**`krayin-blog`**

- Never modifies module source code — it reads code, writes blog content and screenshots.
- Never writes to `core_config`, `.env`, or anything under **Configure** — those hold live credentials.
- Never fabricates a feature, config field, menu item, permission or screenshot.
- Never ships an empty-list screenshot; demo data is audited and seeded first, into test records only.
- Never seeds against a real customer record, and never clicks Send on a live integration.

**`krayin-compat`**

- **No file outside the module package is changed**, ever, beyond three installation registration entries
  (root `composer.json`, `config/concord.php`, `bootstrap/providers.php`).
- A **pre-write path guard** runs before every single `Edit`/`Write`, resolving the absolute path and
  rejecting anything outside the allowed set — including `../` escapes and `vendor/` symlinks that
  resolve back into the module.
- **Containment is re-checked three times per run**, not once.
- It **cannot claim** *compatible*, *secure*, *optimised* or *verified* unless the corresponding gate
  actually ran. Anything that did not run is reported verbatim as `NOT VERIFIED — <reason>`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| The skill never activates | Run `npx krayin-module-skills --list`. The folder name must match the `name:` in its frontmatter. Restart the session — skills are discovered at session start. |
| `npx: command not found` | Install Node 16+ (npx ships with npm), or use the manual copy install above. |
| `npx` installs an old version | npx caches packages. Run `npx --yes krayin-module-skills@latest`, or `npm cache clean --force`. |
| `krayin-compat` says "Module is not available in this directory" | It only looks in the current working directory, by design. `cd` to the directory that holds `packages/Webkul/<Module>` and re-run. |
| `krayin-compat` stops with "This is not a Krayin module package" | The folder needs both a `composer.json` with a `Webkul\<Module>\` PSR-4 entry and a `src/Providers/*ServiceProvider.php`. |
| It stops with "No Krayin installation found" | The host path needs `artisan` **and** `packages/Webkul/Core/`. A Bagisto checkout also has both — use `bagisto-compat` for Bagisto. |
| The module's config section does not appear in the admin panel | `php artisan optimize:clear`. `mergeConfigFrom` is skipped while the config cache is warm. |
| `krayin-blog` produced no screenshots | The app must be running and reachable, with admin credentials supplied. Otherwise the skill offers image placeholders — it will ask which you want. |
| Screenshots are the wrong width | Every image must be exactly 1440px wide. The skill asserts this; a wrong-width file is recaptured, never upscaled. |

---

## Contributing

Issues and pull requests are welcome at
<https://github.com/23gauravS/krayin-module-related-skills>.

When proposing a change to a skill, please:

- Verify the claim against a real Krayin 2.2.x checkout and say which file you verified it in — both
  skills are deliberately full of "verified against the codebase" facts, and an unverified addition
  undoes their whole point.
- Keep the same voice: imperative rules, explicit outcomes, no hedging.
- Update the skill's own README in the same PR.

## Related

- [Krayin CRM](https://krayincrm.com/) · [Developer docs](https://devdocs.krayincrm.com/) ·
  [User docs](https://docs.krayincrm.com/) · [Forums](https://forums.krayincrm.com/)
- [Claude Code Agent Skills](https://docs.claude.com/en/docs/claude-code/skills)
- Bagisto counterparts: `bagisto-blog`, `bagisto-compat`

## License

MIT — see [LICENSE](LICENSE). Free and open source; use, modify and redistribute freely.
