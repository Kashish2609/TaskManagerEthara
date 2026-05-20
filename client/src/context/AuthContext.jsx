import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API base URL: use Vercel backend in production, proxy (vite) in development
axios.defaults.baseURL = 'https://task-manager-ethara-x1h7.vercel.app';



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user and token on initial load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Set default axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { data } = response;

      if (data.success) {
        const userMeta = {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
        };

        setUser(userMeta);
        localStorage.setItem('user', JSON.stringify(userMeta));
        localStorage.setItem('token', data.token);
        
        // Set axios auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return { success: true };
      }
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Invalid email or password';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (name, email, password, role) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/signup', { name, email, password, role });
      const { data } = response;

      if (data.success) {
        const userMeta = {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
        };

        setUser(userMeta);
        localStorage.setItem('user', JSON.stringify(userMeta));
        localStorage.setItem('token', data.token);

        // Set axios auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return { success: true };
      }
      return { success: false, message: 'Signup failed' };
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Registration failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
