import express from "express";
import cors from "cors";
import {
  postLogin,
  postNewWithdraw,
  postNewDeposit,
  postUserRegister,
  listenServer,
  getUserInfo,
} from "./responses.js";

const PORT = 5000;
const server = express();
server.use(cors());
server.use(express.json());

server.post("/", postLogin);

server.post("/cadastro", postUserRegister);

server.get("/home", getUserInfo);

server.post("/nova-entrada", postNewDeposit);

server.post("/nova-saida", postNewWithdraw);

server.listen(PORT, listenServer);
