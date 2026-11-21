import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { globalRateLimiter } from './middlewares/rateLimiter.js'
import { errorHandler } from './middlewares/errorHandler.js'
import healthRoutes from './routes/healthRoutes.js'
import apiRouter from './routes/index.js'
import { ApiResponse } from './utils/apiResponse.js'

const app = express()

// Security Headers with Cross-Origin Resource Policy configured for decoupled frontend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

// CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    return callback(new Error('Blocked by CORS policy'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// Body Parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Health Check Endpoint (placed BEFORE rate limiter so monitors do not exhaust user quota)
app.use('/api/health', healthRoutes)

// Global Rate Limiting for all other endpoints
app.use('/api', globalRateLimiter)

// Main API Router
app.use('/api', apiRouter)

// 404 Route Handler
app.use((req, res) => {
  return ApiResponse.error(res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  })
})

// Centralized Error Handler (Rule 9 & 10)
app.use(errorHandler)

export default app
