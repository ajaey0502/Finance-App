# FinSight - Personal Finance Dashboard

<div align="center">

![FinSight](https://img.shields.io/badge/FinSight-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

**A modern, AI-powered personal finance management dashboard**

[Features](#features) • [Tech Stack](#tech-stack) • [Setup](#setup) • [API Documentation](#api-documentation) • [Contributing](#contributing)

</div>

---

## 📋 Project Overview

FinSight is a comprehensive personal finance management application that helps users track income and expenses, create budgets, forecast spending patterns, and gain AI-powered financial insights. Built with modern web technologies and powered by Google Gemini AI for intelligent categorization and forecasting.

### Key Benefits
- 💰 **Complete Financial Overview**: Track all transactions in one place
- 🤖 **AI-Powered**: Automatic transaction categorization and expense forecasting
- 📊 **Advanced Analytics**: Visualize spending patterns with interactive charts
- 💼 **Budget Management**: Set and monitor budgets with real-time alerts
- 🔮 **Predictive Insights**: AI-generated spending forecasts
- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile

---

## ✨ Features

### Authentication & Security
- ✅ JWT-based authentication with refresh tokens
- ✅ Secure password handling with bcrypt
- ✅ httpOnly cookie support for token storage
- ✅ User registration and login
- ✅ Session management

### Transaction Management
- ✅ Add, edit, delete transactions
- ✅ Categorize transactions (AI-assisted)
- ✅ Recurring transaction support
- ✅ Category auto-suggestions
- ✅ Filter by month, category, and type
- ✅ Transaction history with timestamps

### Budget System
- ✅ Create and manage budgets by category
- ✅ Real-time budget tracking
- ✅ Alert system for budget overages
- ✅ Monthly and yearly budget periods
- ✅ Budget status visualization

### Analytics & Reporting
- ✅ Income vs Expense trends (line chart)
- ✅ Expense breakdown by category (pie chart)
- ✅ Monthly summaries and statistics
- ✅ Category-wise spending analysis
- ✅ Budget status overview
- ✅ Savings rate calculation

### AI-Powered Features
- ✅ **Automatic Categorization**: Gemini AI categorizes transactions
- ✅ **Expense Forecasting**: Predicts next month's spending
- ✅ **Confidence Scoring**: Shows forecast reliability (50-100%)
- ✅ **Smart Insights**: AI-generated spending explanations
- ✅ **High-Risk Categories**: Identifies spending patterns

### Dashboard
- ✅ Summary cards (Income, Expenses, Balance, Savings)
- ✅ Interactive line chart for trends
- ✅ Category breakdown pie chart
- ✅ Budget alerts section
- ✅ Forecast insights panel
- ✅ Real-time data updates

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: MongoDB 5.0+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **AI Integration**: Google Gemini API
- **Validation**: Express middleware
- **Logging**: Console logging
- **CORS**: Express CORS middleware

### Frontend
- **Framework**: React 18.2+
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite 5.0+
- **Styling**: Tailwind CSS 3.4+
- **HTTP Client**: Axios 1.6+
- **Routing**: React Router 6.20+
- **Charts**: Chart.js 4.4+ with react-chartjs-2
- **UI**: Custom Tailwind components

### DevOps & Tools
- **Version Control**: Git
- **Code Quality**: ESLint
- **Package Manager**: npm/yarn
- **Environment**: .env configuration

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React SPA   │  │ Tailwind UI  │  │ Chart.js     │      │
│  │ Components   │  │ Components   │  │ Visualizations      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS/REST API
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js Server (Node.js)                           │ │
│  │  • Authentication Middleware                           │ │
│  │  • Request Validation                                  │ │
│  │  • Error Handling                                      │ │
│  │  • CORS & Security                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────┬────────────────────────┬────────────────────────────┘
         │                        │
         │ Route Groups:          │
         ├─ /auth (JWT)           │
         ├─ /transactions         │
         ├─ /budgets              │
         ├─ /analytics            │
         ├─ /forecasts            │
         └─ /categories           │
         │
┌────────┴────────────────────────┬────────────────────────────┐
│                   SERVICE LAYER                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ Auth Service     │  │ Transaction Service          │    │
│  │ • JWT tokens     │  │ • CRUD operations            │    │
│  │ • Bcrypt hashing │  │ • Validation                 │    │
│  └──────────────────┘  └──────────────────────────────┘    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ Gemini Service   │  │ Analytics Service            │    │
│  │ • Categorization │  │ • Aggregation pipelines      │    │
│  │ • Forecasting    │  │ • Trend analysis             │    │
│  │ • AI insights    │  │ • Statistics calculation     │    │
│  └──────────────────┘  └──────────────────────────────┘    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ Budget Service   │  │ Forecast Service             │    │
│  │ • Budget tracking│  │ • Monthly predictions        │    │
│  │ • Alert system   │  │ • Confidence scoring         │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└────────┬──────────────────────────────────────────────────┘
         │
┌────────┴──────────────────────────────────────────────────┐
│              DATA PERSISTENCE LAYER                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ MongoDB Atlas                                      │  │
│  │ • Users (authentication data)                      │  │
│  │ • Transactions (income/expense records)            │  │
│  │ • Budgets (spending limits)                        │  │
│  │ • Forecasts (predictions & insights)               │  │
│  │ • Categories (transaction categories)              │  │
│  │ • AI Cache (API response caching)                  │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ├─ External Services
         │
         └─ ┌──────────────────┐
            │ Google Gemini API│  (AI-powered categorization
            │                  │   and forecasting)
            └──────────────────┘
```

### Data Model

```
┌─────────────┐
│   User      │
├─────────────┤
│ _id         │
│ email       │
│ password    │
│ name        │
│ createdAt   │
└─────────────┘
      │
      ├─ 1:N → Transactions
      ├─ 1:N → Budgets
      ├─ 1:N → Forecasts
      └─ 1:N → Categories

┌──────────────────┐
│ Transaction      │
├──────────────────┤
│ _id              │
│ userId (FK)      │
│ amount           │
│ type (I/E)       │
│ category         │
│ description      │
│ date             │
│ isRecurring      │
│ frequency        │
│ categorizedByAI  │
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│ Budget           │
├──────────────────┤
│ _id              │
│ userId (FK)      │
│ category         │
│ limit            │
│ spent            │
│ period (M/Y)     │
│ lastUpdated      │
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│ Forecast         │
├──────────────────┤
│ _id              │
│ userId (FK)      │
│ month (YYYY-MM)  │
│ predictedAmount  │
│ insight (80 words)
│ confidence (0-1) │
│ basedOnMonths    │
│ createdAt        │
└──────────────────┘
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/finsight.git
cd finsight
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with backend URL
nano .env

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 4. Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist folder
npm run preview
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/finsight

# Authentication
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro
GEMINI_TIMEOUT=5000

# CORS
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# Email (optional)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@finsight.com
```

**Generating Secrets:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FinSight

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_FORECAST=true
```

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Transaction Endpoints
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get single transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budget Endpoints
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/status` - Get budget status

### Analytics Endpoints
- `GET /api/analytics` - Get analytics summary
- `GET /api/analytics/monthly` - Monthly trends
- `GET /api/analytics/categories` - Category breakdown

### Forecast Endpoints
- `POST /api/forecasts/generate` - Generate forecast
- `GET /api/forecasts/latest` - Get latest forecast
- `GET /api/forecasts/:month` - Get forecast by month
- `GET /api/forecasts` - List all forecasts

### Category Endpoints
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create custom category

---

## 📊 Screenshots & UI

### Dashboard
```
[Screenshot: Main dashboard with summary cards, charts, alerts, forecast]
```

### Transaction Management
```
[Screenshot: Transaction list with filters and add modal]
```

### Budget Tracking
```
[Screenshot: Budget list with progress bars and alerts]
```

### Analytics
```
[Screenshot: Charts showing income vs expenses trend]
```

### Authentication
```
[Screenshot: Login and registration pages]
```

---

## 🔧 Development

### Project Structure

```
finsight/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # MongoDB schemas
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth, validation
│   │   ├── utils/            # Helper functions
│   │   └── server.ts         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API calls
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities
│   │   ├── context/          # Context providers
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── README.md                 # This file
├── .gitignore
└── LICENSE
```

### Available Scripts

**Backend:**
```bash
npm run dev       # Start development server with hot reload
npm run build     # Build TypeScript
npm start         # Run production build
npm run lint      # Run ESLint
npm test          # Run tests
```

**Frontend:**
```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🔒 Security

### Best Practices
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ CORS enabled for specific origins
- ✅ Environment variables for secrets
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (MongoDB prevents injection)
- ✅ XSS protection via React escaping
- ✅ CSRF token support ready

### Security Headers
- Implement Content-Security-Policy
- Set X-Frame-Options
- Enable HTTPS in production
- Use secure cookies (httpOnly, Secure flags)
- Regular security audits

---

## 🚢 Deployment

### Deploying to Production

**Backend (Node.js):**
```bash
# Build
npm run build

# Deploy to Heroku/Railway/Render
git push heroku main

# Or Docker
docker build -t finsight-backend .
docker run -p 5000:5000 finsight-backend
```

**Frontend (Static Site):**
```bash
# Build
npm run build

# Deploy to Vercel/Netlify
vercel deploy

# Or AWS S3 + CloudFront
aws s3 sync dist/ s3://your-bucket/
```

### Environment Setup
- Set production environment variables
- Enable HTTPS
- Configure CORS for production domain
- Set up monitoring and logging
- Configure backups for MongoDB

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify all environment variables
- Check port 5000 isn't in use
- Install all dependencies: `npm install`

**Frontend API calls fail:**
- Verify backend is running
- Check VITE_API_URL in .env
- Check browser console for errors
- Verify CORS settings

**AI features not working:**
- Check Gemini API key is valid
- Verify API key has right permissions
- Check rate limiting
- Review API quota

**MongoDB connection issues:**
- Verify connection string
- Check whitelist IP address
- Confirm database name
- Test with MongoDB Compass

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

### Getting Help
- 📖 Check documentation
- 🐛 Report bugs on GitHub Issues
- 💬 Discuss ideas in GitHub Discussions
- 📧 Email: support@finsight.app

---

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- MongoDB for database solutions
- React community for amazing tools
- Chart.js for visualizations
- Tailwind CSS for styling framework

---

## 🗺️ Roadmap

### v1.1 (Q1 2025)
- [ ] Mobile app (React Native)
- [ ] Bill reminders and notifications
- [ ] Multi-currency support
- [ ] Export to PDF/Excel

### v1.2 (Q2 2025)
- [ ] Savings goals feature
- [ ] Investment tracking
- [ ] Smart notifications
- [ ] Advanced reporting

### v2.0 (Q3 2025)
- [ ] Collaborative budgeting
- [ ] Bank API integration
- [ ] Advanced forecasting
- [ ] Wealth management tools

---

<div align="center">

**[⬆ back to top](#finsight---personal-finance-dashboard)**

Made with ❤️ by the FinSight Team

</div>
