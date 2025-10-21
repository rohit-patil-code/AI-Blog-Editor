import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'New Post', href: '/editor', icon: Plus },
    { name: 'All Posts', href: '/', icon: FileText },
  ]

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
