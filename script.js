const bcrypt = require("bcrypt"); /* to hash and verify passwords*/
console.log("Starting program.")
// const flag = require('./databasepg')
const express = require('express');
var bodyParser = require('body-parser');
const nodemon = require('nodemon');
const app = express();
const port = 8080; // Connects to localhost:3000
const router = express.Router();
require('dotenv').config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const { Pool } = require('pg');
router.use(express.json());



// The object below has the postgres test DB credentials / configurations. Port : 5432, name : test, user : postgres.
const dbConfig2 = {
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "test123",
    database: "test"
    
};
const pool2 = new Pool(dbConfig2);

// Function to validate the tier level
const isValidTier = (tier) => ['tier 1', 'tier 2', 'tier free'].includes(tier);

// INSERT User ON SUCCESSFUL AUTHENTICATION.
app.post('/createuser', async (req, res) => {

    let regExFirstName = /^[A-Za-z]+$/;
    let regExEmail = /[a-z0-9]+@northeastern.edu/;
    let regExPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
    const { username, password, email, tier_level } = req.body;
    let tier_count;
    if (tier_level === 'tier 1') {
        tier_count = 1000;
    } else if (tier_level === 'tier 2') {
        tier_count = 500;
    } else if (tier_level === 'tier free') {
        tier_count = 10;
    }
    else {
        res.status(400).send('Invalid input');
    }

    // Validate input
    if (!username || typeof username !== 'string' || !password || !email || !isValidTier(tier_level)) {
        return res.status(400).send('Invalid input');
    }

    try {
        // Check if email already exists
        const emailExists = await pool2.query('SELECT * FROM users_sunil WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).send('Email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const newUser = await pool2.query(
            'INSERT INTO users_sunil (username, password, email, tier_level, tier_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, hashedPassword, email, tier_level, tier_count]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// The object below has the postgres test DB credentials / configurations. Port : 5432, name : test, user : postgres.
const dbConfig3 = {
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "test123",
    database: "test"
};
const pool3 = new Pool(dbConfig3);


//URL Shortening end point

app.post('/submiturl', async (req, res) => {
    // Basic Authentication Check
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // Extract and Decode Credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    try {
        // User Verification
        const userResult = await pool3.query('SELECT * FROM users_sunil WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).send('Email not found');
        }

        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send('Authentication failed');
        }

        // URL Shortening Logic
        let longUrl = req.body.longUrl;
        let preferredShortId = req.body.preferredShortId;
        const baseUrl = 'http://shorteningurl.sunil.ai/';

        // Check if longUrl already exists, regardless of preferredShortId
        const urlExists = await pool2.query('SELECT * FROM urls_sunil WHERE longurl=$1', [longUrl]);
        if (longUrl == null || longUrl.trim() === '') {
            return res.status(400).send('Please provide a valid URL');
        } else if (urlExists.rows.length > 0) {
            return res.status(400).send('URL already exists');
        }

        // Handling Preferred Short ID
        if (preferredShortId) {
            const fullShortUrl = baseUrl + preferredShortId;
            const existingShortUrl = await pool2.query('SELECT * FROM urls_sunil WHERE shorturl=$1', [fullShortUrl]);

            if (existingShortUrl.rows.length > 0) {
                return res.status(400).send('Short ID already taken');
            }

            await pool3.query(
                'INSERT INTO urls_sunil (longurl, shorturl) VALUES ($1, $2)',
                [longUrl, fullShortUrl]
            );
            res.status(201).send(fullShortUrl);
        } else {
            // Default URL Shortening with a temporary unique identifier
            const tempShortUrl = 'temp-' + Date.now();
            await pool3.query(
                'INSERT INTO urls_sunil (longurl, shorturl) VALUES ($1, $2)',
                [longUrl, tempShortUrl]
            );

            const insertedRow = await pool2.query(
                'SELECT id FROM urls_sunil WHERE longurl = $1', [longUrl]
            );
            const shortUrlId = insertedRow.rows[0].id.toString().substring(0, 10);
            const newShortUrl = baseUrl + shortUrlId;

            await pool2.query(
                'UPDATE urls_sunil SET shorturl = $1 WHERE longurl = $2',
                [newShortUrl, longUrl]
            );

            res.status(201).send(newShortUrl);
        }

        // User and URL Association
        const fetchedUserId = await pool4.query(
            'SELECT id FROM users_sunil WHERE email = $1',
            [email]
        );
        const userId = fetchedUserId.rows[0].id;
        const finalShortUrl = preferredShortId ? baseUrl + preferredShortId : newShortUrl;
        
        await pool4.query(
            'INSERT INTO user_urls_sunil (userid, userurl) VALUES ($1, $2)',
            [userId, finalShortUrl]
        );

        // Updating User's Tier Count
        await pool4.query(
            'UPDATE users_sunil SET tier_count = tier_count - 1 WHERE email = $1', [email]
        );

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});





// The object below has the postgres test DB credentials / configurations. Port : 5432, name : test, user : postgres.
const dbConfig4 = {
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "test123",
    database: "test"
};
const pool4 = new Pool(dbConfig4);

// Endpoint to redirect
app.get('/:shortId', async (req, res) => {
    try {
        let fullUrl = "http://shorteningurl.sunil.ai/" + req.params.shortId
        //console.log(fullUrl)
        const result = await pool4.query(
            'SELECT longurl FROM urls_sunil WHERE shorturl = $1',
            [fullUrl]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('URL not found');
        }
        const originalUrl = result.rows[0].longurl;
        console.log(originalUrl)
        res.redirect("https://" + originalUrl);
        // res.status(203).send('found');
        //res.redirect(rows[0].longurl);


    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



// The object below has the postgres test DB credentials / configurations. Port : 5432, name : test, user : postgres.
const dbConfig5 = {
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "test123",
    database: "test"
};
const pool5 = new Pool(dbConfig5);

// Endpoint to redirect
app.get('/user/getallurls', async (req, res) => {
    //CODE TO CHECK IF ONLY BASIC AUTHENTICATION IS SELECTED
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    //CODE TO CHECK ONLY AUTHENTICATION
    // Extract and decode Base64 credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    try {
        // Query user from the database
        const userResult = await pool5.query('SELECT * FROM users_sunil WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).send('Email not found');
        }

        const user = userResult.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send('Authentication failed');
        }

        // Fetching data
        console.log(userResult.rows[0].id)
        const fetchingdatafull = await pool5.query('SELECT * FROM user_urls_sunil WHERE userid=$1', [userResult.rows[0].id]);
        if (fetchingdatafull == null) {
            res.status(404).send('No urls found with the authenticated user');
        }
        
        else {
            
            console.log(fetchingdatafull.rows);
            res.status(200).send(fetchingdatafull.rows);
            
        }


    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



// Adds the Cache-control on the Header.
app.use((req, res, next) => {
    // res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'GET' && (Object.keys(req.body).length > 0 || Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0)) {

        return res.status(400).send("Bad request, you cannot use any parameters.");
        console.log("400");
    }
    next();

    // next();
});

//Starting server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});