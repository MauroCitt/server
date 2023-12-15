const User = require("../models/user.js");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const jwt_secret = process.env.JWT_SECRET;
const { v4: uuidv4 } = require('uuid');
const { sendMagicLink } = require('./emailEnvioController.js');

const register = async (email) => {
  try {
    const newUser = {
      Email: email,
      MagicLink: uuidv4()
    };
    let user = await User.create(newUser);
    let sendEmail = await sendMagicLink(email, user.MagicLink, 'signup');
    return { ok: true, message: "Usuario creado" };
  } catch (error) {
    console.error(error);
    return { ok: false, error };
  }
};

const login = async (req, res) => {
  const { email, magicLink } = req.body;
  console.log(email);
  if (!email) {
    console.log("Email not provided");
    return res.json({ ok: false, message: "Debe llenar todos los campos" });
  }

  if (!validator.isEmail(email)) {
    console.log("Invalid email format");
    return res.json({ ok: false, message: "El link no es válido" });
  }

  try {
    const user = await User.findOne({ Email: email });
    if (!user) {

      console.log("User not found, registering...");
      let reg = await register(email);
      res.send({ ok: true, message: 'Tu cuenta ha sido creada, presiona el enlace en el email para ingresar' });
    
    } else if (!magicLink) {
      console.log("MagicLink not provided, updating...");
      try {
        const updatedUser = await User.findOneAndUpdate(
          { Email: email },
          { MagicLink: uuidv4(), MagicLinkExpired: false },
          { returnDocument: 'after' }
        );
        sendMagicLink(email, updatedUser.MagicLink);
        res.send({ ok: true, message: 'Haz clic en el enlace del email para acceder' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error });
      }
    
    } else if (user.MagicLink == magicLink && !user.MagicLinkExpired) {
      console.log("Generating token...");
      const token = jwt.sign(user.toJSON(), jwt_secret, { expiresIn: "1h" });
      await User.findOneAndUpdate(
        { Email: email },
        { MagicLinkExpired: true }
      );
      res.json({ ok: true, message: "Bienvenido de vuelta", token, email });
    } else {
      console.log("Invalid magicLink or expired");
      return res.json({ ok: false, message: "El enlace ha expirado o es incorrecto" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error });
  }
};


const verify_token = (req, res) => {
	const token = req.headers.authorization;
	jwt.verify(token, jwt_secret, (err, succ) => {
		err
		? res.json({ ok: false, message: "something went wrong" })
		: res.json({ ok: true, succ });
	});
};

module.exports = { login, verify_token };
