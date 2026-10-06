function success(res, data = {}, status = 200) {
  return res.status(status).json(data);
}

function error(res, message = 'Internal Server Error', status = 500, details = null) {
  const body = { message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = {
  success,
  error
};
