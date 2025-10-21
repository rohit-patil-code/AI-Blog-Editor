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
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
        <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been deleted.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={`/editor/${post.post_id}`}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full font-medium transition-colors inline-flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Meta */}
        <div className="mb-8">
          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(post.updated_at)}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Author
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              {post.content.replace(/<[^>]*>/g, '').split(/\s+/).length} words
            </div>
            {post.status === 'draft' && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Draft
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(post.updated_at)}
            </div>
            <div className="flex items-center space-x-4">
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
    </div>
  )
}
