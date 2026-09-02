const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Find the start of `if (!isOpen)`
const closedStart = content.indexOf('if (!isOpen) {');
const closedEnd = content.indexOf('return (', closedStart + 10);
const closedReturnEnd = content.indexOf('</aside>', closedEnd) + 8;
const closedContent = content.substring(content.indexOf('<aside', closedEnd), closedReturnEnd);

const openStart = content.indexOf('return (', closedReturnEnd);
const openContentStr = content.substring(openStart);
const openAsideStart = openContentStr.indexOf('<aside');
const openAsideEnd = openContentStr.lastIndexOf('</aside>') + 8;
const openContent = openContentStr.substring(openAsideStart, openAsideEnd);

// Now we construct the unified component.
// We extract the inner content of the closed <aside> and open <aside>.

const innerClosed = closedContent.substring(closedContent.indexOf('>') + 1, closedContent.lastIndexOf('</aside>'));
const innerOpen = openContent.substring(openContent.indexOf('>') + 1, openContent.lastIndexOf('</aside>'));

let newRender = `
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            onClick={onToggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside className={\`fixed inset-y-0 left-0 z-50 flex flex-col border-r h-screen md:sticky md:top-0 transition-all duration-300 ease-in-out select-none shrink-0 font-sans shadow-2xl md:shadow-sm overflow-hidden \${
        isDark 
          ? 'bg-[#0a0d0e] text-zinc-300 border-emerald-950/70' 
          : 'bg-white text-slate-700 border-slate-200'
      } \${
        isOpen 
          ? 'w-72 max-w-[85vw] translate-x-0' 
          : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
      }\`}>
        <div className="relative w-full h-full">
          {/* Expanded Content */}
          <div className={\`absolute top-0 left-0 w-72 max-w-[85vw] h-full flex flex-col transition-opacity duration-300 \${isOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}\`}>
            ${innerOpen}
          </div>
          
          {/* Collapsed Content */}
          <div className={\`absolute top-0 left-0 w-16 h-full flex-col items-center py-4 transition-opacity duration-300 hidden md:flex \${!isOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}\`}>
            ${innerClosed}
          </div>
        </div>
      </aside>
    </>
  );
`;

const newContent = content.substring(0, closedStart) + newRender + '\n};\n';

fs.writeFileSync('src/components/Sidebar.tsx', newContent);
console.log('Patched Sidebar.tsx');

