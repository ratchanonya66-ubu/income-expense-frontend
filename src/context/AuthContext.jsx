// Context สำหรับจัดการ Authentication (ปรับปรุงแล้ว)
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ตรวจสอบ token เมื่อเริ่มต้น
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // ลองใช้ user ที่ save ไว้ก่อน เพื่อให้ UI โหลดเร็ว
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Invalid saved user data');
          }
        }

        // ยืนยันกับ server
        const response = await authAPI.getMe();
        
        if (isMounted) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setError(null);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setError('กรุณาเข้าสู่ระบบใหม่');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // ฟังก์ชัน Login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'เข้าสู่ระบบไม่สำเร็จ';
      setError(message);
      return { 
        success: false, 
        message 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชัน Register
  const register = useCallback(async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register({ name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'สมัครสมาชิกไม่สำเร็จ';
      setError(message);
      return { 
        success: false, 
        message 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชัน Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  // ฟังก์ชัน Refresh User (เรียกเมื่อต้องการอัพเดทข้อมูล user)
  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};