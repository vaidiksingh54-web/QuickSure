/**
 * Standardized API Response Utilities
 * Enforces Rule 9 of QuickSure Security Boundaries
 */

export class ApiResponse {
  static forbidden (res, { message = 'Access forbidden: insufficient permissions', details = null } = {}) {
    return ApiResponse.error(res, { message, code: 'FORBIDDEN', details, statusCode: 403 })
  }

  static unauthorized (res, { message = 'Authentication required', details = null } = {}) {
    return ApiResponse.error(res, { message, code: 'UNAUTHORIZED', details, statusCode: 401 })
  }

  static badRequest (res, { message = 'Bad request parameters', details = null } = {}) {
    return ApiResponse.error(res, { message, code: 'BAD_REQUEST', details, statusCode: 400 })
  }

  static noContent (res) {
    return res.status(204).send()
  }

  static created (res, { data = null, message = 'Resource created successfully', meta = {} }) {
    return ApiResponse.success(res, { data, message, meta, statusCode: 201 })
  }

  static success (res, { data = null, message = 'Operation successful', meta = {}, statusCode = 200 }) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null,
      meta
    })
  }

  static error (res, { message = 'Internal server error', code = 'INTERNAL_ERROR', details = null, statusCode = 500 }) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: {
        code,
        details
      },
      meta: {}
    })
  }

  static paginated (res, { data = [], total = 0, page = 1, limit = 12, message = 'Data fetched successfully' }) {
    const totalPages = Math.ceil(total / limit) || 1
    return res.status(200).json({
      success: true,
      message,
      data,
      error: null,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  }
}
