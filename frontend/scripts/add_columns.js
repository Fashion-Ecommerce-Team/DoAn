
const pages = [
  { name: 'banners', var: 'banner' },
  { name: 'brands', var: 'brand' },
  { name: 'categories', var: 'cat' },
  { name: 'coupons', var: 'coupon' },
  { name: 'orders', var: 'order' },
  { name: 'products', var: 'prod' },
  { name: 'reviews', var: 'review' },
  { name: 'users', var: 'user' }
];

const basePath = 'C:\\Users\\admin\\DO_AN\\frontend\\src\\app\\(admin)\\admin';

for (const p of pages) {
  const filePath = path.join(basePath, p.name, 'page.tsx');
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has Ngày tạo
  if (content.includes('Ngày tạo') || content.includes('NgA y to') || content.includes('Ngày Ttạo')) continue;

  // 1. Add headers before "Hành động" / "Trạng thái" / etc. Actually, let's just put them right before <TableHead className="text-center">Hành động</TableHead>
  // Wait, some pages might have it as <TableHead className="text-right">Hành động</TableHead>
  content = content.replace(/<TableHead(\s+className=".*?")?>H[aA]nh [đ]`Tng<\/TableHead>/g, (match) => {
    return `<TableHead>Ngày tạo</TableHead>\n                <TableHead>Cập nhật</TableHead>\n                ${match}`;
  });

  // Also replace if it's literally "Hành động"
  content = content.replace(/<TableHead(\s+className=".*?")?>Hành động<\/TableHead>/g, (match) => {
    return `<TableHead>Ngày tạo</TableHead>\n                <TableHead>Cập nhật</TableHead>\n                ${match}`;
  });

  // 2. Add cells before the action cell. The action cell always has the buttons and is usually the last one.
  // We can look for <TableCell className="text-center space-x-2"> or <TableCell className="text-right space-x-2">
  // Since we know the variable name (e.g. brand), we can inject:
  const actionCellRegex = /<TableCell className="(text-center|text-right).*?space-x-2.*?>/g;
  content = content.replace(actionCellRegex, (match) => {
    return `<TableCell className="text-slate-500 text-sm whitespace-nowrap">{${p.var}.createdAt ? new Date(${p.var}.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>\n                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{${p.var}.updatedAt ? new Date(${p.var}.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>\n                    ${match}`;
  });

  // 3. Update colSpans +2
  // We match colSpan={5} or colSpan={6} or colSpan={8}
  content = content.replace(/colSpan=\{([0-9]+)\}/g, (match, p1) => {
    return `colSpan={${parseInt(p1) + 2}}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated columns for', p.name);
}
