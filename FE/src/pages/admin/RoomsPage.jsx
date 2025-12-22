import { useEffect, useState } from 'react'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { roomService } from '../../services/roomApi'
import DataTable from '../../components/shared/DataTable'
import { formatDate } from '../../utils/formatters'

const RoomsPage = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const roomTypes = roomService.getRoomTypes()
  const roomStatuses = roomService.getRoomStatuses()

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomService.getRooms(
        currentPage,
        10,
        search,
        selectedRoomType,
        selectedStatus,
      )

      if (response.success) {
        setRooms(response.data.data || [])
        setTotalPages(response.data.paging?.total_pages || 1)
      } else {
        setError('Không thể tải danh sách phòng')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [currentPage, search, selectedRoomType, selectedStatus])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      return
    }

    try {
      await roomService.deleteRoom(id)
      fetchRooms()
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa phòng')
      console.error('Error deleting room:', err)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await roomService.updateRoomStatus(id, newStatus)
      fetchRooms()
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
      console.error('Error updating status:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoomTypeLabel = (type) => {
    const roomType = roomTypes.find((rt) => rt.value === type)
    return roomType ? roomType.label : type
  }

  const handleView = (room) => {
    navigate(`/admin/rooms/${room.id}`)
  }

  const handleEdit = (room) => {
    navigate(`/admin/rooms/${room.id}/edit`)
  }

  const columns = [
    {
      label: 'Phòng',
      render: (room) => (
        <div className="text-sm font-medium text-gray-900">
          Phòng {room.room_number}
        </div>
      )
    },
    {
      label: 'Loại phòng',
      render: (room) => (
        <div className="text-sm text-gray-900">
          {getRoomTypeLabel(room.room_type)}
        </div>
      )
    },
    {
      label: 'Sức chứa',
      render: (room) => (
        <div className="text-sm text-gray-900">{room.capacity} ghế</div>
      )
    },
    {
      label: 'Trạng thái',
      render: (room) => (
        <select
          value={room.status}
          onChange={(e) => handleStatusChange(room.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(room.status)} border-0`}
        >
          {roomStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      )
    },
    {
      label: 'Ngày tạo',
      render: (room) => (
        <span className="text-sm text-gray-500">{formatDate(room.created_at)}</span>
      )
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Phòng chiếu</h1>
            <p className="text-gray-600">Quản lý thông tin các phòng chiếu trong rạp</p>
          </div>
          <Link
            to="/admin/rooms/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus />
            Thêm phòng mới
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedRoomType}
              onChange={(e) => {
                setSelectedRoomType(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại phòng</option>
              {roomTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              {roomStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rooms}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              actions={['view', 'edit', 'delete']}
              emptyMessage="Không có phòng nào"
              loading={loading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'text-blue-600 bg-blue-50 border border-blue-300'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default RoomsPage
