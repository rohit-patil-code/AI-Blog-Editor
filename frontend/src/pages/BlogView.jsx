import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Edit, 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react'
import { blogAPI } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export function BlogView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await blogAPI.getBlog(id)
      setPost(response.data.post)
    } catch (error) {
      console.error('Failed to fetch post:', error)
      toast.error('Failed to load post')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusIcon = (status) => {
    return status === 'published' ? CheckCircle : Clock
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
        <p className="text-gray-400 mb-6">The post you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center bg-gray-900 text-white px-4 py-2 rounded-lg"
          type="button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-5xl mx-auto space-y-8 p-6 rounded-2xl shadow-lg">
        {/* Header (responsive like editor) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 gap-4 sm:gap-0">
          <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition shrink-0"
              type="button"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Blog</span>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight truncate">
                {post.title}
              </h1>
              <p className="text-gray-400 text-sm mt-1 sm:mt-0 truncate">
                {post.description || ''}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center mt-2 sm:mt-0">
            <Link
              to={`/editor/${post.post_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full transition"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="text-sm">Edit Post</span>
            </Link>

            {post.status && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <span className="inline-flex items-center space-x-1">
                  {post.status === 'published' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  <span className="ml-1">{post.status}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {formatDate(post.updated_at)}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              Author
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2 text-gray-400" />
              {post.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-black">
          <div 
            className="prose prose-lg max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between text-gray-700">
          <div className="text-sm">
            Last updated: {formatDate(post.updated_at)}
          </div>
          <div className="mt-3 sm:mt-0">
            <Link
              to={`/editor/${post.post_id}`}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Edit this post
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
