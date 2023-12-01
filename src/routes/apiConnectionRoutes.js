const {Router} = require('express');
const { apiConnectionController } = require('../controllers/apiConnectionController.js');
const genreConnectionController = require('../controllers/genreConnectionController.js');
const crewApiController = require('../controllers/crewApiController.js');
const auth = require('../controllers/usersAuthController.js');

const router = Router();

router.post('/login/user', auth.login);
router.get('/verify/:email/:link', auth.verify_token);

router.use(auth.verifyTokenMiddelware);

router.get('/home', (req, res) => {
    res.json({ ok: true, message: 'Welcome to the home page'});
});

router.get('/', apiConnectionController.getJsonFile);
router.get('/genres', genreConnectionController.getJsonFile);
router.get('/crew', crewApiController.getJsonFile);


module.exports = router;