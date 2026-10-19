
const pages = [
  'banners',
  'brands',
  'coupons',
  'orders',
  'reviews',
  'users'
];

const basePath = 'C:\\Users\\admin\\DO_AN\\frontend\\src\\app\\(admin)\\admin';

for (const p of pages) {
  const filePath = path.join(basePath, p, 'page.tsx');
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match useEffect block handling \r\n and \n
  const useEffectRegex = /useEffect\(\(\) => \{\s*load[a-zA-Z]+\(\);\s*\}, \[(.*?)\]\);/;
  
  content = content.replace(useEffectRegex, (match, deps) => {
    const fnName = match.match(/load[a-zA-Z]+/)[0];
    let newDeps = deps.trim();
    if (!newDeps.includes('page')) {
      newDeps = newDeps ? `${newDeps}, page` : `page`;
    }
    return `useEffect(() => {\n    const timer = setTimeout(() => {\n      ${fnName}();\n    }, 500);\n    return () => clearTimeout(timer);\n  }, [${newDeps}]);`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed useEffect in', p);
}
