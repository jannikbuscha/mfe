// Assembles the production builds of the shell and its remotes into one
// static site for GitHub Pages:
//
//   <base-path>/                  shell (+ 404.html for deep links)
//   <base-path>/remotes/mf1/      mf1, also usable standalone
//   <base-path>/remotes/mf2/      mf2, also usable standalone
//
// The remotes live under /remotes/ so their folders do not collide with the
// shell's own routes /mf1 and /mf2.
//
// Usage: node tools/github-pages/assemble.mjs [--base-path=/mfe]
// (normally via `nx run shell:github-pages`, which builds the apps first)
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    'base-path': { type: 'string', default: '' },
  },
});

// '/mfe', '/mfe/' and 'mfe' all mean the same; '' and '/' mean the domain root.
const basePath = `/${values['base-path'].replace(/^\/+|\/+$/g, '')}/`.replace(
  /^\/\/$/,
  '/',
);
const out = 'dist/github-pages';
const dist = (app) => join('dist/apps', app, 'browser');

const manifest = JSON.parse(
  await readFile('apps/shell/public/federation.manifest.json', 'utf8'),
);
const remotes = Object.keys(manifest);

for (const app of ['shell', ...remotes]) {
  await access(join(dist(app), 'index.html')).catch(() => {
    throw new Error(
      `${dist(app)} is missing: build it first (nx run shell:github-pages builds every type:app project)`,
    );
  });
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(dist('shell'), out, { recursive: true });
await setBaseHref(join(out, 'index.html'), basePath);

for (const remote of remotes) {
  const target = join(out, 'remotes', remote);
  await cp(dist(remote), target, { recursive: true });
  await setBaseHref(
    join(target, 'index.html'),
    `${basePath}remotes/${remote}/`,
  );
}

// Relative to the shell's <base href>, so the site works under any host.
const pagesManifest = Object.fromEntries(
  remotes.map((remote) => [remote, `./remotes/${remote}/remoteEntry.json`]),
);
await writeFile(
  join(out, 'federation.manifest.json'),
  `${JSON.stringify(pagesManifest, null, 2)}\n`,
);

// GitHub Pages answers unknown paths (deep links such as /mf1/espresso) with
// the top-level 404.html: let the shell's router handle them.
await cp(join(out, 'index.html'), join(out, '404.html'));

// Native Federation emits files starting with "_" (e.g. _angular_core.*.js),
// which Jekyll would drop when the site is published from a branch. The
// Actions deployment (upload-pages-artifact skips dotfiles) runs no Jekyll.
await writeFile(join(out, '.nojekyll'), '');

console.log(
  `GitHub Pages site in ${out} (base path ${basePath}, remotes: ${remotes.join(', ')})`,
);

async function setBaseHref(indexHtml, href) {
  const html = await readFile(indexHtml, 'utf8');
  if (!html.includes('<base href="/">')) {
    throw new Error(`${indexHtml} has no <base href="/"> to replace`);
  }
  await writeFile(
    indexHtml,
    html.replace('<base href="/">', `<base href="${href}">`),
  );
}
