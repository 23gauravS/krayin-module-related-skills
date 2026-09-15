#!/usr/bin/env node
'use strict';

/**
 * Installer for the Krayin module Agent Skills.
 *
 *   npx krayin-module-skills                    # install both, for your user
 *   npx krayin-module-skills --project          # install into ./.claude/skills
 *   npx krayin-module-skills blog               # install only krayin-blog
 *   npx krayin-module-skills compat             # install only krayin-compat
 *   npx krayin-module-skills --list             # show what is installed
 *   npx krayin-module-skills --uninstall        # remove them
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILLS = {
  blog: {
    name: 'krayin-blog',
    source: 'Krayin-module-blog',
    summary: 'Write a deep, step-by-step blog post for a Krayin module, with real screenshots.',
  },
  compat: {
    name: 'krayin-compat',
    source: 'Krayin-module-compatible',
    summary: 'Make a Krayin module compatible with the latest Krayin — plus security, UI and performance.',
  },
};

const ALIASES = {
  'blog': 'blog',
  'krayin-blog': 'blog',
  'krayin-module-blog': 'blog',
  'compat': 'compat',
  'krayin-compat': 'compat',
  'krayin-module-compatible': 'compat',
  'compatible': 'compat',
};

const ESC = String.fromCharCode(27);

const wrap = (code) => (s) => ESC + '[' + code + 'm' + s + ESC + '[0m';

const c = process.stdout.isTTY
  ? {
      b: wrap(1),
      dim: wrap(2),
      green: wrap(32),
      yellow: wrap(33),
      red: wrap(31),
      cyan: wrap(36),
    }
  : { b: (s) => s, dim: (s) => s, green: (s) => s, yellow: (s) => s, red: (s) => s, cyan: (s) => s };

function usage() {
  console.log([
    '',
    c.b('krayin-module-skills') + ' — install the Krayin CRM Agent Skills',
    '',
    c.b('Usage'),
    '  npx krayin-module-skills [skill...] [options]',
    '',
    c.b('Skills') + ' ' + c.dim('(default: both)'),
    '  blog      ' + c.dim(SKILLS.blog.summary),
    '  compat    ' + c.dim(SKILLS.compat.summary),
    '',
    c.b('Options'),
    '  --project, -p     Install into ./.claude/skills instead of ~/.claude/skills',
    '  --dir <path>      Install into an explicit skills directory',
    '  --force, -f       Overwrite an existing install without a warning',
    '  --list, -l        Show which skills are installed and where',
    '  --uninstall       Remove the selected skills',
    '  --help, -h        Show this message',
    '',
    c.b('Examples'),
    '  npx krayin-module-skills',
    '  npx krayin-module-skills blog',
    '  npx krayin-module-skills --project',
    '  npx krayin-module-skills --uninstall compat',
    '',
  ].join('\n'));
}

function parseArgs(argv) {
  const opts = {
    selected: [],
    project: false,
    dir: null,
    force: false,
    list: false,
    uninstall: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--project' || a === '-p') opts.project = true;
    else if (a === '--force' || a === '-f') opts.force = true;
    else if (a === '--list' || a === '-l') opts.list = true;
    else if (a === '--uninstall' || a === '--remove') opts.uninstall = true;
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a.indexOf('--dir=') === 0) opts.dir = a.slice('--dir='.length);
    else if (a.charAt(0) === '-') {
      console.error(c.red('Unknown option: ' + a));
      process.exit(1);
    } else {
      const key = ALIASES[a.toLowerCase()];

      if (!key) {
        console.error(c.red('Unknown skill: ' + a) + '  (expected: blog, compat)');
        process.exit(1);
      }

      if (opts.selected.indexOf(key) === -1) opts.selected.push(key);
    }
  }

  if (opts.selected.length === 0) opts.selected = Object.keys(SKILLS);

  return opts;
}

function targetDir(opts) {
  if (opts.dir) return path.resolve(opts.dir);
  if (opts.project) return path.resolve(process.cwd(), '.claude', 'skills');

  return path.join(os.homedir(), '.claude', 'skills');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);

    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(from), to);
    else fs.copyFileSync(from, to);
  }
}

function list(dest) {
  console.log('\n' + c.b('Skills directory') + '  ' + dest + '\n');

  for (const key of Object.keys(SKILLS)) {
    const s = SKILLS[key];
    const p = path.join(dest, s.name);
    const installed = fs.existsSync(path.join(p, 'SKILL.md'));
    const link = installed && fs.lstatSync(p).isSymbolicLink() ? c.dim(' (symlink)') : '';

    console.log('  ' + (installed ? c.green('OK') : c.dim(' -')) + ' ' + s.name.padEnd(16) +
      (installed ? c.dim(p) + link : c.dim('not installed')));
  }

  console.log('');
}

function uninstall(dest, selected) {
  for (const key of selected) {
    const s = SKILLS[key];
    const p = path.join(dest, s.name);

    if (!fs.existsSync(p)) {
      console.log('  ' + c.dim(' -') + ' ' + s.name + ' ' + c.dim('not installed'));
      continue;
    }

    fs.rmSync(p, { recursive: true, force: true });
    console.log('  ' + c.green('OK') + ' removed ' + s.name + ' ' + c.dim(p));
  }

  console.log('\n' + c.dim('Restart your Claude Code session to pick up the change.') + '\n');
}

function install(root, dest, opts) {
  fs.mkdirSync(dest, { recursive: true });

  const done = [];

  for (const key of opts.selected) {
    const s = SKILLS[key];
    const from = path.join(root, s.source);
    const to = path.join(dest, s.name);

    if (!fs.existsSync(path.join(from, 'SKILL.md'))) {
      console.error(c.red('FAIL ' + s.name + ': source not found at ' + from));
      process.exitCode = 1;
      continue;
    }

    if (fs.existsSync(to)) {
      if (!opts.force) {
        console.log('  ' + c.yellow(' !') + ' ' + s.name + ' already exists — replacing ' +
          c.dim('(use --force to silence)'));
      }

      fs.rmSync(to, { recursive: true, force: true });
    }

    copyDir(from, to);

    if (!fs.existsSync(path.join(to, 'SKILL.md'))) {
      console.error(c.red('FAIL ' + s.name + ': install verification failed'));
      process.exitCode = 1;
      continue;
    }

    done.push(s);
    console.log('  ' + c.green('OK') + ' ' + s.name.padEnd(16) + c.dim(to));
  }

  if (done.length === 0) return;

  console.log('\n' + c.b('Installed') + ' ' + done.length + ' skill' + (done.length > 1 ? 's' : '') +
    ' into ' + c.cyan(dest) + '\n');

  for (const s of done) console.log('  ' + c.b(s.name) + '\n    ' + c.dim(s.summary));

  console.log([
    '',
    c.b('Next'),
    '  1. Restart your Claude Code session — skills are discovered at session start.',
    '  2. Ask for the work in plain language, e.g.',
    '       ' + c.dim('"Write a blog post for the Krayin WhatsApp module, using /path/to/reference.html"'),
    '       ' + c.dim('"Make this module compatible with the latest Krayin version"'),
    '',
    c.dim('Docs: https://github.com/23gauravS/krayin-module-related-skills'),
    '',
  ].join('\n'));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) return usage();

  const root = path.resolve(__dirname, '..');
  const dest = targetDir(opts);

  if (opts.list) return list(dest);
  if (opts.uninstall) return uninstall(dest, opts.selected);

  return install(root, dest, opts);
}

main();
