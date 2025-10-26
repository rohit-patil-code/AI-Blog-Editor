import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, 
  Eye, 
  Sparkles, 
  Wand2, 
  CheckCircle, 
  Zap, 
  FileText,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { blogAPI, aiAPI } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export function BlogEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const quillRef = useRef(null)

  const [post, setPost] = useState({
    title: '',
    content: '',
    status: 'draft'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isNewPost, setIsNewPost] = useState(!id)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (id) fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await blogAPI.getBlog(id)
      setPost(response.data.post)
    } catch (error) {
      toast.error('Failed to load post')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (status = post.status) => {
    if (!post.title.trim() || !post.content.trim()) {
      toast.error('Please add a title and content')
      return
    }
    try {
      setSaving(true)
      if (isNewPost) {
        const response = await blogAPI.createBlog({ ...post, status })
        setPost(response.data.post)
        setIsNewPost(false)
        navigate(`/editor/${response.data.post.post_id}`, { replace: true })
        toast.success('Post created successfully')
      } else {
        await blogAPI.updateBlog(id, { ...post, status })
        toast.success('Post saved successfully')
      }
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleTitleChange = (e) => setPost({ ...post, title: e.target.value })
  const handleContentChange = (content) => setPost({ ...post, content })

  const handleAIAction = async (action, data = {}) => {
    try {
      setAiLoading(true)
      let result

      switch (action) {
        case 'generate':
          result = await aiAPI.generate({
            prompt: data.prompt || 'Write a blog post about...',
            tone: data.tone || 'professional',
            length: data.length || 'medium'
          })
          setPost({ ...post, content: result.data.content })
          break
        case 'grammar':
          if (!post.content.trim()) return toast.error('Add content to correct')
          result = await aiAPI.grammar({ text: post.content })
          console.log(result.data.correctedText);
          setPost({ ...post, content: result.data.correctedText})
          break
        case 'enhance':
          if (!post.content.trim()) return toast.error('Add content to enhance')
          result = await aiAPI.enhance({ text: post.content, type: data.type })
          setPost({ ...post, content: result.data.enhancedText })
          break
        case 'titles':
          result = await aiAPI.titles({ content: post.content, count: 5 })
          showTitleSuggestions(result.data.titles)
          break
        default:
          toast.error('Unknown AI action')
          return
      }
      toast.success('AI action complete')
    } catch {
      toast.error('AI action failed')
    } finally {
      setAiLoading(false)
    }
  }

  const showTitleSuggestions = (titles) => {
    const list = titles.map((t, i) => `${i + 1}. ${t}`).join('\n')
    const pick = prompt(`Choose a title:\n\n${list}\n\nEnter 1-${titles.length}`)
    if (pick) {
      const i = parseInt(pick) - 1
      if (i >= 0 && i < titles.length) {
        setPost({ ...post, title: titles[i] })
        toast.success('Title updated')
      }
    }
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 bg-black text-white p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 gap-4 sm:gap-0">
        <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition shrink-0"
            type="button"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {isNewPost ? 'Create New Post' : 'Edit Post'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 sm:mt-0 truncate">
              {isNewPost
                ? 'Start writing your next great article'
                : 'Make your changes and save'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center mt-2 sm:mt-0">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-gray-200 px-4 py-2 rounded-lg transition border border-gray-700 disabled:opacity-50"
            type="button"
            aria-label="Save draft"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm">Save Draft</span>
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
            type="button"
            aria-label="Publish"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm">Publish</span>
          </button>
        </div>
      </div>
  
      {/* AI Features Panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-white" />
          AI Writing Assistant
        </h3>
  
        {/* Responsive: 1 column on very small, 2 on small, 4 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() =>
              handleAIAction('generate', {
                prompt: `Write an engaging introduction for a blog post on title: ${post.title}`,
              })
            }
            disabled={aiLoading}
            type="button"
            aria-label="Generate content"
            className="w-full h-20 sm:h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95"
          >
            <Wand2 className="h-6 w-6 mb-1" />
            <span className="text-sm sm:text-base">Generate Content</span>
          </button>
  
          <button
            onClick={() => handleAIAction('titles')}
            disabled={aiLoading || !post.content.trim()}
            type="button"
            aria-label="Suggest titles"
            className="w-full h-20 sm:h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95"
          >
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-sm sm:text-base">Suggest Titles</span>
          </button>
  
          <button
            onClick={() => handleAIAction('enhance', { type: 'improve' })}
            disabled={aiLoading || !post.content.trim()}
            type="button"
            aria-label="Improve text"
            className="w-full h-20 sm:h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95"
          >
            <Zap className="h-6 w-6 mb-1" />
            <span className="text-sm sm:text-base">Improve Text</span>
          </button>
  
          <button
            onClick={() => handleAIAction('grammar')}
            disabled={aiLoading || !post.content.trim()}
            type="button"
            aria-label="Fix grammar"
            className="w-full h-20 sm:h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95"
          >
            <CheckCircle className="h-6 w-6 mb-1" />
            <span className="text-sm sm:text-base">Fix Grammar</span>
          </button>
        </div>
  
        {aiLoading && (
          <div className="mt-4 flex items-center justify-center text-gray-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            AI is working...
          </div>
        )}
      </div>
  
      {/* Editor */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-400">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={post.title}
            onChange={handleTitleChange}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
            placeholder="Enter your post title..."
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-400">
            Content
          </label>
          <ReactQuill
            ref={quillRef}
            value={post.content}
            onChange={handleContentChange}
            modules={quillModules}
            theme="snow"
            placeholder="Start writing your post..."
            className="bg-gray-800 text-white rounded-lg border border-gray-700 quill-dark"
          />
        </div>
      </div>
    </div>
  )
}
