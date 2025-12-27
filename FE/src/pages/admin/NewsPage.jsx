import { useCallback, useEffect, useState } from 'react'
import {
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaNewspaper,
  FaSpinner,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { newsService } from '../../services/newsService'

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const navigate = useNavigate()

  const fetchNews = useCallback(
    async (page = 1, size = 12, cat = category) => {
      try {
        setLoading(page === 1)

        const data = await newsService.getAllNewsSummaries(cat, page, size)
        setNews(data.data || [])
        setMeta(data.pagination || {})
        setError('')
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load news')
        console.error('Error fetching news:', err)
      } finally {
        setLoading(false)
      }
    },
    [category],
  )

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    fetchNews(1, 12, newCategory)
  }

  const handleToggleActive = async (id, currentStatus) => {
    const newStatus = !currentStatus
    const action = newStatus ? 'hiện' : 'ẩn'

    if (!window.confirm(`Bạn có chắc muốn ${action} tin tức này?`)) {
      return
    }

    try {
      await newsService.toggleNewsActive(id, newStatus)
      // Refresh list
      fetchNews(meta.current_page || 1, meta.page_size || 12)
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} news`)
      console.error('Error toggling news status:', err)
    }
  }

  const handlePageChange = (newPage) => {
    fetchNews(newPage, meta.page_size || 12)
    window.scrollTo(0, 0)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Đang tải danh sách tin tức...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaNewspaper className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý tin tức</h1>
                <p className="text-gray-600">Quản lý tin tức AI tổng hợp trong hệ thống</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'domestic', label: 'Trong nước' },
              { value: 'international', label: 'Quốc tế' },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {news.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaNewspaper className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tin tức nào</h3>
              <p className="text-gray-500">Chưa có tin tức nào được tổng hợp</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Image */}
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {/* Category & Status Badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            item.category === 'domestic'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            item.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.summary}</p>

                      {/* Source Count */}
                      <div className="text-xs text-gray-500 mb-4">
                        {item.source_count} nguồn tin
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/news/${item.id}/edit`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                        >
                          <FaEdit />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                            item.is_active
                              ? 'bg-gray-600 hover:bg-gray-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {item.is_active ? <FaEyeSlash /> : <FaEye />}
                          <span>{item.is_active ? 'Ẩn' : 'Hiện'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Trang {meta.current_page} / {meta.total_pages} • Tổng {meta.total} tin tức
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  ← Trước
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, meta.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, meta.current_page - 2) + i
                    if (pageNum > meta.total_pages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          meta.current_page === pageNum
                            ? 'bg-red-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page >= meta.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
