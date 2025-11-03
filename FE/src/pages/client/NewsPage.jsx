import { useEffect, useState } from 'react'
import { FaNewspaper, FaGlobe, FaHome, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa'
import Header from '../../components/Header'
import { newsService } from '../../services/newsService'

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedNews, setSelectedNews] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [selectedCategory, page])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await newsService.getNewsSummaries(selectedCategory, page, 12)
      setNews(response.data || [])
      setPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch news:', error)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'Tất cả', icon: FaNewspaper },
    { value: 'domestic', label: 'Trong nước', icon: FaHome },
    { value: 'international', label: 'Quốc tế', icon: FaGlobe },
  ]

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleNewsClick = (newsItem) => {
    setSelectedNews(newsItem)
  }

  const closeModal = () => {
    setSelectedNews(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900/20 to-purple-900/20 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center gap-3">
            <FaNewspaper className="text-red-500" />
            Tin Tức Điện Ảnh
          </h1>
          <p className="text-gray-300 text-lg">
            Cập nhật tin tức mới nhất về thế giới điện ảnh trong và ngoài nước
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.value)
                  setPage(1)
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon />
                {category.label}
              </button>
            )
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-red-500 text-5xl" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <FaNewspaper className="mx-auto text-gray-600 text-6xl mb-4" />
            <p className="text-gray-400 text-xl">Chưa có tin tức nào</p>
          </div>
        ) : (
          <>
            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNewsClick(item)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNewsClick(item)}
                  role="button"
                  tabIndex={0}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 cursor-pointer group"
                >
                  {/* Image */}
                  {item.image_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-red-600 px-3 py-1 rounded-full text-xs font-bold text-white">
                        {item.source_count} nguồn
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-red-900/30 to-purple-900/30 flex items-center justify-center">
                      <FaNewspaper className="text-gray-600 text-5xl" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.category === 'domestic'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {item.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                      </span>
                      <span className="text-gray-500 text-xs">{formatDate(item.created_at)}</span>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-3">{item.summary}</p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Trang trước
                </button>
                <span className="text-gray-300">
                  Trang {page} / {pagination.total_pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for News Detail */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-red-400 text-3xl z-10"
            >
              ×
            </button>

            {/* Image */}
            {selectedNews.image_url && (
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    selectedNews.category === 'domestic'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {selectedNews.category === 'domestic' ? 'Trong nước' : 'Quốc tế'}
                </span>
                <span className="text-gray-400 text-sm">{formatDate(selectedNews.created_at)}</span>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">{selectedNews.title}</h2>

              <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
                <p className="text-gray-300 text-lg leading-relaxed">{selectedNews.summary}</p>
              </div>

              {/* Sources */}
              {selectedNews.sources && selectedNews.sources.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Nguồn tin ({selectedNews.source_count})
                  </h3>
                  <div className="space-y-3">
                    {selectedNews.sources.map((source) => (
                      <a
                        key={source.id}
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-white font-medium mb-1 group-hover:text-red-400 transition-colors">
                              {source.title}
                            </p>
                            <p className="text-gray-400 text-sm">{source.source}</p>
                          </div>
                          <FaExternalLinkAlt className="text-gray-500 group-hover:text-red-400 transition-colors mt-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
