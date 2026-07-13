export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    requestId: req.requestId,
    error: {
      code: "NOT_FOUND",
      message: `No route exists for ${req.method} ${req.originalUrl}.`,
    },
  });
}

export function errorHandler(error, req, res, _next) {
  const requestId = error?.requestId || req.requestId;
  const missingKey = /(?:OPENAI|GROQ)_API_KEY/.test(error?.message || "");
  const rateLimited =
    error?.status === 429 ||
    error?.statusCode === 429 ||
    error?.name === "RateLimitError" ||
    /quota|rate.?limit|429/i.test(error?.message || "");
  const statusCode = error?.statusCode || (missingKey ? 503 : rateLimited ? 429 : 500);
  const code =
    missingKey
      ? "LLM_NOT_CONFIGURED"
      : rateLimited
        ? "LLM_RATE_LIMITED"
        : error?.code || "AGENT_ERROR";

  console.error(
    JSON.stringify({
      event: "chat_request_failed",
      requestId,
      method: req.method,
      path: req.originalUrl,
      errorCode: code,
      error: error?.message || "Unknown error",
    })
  );

  const message =
    error?.publicMessage ||
    (missingKey
      ? "The selected model provider API key is not configured."
      : rateLimited
        ? "The model provider quota is unavailable. Check its billing and usage limits, then try again."
      : "The chat agent could not complete the request. Check the server logs and try again.");

  res.status(statusCode).json({
    success: false,
    requestId,
    error: {
      code,
      message,
    },
  });
}
