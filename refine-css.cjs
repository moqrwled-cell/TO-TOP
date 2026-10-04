const fs = require('fs');

const path = 'src/index.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/padding: 3rem;/g, 'padding: 2rem;');
css = css.replace(/padding: 1.2rem 3rem;/g, 'padding: 0.9rem 2rem;');
css = css.replace(/padding: 1.2rem 1.5rem;/g, 'padding: 0.8rem 1.2rem;');
css = css.replace(/border-radius: 24px;/g, 'border-radius: 18px;');
css = css.replace(/border-radius: 16px;/g, 'border-radius: 12px;');
css = css.replace(/font-size: 3.5rem;/g, 'font-size: 2.8rem;');
css = css.replace(/font-size: 2.2rem;/g, 'font-size: 1.8rem;');
css = css.replace(/font-size: 1.4rem;/g, 'font-size: 1.2rem;');
css = css.replace(/min-height: 280px;/g, 'min-height: 220px;');
css = css.replace(/width: 320px;/g, 'width: 280px;');
css = css.replace(/margin: 1.5rem;/g, 'margin: 1rem;');
css = css.replace(/padding: 3rem 2rem;/g, 'padding: 2rem 1rem;');

// Make the app even more elegant and tight (mobile bottom nav also smaller)
css = css.replace(/padding: 0.6rem 0.2rem/g, 'padding: 0.4rem 0.2rem');
css = css.replace(/width: 24px; height: 24px;/g, 'width: 20px; height: 20px;');

fs.writeFileSync(path, css);
console.log('CSS optimized for a tighter, elegant UI.');
