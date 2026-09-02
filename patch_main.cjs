const fs = require('fs');
let c = fs.readFileSync('src/main.tsx', 'utf8');

c = c.replace("import { ThemeProvider } from './context/ThemeContext.tsx';", "import { ThemeProvider } from './context/ThemeContext.tsx';\nimport { BrowserRouter } from 'react-router-dom';");

c = c.replace("<ThemeProvider>", "<ThemeProvider>\n      <BrowserRouter>");
c = c.replace("</ThemeProvider>", "      </BrowserRouter>\n    </ThemeProvider>");

fs.writeFileSync('src/main.tsx', c);
console.log('Patched main.tsx');
