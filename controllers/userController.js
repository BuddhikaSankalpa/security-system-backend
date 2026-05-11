import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// --- REGISTRATION FUNCTION ---
export async function registerUser(req, res) {
    try {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        const phone = req.body.phone;
        const role = req.body.role;

        // 1. Validation checks
        if (firstName == null || lastName == null || email == null || password == null || phone == null) {
            res.status(400).json({ message: "All fields (Name, Email, Password, Phone) are required" });
            return;
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser != null) {
            res.status(409).json({ message: "User already exists with this email" });
            return;
        }

        // 3. Password hashing (Security)
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // 4. Create new user object
        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            phone: phone,
            role: role || "Security Officer"
        });

        // 5. Save to database
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- LOGIN FUNCTION ---
export async function loginUser(req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (email == null || password == null) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await User.findOne({ email: email });

        if (user == null) {
            res.status(403).json({ message: "User not found" });
            return;
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (isPasswordValid) {
            const token = jwt.sign(
                {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin,
                    role: user.role
                },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({ 
                message: "Login successful", 
                token: token, 
                isAdmin: user.isAdmin,
                role: user.role 
            });

        } else {
            res.status(401).json({ message: "Invalid password" });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}