import express from "express"
import axios from "axios"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

const PORT = 5000

const server = express()
server.use(cors());
server.use(express.json());

dotenv.config();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

server.post("/", (req, res) => {
  console.log(req.body)
})

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

