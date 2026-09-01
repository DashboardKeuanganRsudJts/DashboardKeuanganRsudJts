const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

content = content.replace(
  /export const Navbar: React.FC<NavbarProps> = \({[\s\S]*?}\) => {/,
  `export const Navbar: React.FC<NavbarProps> = ({
  syncConfig,
  totalRecordsCount,
  user,
  isAdmin
}) => {`
);

content = content.replace(
  /<button \s+onClick={\(\) => setIsSettingsOpen\(true\)}[\s\S]*?<\/button>/,
  `{isAdmin && (
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className="text-emerald-400 hover:text-white transition ml-2" 
                title="Pengaturan"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}`
);

fs.writeFileSync('src/components/Navbar.tsx', content);
