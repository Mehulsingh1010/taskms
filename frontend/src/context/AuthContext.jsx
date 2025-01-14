import { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData) => {
    // Ensure we have all required user data
    const userToSave = {
      token: userData.token,
      userId: userData.userId,
      username: userData.username,
      role: userData.role // Make sure role is included
    };
    
    localStorage.setItem('user', JSON.stringify(userToSave));
    setUser(userToSave);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    // Redirect to login page after logout
    window.location.href = '/login';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;