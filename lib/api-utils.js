export function successResponse(data, statusCode = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function errorResponse(message, statusCode = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401);
}

export function forbiddenResponse() {
  return errorResponse('Forbidden: Insufficient permissions', 403);
}

export function notFoundResponse() {
  return errorResponse('Not found', 404);
}
