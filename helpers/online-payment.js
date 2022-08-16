var db=require('../config/connection')
var objectId = require('mongodb').ObjectId
const { Db } = require('mongodb');
const Razorpay = require('razorpay');
const collection = require('../config/collection');

var instance = new Razorpay({
    key_id: 'rzp_test_Kts2ch8LMAIJM8',
    key_secret: 'Ilkw3kF3Sb07S2VRLu4EOObn',
});
module.exports = {
generateRazorPay: (orderId,total) => {
        try {
            return new Promise((resolve, reject) => {

                var options = {
                    amount: total*100,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: ""+orderId
                };
                instance.orders.create(options, function (err, order) {
                    if(err){
                        console.log(err);
                    }else{
                        order.razorpay_status=true
                    console.log("New Order :",order);
                    
                    resolve(order)
                    }
                });
            })
        } catch (err) {
            console.log(err);
        }
    },
    verifyPayment:(details)=>{
        try{
            return new Promise((resolve, reject) => {
                const crypto=require('crypto');
                let hmac = crypto.createHmac('sha256', 'Ilkw3kF3Sb07S2VRLu4EOObn');

                hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
                hmac=hmac.digest('hex')
                if(hmac=details['payment[razorpay_signature]']){
                    resolve()
                }else{
                    reject()
                }
               
            })
        }catch(err){
            console.log(err);
        }
    },
    changePaymentStatus:(orderId,userId)=>{
        try{
            console.log(orderId);
            return new Promise((resolve, reject) => {
                db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status:"Order confirmed"
                    }
                }
                ).then(()=>{
                    db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(userId)})
                    resolve()
                })
            })
        }catch(err){
            console.log(err);
        }
    }
}