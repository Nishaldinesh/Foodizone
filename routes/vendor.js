var express = require('express');
const { response } = require('../app');
var router = express.Router();
var vendorHelpers= require('../helpers/vendor-helpers')
var productHelpers= require('../helpers/product-helpers');
const { ConnectionPoolClosedEvent } = require('mongodb');
const verifyVendorLogin=(req, res, next)=>{
    if(req.session.vendor){
        next()
    }else{
        res.render('vendor/signin')
    }
}

router.get('/',(req,res, next)=>{
    res.render('vendor/signin',{user_status:true})
});
router.get('/signup',(req,res, next)=>{
    res.render('vendor/signup',{user_status:true});
});
router.get('/signin',(req,res, next)=>{
    if(req.session.vendor){
        res.redirect('/vendor')
    }else{
        res.render('vendor/signin',{"loginErr":req.session.vendorLoginErr,user_status:true})
        req.session.vendorLoginErr= false
    }
});
router.post('/signup',(req,res, next)=>{
    console.log(req.body);
    vendorHelpers.doSignup(req.body).then((id)=>{
        console.log(id);
        let image= req.files.Image
        image.mv('./public/shop-images/' +id + '.jpg',(err,done)=>{
            if(!err){
                res.redirect('/vendor')
            }else{
                console.log(err);
            }
        })
    })
    
});
router.post('/signin',(req,res, next)=>{
    console.log(req.body);
    vendorHelpers.doSignin(req.body).then((response)=>{
        if(response.status){
            req.session.vendor = response.vendor
            req.session.vendor.loggedIn= true
            res.render('vendor/vendor-dashboard',{vendor_status:true ,vendor: req.session.vendor})
        }else{
            console.log("Login failed")
            req.session.vendorLoginErr= "Invalid email or password"
            res.redirect('/vendor/signin')
            
        }
    })
});
router.get('/dashboard',(req,res, next)=>{
    res.render('vendor/vendor-dashboard',{vendor_status:true})
})

router.get('/logout',(req,res, next)=>{
    req.session.vendor= null
    res.redirect('/')
});
router.get('/view-products',verifyVendorLogin,(req,res, next)=>{
    let vendor=req.session.vendor._id
    console.log(vendor);
    vendorHelpers.getProducts(vendor).then((products)=>{
        res.render('vendor/view-products',{vendor_status:true,products})
    })
   
});
router.get('/add-products',verifyVendorLogin,(req, res, next)=>{
    res.render('vendor/add-products',{vendor_status:true,vendor:req.session.vendor})
});
router.post('/add-products',(req,res,next)=>{
    console.log(req.body);
  productHelpers.addProduct(req.body).then((id)=>{
    let image=req.files.Image
    console.log(id);
    image.mv('./public/product-images/' +id + '.jpg',(err,done)=>{
        if(!err){
            res.redirect('/vendor/add-products')
        }else{
            console.log(err);
        }
    })
  })
})

module.exports =router;