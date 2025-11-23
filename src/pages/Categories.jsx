import { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '📝',
    color: '#3b82f6'
  });

  const commonIcons = [
    '🍔', '🚗', '🛍️', '🎮', '🏠', '⚕️', '📚', '✈️',
    '💰', '💼', '📈', '💵', '🎬', '☕', '🎨', '🏋️',
    '📱', '💻', '🎵', '🍕', '🎁', '💊', '🚌', '📝'
  ];

  const commonColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
  ];

  useEffect(() => {
    loadCategories();
  }, [filterType]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll(filterType !== 'all' ? filterType : undefined);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      loadCategories();
    } catch (error) {
      alert(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('ต้องการลบหมวดหมู่นี้?')) {
      try {
        await categoryAPI.delete(id);
        loadCategories();
      } catch (error) {
        alert(error.message || 'ลบไม่สำเร็จ');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: '📝',
      color: '#3b82f6'
    });
  };

  const filteredCategories = categories.filter(cat => 
    filterType === 'all' || cat.type === filterType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการหมวดหมู่</h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการหมวดหมู่รายรับ-รายจ่าย</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingCategory(null);
            resetForm();
          }}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus size={20} />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex space-x-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'expense'
              ? 'bg-red-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          รายจ่าย
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'income'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          รายรับ
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{category.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-800">{category.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      category.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </div>
                </div>
              </div>

              {!category.isDefault && (
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>ลบ</span>
                  </button>
                </div>
              )}

              {category.isDefault && (
                <div className="mt-4 text-center text-xs text-gray-500">
                  หมวดหมู่เริ่มต้น
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-3 rounded-lg font-medium transition-colors ${
                      formData.type === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    รายจ่าย
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-3 rounded-lg font-medium transition-colors ${
                      formData.type === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    รายรับ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น อาหาร, เดินทาง"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ไอคอน (เลือก: {formData.icon})
                </label>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-2xl p-2 rounded-lg transition-colors ${
                        formData.icon === icon
                          ? 'bg-blue-100 ring-2 ring-blue-500'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                <div className="grid grid-cols-5 gap-2">
                  {commonColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-12 rounded-lg transition-all ${
                        formData.color === color
                          ? 'ring-4 ring-offset-2 ring-blue-500'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}