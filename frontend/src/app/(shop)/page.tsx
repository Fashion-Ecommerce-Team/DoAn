import Link from 'next/link';

export default function ShopHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
        Chào mừng đến với Cửa hàng
      </h1>
      <p className="text-xl text-slate-500 max-w-[600px]">
        Giao diện phía người dùng (Client) sẽ được thiết kế tại đây. Hiện tại, hãy vào trang Quản trị để kiểm tra hệ thống Backend.
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Đến trang Quản trị (Admin)
        </Link>
      </div>
    </div>
  );
}
