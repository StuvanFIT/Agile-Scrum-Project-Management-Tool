const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the CORS middleware

const app = express();
const PORT = 3000;

// Use CORS middleware to allow cross-origin requests
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const csvFilePath = path.join(__dirname, 'tasks.csv');

// Endpoint to append data to the CSV file
app.post('/append-csv', (req, res) => {
    const newRow = req.body;
    const csvRow = Object.values(newRow).map(value => `"${value}"`).join(',') + '\n';

    fs.appendFile(csvFilePath, csvRow, err => {
        if (err) {
            console.error('Error appending to CSV file:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send('Row added successfully');
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
