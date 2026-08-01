const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes/index');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded menu photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', routes);

// Serve both static client apps from this same server + port as the API.
// This means opening http://<your-ip>:4000 (customer) or
// http://<your-ip>:4000/admin/login.html (admin) gets the whole app with
// no separate static server, no cross-port CORS, and only "npm start" to run.
const clientRoot = path.join(__dirname, '..', '..', 'client');
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin/login.html'));
app.use('/admin', express.static(path.join(clientRoot, 'admin')));
app.use('/', express.static(path.join(clientRoot, 'customer')));

// Fallback error handler (e.g. multer file-type errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Something went wrong' });
});

module.exports = app;
