export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar Placeholder */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
        <div className="text-2xl font-bold text-slate-800">Seeme</div>
        <nav>
          <ul className="flex space-x-6 text-slate-600">
            <li className="hover:text-blue-600 cursor-pointer">Trang chủ</li>
            <li className="hover:text-blue-600 cursor-pointer">Sản phẩm</li>
            <li className="hover:text-blue-600 cursor-pointer">Giỏ hàng</li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center">
        <p>&copy; 2026 Seeme. All rights reserved.</p>
      </footer>
    </div>
  );
}
