const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// contact(get)
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// contact post
app.post('/contact', (req, res) => {
  console.log(req.body);
  res.send(`<h2>Thanks, ${req.body.name}! Your message has been received.</h2>`);
});

// 404
app.use((req, res) => {
  res.status(404).send('<h1>404 Page not found</h1>');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});