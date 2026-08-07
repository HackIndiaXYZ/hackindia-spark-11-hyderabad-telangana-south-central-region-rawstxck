const fs = require('fs');
 // wait glob is not available by default in node core.
// I will just read the files individually.

const filesToPatch = [
  {
    path: 'e:/SecurePush/web/app/login/LoginClient.tsx',
    replacements: [
      { from: /color:\s*'var\(--removed\)'/g, to: "color: 'var(--text-primary)'" },
      { from: /background:\s*'rgba\(62,207,142,0\.12\)'/g, to: "background: 'var(--surface-soft)'" },
      { from: /color:\s*'var\(--accepted\)'/g, to: "color: 'var(--text-primary)'" },
      { from: /background:\s*'var\(--accepted\)'/g, to: "background: 'var(--text-primary)'" },
      { from: /background:\s*var\(--proposed\);/g, to: "background: var(--text-muted);" },
      { from: /border-top-color:\s*var\(--accepted\);/g, to: "border-top-color: var(--text-primary);" }
    ]
  },
  {
    path: 'e:/SecurePush/web/app/about/page.module.css',
    replacements: [
      { from: /color:\s*var\(--proposed\);/g, to: "color: var(--text-primary);" },
      { from: /background:\s*rgba\(232, 163, 61, 0\.1\);/g, to: "background: var(--surface-soft);" }
    ]
  },
  {
    path: 'e:/SecurePush/web/app/dashboard/page.module.css',
    replacements: [
      { from: /color:\s*var\(--accepted\);/g, to: "color: var(--text-primary);" },
      { from: /background:\s*rgba\(62, 207, 142, 0\.1\);/g, to: "background: var(--surface-soft);" }
    ]
  },
  {
    path: 'e:/SecurePush/web/app/dashboard/[repo]/layout.module.css',
    replacements: [
      { from: /color:\s*var\(--accepted\);/g, to: "color: var(--text-primary);" }
    ]
  },
  {
    path: 'e:/SecurePush/web/app/profile/page.module.css',
    replacements: [
      { from: /color:\s*var\(--removed\);/g, to: "color: var(--text-primary);" },
      { from: /border:\s*1px solid rgba\(229, 72, 77, 0\.3\);/g, to: "border: 1px solid var(--border);" },
      { from: /background:\s*rgba\(229, 72, 77, 0\.1\);/g, to: "background: var(--surface-raised);" }
    ]
  }
];

filesToPatch.forEach(fileDef => {
  let content = fs.readFileSync(fileDef.path, 'utf8');
  fileDef.replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(fileDef.path, content);
  console.log('Patched', fileDef.path);
});
