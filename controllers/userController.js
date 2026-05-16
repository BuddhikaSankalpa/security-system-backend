import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// --- REGISTRATION FUNCTION ---
export async function registerUser(req, res) {
    try {
        const { firstName, lastName, email, password, phone, role } = req.body;

        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists with this email" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            role: role || "Security Officer"
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- LOGIN FUNCTION ---
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (isPasswordValid) {
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ message: "Login successful", token, isAdmin: user.isAdmin, role: user.role });
        } else {
            res.status(401).json({ message: "Invalid password" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- GET ALL ADMIN USERS (protected for legacy pages) ---
export async function getAdminUsers(req, res) {
    try {
        const admins = await User.find({ isAdmin: true }).sort({ createdAt: -1 });
        res.status(200).json(admins);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- GET ALL USERS (section to fetch all users recently added) ---
export async function getAllUsers(req, res) {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- UPDATE USER (section to edit user information) ---
export async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, role, isBlocked } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { firstName, lastName, email, phone, role, isBlocked },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- DELETE USER (section to remove a user) ---
export async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User removed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}