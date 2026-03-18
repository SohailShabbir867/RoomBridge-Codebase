const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
