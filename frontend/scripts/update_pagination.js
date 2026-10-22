
const pages = [
  'products',
  'categories',
  'banners',
  'brands',
  'coupons',
  'orders',
  'reviews',
  'users'
];

const basePath = 'C:\\Users\\admin\\DO_AN\\frontend\\src\\app\\(admin)\\admin';

const newPaginationBlock = `
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">
                Tổng số: {totalElements} bản ghi
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">Trang {page + 1} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
`;

for (const p of pages) {
  const filePath = path.join(basePath, p, 'page.tsx');
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Match the old pagination block
  const oldPaginationRegex = /\{totalPages > 0 && \(\s*<div className="flex items-center justify-between mt-4">[\s\S]*?<\/div>\s*\)\s*\}/g;
  
  if (content.match(oldPaginationRegex)) {
    content = content.replace(oldPaginationRegex, newPaginationBlock.trim());
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated pagination in', p);
  } else {
    console.log('No match found in', p);
  }
}
