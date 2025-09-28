const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos
const staticPath = path.join(__dirname, 'dist/modeler-frontend');
app.use(express.static(staticPath));

// Ruta de fallback para SPA
app.get('/*', function(req, res) {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});