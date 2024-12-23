
const mongoose = require("mongoose");

// Connect to MongoDB
const connect = mongoose.connect("mongodb://0.0.0.0:27017/login-tut", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connect.then(() => {
    console.log("Database connected successfully");
})
.catch((err) => { // Correctly capture the error
    console.error("Database can't be connected:", err.message);
});

// Define the Login Schema
const LoginSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Role: {
        type: String,
        required: true
    },
    Organization: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true,
        unique: true // Optional: ensures that emails are unique
    },
    Experience: {
        type: String,
        required: true
    },
    Age: {
        type: String,
        required: true
    },
    Contact: {
        type: String,
        required: true
    },
    Status:{
        type: String,
        required:true
    }
});

// Create the model from the schema
const User = mongoose.model("users", LoginSchema);

// Export the model
module.exports = User;


