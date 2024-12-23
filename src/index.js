import express from "express";
import path, { normalize } from "path";
import bcrypt from "bcrypt";
import session from "express-session";
import mongoose from "mongoose";
import collection from "./config.js"; 
import { createServer } from 'http'; // Import HTTP server
import { fileURLToPath } from 'url';


// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = 2400;
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
}));


app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourdbname', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Routes
app.get("/", (req, res) => {
    res.render("Home");
});

app.get("/help", (req, res) => {
    res.render("help");
}); 

app.get("/home", (req, res) => {
    res.render("home");
});  

app.get("/about", (req, res) => {
    res.render("about");
});


app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/profile", async (req, res) => {
    const username = req.session.username; // Get username from session
    
    if (!username) {
        return res.redirect("/login"); // Redirect if not logged in
    }
    
    try {
        const userProfile = await collection.findOne({ Name: username });
        
        if (!userProfile) {
            return res.status(404).send("User not found.");
        }
        
        // Determine if the profile being viewed is the user's own profile
        const isOwnProfile = userProfile.Name === username;

        // Render profile view with user data and isOwnProfile flag
        res.render("profile", { userProfile, isOwnProfile });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving profile.");
    }
});


// Signup route
app.post("/signup", async (req, res) => {
    const { username, password, role, organization, email, age, contact_no, experience, status} = req.body;

    // Validate incoming data
    if (!username || !password || !role || !organization || !email || !experience || !contact_no || !status) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const data = {
        Name: username,
        Password: password,
        Role: role,
        Organization: organization,
        Email: email,
        Age: age,
        Contact : contact_no,
        Experience: experience,
        Status: status
    };

    try {
        const existingUser = await collection.findOne({ Name: username });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists. Please choose a different username." });
        }

        const saltRounds = 10; // Define salt rounds here
        const hashedPassword = await bcrypt.hash(password, saltRounds); // Hashing the password

        data.Password = hashedPassword;

        const userdata = await collection.create(data);
        console.log(userdata);
        return res.redirect("/login");
        
        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while creating the user." });
    }
});

// Login route
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ Name: req.body.username });
        if (!check) {
            return res.status(404).send("Username not found.");
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.Password);
        
        if (isPasswordMatch) {
            req.session.username = check.Name; // Store username in session
            res.redirect("/profile"); // Redirect to profile page on successful login
        } else {
            res.status(401).send("Wrong Password");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while logging in.");
    }
});

// Search route
app.get("/search", async (req, res) => {
    const query = req.query.query; // Get the search query from the URL

    if (!query) {
        return res.status(400).send("Query is required.");
    }

    try {
        const results = await collection.find({
            Name: { $regex: new RegExp(query, 'i') } // Case-insensitive regex search
        });

        const resultsWithLinks = results.map(user => ({
            name: user.Name,
            role: user.Role,
            profileLink: `/profile/${user._id}` // Assuming you have a route for user profiles
        }));

        res.render("search-results", { results: resultsWithLinks, query }); // Render results on a new page
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while searching.");
    }
});

// Profile route with ID parameter
app.get("/profile/:id", async (req, res) => {
    const userId = req.params.id; 
    const loggedInUserId = req.session.userId;

    try {
        const userProfile = await collection.findById(userId);
        
        if (!userProfile) {
            return res.status(404).send("User not found.");
        }

        const isOwnProfile = loggedInUserId && loggedInUserId.toString() === userProfile._id.toString();

        res.render("profile", { userProfile, isOwnProfile });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving profile.");
    }
});

// Update profile route
app.post("/profile/update", async (req, res) => {
    const { age, contact_no, organization, experience , status} = req.body;
    
    const username = req.session.username;

    try {
        await collection.findOneAndUpdate(
            { Name: username },
            { Age: age },
            { Contact: contact_no },
            { Organization: organization },
            { Experience: experience },
            { Status: status},
            { new: true }
        );
        
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating profile.");
    }
});

// Connect route
app.get("/connect/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const userProfile = await collection.findById(userId); // Fetch user details

        if (!userProfile) {
            return res.status(404).send("User not found.");
        }

        res.render("connect", { userProfile }); // Render connect view with user data
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving user profile.");
    }
});


// Start server with Socket.IO
server.listen(port, () => {
   console.log(`Server running on port: ${port}`);
});



