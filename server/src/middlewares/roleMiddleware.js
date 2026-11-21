import { ForbiddenError, UnauthorizedError } from '../utils/errors.js'

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the required roles.
 * @param  {...string} allowedRoles - e.g. 'admin', 'seller', 'customer'
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. This endpoint requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`
        )
      )
    }

    next()
  }
}

/**
 * Seller Verification Guard
 * Verifies that the user has an approved seller account before performing merchant operations.
 */
export const requireApprovedSeller = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'))
  }

  if (req.user.role !== 'seller') {
    return next(new ForbiddenError('Access denied: Seller account required'))
  }

  if (!req.seller || req.seller.status !== 'approved') {
    return next(
      new ForbiddenError('Your seller store is pending approval or has been suspended by an administrator.')
    )
  }

  next()
}
