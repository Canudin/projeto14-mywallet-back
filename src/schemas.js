import joi from "joi"

const userSignInSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().pattern(password_pattern),
  repeat_password: joi.ref("password"),
});