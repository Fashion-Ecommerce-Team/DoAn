
const pages = [
  'banners',
  'brands',
  'coupons',
  'orders',
  'reviews',
  'users'
];

const basePath = 'C:\\Users\\admin\\DO_AN\\frontend\\src\\app\\(admin)\\admin';

const paginationBlock = `
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm font-medium text-slate-500">
                Hiển thị trang {page + 1} / {totalPages} (Tổng số {totalElements} bản ghi)
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || loading}
                >
                  Sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}`;

for (const p of pages) {
  const filePath = path.join(basePath, p, 'page.tsx');
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already refactored
  if (content.includes('totalPages > 0')) continue;

  // 1. Add lucide-react icons import if missing
  if (!content.includes('ChevronLeft')) {
    if (content.includes('lucide-react')) {
      content = content.replace(/import \{(.*?)\} from 'lucide-react';/, (match, p1) => {
        return `import {${p1}, ChevronLeft, ChevronRight} from 'lucide-react';`;
      });
    } else {
      content = content.replace(/(import .*?;)/, `$1\nimport { ChevronLeft, ChevronRight } from 'lucide-react';`);
    }
  }

  // 2. Add pagination states
  const searchStateRegex = /const \[search, setSearch\] = useState\(''\);/;
  if (content.match(searchStateRegex)) {
    content = content.replace(searchStateRegex, `const [search, setSearch] = useState('');\n  const [page, setPage] = useState(0);\n  const [totalPages, setTotalPages] = useState(0);\n  const [totalElements, setTotalElements] = useState(0);`);
  } else {
    // If no search state, add after loading state
    content = content.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [totalPages, setTotalPages] = useState(0);\n  const [totalElements, setTotalElements] = useState(0);`);
  }

  // 3. Update load data function
  // We need to find the data = await getXXXX(0, 50, ...) and replace with page, 10
  content = content.replace(/await (get[a-zA-Z]+)\(0,\s*50(.*?)\)/, (match, fn, rest) => {
    return `await ${fn}(page, 10${rest})`;
  });

  // Also add setTotalPages and setTotalElements after setXXXX(data.content)
  content = content.replace(/(set[a-zA-Z]+)\(data\.content\);/, `$1(data.content);\n      setTotalPages(data.totalPages);\n      setTotalElements(data.totalElements);`);

  // 4. Update useEffect for debounce and dependencies
  // Most pages have useEffect(() => { loadXXX(); }, [search, status]);
  content = content.replace(/useEffect\(\(\) => \{\n\s*load[a-zA-Z]+\(\);\n\s*\}, \[(.*?)\]\);/, (match, deps) => {
    const fnName = match.match(/load[a-zA-Z]+/)[0];
    let newDeps = deps.trim();
    if (!newDeps.includes('page')) {
      newDeps = newDeps ? `${newDeps}, page` : `page`;
    }
    return `useEffect(() => {\n    const timer = setTimeout(() => {\n      ${fnName}();\n    }, 500);\n    return () => clearTimeout(timer);\n  }, [${newDeps}]);`;
  });

  // 5. Update input onChange to reset page to 0
  content = content.replace(/onChange=\{\(e\) => setSearch\(e\.target\.value\)\}/, `onChange={(e) => { setSearch(e.target.value); setPage(0); }}`);

  // Also update Select onValueChange to reset page if applicable
  content = content.replace(/onValueChange=\{setStatus\}/, `onValueChange={(v) => { setStatus(v); setPage(0); }}`);

  // 6. Add pagination UI block before </CardContent>
  content = content.replace(/<\/Table>\n\s*<\/CardContent>/, `</Table>\n${paginationBlock}\n        </CardContent>`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', p);
}
