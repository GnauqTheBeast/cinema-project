import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { seatService } from '../../services/seatApi';
import { roomService } from '../../services/roomApi';

const SeatsPage = () => {
  const [seats, setSeats] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedSeatType, setSelectedSeatType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRow, setSelectedRow] = useState('');

  const seatTypes = seatService.getSeatTypes();
  const seatStatuses = seatService.getSeatStatuses();

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await seatService.getSeats(
        currentPage,
        10,
        search,
        selectedRoom,
        selectedSeatType,
        selectedStatus,
        selectedRow
      );
      
      if (response.success) {
        setSeats(response.data.data || []);
        setTotalPages(response.data.paging?.total_pages || 1);
      } else {
        setError('Không thể tải danh sách ghế');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms(1, 100);
      if (response.success) {
        setRooms(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchSeats();
  }, [currentPage, search, selectedRoom, selectedSeatType, selectedStatus, selectedRow]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghế này?')) {
      return;
    }

    try {
      await seatService.deleteSeat(id);
      fetchSeats();
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa ghế');
      console.error('Error deleting seat:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await seatService.updateSeatStatus(id, newStatus);
      fetchSeats();
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
      console.error('Error updating status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeatTypeLabel = (type) => {
    const seatType = seatTypes.find(st => st.value === type);
    return seatType ? seatType.label : type;
  };

  const getStatusLabel = (status) => {
    const statusObj = seatStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? `Phòng ${room.room_number}` : roomId;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Ghế ngồi</h1>
            <p className="text-gray-600">Quản lý thông tin ghế ngồi trong các phòng chiếu</p>
          </div>
          <Link
            to="/admin/seats/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus />
            Thêm ghế mới
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ghế..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả phòng</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Phòng {room.room_number}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Hàng ghế"
              value={selectedRow}
              onChange={(e) => {
                setSelectedRow(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={selectedSeatType}
              onChange={(e) => {
                setSelectedSeatType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại ghế</option>
              {seatTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              {seatStatuses.map(status => (
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
            {/* Seats Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại ghế
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seats.map((seat) => (
                    <tr key={seat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getRoomName(seat.room_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {seat.row_number}{seat.seat_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getSeatTypeLabel(seat.seat_type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={seat.status}
                          onChange={(e) => handleStatusChange(seat.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(seat.status)} border-0`}
                        >
                          {seatStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(seat.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/seats/${seat.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/admin/seats/${seat.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(seat.id)}
                            className="text-red-600 hover:text-red-900"  
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {seats.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không có ghế nào</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
  );
};

export default SeatsPage; 