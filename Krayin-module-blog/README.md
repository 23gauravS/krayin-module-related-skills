# krayin-blog

> Write a deep, step-by-step blog post for any **Krayin CRM** module — mirroring the structure of a
> reference blog you supply, with **real screenshots** captured from the running admin panel, output as
> WordPress Gutenberg HTML ready to paste into the WP editor.

Part of [krayin-module-related-skills](../README.md). See also the companion skill
[`krayin-compat`](../Krayin-module-compatible/README.md).

---

## Table of contents

- [What it does](#what-it-does)
- [When it activates](#when-it-activates)
- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
- [What it asks you — every time](#what-it-asks-you--every-time)
- [The workflow](#the-workflow)
- [Outputs](#outputs)
- [Screenshot rules](#screenshot-rules)
- [Demo data seeding](#demo-data-seeding)
- [Gutenberg block format](#gutenberg-block-format)
- [Content rules](#content-rules)
- [SEO & readability standards](#seo--readability-standards)
- [Verification scripts](#verification-scripts)
- [Reference blog mapping](#reference-blog-mapping)
- [Krayin facts the skill encodes](#krayin-facts-the-skill-encodes)
- [Safety rails](#safety-rails)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What it does

Given a Krayin module and a reference blog file, the skill:

1. **Parses the reference blog** and extracts its exact skeleton — heading hierarchy, intro style,
   installation code blocks, feature-bullet pattern, image placement, closing paragraph.
2. **Reads the module's entire source** — routes, controllers, models, repositories, migrations, views,
   `src/Config/core_config.php`, `menu.php`, `acl.php`, `composer.json` — and writes a
   **Module Analysis Notes** doc that becomes the source of truth for every factual claim.
3. **Audits and seeds demo CRM data** so no screenshot shows an empty list.
4. **Captures real screenshots** via Playwright from the running admin panel, at a strict 1440px width,
   as WebP, numbered by their position in the finished document.
5. **Writes the blog** in WordPress Gutenberg block markup, mirroring the reference structure exactly,
   with a step-by-step block for **every** feature section.
6. **Verifies programmatically** — paragraph length, image width, image numbering, block balance,
   passive-voice ratio, transition density, section word counts — then delivers.

It never modifies module source code and never writes to application configuration.

## When it activates

Triggers on *write blog*, *blog content*, *blog post*, *documentation article* for a Krayin module or
package — especially when you reference a sample blog ("use this blog as reference", "according to this
structure", "I have attached the blog path").

---

## Installation

### npx (recommended)

```bash
npx krayin-module-skills blog
```

Installs `krayin-blog` into `~/.claude/skills/`. Nothing is installed globally, no clone is left behind.

Until the package is published to npm, run it straight from GitHub — same installer, same result:

```bash
npx github:23gauravS/krayin-module-related-skills blog
```

Other options:

| Command | What it does |
|---|---|
| `npx krayin-module-skills blog` | Install `krayin-blog` for your user |
| `npx krayin-module-skills blog --project` | Install into `./.claude/skills/` so your team gets it |
| `npx krayin-module-skills blog --dir <path>` | Install into an explicit skills directory |
| `npx krayin-module-skills blog --force` | Overwrite an existing install without a warning |
| `npx krayin-module-skills --list` | Show which skills are installed and where |
| `npx krayin-module-skills --uninstall blog` | Remove it |
| `npx krayin-module-skills` | Install **both** skills (this one and its companion) |

Node 16+ is required for the installer — the skill itself needs no Node at all.

### Manual install

The folder name becomes the skill name, so rename it to `krayin-blog` on install.

**Personal install (all projects):**

```bash
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills \
  && mkdir -p ~/.claude/skills \
  && cp -r /tmp/krayin-skills/Krayin-module-blog ~/.claude/skills/krayin-blog \
  && rm -rf /tmp/krayin-skills \
  && echo "installed: krayin-blog"
```

**Project install (shared with your team):**

```bash
cd /path/to/your/krayin-project
git clone --depth 1 https://github.com/23gauravS/krayin-module-related-skills.git /tmp/krayin-skills
mkdir -p .claude/skills
cp -r /tmp/krayin-skills/Krayin-module-blog .claude/skills/krayin-blog
rm -rf /tmp/krayin-skills
git add .claude/skills && git commit -m "Add krayin-blog skill"
```

**Symlink install (auto-updates on `git pull`):**

```bash
git clone https://github.com/23gauravS/krayin-module-related-skills.git ~/src/krayin-module-related-skills
mkdir -p ~/.claude/skills
ln -sfn ~/src/krayin-module-related-skills/Krayin-module-blog ~/.claude/skills/krayin-blog
```

### Verify

```bash
npx krayin-module-skills --list
head -3 ~/.claude/skills/krayin-blog/SKILL.md   # -> name: krayin-blog
```

Restart your Claude Code session — skills are discovered at session start.

### Uninstall

```bash
npx krayin-module-skills --uninstall blog

# or by hand
rm -rf ~/.claude/skills/krayin-blog
```

---

## Requirements

| Requirement | Why |
|---|---|
| **Claude Code** with Playwright available | browser automation for real screenshots |
| **A running Krayin 2.2.x app** + admin URL + admin credentials | the screenshots come from the live admin panel |
| **The module present** under `packages/Webkul/<Module>/` | the skill reads its real source |
| **A reference blog `.html`** in WordPress Gutenberg format | the structure to mirror |
| **Database access** | auditing and seeding demo CRM data before capture |
| **Python 3** | the three verification scripts |
| **Pillow** (or ImageMagick `identify`) | asserting the 1440px image width |
| **ImageMagick `convert`** | width-only resize when a capture needs conversion |

If the app is not running, the skill offers to start it (`php artisan optimize:clear`,
`php artisan serve`) or to fall back to image placeholders — it always asks which, never decides for you.

---

## Usage

```text
Write a blog post for the Krayin WhatsApp module.
Use /home/me/blogs/reference-bagisto-whatsapp.html as the reference structure.
Save the output to /home/me/blogs/krayin-whatsapp.html
```

or simply:

```text
Write blog content for the Krayin Zapier module, using this blog as reference:
/path/to/reference.html
```

The skill takes it from there — but it will confirm every input first.

---

## What it asks you — every time

Nothing is assumed, on every run, even if you already said it once:

1. **Module / package name** — e.g. `WhatsApp`, `Zapier`, `Twilio`, `GoogleMeet`. Must exist under
   `packages/Webkul/`.
2. **Reference blog path** — absolute path to the Gutenberg `.html` whose structure to mirror.
3. **Module version / Krayin version** — read from the module's `composer.json` and
   `php artisan krayin-crm:version`.
4. **Output path** — where the final `.html` is saved.
5. **Is the app running?** — base URL, admin URL, admin credentials. If not, start it or use placeholders.

It also **confirms the outline with you** before writing, and confirms the screenshot list before
capturing.

---

## The workflow

### Step 1 — Parse the reference blog

Extracts the skeleton: every `h2`/`h3`/`h4`/`h5` in order, intro style, installation code blocks, feature
bullet pattern (`<strong>Feature Name:</strong> description`), configuration section shape, admin-view
section shape, image placement and alt-text style, and the concluding paragraph style.

Produces an **outline** mapping reference structure → module-specific sections. Where the reference has a
seller, customer or storefront section, it is marked **dropped — no Krayin equivalent**, visibly, rather
than silently deleted. You confirm the outline before anything is written.

### Step 2 — Deep module analysis

Reads (never copies) the module's code:

- `src/Models`, `src/Repositories`, `src/Http/Controllers`, `src/Routes`, `src/Config`,
  `src/Database/Migrations`, `src/Resources/views`
- **Routes** — every file under `src/Routes/`, each route's prefix, middleware, controller and method.
  Admin routes are wrapped in `['web', 'admin_locale', 'user']` and prefixed with
  `config('app.admin_path')`. This is the definitive list of screens to screenshot.
- **`src/Config/core_config.php`** — the configuration tree rendered under **Configure**
- **`src/Config/menu.php`** — admin menu entries merged into `menu.admin`
- **`src/Config/acl.php`** — the permissions the module registers
- **Views** — including whether the module extends core through `view_render_event` rather than forking
  core views
- **Migrations**, **install instructions**, **version** from `composer.json`

Output: a **Module Analysis Notes** document.

### Step 3 — Plan the blog

Final outline: every section, heading level, feature, config field, admin screen, and which screenshot
goes where. Every screenshot is tied to a route verified in Step 2. Confirmed with you before proceeding.

### Step 4 — Screenshots via Playwright

Data-first: audit the database, seed what is empty, verify the counts, **then** capture. URLs are built
from `config('app.admin_path')`, never a hardcoded `/admin`. The skill checks for an already-running
server before starting one, and never kills a process it did not start.

### Step 5 — Write the blog content

WordPress Gutenberg block markup mirroring the reference exactly, with the content rules below.

### Step 6 — Verify and deliver

Cross-check against the outline, run all verification scripts, and report the output path, screenshot
folder, seeded-data summary and quality metrics.

---

## Outputs

| Artifact | Description |
|---|---|
| `<output>.html` | The finished blog in WordPress Gutenberg block markup, ready to paste |
| `blog-images/` | Every screenshot, WebP, exactly 1440px wide, numbered by document position |
| **Module Analysis Notes** | The code-derived source of truth for every factual claim in the blog |
| **Delivery summary** | Output path, screenshot folder, tables seeded + row counts, sections written, quality metrics (passive %, transition %, max section word count) |

---

## Screenshot rules

- **Naming:** `{n}-{module}-{name}.webp` — e.g. `1-whatsapp-lead-view.webp`, `2-whatsapp-chat-widget.webp`
- **`{n}` is the 1-based position in the finished blog**, not the capture order. Numbers are assigned once
  the outline is fixed, and renumbered if a section moves.
- **Every image is exactly 1440px wide. No exceptions.** Set the browser viewport to 1440 at device scale
  factor 1, so the capture is already 1440 wide before any conversion — an upscaled screenshot is visibly
  soft, and text is the entire point of a documentation screenshot.
- **Height follows content.** Resize on width only: `convert -resize 1440x -quality 90 out.webp`. Never
  use ImageMagick's `!` flag (`1440x900!`) — it distorts the screenshot.
- A screen taller than the viewport is either captured full-page at the same 1440 width, or cropped to the
  region the section is actually about.
- Capture at each meaningful step — list → create → save → confirmation — so the blog tells a story.
- Every image referenced by the blog must resolve to a real, non-empty file. Asserted, not eyeballed.

---

## Demo data seeding

Every feature must have real records, so screenshots are never empty lists.

1. **Audit** — connect to the app database and count rows in every table the module adds (from its
   `src/Database/Migrations`) plus the core tables it reads: `leads`, `persons`, `organizations`,
   `activities`, `quotes`, `products`.
2. **Seed** — one idempotent SQL or tinker seed file covering every empty feature table, minimum 2 rows
   per list-based feature, with the foreign keys filled in so screens show meaningful data.
3. **Resolve ids at runtime, never hardcode.** `lead_pipeline_id`, `lead_pipeline_stage_id`,
   `lead_source_id`, `lead_type_id` and `user_id` differ per installation.
4. **Verify counts** after seeding.

**Seed into a test lead or contact, never a real one.** Check the phone numbers, email addresses and
names you are about to write against — a demo row on a real customer's record is worse than an empty
screenshot. This matters most for modules that send: a walkthrough that clicks Send delivers a real
message.

---

## Gutenberg block format

| Element | Markup |
|---|---|
| Heading | `<!-- wp:heading -->` + `<h2 class="wp-block-heading">` … `<!-- /wp:heading -->` (use `{"level":3}` for h3) |
| Paragraph | `<!-- wp:paragraph -->` + `<p>` … `<!-- /wp:paragraph -->` |
| Code | `<!-- wp:code -->` + `<pre class="wp-block-code"><code>…</code></pre>` |
| Commands | `<!-- wp:preformatted -->` + `<pre class="wp-block-preformatted">…</pre>` |
| List | `<!-- wp:list -->` + `<ul class="wp-block-list">` with `<!-- wp:list-item --><li>` |
| Ordered list | `<!-- wp:list {"ordered":true} -->` + `<ol>` |
| Image | `<!-- wp:image {"sizeSlug":"full"} -->` + `<figure class="wp-block-image size-full"><img src="…" alt="…"/></figure>` |

**Block hygiene:**

- **Unique `wp-image-*` ids** — never reuse an id; grep for duplicates before delivering.
- **Position prefixes stay in sync** — the `{n}-` in the filename, the `{n}-` opening the alt text, and
  the image's actual document position are the same number. These drift the moment a section moves, so
  they are re-checked last, after the HTML is final.
- **Balanced blocks** — every `<!-- wp:… -->` has its `<!-- /wp:… -->`. Counted, not assumed.
- **Generating programmatically?** Re-scan heading positions on the *current* document after every
  insertion. Sequential insertions against pre-computed offsets drift and corrupt the HTML.

---

## Content rules

- **Step-by-step, deeply.** Every feature gets a real step-by-step block — not just installation and
  configuration. Each admin section gets an `h4` titled `Step-by-Step: {Section Action}` followed by an
  ordered list with the exact numbered click-path (menu → button → fields → save).
- **Paragraphs under 200 characters — strict.** Roughly three lines at blog width. One idea per
  paragraph. A longer thought becomes a second paragraph, a list, or a new subheading. Verified by script.
- **Feature descriptions** are `<strong>Feature Name:</strong>` + a real description derived from the
  code. Never hallucinated.
- **Config fields** — every field from `src/Config/core_config.php`, one per paragraph or heading.
  Credential fields are usually `type => password`; say what the module does to protect them rather than
  assuming encryption — **Krayin stores `core_config` values in plain text** unless the module encrypts
  them itself.
- **Admin sections** — one `h3` per entry in `menu.php`, with explanation, screenshot, then its
  step-by-step block.
- **Permissions** — if the module ships `acl.php`, document each permission and where it is granted
  (**Settings → Roles**). Krayin's `hasPermission()` is an **exact match with no inheritance**, so a
  parent permission never implies a child one; describe each permission separately.
- **Accurate naming** — exact menu labels, route names and field labels from the module's views,
  `menu.php` and lang files.

---

## SEO & readability standards

Applied while writing, verified before delivery.

| # | Rule | Threshold |
|---|---|---|
| 1 | **Sentence variety** — no 3+ consecutive sentences starting with the same word | hard |
| 2 | **Subheading distribution** — no prose section exceeds 300 words without an `h3`/`h4` | ≤ 300 words |
| 3 | **Passive voice** | ≤ 10% of sentences |
| 4 | **Transition word density** | ≥ 30% of sentences |
| 5 | **Sentence length** | 15–20 words average; avoid > 25 |
| 6 | **Paragraph length** | < 200 characters per block |

Plus:

- **Focus keyword** — module name + "Krayin" in the first paragraph, at least one `h2`, and the conclusion.
- **Meta description** — a paragraph block right after the h1, 150–160 characters.
- **Image alt text** — starts with the position prefix, then describes the screen including the module
  name: `alt="1- image for the Krayin WhatsApp module lead view showing the chat widget"`. The number
  matches the filename.
- **Internal links** — [devdocs.krayincrm.com](https://devdocs.krayincrm.com/) and
  [docs.krayincrm.com](https://docs.krayincrm.com/) where the reference blog links to official docs.
- **Heading hierarchy** — strictly sequential h1 → h2 → h3 → h4. Never skip a level.
- **Bold key terms** — `<strong>` for feature names, config fields and menu items on first mention.

Transition words the skill draws on: *however, therefore, moreover, furthermore, consequently,
additionally, similarly, for example, in addition, as a result, next, then, finally, first, second,
meanwhile, likewise, on the other hand, in contrast, specifically, notably, particularly.*

---

## Verification scripts

The skill ships three checks and runs them before delivering. Each exits non-zero and names every
offender.

**Paragraph length** — every paragraph block under 200 characters. Split each offender; never shrink one
by deleting a fact.

```bash
python3 paragraph-check.py "$BLOG_HTML"
```

**Image width** — every WebP exactly 1440px wide. Requires Pillow (or swap in ImageMagick `identify`).
Any file that is not 1440 is **recaptured, never upscaled**.

```bash
python3 image-width-check.py blog-images
```

**Image prefix order** — walks the images in document order and names every mismatch between position,
filename and alt text. Renumber the offenders — do not renumber the document to suit the files.

```bash
python3 image-order-check.py "$BLOG_HTML"
```

The full source of all three is in [`SKILL.md`](SKILL.md). The shell snippets deliberately avoid
positional variables: a skill invoked with arguments has them substituted before the script ever sees them.

---

## Reference blog mapping

| Reference section | What it becomes for the target module |
|---|---|
| Introduction | What the module does, compatibility (Krayin version, PHP, Laravel) |
| Installation of {Module} | Real install steps from the module's README, provider and installer command |
| Features / Additional Features | Real feature bullets derived from routes, controllers and config |
| {Module} Configuration | Every field from `src/Config/core_config.php`, grouped, reached through **Configure** |
| {Module} Admin View | Every admin screen from the route files + `src/Config/menu.php` |
| {Module} Permissions | Every entry in `src/Config/acl.php`, granted under **Settings → Roles** |
| Seller / Customer / Storefront View | **Dropped** — Krayin has no such surface. Only cover Web Forms if the module touches them. |
| Conclusion | Wrap-up + link to [forums.krayincrm.com](https://forums.krayincrm.com/) |

---

## Krayin facts the skill encodes

Krayin shares a vendor and a Laravel lineage with Bagisto, so plausible-looking file names get assumed
into existence. Every row is verified against the Krayin 2.2.x codebase.

| Do not assume | Krayin reality |
|---|---|
| `src/Config/system.php` merged into `core` | **`src/Config/core_config.php`** merged into **`core_config`**. No `system.php` exists in Krayin. |
| `src/Config/admin-menu.php` | **`src/Config/menu.php`**, merged into **`menu.admin`** |
| `admin-routes.php` + `shop-routes.php` | Domain-named route files: `leads-routes.php`, `contacts-routes.php`, `activities-routes.php`, `quote-routes.php`, `products-routes.php`, `mail-routes.php`, `settings-routes.php`, `configuration-routes.php`. Third-party modules commonly ship a single `web.php`. |
| Admin + seller panel + storefront | **Admin panel only.** |
| Customers placing orders | Leads, persons, organizations, quotes, products, activities, campaigns |
| Shop themes | Not applicable — discuss **locales and RTL** instead |
| A hardcoded `/admin` prefix | `config('app.admin_path')`, default `admin`, overridable with `APP_ADMIN_PATH` |
| A translations-check artisan command | **Does not exist.** Krayin ships `krayin-crm:install` and `krayin-crm:version`. |

**The only public, non-admin surface is Web Forms** — `web-forms/forms/{id}/form.js` and `form.html`, an
embeddable lead-capture form. If the module does not touch Web Forms, there is nothing outside the admin
panel to screenshot.

**The core admin menu**, for placing a module's screens in context: **Dashboard**, **Leads**, **Quotes**,
**Mail** (Inbox, Draft, Outbox, Sent, Trash), **Activities**, **Contacts** (Persons, Organizations),
**Products**, and **Settings** — User (Groups, Roles, Users), Lead (Pipelines, Sources, Types), Inventory
(Warehouse), Automation (Attributes, Email Templates, Events, Campaigns, Webhooks, Workflows, Data
Transfer) and Other Settings (Tags). Module configuration lives separately under **Configure**.

**Locales:** `ar`, `en`, `es`, `fa`, `ja`, `ko`, `pt_BR`, `tr`, `vi`, `zh_CN` — `ar` and `fa` are RTL.

---

## Safety rails

- **Never modifies module source code.** The skill reads code and writes blog content and screenshots.
- **Never writes to `core_config`, `.env`, or anything under Configure.** Those hold live credentials for
  real integrations. It reads current values and works with what is set; if a setting is genuinely
  required for a screenshot, it asks you to set it. A broken integration is invisible until a real
  customer message fails.
- **Never copies large code chunks** into the blog — behavior is described, and only tiny config or route
  fragments are quoted.
- **Never fabricates** features, config fields, menu items, permissions or screenshots. Every claim traces
  back to code read in Step 2.
- **Never fakes data in screenshots.** Real rows are seeded first; no placeholders or empty-list
  screenshots for features that ship with records.
- **Seeds into test records only**, never a real lead or contact.
- **Never kills a server it did not start.**
- If the module has no admin menu entry, no configuration section, or no permissions, the blog mirrors the
  reference and **omits what does not exist** rather than inventing it.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| The skill does not activate | Run `npx krayin-module-skills --list`. The folder must be named `krayin-blog` and contain `SKILL.md`. Restart the session. |
| `npx: command not found` | Install Node 16+ (npx ships with npm), or use the manual install above. |
| The module's config section is missing from the blog | `php artisan optimize:clear` — `mergeConfigFrom` is a no-op while the host app has a cached config, which makes a correct module look broken. |
| Screenshots are empty lists | Demo data was not seeded. Confirm database access and re-run Step 4; the skill audits row counts before capture. |
| Screenshots are the wrong width | Every image must be exactly 1440px. Run `image-width-check.py`; recapture at viewport 1440 / DSF 1 rather than upscaling. |
| Images appear out of order in WordPress | Run `image-order-check.py`. The filename prefix, alt-text prefix and document position must agree — renumber the files, not the document. |
| Paragraphs render as walls of text | Run `paragraph-check.py`. Split offenders into more paragraphs, lists or subheadings; do not delete facts to fit. |
| Screenshot URLs 404 | The admin prefix is `config('app.admin_path')`, not a hardcoded `/admin`. Check `APP_ADMIN_PATH`. |
| The app is not running | The skill offers to start it (`php artisan optimize:clear`, `php artisan serve`) or fall back to placeholders — it always asks. |

---

## License

MIT. Free and open source.
