/******************************************************************************
***
* ITE5315-Assignment 2
* I declare that this assignment is my own work in accordance with Humber Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Mazharuddin Sohail Mohammed
* Student ID: n01666360
******************************************************************************/
const { body, validationResult } = require('express-validator');
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const fs = require('fs'); 

const app = express();
const port = process.env.port || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: {
        highlightEmpty: (name) => {
            return (name && name.trim().length > 0) ? name : 'N/A';
        },
        rowClass: (name) => {
            return (!name || name.trim().length === 0) ? 'highlight' : ''; 
        }
    }
}));
app.set('view engine', 'hbs');


app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

app.get('/users', function(req, res) {
  res.send('respond with a resource');
});

app.get('/search/id', (req, res) => {
    res.render('search_id', { title: 'Search by ID' });
});

app.get('/search/name', (req, res) => {
    res.render('search_name', { title: 'Search by Name' });
});

app.post('/search/id/result', 
    [
        body('property_id').notEmpty().withMessage('ID is required').isNumeric().withMessage('ID must be a number').trim().escape()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('search_id', { title: 'Search by ID', error: errors.array()[0].msg });
        }

        const searchId = req.body.property_id;

        fs.readFile(path.join(__dirname, 'airbnb_with_photos.json'), 'utf8', (err, data) => {
            if (err) {
                console.error('File read error:', err);
                return res.render('error', { message: 'Error reading data: ' + err.message });
            }
            
            try {
                const jsonData = JSON.parse(data);
                const result = jsonData.find(item => item.id == searchId);

                if (result) {
                    res.render('results', { title: 'Property Found', data: [result] });
                } else {
                    res.render('error', { title: 'Not Found', message: `Property ID ${searchId} not found.` });
                }
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                return res.render('error', { message: 'Error parsing data: ' + parseErr.message });
            }
        });
    }
);

app.post('/search/name/result', 
    [
        body('property_name').notEmpty().withMessage('Name is required').trim().escape()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('search_name', { title: 'Search by Name', error: errors.array()[0].msg });
        }

        const searchName = req.body.property_name.toLowerCase();

        fs.readFile(path.join(__dirname, 'airbnb_with_photos.json'), 'utf8', (err, data) => {
            if (err) {
                console.error('File read error:', err);
                return res.render('error', { message: 'Error reading data: ' + err.message });
            }
            
            try {
                const jsonData = JSON.parse(data);
                
                const results = jsonData.filter(item => item.NAME && item.NAME.toLowerCase().includes(searchName));

                if (results.length > 0) {
                    res.render('results', { title: 'Properties Found', data: results });
                } else {
                    res.render('error', { title: 'Not Found', message: `No properties found for "${req.body.property_name}"` });
                }
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                return res.render('error', { message: 'Error parsing data: ' + parseErr.message });
            }
        });
    }
);

app.get('/viewData', (req, res) => {
    fs.readFile(path.join(__dirname, 'airbnb_with_photos.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('File read error:', err);
            return res.render('error', { message: 'Error reading data: ' + err.message });
        }
        
        try {
            const jsonData = JSON.parse(data);
            res.render('viewData', { title: 'All Data (Top 100)', data: jsonData.slice(0, 100) });
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            return res.render('error', { message: 'Error parsing data: ' + parseErr.message });
        }
    });
});

app.get('/viewData/clean', (req, res) => {
    fs.readFile(path.join(__dirname, 'airbnb_with_photos.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('File read error:', err);
            return res.render('error', { message: 'Error reading data: ' + err.message });
        }
        
        try {
            const jsonData = JSON.parse(data);
            const cleanData = jsonData.filter(item => item.NAME && item.NAME.trim() !== "");
            res.render('viewData', { title: 'Clean Data (No Empty Names)', data: cleanData.slice(0, 100) });
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            return res.render('error', { message: 'Error parsing data: ' + parseErr.message });
        }
    });
});

app.get('/viewData/price', (req, res) => {
    res.render('search_price', { title: 'Search by Price' });
});

app.post('/viewData/price', 
    [
        body('min_price').isNumeric().withMessage('Min Price must be a number'),
        body('max_price').isNumeric().withMessage('Max Price must be a number')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('search_price', { title: 'Search by Price', error: errors.array()[0].msg });
        }

        const min = parseFloat(req.body.min_price);
        const max = parseFloat(req.body.max_price);

        fs.readFile(path.join(__dirname, 'airbnb_with_photos.json'), 'utf8', (err, data) => {
            if (err) {
                console.error('File read error:', err);
                return res.render('error', { message: 'Error reading data: ' + err.message });
            }
            
            try {
                const jsonData = JSON.parse(data);

                const filteredData = jsonData.filter(item => {
                    const itemPrice = parseFloat(item.price); 
                    return itemPrice >= min && itemPrice <= max;
                });

                res.render('viewData', { title: `Properties between $${min} and $${max}`, data: filteredData.slice(0, 100) });
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                return res.render('error', { message: 'Error parsing data: ' + parseErr.message });
            }
        });
    }
);

app.use(function(req, res) {
  res.status(404).render('error', { title: 'Error', message:'Wrong Route' });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});