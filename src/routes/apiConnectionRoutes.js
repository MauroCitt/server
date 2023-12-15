const { Router } = require('express');
const { apiConnectionController } = require('../controllers/apiConnectionController.js');
const genreConnectionController = require('../controllers/genreConnectionController.js');
const crewApiController = require('../controllers/crewApiController.js');
const auth = require('../controllers/usersAuthController.js');
const { render } = require('../server.js');

const router = Router();

// router.get('/login', function(req, res, next) {
//     res.render('index', { error: false });
// });

router.post('/login/user', auth.login);
router.get('/verify', auth.verify_token); 

router.get('/', (req, res) => {
    res.render('home');
});
router.get('/movies', apiConnectionController.getJsonFile);
router.get('/genres', genreConnectionController.getJsonFile);
router.get('/crew', crewApiController.getJsonFile);

module.exports = router;
