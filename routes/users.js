var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('user/home-page');
});
router.get('/user-signin',(req,res, next)=>{
  res.render('user/signin')
})
module.exports = router;
