/**
 * Standardized API Response Utilities
 * Enforces Rule 9 of QuickSure Security Boundaries
 */

export class ApiResponse {
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
