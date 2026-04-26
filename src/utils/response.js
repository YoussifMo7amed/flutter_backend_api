export const sendResponse = (res, code, message, data = null) => {
  return res.status(code >= 100 && code < 600 ? code : 500).json({
    code,
    message,
    data
  });
};
