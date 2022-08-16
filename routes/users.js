var express = require('express');
const { Db } = require('mongodb');
const { response, render } = require('../app');
const router = express.Router();
var userHelpers = require('../helpers/user-helpers');
var onlinePaymentHelpers =require('../helpers/online-payment');
const vendorHelpers = require('../helpers/vendor-helpers');
var productHelpers = require('../helpers/product-helpers');
const { getTotalAmount } = require('../helpers/user-helpers');
const { Router } = require('express');
const { route } = require('./admin');

const verifyUserLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/signin')
  }
}

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  console.log(cartCount);
  userHelpers.getAllVendors(user).then((vendors) => {
    res.render('user/home-page', { user, user_status: true, vendors, cartCount });
  })

});
router.get('/signin', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/signin', { "loginErr": req.session.userLoginErr, user_status: true })
    req.session.userLoginErr = false
  }
});
router.post('/signup', (req, res, next) => {
  console.log(req.body);
  userHelpers.doSignup(req.body).then((response) => {
    res.redirect('/')
  })

});
router.post('/signin', (req, res, next) => {
  console.log(req.body);
  userHelpers.dosignin(req.body).then((response) => {
    if (response.status) {
      console.log("Login success");
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid email or password"
      res.redirect('/signin')
    }
  })
});
router.get('/logout', (req, res, next) => {
  req.session.user = null
  res.redirect('/')
});
router.post('/add-to-cart', verifyUserLogin, (req, res, next) => {
  console.log(req.body);
  console.log("api call");
  let productId = req.body.proId
  let vendorId = req.body.vendorId
  userHelpers.addToCart(productId, vendorId, req.session.user._id).then((response) => {
    if (response.VendorExist_status) {
      res.json({ VendorExist_status: true })
    } else {
      res.json({ status: true })
    }

  })

})

router.get('/cart', verifyUserLogin, async (req, res, next) => {
  let cartItems = await userHelpers.getCartItems(req.session.user._id)
  console.log(cartItems);
  // let total=await userHelpers.getProductTotal(req.session.user._id)
  let totalAmount = 0
  let cartVendorId = 0
  let cartEmpty = 0
  if (cartItems.length > 0) {
    totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
    cartVendorId = cartItems[0].vendor
  } else {
    cartEmpty = true
  }
  let userId = req.session.user._id
  let user = req.session.user
  let vendorDetails = await userHelpers.getVendorDetails(cartVendorId)
  // let homeAddress = await userHelpers.getHomeAddress(userId)
  // let workAddress = await userHelpers.getWorkAddress(userId)
  let userAddress=await userHelpers.getUserAddress(userId)
  console.log(userAddress);
  res.render('user/cart', { user_status: true, cartItems, userId, user, totalAmount, cartVendorId, cartEmpty, vendorDetails,userAddress})
  cartEmpty = false;
});
router.get('/get-vendor-details/:id', verifyUserLogin, async (req, res, next) => {
  let vendorId = req.params.id
  cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let total = await userHelpers.getProductTotal(req.session.user._id)
  let cartItems = await userHelpers.getCartItems(req.session.user._id)
  let totalAmount = 0
  if (cartItems.length > 0) {
    totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }
  let vendorDetails = await userHelpers.getVendorDetails(vendorId)
  let vendorProducts = await userHelpers.getVendorProducts(vendorId)
  let cartVendorId = 0
  if (cartItems.length > 0) {
    cartVendorId = cartItems[0].vendor
  }
  console.log(vendorProducts);
  let user = req.session.user
  let userId = req.session.user._id
  res.render('user/vendor-details', { user_status: true, vendorDetails, vendorProducts, cartCount, cartItems, userId, user, total, cartVendorId, totalAmount })
});
router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.session.user._id)
    console.log(response.total);
    res.json(response)
  })
});
// router.get('/checkout/:id', verifyUserLogin, async (req, res, next) => {
//   let cartItems = await userHelpers.getCartItems(req.session.user._id)
//   console.log(req.params.id);
//   let vendorId = req.params.id
//   console.log(vendorId);
//   let vendorDetails = await userHelpers.getVendorDetails(vendorId)
//   let vendor = cartItems.vendor
//   let totalAmount = 0
//   if (cartItems.length > 0) {
//     totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
//   }
//   res.render('user/checkout', { cartItems, vendorDetails, vendor, totalAmount, user: req.session.user._id })
// });

router.post('/edit-address', (req, res, next) => {
  console.log(req.body);
  userHelpers.addAddress(req.body).then((response) => {
    res.json(response)
  })
});
router.post('/delete-address',(req,res,next)=>{
  console.log(req.body);
  userHelpers.deleteAddress(req.body).then((response)=>{
    res.json(response)
  })
})


router.post('/place-order', async (req, res, next) => {
  console.log(req.body);
  let cart = await userHelpers.getCartProductList(req.body.userId);
  let cartVendorId = cart.vendor
  let cartProducts = cart.products
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  let addressType= req.body['addressType'];
  let userAddress=await userHelpers.getPlacedAddress(req.body.userId,addressType)
  console.log(userAddress);
  userHelpers.placeOrder(req.body, cartProducts, cartVendorId, totalPrice, userAddress).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if(req.body['payment-method'] === 'Online') {
      onlinePaymentHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  }).catch((err)=>{
    console.log(err);
    res.json({err:true})
  })
});
router.get('/order-success', (req, res, next) => {
  res.render('user/order-success', { user_status: true })
});
router.get('/profile', verifyUserLogin, async (req, res, next) => {
  let userId = req.session.user._id
  let user=req.session.user
  let orders = await userHelpers.getUserOrders(userId)
  console.log((orders));
  let userAddress= await userHelpers.getUserAddress(userId)
  // let orderProducts= await userHelpers.getOrderProducts(user)
  res.render('user/view-profile', { user_status: true,userId,user, orders,userAddress})
});
router.get('/view-order-details/:id', async (req, res, next) => {
  console.log(req.params.id)
  let orderId=req.params.id
 
  console.log(products);
  res.render('user/view-order-products')
});
router.post('/verify-payment',(req,res,next)=>{
  console.log(req.body);
  onlinePaymentHelpers.verifyPayment(req.body).then(()=>{
    onlinePaymentHelpers.changePaymentStatus(req.body['order[receipt]'],req.session.user._id).then(()=>{
      console.log("Payment success");
      res.json({status:true})
    })
   
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:'Payment failed'})
  })
  

})

module.exports = router;
