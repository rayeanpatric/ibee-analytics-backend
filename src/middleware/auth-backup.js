const { logger } = require("./logger");

const validTokens = new Map([
  ["demo-token-123", { userId: "demo-user", name: "Demo User", role: "user" }],
  ["admin-token-456", { userId: "admin-user", name: "Admin User", role: "admin" }],
  ["user-token-789", { userId: "regular-user", name: "Regular User", role: "user" }],
]);

const authenticate = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
      token = token.substring(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      logger.warn(
        `Authentication failed: No token provided - ${req.method} ${req.url} - ${req.ip}`
      );
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please provide a valid token in Authorization header or token query parameter",
      });
    }

    const userInfo = validTokens.get(token);
    if (!userInfo) {
      logger.warn(
        `Authentication failed: Invalid token "${token}" - ${req.method} ${req.url} - ${req.ip}`
      );
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "The provided token is not valid",
      });
    const userInfo = validTokens.get(token);
    if (!userInfo) {
      logger.warn(`Authentication failed: Invalid token "${token}" - ${req.method} ${req.url} - ${req.ip}`);
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "The provided token is not valid",
      });
    }

    req.authToken = token;
    req.user = {
      token,
      userId: userInfo.userId,
      name: userInfo.name,
      role: userInfo.role,
    };

    logger.info(
      `Authentication successful: User "${userInfo.userId}" with token "${token}" - ${req.method} ${req.url} - ${req.ip}`
    );
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Authentication error",
      message: "Internal authentication error",
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
      token = token.substring(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    const userInfo = validTokens.get(token);
    if (token && userInfo) {
      req.authToken = token;
      req.user = {
        token,
        userId: userInfo.userId,
        name: userInfo.name,
        role: userInfo.role,
      };
      req.isAuthenticated = true;
      logger.info(
        `Optional auth: Authenticated user "${userInfo.userId}" with token "${token}" - ${req.method} ${req.url}`
      );
    } else {
      req.isAuthenticated = false;
      logger.info(
        `Optional auth: Unauthenticated access - ${req.method} ${req.url}`
      );
    }

    next();
  } catch (error) {
    logger.error(`Optional authentication error: ${error.message}`);
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Get authentication info endpoint
 */
const getAuthInfo = (req, res) => {
  res.json({
    success: true,
    data: {
      isAuthenticated: !!req.authToken,
      token: req.authToken || null,
      user: req.user || null,
      validTokens: Array.from(validTokens.keys()), // For demo purposes only
      message: "Use one of the valid tokens for authentication",
    },
  });
};

module.exports = {
  authenticate,
  optionalAuth,
  getAuthInfo,
  validTokens,
};
