var express = require('express');
const { response } = require('../app');
var router = express.Router();
var vendorHelpers= require('../helpers/vendor-helpers')
const verifyVendorLogin=(req, res, next)=>{
    if(req.session.vendor){
        next()
    }else{
        res.render('vendor/vendor-dashboard')
    }
}

router.get('/',(req,res, next)=>{
    res.render('vendor/signin')
});
router.get('/signup',(req,res, next)=>{
    res.render('vendor/signup');
})
router.get('/signin',(req,res, next)=>{
    if(req.session.vendor){
        res.redirect('/vendor')
    }else{
        res.render('vendor/signin',{"loginErr":req.session.vendorLoginErr})
        req.session.vendorLoginErr= false
    }
});
router.post('/signup',(req,res, next)=>{
    console.log(req.body);
    vendorHelpers.doSignup(req.body).then((response)=>{
        res.redirect('/vendor')
    })
    
});
router.post('/signin',(req,res, next)=>{
    console.log(req.body);
    vendorHelpers.doSignin(req.body).then((response)=>{
        if(response.status){
            req.session.vendor = response.vendor
            req.session.vendor.loggedIn= true
            res.render('vendor/vendor-dashboard',{vendor_status:true})
        }else{
            console.log("Login failed")
            req.session.vendorLoginErr= "Invalid email or password"
            res.redirect('/vendor/signin')
            
        }
    })
});
router.get('/logout',(req,res, next)=>{
    req.session.vendor= null
    res.redirect('/vendor')
})

module.exports =router;