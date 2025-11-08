import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">HQ</span>
              </div>
              <span className="text-white font-bold text-lg">Cinema</span>
            </div>
            <p className="text-gray-400 text-sm">
              Hệ thống rạp chiếu phim hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh tuyệt vời
              nhất.
            </p>
          </div>

          {/* Phim */}
          <div>
            <h4 className="text-white font-semibold mb-4">Phim</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Suất chiếu đặc biệt
                </Link>
              </li>
            </ul>
          </div>

          {/* Rạp HQ Cinema */}
          <div>
            <h4 className="text-white font-semibold mb-4">Rạp HQ Cinema</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Tất cả các rạp
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Rạp đặc biệt
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Sự kiện
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                  Chính sách
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© 2025 HQ Cinema. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}