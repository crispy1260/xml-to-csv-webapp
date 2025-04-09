
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'uploaded.xml')
});
const upload = multer({ storage });

app.use(express.static('public'));

app.post('/upload', upload.single('xmlfile'), (req, res) => {
  // Run XML processing script
  const outputPath = path.join(__dirname, 'output/output.csv');

  // Clean up old output
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  const scriptPath = path.join(__dirname, 'processor.js');

  const command = `node "${scriptPath}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing script:', stderr);
      return res.status(500).send('Error processing XML file');
    }
    res.download(outputPath, 'converted.csv');
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
