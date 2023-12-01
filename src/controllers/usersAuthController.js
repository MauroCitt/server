const User = require("../models/user.js");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const jwt_secret = process.env.JWT_SECRET;
const { v4: uuidv4 } = require('uuid');
const { sendMagicLink } = require('./emailEnvioController.js');
const init = async () => {
  fetch = (await import("node-fetch")).default;
};

init();

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
  	if (!email)
    	return res.json({ ok: false, message: "Debe llenar todos los campos" });
  	if (!validator.isEmail(email))
    	return res.json({ ok: false, message: "El email no es válido" });

  	try {
   	  const user = await User.findOne({ Email: email });
    if (!user) {

      let reg = await register(email);
      res.send({ ok: true, message: 'Tu cuenta ha sido creada, presiona el enlace en el email para ingresar' });

    } else if (!magicLink) {

      try {
        const user = await User.findOneAndUpdate(
          { Email: email },
          { MagicLink: uuidv4(), MagicLinkExpired: false },
          { returnDocument: 'after' }
        );
        await sendMagicLink(email, user.MagicLink, 'signin');
        res.send({ ok: true, message: 'Haz clic en el enlace del email para acceder' });

      } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error });
      }

    } 
    
    else if (user.MagicLink == magicLink && !user.MagicLinkExpired) {
      const token = jwt.sign(user.toJSON(), jwt_secret, { expiresIn: '5m' });
      console.log("token generado: " + token);
      console.log("hola");

      await User.findOneAndUpdate(
          { Email: email },
          { MagicLinkExpired: true }
      );

      res.json({ ok: true, message: 'Bienvenido', token, email });
    } else {
        return res.json({ ok: false, message: 'El enlace ha expirado o es incorrecto' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error });
  }
};

const verify_token = (req, res) => {
  console.log(req.headers.authorization);
  const token = req.headers.authorization;
  
  jwt.verify(token, jwt_secret, (err, succ) => {
      if (err) {
          console.log(err);
          res.json({ ok: false, message: "something went wrong" });
      } else {
          res.json({ ok: true, succ });
      }
  });
};

const verifyTokenMiddelware = (req, res, next) => {
  const token = req.headers.authorization;
  console.log(token)
  if(!token)
    return res.status(401).json({ok: false, message: 'Token no proporcionado'});

  jwt.verify(token, jwt_secret, (err, succ) => {
    if(err) return res.status(401).json({ok: false, message: 'Token no autirizado'});
  });

  req.user = succ;
  next();
}

module.exports = { login, verify_token, verifyTokenMiddelware };
