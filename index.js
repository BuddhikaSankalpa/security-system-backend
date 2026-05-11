import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'
import userRoutes from './routes/userRoutes.js';

dotenv.config()

const mongoDBURI = process.env.MONGODB_URI

connectDB() //connect to mongodb database

const app = express()

app.use( express.json() )
app.use( cors() )

app.use( '/api/users', userRoutes )


const PORT = process.env.PORT
app.listen(
    PORT,
    ()=>{
        console.log('Server started successfully')
        console.log(`Listening on port ${PORT}`)
    }
)
