import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { showtimeService } from '../../services/showtimeApi';
import { roomService } from '../../services/roomApi';
import { movieService } from '../../services/movieApi';

const ShowtimeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    movie_id: '',
    room_id: '',
    start_time: '',
    end_time: '',
    format: '2d',
    base_price: '',
    status: 'scheduled'
  });
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [timeInfo, setTimeInfo] = useState('');

  const showtimeFormats = showtimeService.getShowtimeFormats();
  const showtimeStatuses = showtimeService.getShowtimeStatuses();

  useEffect(() => {
    fetchRooms();
    fetchMovies();
    if (isEditing) {
      fetchShowtime();
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (formData.start_time) {
      checkTimeInfo();
    }
  }, [formData.start_time, formData.end_time]);

  useEffect(() => {
    if (formData.room_id && formData.start_time && formData.end_time) {
      checkTimeConflict();
    }
  }, [formData.room_id, formData.start_time, formData.end_time]);

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

  const fetchMovies = async () => {
    try {
      const response = await movieService.getMovies(1, 100);
      if (response.success) {
        setMovies(response.data.movies || []);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };

  const fetchShowtime = async () => {
    try {
      setLoading(true);
      const response = await showtimeService.getShowtimeById(id);
      
      if (response.success) {
        const showtime = response.data;
        setFormData({
          movie_id: showtime.movie_id,
          room_id: showtime.room_id,
          start_time: new Date(showtime.start_time).toISOString().slice(0, 16),
          end_time: new Date(showtime.end_time).toISOString().slice(0, 16),
          format: showtime.format,
          base_price: showtime.base_price.toString(),
          status: showtime.status
        });
      } else {
        setError('Không thể tải thông tin lịch chiếu');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error fetching showtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTimeInfo = () => {
    if (!formData.start_time) return;

    const startTime = new Date(formData.start_time);
    const truncatedStart = showtimeService.truncateToHalfHour(startTime);
    
    let info = '';
    if (startTime.getTime() !== truncatedStart.getTime()) {
      info = `Thời gian sẽ được làm tròn từ ${startTime.toLocaleTimeString('vi-VN')} thành ${truncatedStart.toLocaleTimeString('vi-VN')}`;
    }

    if (formData.end_time) {
      const endTime = new Date(formData.end_time);
      const truncatedEnd = showtimeService.truncateToHalfHour(endTime);
      
      if (endTime.getTime() !== truncatedEnd.getTime()) {
        info += info ? '\n' : '';
        info += `Thời gian kết thúc sẽ được làm tròn từ ${endTime.toLocaleTimeString('vi-VN')} thành ${truncatedEnd.toLocaleTimeString('vi-VN')}`;
      }

      const duration = (truncatedEnd.getTime() - truncatedStart.getTime()) / (1000 * 60);
      info += info ? '\n' : '';
      info += `Thời lượng: ${Math.floor(duration / 60)}h ${duration % 60}m`;
    }

    setTimeInfo(info);
  };

  const checkTimeConflict = async () => {
    try {
      const startTime = showtimeService.formatDateTime(formData.start_time);
      const endTime = showtimeService.formatDateTime(formData.end_time);
      
      const response = await showtimeService.checkTimeConflict(
        formData.room_id,
        startTime,
        endTime,
        isEditing ? id : ''
      );

      if (response.success && response.data.has_conflict) {
        setConflictWarning('⚠️ Thời gian này đã có lịch chiếu khác trong phòng!');
      } else {
        setConflictWarning('');
      }
    } catch (err) {
      console.error('Error checking time conflict:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.movie_id || !formData.room_id || !formData.start_time || 
        !formData.end_time || !formData.base_price) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    if (basePrice <= 0) {
      setError('Giá vé phải lớn hơn 0');
      return;
    }

    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);

    if (endTime <= startTime) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    if (startTime < new Date()) {
      setError('Không thể tạo lịch chiếu trong quá khứ');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestData = {
        movie_id: formData.movie_id,
        room_id: formData.room_id,
        start_time: showtimeService.formatDateTime(formData.start_time),
        end_time: showtimeService.formatDateTime(formData.end_time),
        format: formData.format,
        base_price: basePrice
      };

      if (isEditing) {
        requestData.status = formData.status;
        await showtimeService.updateShowtime(id, requestData);
      } else {
        await showtimeService.createShowtime(requestData);
      }

      navigate('/admin/showtimes');
    } catch (err) {
      if (err.response?.data?.message?.includes('conflicts')) {
        setError('Lịch chiếu bị trung với lịch chiếu khác trong phòng');
      } else if (err.response?.data?.message?.includes('past')) {
        setError('Không thể tạo lịch chiếu trong quá khứ');
      } else {
        setError(isEditing ? 'Có lỗi xảy ra khi cập nhật lịch chiếu' : 'Có lỗi xảy ra khi tạo lịch chiếu');
      }
      console.error('Error saving showtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      start_time: startTime,
      // Auto-set end time to 2 hours later if empty
      end_time: prev.end_time || new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
    }));
  };

  if (loading && isEditing) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );  
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/showtimes')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Chỉnh sửa lịch chiếu' : 'Thêm lịch chiếu mới'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Cập nhật thông tin lịch chiếu' : 'Tạo lịch chiếu mới với tính năng làm tròn 30 phút'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {conflictWarning && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <FaExclamationTriangle />
                {conflictWarning}
              </div>
            )}

            {timeInfo && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock />
                  <span className="font-medium">Thông tin thời gian:</span>
                </div>
                <div className="text-sm whitespace-pre-line">{timeInfo}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Movie */}
              <div>
                <label htmlFor="movie_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Phim <span className="text-red-500">*</span>
                </label>
                <select
                  id="movie_id"
                  name="movie_id"
                  value={formData.movie_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Phòng chiếu <span className="text-red-500">*</span>
                </label>
                <select
                  id="room_id"
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.room_number} ({room.room_type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleStartTimeChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  min={formData.start_time}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Format */}
              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                  Định dạng <span className="text-red-500">*</span>
                </label>
                <select
                  id="format"
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {showtimeFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Price */}
              <div>
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá vé cơ bản (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập giá vé"
                />
              </div>

              {/* Status (only for editing) */}
              {isEditing && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {showtimeStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/admin/showtimes')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !!conflictWarning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaSave />
                )}
                {isEditing ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShowtimeFormPage; 