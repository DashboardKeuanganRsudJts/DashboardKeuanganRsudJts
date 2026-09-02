const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

c = "import { useNavigate, useLocation } from 'react-router-dom';\n" + c;

// Replace `const [activeMenu, setActiveMenu] = useState<string>('dashboard_2026');`
// and `const [activeSubmenu, setActiveSubmenu] = useState<string | undefined>(undefined);`
// with logic driven by react-router.

const replacement = `
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuFromRoute = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    const main = parts[0];
    const sub = parts[1] ? parts[1].replace(/-/g, '_') : undefined;

    switch (main) {
      case 'home':
      case '':
        return { menu: 'dashboard_2026', submenu: undefined };
      case 'pendapatan':
        return { menu: 'pendapatan_blud', submenu: sub };
      case 'pengeluaran':
        return { menu: 'pengeluaran_blud', submenu: sub };
      case 'hutang':
        return { menu: 'hutang', submenu: sub };
      case 'piutang':
        if (['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(sub || '')) {
          return { menu: sub, submenu: undefined };
        }
        return { menu: 'perusahaan_asuransi', submenu: undefined };
      case 'monitoring-ppn':
        return { menu: 'monitoring_ppn', submenu: sub };
      default:
        return { menu: 'dashboard_2026', submenu: undefined };
    }
  };

  const currentMenu = getMenuFromRoute(location.pathname);
  const activeMenu = currentMenu.menu;
  const activeSubmenu = currentMenu.submenu;

  const handleSelectMenu = (menu: string, submenu?: string) => {
    let path = '/home';
    if (menu === 'dashboard_2026') path = '/home';
    else if (menu === 'pendapatan_blud') path = \`/pendapatan\${submenu ? \`/\${submenu.replace(/_/g, '-')}\` : ''}\`;
    else if (menu === 'pengeluaran_blud') path = \`/pengeluaran\${submenu ? \`/\${submenu.replace(/_/g, '-')}\` : ''}\`;
    else if (menu === 'hutang') path = \`/hutang\${submenu ? \`/\${submenu.replace(/_/g, '-')}\` : ''}\`;
    else if (['perusahaan_asuransi', 'listrik_kantin', 'semua_rekapan'].includes(menu)) {
      path = \`/piutang/\${menu.replace(/_/g, '-')}\`;
    }
    else if (menu === 'monitoring_ppn') path = \`/monitoring-ppn\${submenu ? \`/\${submenu.replace(/_/g, '-')}\` : ''}\`;
    
    navigate(path);
  };
`;

c = c.replace(/const \[activeMenu, setActiveMenu\] = useState<string>\('dashboard_2026'\);\s*const \[activeSubmenu, setActiveSubmenu\] = useState<string \| undefined>\(undefined\);\s*/, replacement);

c = c.replace(/if \(user\) \{\s*setActiveMenu\('dashboard_2026'\);\s*setActiveSubmenu\(undefined\);\s*\}/, `if (user && location.pathname === '/') {\n      navigate('/home');\n    }`);

c = c.replace(/const handleSelectMenu = \(menu: string, submenu\?: string\) => \{\s*setActiveMenu\(menu\);\s*setActiveSubmenu\(submenu\);\s*\};/, '');

fs.writeFileSync('src/App.tsx', c);
console.log('Patched App.tsx');
