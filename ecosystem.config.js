module.exports = {
  apps: [
    {
      name: "tessera-blockchain-api",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      combine_logs: true,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_file: "./logs/combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "1G"
    }
  ]
};
