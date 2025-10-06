import React, { useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function StaffManagementPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'manager_staff'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const submitCreate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/auth/staff`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Tạo tài khoản nhân viên thành công');
      setForm({ name: '', email: '', password: '', address: '', role: 'manager_staff' });
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tạo tài khoản nhân viên');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Quản lý nhân viên</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Họ tên</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vai trò</label>
            <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="manager_staff">Quản lý rạp chiếu</option>
              <option value="ticket_staff">Nhân viên bán vé</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Địa chỉ (tuỳ chọn)</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        {error && <div className="mt-4 text-red-600">{error}</div>}
        {success && <div className="mt-4 text-green-600">{success}</div>}

        <div className="mt-6">
          <button
            disabled={loading}
            onClick={() => setConfirmOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            {loading ? 'Đang xử lý...' : 'Thêm tài khoản nhân viên'}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Xác nhận tạo tài khoản nhân viên</h2>
            <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn tạo tài khoản nhân viên với email {form.email}?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded border">Huỷ</button>
              <button onClick={submitCreate} className="px-4 py-2 rounded bg-red-600 text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}



