require('dotenv').config({ path: 'backend/.env' }); // Explicit path

console.log("Values from .env:");
console.log("Wait validation...");
if (process.env.MONGO_URI) {
    console.log("MONGO_URI found:", process.env.MONGO_URI.replace(/:.*@/, ':****@')); // Mask password
} else {
    console.log("MONGO_URI is undefined.");
}
