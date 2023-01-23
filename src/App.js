import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid"

const PORT = 5000;
const hashIterations = 10;
const password_pattern = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/; //password with a, A, 1, @, 8-16 chars
const collections = {
  registeredUsers: "registered-users",
  userSessions: "user-sessions"
}

const server = express();
server.use(cors());
server.use(express.json());

dotenv.config();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db();
});

server.post("/", async (req, res) => {
  const { email, password } = req.body;
  const getUser = await db.collection(collections.registeredUsers).findOne({email})
  
  if (getUser && bcrypt.compareSync(password, getUser.password)){
    const token = uuid()

    await db.collection(collections.userSessions).insertOne({
      userId: getUser._id,
      token
    })

    return res.status(201).send(token);
  }else{
    return res.sendStatus("usuário não encontrado, email ou senha incorretos")
  }
});

server.get("/", async (req, res)=>{
  const {authorization} = req.headers;
  const token = authorization?.replace("Bearer ", "")
})

server.post("/cadastro", async (req, res) => {
  const userSignInValue = req.body;
  const { name, email, password } = req.body;
  

  const userSignInSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().pattern(password_pattern),
    repeat_password: joi.ref("password"),
  });

  const userSignInValidation = userSignInSchema.validate(userSignInValue);
  if (userSignInValidation.error) {
    const errors = userSignInValidation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const notValidEmail = await db.collection(collections.registeredUsers).findOne({ email: email });
  if (notValidEmail) return res.status(409).send("E-mail já registrado");

  const hashedPassword = bcrypt.hashSync(password, hashIterations);

  try {
    await db.collection(collections.registeredUsers).insertOne({
      name: name,
      email: email,
      password: hashedPassword,
    });
    return res.status(201).send("Usuário cadastrado com sucesso!");
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

server.get("/home", (req, res) => {
  const loginInfo = req.body;
});

server.post("/nova-entrada", (req, res) => {
  const { value, description } = req.body;
  const valueInSchema = joi.object({
    value: joi.number().positive().required(),
    description: joi.string().max(30).required(),
  });
  return res.status(201).send(value, description);
});
server.post("/nova-saida", (req, res) => {});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
