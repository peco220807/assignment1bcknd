const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// get
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// post
app.post('/contact', (req, res) => {
  const { name, message } = req.body;

  // validation
  if (!name || !message) {
    return res.status(400).send('Missing required fields');
  }
  const contactData = {
    name,
    message,
    date: new Date().toISOString()
  };

  fs.writeFile(
    'contacts.json',
    JSON.stringify(contactData, null, 2),
    (err) => {
      if (err) {
        return res.status(500).send('Error saving data');
      }
      res.send(`<h2>Thanks, ${name}! Your message has been received.</h2>`);
    }
  );
});

// search page (query)
app.get('/search', (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).send('Missing search query');
  }

  res.send(`<h2>Search results for: ${q}</h2>`);
});

// item page (route)
app.get('/item/:id', (req, res) => {
  const id = req.params.id;
  res.send(`<h2>Item page for ID: ${id}</h2>`);
});

// API endpoint (JSON response)
app.get('/api/info', (req, res) => {
  res.json({
    project: 'Assignment 2 – Part 1 "DEZIRE"',
    author: 'Saparbay Symbat',
    year: 2025
  });
});

app.use((req, res) => {
  res.status(404).send('<h1>404 Page Not Found</h1>');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});