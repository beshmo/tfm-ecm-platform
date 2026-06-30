const target = process.env.MANAGEMENT_API_PROXY_TARGET ?? "http://localhost:3000";

module.exports = {
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "warn"
  }
};
