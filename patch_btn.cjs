const fs = require('fs');
let c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

c = c.replace(/<button\s*onClick=\{onToggleSidebar\}\s*className=\{`p-1\.5 rounded-lg transition \$\{[^}]*\}\s*`\}\s*\}\}\s*title="Tutup Menu" className=\{`p-1\.5 rounded-lg transition transform active:scale-90 \$\{\}\`\}/s,
  `<button onClick={onToggleSidebar} className={\`p-1.5 rounded-lg transition transform active:scale-90 \${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}\`} title="Tutup Menu">`
);

fs.writeFileSync('src/components/Sidebar.tsx', c);
