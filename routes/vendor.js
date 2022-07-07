var express = require('express');
var router = express.Router();

router.get('/',(req,res, next)=>{
    res.render('vendor/vendor-dashboard')
});

module.exports =router;