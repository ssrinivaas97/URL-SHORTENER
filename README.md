# URL-SHORTENER

## Key Endpoints

## 1. User Creation (/createuser)

Method: POST
Description: Registers a new user with a username, password, email, and tier level.
Required Fields: username, password, email, tier_level
Special Notes:
Passwords are securely hashed using bcrypt.
Email must be from the domain northeastern.edu.
Tier levels allowed are 'tier 1', 'tier 2', 'tier free'.

## 2. URL Shortening (/submiturl)

Method: POST
Description: Shortens a provided URL. Users can optionally specify a preferred short ID.
Required Fields: longUrl, preferredShortId (optional)
Authentication: Requires Basic Authentication.
Special Notes:
Checks for existing long URLs to prevent duplication.
Generates a unique short URL if no preferred ID is provided.

## 3. URL Redirection (/:shortId)
Method: GET
Description: Redirects to the original URL based on the provided short ID.
Parameters: shortId - The short ID of the URL.
Special Notes: Returns a 404 error if the URL is not found.

## 4. Fetch User URLs (/user/getallurls)
Method: GET
Description: Retrieves all URLs associated with the authenticated user.
Authentication: Requires Basic Authentication.
Special Notes:
Returns a list of URLs.
Indicates if no URLs are found for the user.


## Tech Stack

Utilizes PostgreSQL for data storage and Node js for event driven and scalable code.


## General Notes

All endpoints respond with appropriate HTTP status codes and messages for success or error scenarios.

Implements basic authentication and input validation.
