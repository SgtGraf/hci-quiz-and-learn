const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const whisperRoutes = require('./routes/whisperRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ttsRoutes = require('./routes/ttsRoutes');
const connectorRoutes = require('./routes/connectorRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/connector', connectorRoutes);
app.use("/api/whisper", whisperRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/tts", ttsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
