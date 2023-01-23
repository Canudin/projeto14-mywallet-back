import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

const PORT = 5000;
const hashIterations = 10;
const password_pattern = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/; //password with a, A, 1, @, 8-16 chars
const collections = {
  registeredUsers: "registered-users",
  usersSessions: "users-sessions",
  usersStatement: "users-statement",
};

dotenv.config();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db();
});

export async function postLogin(req, res) {
  const { email, password } = req.body;
  const getUser = await db.collection(collections.registeredUsers).findOne({ email });
  if (!getUser) return res.sendStatus(401);
  if (getUser && bcrypt.compareSync(password, getUser.password)) {
    const token = uuid();
    const firstLogin = await db
      .collection(collections.usersSessions)
      .findOne({ userId: getUser._id });
    if (firstLogin) {
      await db
        .collection(collections.usersSessions)
        .updateOne({ userId: getUser._id }, { $set: { token: token } });
    } else {
      await db.collection(collections.usersSessions).insertOne({
        userId: getUser._id,
        token,
      });
    }

    return res.status(200).send(token);
  } else {
    return res.status(401).send();
  }
}

export async function getUserInfo(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  console.log(typeof token);
  if (!token) return res.sendStatus(401);
  const userSession = await db.collection(collections.usersSessions).findOne({ token });
  console.log(userSession);
  if (!userSession) return res.sendStatus(401);

  const user = await db.collection(collections.registeredUsers).findOne({ _id: userSession.userID });

  if (user) {
    delete user.password;
    console.log(user);
    res.send(user);
  } else {
    res.sendStatus(401);
  }
}

export async function postUserRegister(req, res) {
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
}

export async function postNewDeposit(req, res) {
  const { value, description, type } = req.body;
  const valueInSchema = joi.object({
    value: joi.number().positive().required(),
    description: joi.string().max(30).required(),
    type: joi.boolean().required(),
  });

  return res.status(201).send(value, description);
}

export async function postNewWithdraw(req, res) {
  const { value, description, type } = req.body;
  const valueInSchema = joi.object({
    value: joi.number().positive().required(),
    description: joi.string().max(30).required(),
    type: joi.boolean().required(),
  });

  return res.status(201).send(value, description);
}

export async function listenServer() {
  console.log(`Servidor rodando na porta ${PORT}`);
}
