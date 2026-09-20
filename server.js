const config = require('./config/config');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`\n╔══════════════════════════════════════════════╗`);
      console.log(`║   Library Management System                  ║`);
      console.log(`║   Running on: http://localhost:${config.port}          ║`);
      console.log(`║   Environment: ${config.nodeEnv.padEnd(29)}║`);
      console.log(`╚══════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
