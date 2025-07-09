import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      localStorage.removeItem('userInfo');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_PROBLEMS_COMPLETED':
      const updatedUser = { ...state.user, problemsCompleted: action.payload };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return {
        ...state,
        user: updatedUser,
      };
    case 'UPDATE_FAVORITES':
      const userWithFavorites = { ...state.user, favorites: action.payload };
      localStorage.setItem('userInfo', JSON.stringify(userWithFavorites));
      return {
        ...state,
        user: userWithFavorites,
      };
    case 'UPDATE_RECENTS':
      const userWithRecents = { ...state.user, recents: action.payload };
      localStorage.setItem('userInfo', JSON.stringify(userWithRecents));
      return {
        ...state,
        user: userWithRecents,
      };
    case 'UPDATE_USER_PROFILE':
      const updatedProfile = { ...state.user, ...action.payload };
      localStorage.setItem('userInfo', JSON.stringify(updatedProfile));
      return {
        ...state,
        user: updatedProfile,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is logged in on app start
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await api.post('/users/login', { email, password });
      const userData = response.data;

      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await api.post('/users/register', { username, email, password });
      const userData = response.data;

      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const updateProblemsCompletedInContext = (problemsCompleted) => {
    dispatch({ type: 'UPDATE_PROBLEMS_COMPLETED', payload: problemsCompleted });
  };

  const updateFavoritesInContext = (favorites) => {
    dispatch({ type: 'UPDATE_FAVORITES', payload: favorites });
  };

  const updateRecentsInContext = (recents) => {
    dispatch({ type: 'UPDATE_RECENTS', payload: recents });
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const addToFavorites = async (deckId) => {
    try {
      const response = await api.post('/users/favorites/add', { deckId });
      updateFavoritesInContext(response.data.favorites);
      return response.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (deckId) => {
    try {
      const response = await api.post('/users/favorites/remove', { deckId });
      updateFavoritesInContext(response.data.favorites);
      return response.data;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    updateProblemsCompletedInContext,
    updateFavoritesInContext,
    updateRecentsInContext,
    fetchUserProfile,
    addToFavorites,
    removeFromFavorites,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 