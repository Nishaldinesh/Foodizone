var express = require('express');
var router = express.Router();

router.get('/',(req,res, next)=>{
    res.render('vendor/signup')
});
router.get('/signin',(req,res, next)=>{
    res.render('vendor/signin')
})

module.exports =router;