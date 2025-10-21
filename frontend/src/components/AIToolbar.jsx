import { useState } from 'react'
import { 
  Wand2, 
  CheckCircle, 
  Zap, 
  Expand, 
  Minimize, 
  FileText,
  X,
  Loader2
} from 'lucide-react'

export function AIToolbar({ selectedText, onAction, onClose, loading }) {
  const [showOptions, setShowOptions] = useState(false)

  const actions = [
    {
      id: 'grammar',
      label: 'Fix Grammar',
      icon: CheckCircle,
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      id: 'enhance_improve',
      label: 'Improve',
      icon: Zap,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'enhance_expand',
      label: 'Expand',
      icon: Expand,
      color: 'text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'enhance_simplify',
      label: 'Simplify',
      icon: Minimize,
      color: 'text-orange-600 hover:bg-orange-50'
    },
    {
      id: 'enhance_summarize',
      label: 'Summarize',
      icon: FileText,
      color: 'text-indigo-600 hover:bg-indigo-50'
    }
  ]

  const handleAction = (actionId) => {
    if (actionId.startsWith('enhance_')) {
      const type = actionId.replace('enhance_', '')
      onAction('enhance', { type })
    } else {
      onAction(actionId)
    }
    setShowOptions(false)
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">AI Actions</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Selected text:</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border max-h-20 overflow-y-auto">
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
          </p>
        </div>

        {!showOptions ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction('grammar')}
              disabled={loading}
              className="flex-1 btn btn-outline btn-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Fix Grammar
            </button>
            <button
              onClick={() => setShowOptions(true)}
              disabled={loading}
              className="flex-1 btn btn-primary btn-sm"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              More Options
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${action.color} border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowOptions(false)}
              className="w-full btn btn-ghost btn-sm"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

