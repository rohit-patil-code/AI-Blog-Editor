import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  BarChart3,
  Sparkles,
  Clock,
  CheckCircle
} from 'lucide-react'
import { blogAPI, aiAPI } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export function Dashboard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiUsage, setAiUsage] = useState(null)
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalWords: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const postsResponse = await blogAPI.getBlogs({ limit: 10 })
      setPosts(postsResponse.data.posts)

      const totalPosts = postsResponse.data.pagination.totalPosts
      const publishedPosts = postsResponse.data.posts.filter(post => post.status === 'published').length
      const draftPosts = postsResponse.data.posts.filter(post => post.status === 'draft').length
      const totalWords = postsResponse.data.posts.reduce((acc, post) => {
        const textContent = post.content.replace(/<[^>]*>/g, '')
        return acc + textContent.split(/\s+/).length
      }, 0)

      setStats({ totalPosts, publishedPosts, draftPosts, totalWords })

      try {
        const usageResponse = await aiAPI.usage({ period: '30' })
        setAiUsage(usageResponse.data)
      } catch {}
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await blogAPI.deleteBlog(postId)
      setPosts(posts.filter(p => p.post_id !== postId))
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handlePublishToggle = async (postId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      await blogAPI.publishBlog(postId, newStatus)
      setPosts(posts.map(p => p.post_id === postId ? { ...p, status: newStatus } : p))
      toast.success(`Post ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getStatusColor = (status) =>
    status === 'published'
      ? 'bg-gray-800 text-white border border-gray-700'
      : 'bg-gray-900 text-gray-400 border border-gray-700'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black text-white min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="bg-black text-white min-h-screen py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-gray-400">Your blog overview, all in one place.</p>
        </div>
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: FileText, label: 'Total Posts', value: stats.totalPosts },
          { icon: CheckCircle, label: 'Published', value: stats.publishedPosts },
          { icon: Clock, label: 'Drafts', value: stats.draftPosts },
          { icon: BarChart3, label: 'Total Words', value: stats.totalWords.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:bg-gray-800 transition-all"
          >
            <div className="flex items-center">
              <Icon className="h-8 w-8 text-white opacity-80" />
              <div className="ml-4">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Usage */}
      {aiUsage && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <Sparkles className="h-5 w-5 mr-2 text-white opacity-70" />
            AI Usage (Last 30 Days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-6">
            <div>
              <p className="text-3xl font-bold">{aiUsage.total.requests}</p>
              <p className="text-gray-400 text-sm">Requests</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{aiUsage.total.tokens.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Tokens Used</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {aiUsage.total.requests > 0 ? Math.round(aiUsage.total.tokens / aiUsage.total.requests) : 0}
              </p>
              <p className="text-gray-400 text-sm">Avg / Request</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        {posts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Start by creating your first blog post.</p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.post_id}
                className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold truncate">{post.title}</h4>
                    <span className={`px-2.5 py-0.5 text-xs rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(post.updated_at)}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {post.content.replace(/<[^>]*>/g, '').split(/\s+/).length} words
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/blog/${post.post_id}`} className="p-2 hover:bg-gray-700 rounded-lg" title="View">
                    <Eye className="h-4 w-4 text-gray-300" />
                  </Link>
                  <Link to={`/editor/${post.post_id}`} className="p-2 hover:bg-gray-700 rounded-lg" title="Edit">
                    <Edit className="h-4 w-4 text-gray-300" />
                  </Link>
                  <button
                    onClick={() => handlePublishToggle(post.post_id, post.status)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.post_id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
