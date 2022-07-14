var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers');
const vendorHelpers = require('../helpers/vendor-helpers');

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

   userHelpers.getAllProducts(user).then((products)=>{
    res.render('user/home-page',{user, user_status:true,products,cartCount});
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
router.get('/add-to-cart/:id',verifyUserLogin,(req, res, next)=>{
  console.log(req.params.id);
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/')
  })

})

router.get('/cart',verifyUserLogin,async(req,res,next)=>{
  let products= await userHelpers.getCartItems(req.session.user._id)
  console.log(products);
  res.render('user/cart',{user_status:true,products})
})
module.exports = router;
