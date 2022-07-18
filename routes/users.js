var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers');
const vendorHelpers = require('../helpers/vendor-helpers');
var productHelpers = require('../helpers/product-helpers');

const verifyUserLogin= (req,res, next) =>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/signin')
  }
}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
   userHelpers.getAllVendors(user).then((vendors)=>{
    res.render('user/home-page',{user, user_status:true,vendors,cartCount});
   })
  
});
router.get('/signin',(req,res, next)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/signin',{"loginErr": req.session.userLoginErr,user_status:true})
    req.session.userLoginErr=false
  }
});
router.post('/signup',(req, res , next)=>{
  console.log(req.body);
  userHelpers.doSignup(req.body).then((response)=>{
    res.redirect('/')
 })
  
});
router.post('/signin',(req,res, next)=>{
  console.log(req.body);
  userHelpers.dosignin(req.body).then((response)=>{
    if(response.status){
      console.log("Login success");
      req.session.user= response.user
      req.session.user.loggedIn=true
        res.redirect('/')
    }else{
      req.session.userLoginErr= "Invalid email or password"
      res.redirect('/signin')
    }
  })
});
router.get('/logout',(req,res, next)=>{
  req.session.user= null
  res.redirect('/')
});
router.post('/add-to-cart',verifyUserLogin,(req, res, next)=>{
  console.log(req.body);
  console.log("api call");
  let productId=req.body.proId
  let vendorId=req.body.vendorId
  userHelpers.addToCart(productId,vendorId,req.session.user._id).then(()=>{
    res.json({status:true})

  })

})

router.get('/cart',verifyUserLogin,async(req,res,next)=>{
  let products= await userHelpers.getCartItems(req.session.user._id)
  console.log(products);
  let user= req.session.user._id
  res.render('user/cart',{user_status:true,products, user})
});
router.get('/get-vendor-details/:id',verifyUserLogin ,async(req,res, next)=>{
  let vendorId= req.params.id
  cartCount=null
  if(req.session.user){
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let cartItems= await userHelpers.getCartItems(req.session.user._id)
  let vendorDetails= await userHelpers.getVendorDetails(vendorId)
  let vendorProducts= await userHelpers.getVendorProducts(vendorId)
  let user= req.session.user._id
  res.render('user/vendor-details',{user_status:true, vendorDetails, vendorProducts, cartCount, cartItems, user})
});
router.post('/change-product-quantity',(req,res, next)=>{
  console.log("call")
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    res.json(response)
  })
})

module.exports = router;
