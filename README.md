# AI-Powered Blog Editor

A modern, full-stack blog editing platform with integrated AI capabilities powered by OpenAI and Google's Generative AI. This application allows users to create, edit, and manage blog posts with the assistance of AI-powered features for content generation, improvement, summarization, and SEO optimization.

## ✨ Features

### 🤖 AI-Powered Features
- **Content Generation**: Generate blog content from prompts with customizable tone, length, and creativity
- **Content Improvement**: Enhance existing content with AI suggestions
- **Summarization**: Create concise summaries of blog posts
- **SEO Optimization**: Generate SEO-friendly titles, meta descriptions, and keywords
- **Grammar Check**: Detect and fix grammar and spelling errors
- **Tone Adjustment**: Modify content tone (professional, casual, technical, creative)
- **Paragraph Expansion/Compression**: Adjust content length as needed

### 📝 Blog Management
- Create, read, update, and delete blog posts
- Rich text editor with React Quill
- Draft and publish workflow
- Blog categorization and tagging
- View count tracking
- User-specific blog management

### 🔐 Authentication & Security
- JWT-based authentication
- Secure password hashing with bcryptjs
- Protected API routes
- Rate limiting for API endpoints
- CORS configuration
- Helmet.js security headers

### 💻 Modern UI/UX
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Toast notifications for user feedback
- Loading states and skeletons
- Clean and intuitive interface
- Lucide React icons

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI Integration**: 
  - OpenAI API
  - Google Generative AI
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Logging**: Winston, Morgan
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Rich Text Editor**: React Quill
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- PostgreSQL (v12 or higher)
- Redis (optional, for caching and rate limiting)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AI-Blog-Editor.git
cd AI-Blog-Editor
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_blog_editor
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX_REQUESTS=20
```

#### Database Setup

1. Create a PostgreSQL database:
```bash
createdb ai_blog_editor
```

2. Run migrations to create tables:
```bash
npm run db:migrate
```

3. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

#### Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:3001`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`

## 📁 Project Structure

```
AI-Blog-Editor/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   ├── notFound.js          # 404 handler
│   │   └── rateLimiter.js       # Rate limiting configuration
│   ├── routes/
│   │   ├── ai.js                # AI-powered features endpoints
│   │   ├── auth.js              # Authentication endpoints
│   │   └── blogs.js             # Blog CRUD endpoints
│   ├── scripts/
│   │   ├── migrate.js           # Database migration script
│   │   └── seed.js              # Database seeding script
│   ├── services/
│   │   └── aiService.js         # AI service integration
│   ├── utils/
│   │   └── logger.js            # Winston logger configuration
│   ├── server.js                # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIToolbar.jsx    # AI features toolbar
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── pages/
│   │   │   ├── BlogEditor.jsx   # Blog creation/editing page
│   │   │   ├── BlogView.jsx     # Blog viewing page
│   │   │   ├── Dashboard.jsx    # User dashboard
│   │   │   ├── Login.jsx        # Login page
│   │   │   └── Register.jsx     # Registration page
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Blogs
- `GET /api/blogs` - Get all blogs (with pagination)
- `GET /api/blogs/:id` - Get blog by ID
- `POST /api/blogs` - Create new blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog
- `GET /api/blogs/user/:userId` - Get user's blogs

### AI Features
- `POST /api/ai/generate` - Generate content from prompt
- `POST /api/ai/improve` - Improve existing content
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/seo` - Generate SEO metadata
- `POST /api/ai/grammar` - Check and fix grammar
- `POST /api/ai/tone` - Adjust content tone
- `POST /api/ai/expand` - Expand paragraph
- `POST /api/ai/compress` - Compress paragraph

## 🔧 Configuration

### Rate Limiting
The application implements rate limiting to protect against abuse:
- General API: 100 requests per 15 minutes
- AI Endpoints: 20 requests per 15 minutes

### Database Schema
The application uses PostgreSQL with the following main tables:
- `users` - User accounts
- `posts` - Blog posts
- `ai_usage_logs` - AI feature usage tracking

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Uses Vite dev server with HMR
```

### Building for Production

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

## 📝 Environment Variables Reference

### Backend Required Variables
- `PORT` - Server port (default: 3001)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GOOGLE_AI_API_KEY` - Google AI API key

### Frontend Required Variables
- `VITE_API_URL` - Backend API URL

## 🙏 Acknowledgments

- OpenAI for GPT API
- Google for Generative AI
- React and the amazing React ecosystem
- Express.js and Node.js community

## 🐛 Known Issues

- Redis is currently optional but recommended for production deployments
- Rate limiting may need adjustment based on your use case
- AI API costs should be monitored in production

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Collaborative editing
- [ ] Image upload and management
- [ ] Comments and reactions
- [ ] Social media integration
- [ ] Advanced analytics
- [ ] Mobile app version
- [ ] Export to various formats (PDF, Markdown, etc.)

---

Made with ❤️ by Rohit Patil
