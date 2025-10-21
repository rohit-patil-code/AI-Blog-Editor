import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
        return
      }

      try {
        const response = await authAPI.getMe()
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token
          }
        })
      } catch (error) {
        localStorage.removeItem('token')
        dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.error?.message || 'Authentication failed' })
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const response = await authAPI.login(email, password)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (username, email, password) => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const response = await authAPI.register(username, email, password)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

