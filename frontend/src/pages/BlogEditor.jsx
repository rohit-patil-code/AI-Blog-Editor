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
import { AIToolbar } from '../components/AIToolbar'
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
  const [selectedText, setSelectedText] = useState('')
  const [showAIToolbar, setShowAIToolbar] = useState(false)
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

  const handleTextSelection = () => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    const selection = quill.getSelection()
    if (selection && selection.length > 0) {
      const text = quill.getText(selection.index, selection.length)
      setSelectedText(text.trim())
      setShowAIToolbar(true)
    } else {
      setSelectedText('')
      setShowAIToolbar(false)
    }
  }

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
          if (!selectedText) return toast.error('Select text to correct')
          result = await aiAPI.grammar({ text: selectedText })
          replaceSelectedText(result.data.correctedText)
          break
        case 'enhance':
          if (!selectedText) return toast.error('Select text to enhance')
          result = await aiAPI.enhance({ text: selectedText, type: data.type })
          replaceSelectedText(result.data.enhancedText)
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

  const replaceSelectedText = (newText) => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const selection = quill.getSelection()
      if (selection) {
        quill.deleteText(selection.index, selection.length)
        quill.insertText(selection.index, newText)
        quill.setSelection(selection.index, newText.length)
      }
    }
    setShowAIToolbar(false)
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
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
  
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isNewPost ? 'Create New Post' : 'Edit Post'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isNewPost
                ? 'Start writing your next great article'
                : 'Make your changes and save'}
            </p>
          </div>
        </div>
  
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center bg-gray-900 hover:bg-gray-800 text-gray-200 px-4 py-2 rounded-lg transition border border-gray-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </button>
  
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Publish
          </button>
        </div>
      </div>
  
      {/* AI Features Panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-white" />
          AI Writing Assistant
        </h3>
  
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() =>
              handleAIAction('generate', {
                prompt: `Write an engaging introduction for a blog post on title: ${post.title}`,
              })
            }
            disabled={aiLoading}
            className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-4 h-24 transition border border-gray-700"
          >
            <Wand2 className="h-6 w-6 mb-2" />
            <span className="text-sm">Generate Content</span>
          </button>
  
          <button
            onClick={() => handleAIAction('titles')}
            disabled={aiLoading || !post.content.trim()}
            className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-4 h-24 transition border border-gray-700"
          >
            <FileText className="h-6 w-6 mb-2" />
            <span className="text-sm">Suggest Titles</span>
          </button>
  
          <button
            onClick={() => handleAIAction('enhance', { type: 'improve' })}
            disabled={aiLoading || !selectedText}
            className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-4 h-24 transition border border-gray-700"
          >
            <Zap className="h-6 w-6 mb-2" />
            <span className="text-sm">Improve Text</span>
          </button>
  
          <button
            onClick={() => handleAIAction('grammar')}
            disabled={aiLoading || !selectedText}
            className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl p-4 h-24 transition border border-gray-700"
          >
            <CheckCircle className="h-6 w-6 mb-2" />
            <span className="text-sm">Fix Grammar</span>
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
            onSelectionChange={handleTextSelection}
            modules={quillModules}
            theme="snow"
            placeholder="Start writing your post..."
            className="bg-gray-800 text-white rounded-lg border border-gray-700 quill-dark"
          />
        </div>
      </div>
  
      {/* AI Toolbar */}
      {showAIToolbar && selectedText && (
        <AIToolbar
          selectedText={selectedText}
          onAction={handleAIAction}
          onClose={() => setShowAIToolbar(false)}
          loading={aiLoading}
        />
      )}
    </div>
  )
}
