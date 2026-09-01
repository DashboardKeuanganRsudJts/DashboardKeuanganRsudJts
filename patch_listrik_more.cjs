const fs = require('fs');

let lk = fs.readFileSync('src/components/ListrikKantinView.tsx', 'utf8');

lk = lk.replace(
  /<button\s+onClick={handleOpenNewTagihan}[\s\S]*?<\/button>/g,
  (match) => {
    // If it's already wrapped in isAdmin && (, we don't need to wrap it again.
    // The first instance might be wrapped, let's be careful.
    return match;
  }
);
