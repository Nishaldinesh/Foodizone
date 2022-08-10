var express = require('express');
const { Db } = require('mongodb');
const { response, render } = require('../app');
const router = express.Router();
var userHelpers = require('../helpers/user-helpers');
const vendorHelpers = require('../helpers/vendor-helpers');
var productHelpers = require('../helpers/product-helpers');
const { getTotalAmount } = require('../helpers/user-helpers');
const { Router } = require('express');

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
  let user = req.session.user._id
  let vendorDetails = await userHelpers.getVendorDetails(cartVendorId)
  let homeAddress= await userHelpers.getHomeAddress(user)
  let workAddress= await userHelpers.getWorkAddress(user)
 
  res.render('user/cart', { user_status: true, cartItems, user, totalAmount, cartVendorId, cartEmpty, vendorDetails,homeAddress,workAddress })
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
router.get('/checkout/:id', verifyUserLogin, async (req, res, next) => {
  let cartItems = await userHelpers.getCartItems(req.session.user._id)
  console.log(req.params.id);
  let vendorId = req.params.id
  console.log(vendorId);
  let vendorDetails = await userHelpers.getVendorDetails(vendorId)
  let vendor = cartItems.vendor
  let totalAmount = 0
  if (cartItems.length > 0) {
    totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }
  res.render('user/checkout', { cartItems, vendorDetails, vendor, totalAmount, user: req.session.user._id })
});

router.post('/add-address', (req, res, next) => {
  console.log(req.body);
  userHelpers.addAddress(req.body).then((response) => {
    res.json(response)
  })
})


router.post('/place-order', async (req, res, next) => {
  console.log(req.body);
  let products = await userHelpers.getCartProductList(req.body.UserId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.UserId)
  if(req.body['AddressType']==='Home'){
    console.log(("Working"));
    var userAddress= await userHelpers.getHomeAddress(req.body.UserId)
  }else if(req.body['AddressType']==='Work'){
     var userAddress= await userHelpers.getWorkAddress(req.body.UserId)
  }
  console.log(userAddress);
  userHelpers.placeOrder(req.body, products, totalPrice,userAddress).then((orderId) => {
    if (req.body['Payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['Payment-method'] === 'Razorpay') {
      userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })
});
router.get('/order-success', (req, res, next) => {
  res.render('user/order-success', { user_status: true })
});
router.get('/orders', verifyUserLogin, async (req, res, next) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  console.log(orders);
  res.render('user/view-orders', { user_status: true, orders })
})

module.exports = router;
