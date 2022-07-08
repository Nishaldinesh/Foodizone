var express = require('express');
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
  res.render('user/home-page',{user});
});
router.get('/signin',(req,res, next)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/signin',{"loginErr": req.session.userLoginErr})
    req.session.userLoginErr=false
  }
  res.render('user/signin')
});
router.post('/signup',async(req, res , next)=>{
  console.log(req.body);
 let user=await userHelpers.doSignup(req.body)
  res.redirect('/')
});
router.post('/signin',(req,res, next)=>{
  console.log(req.body);
  userHelpers.dosignin(req.body).then((response)=>{
    if(response.status){
      req.session.user= response.user
      req.session.user.loggeIn=true
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
})
module.exports = router;
