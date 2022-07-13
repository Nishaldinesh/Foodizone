var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')

const verifyUserLogin= (req,res, next) =>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/signin')
  }
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  let user=req.session.user
   userHelpers.getAllProducts(user).then((products)=>{
    res.render('user/home-page',{user, user_status:true,products});
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
router.get('/cart',(req,res, next)=>{
  userHelpers.getCartProducts()
})
module.exports = router;
