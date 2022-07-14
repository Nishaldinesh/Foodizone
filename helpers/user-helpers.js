var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const { resolve, reject } = require('promise');
const { ObjectID, ObjectId } = require('bson');
var objectId=require('mongodb').ObjectId

module.exports ={
    doSignup:(userDetails)=>{
        return new Promise(async(resolve,reject)=>{
            userDetails.Password=await bcrypt.hash(userDetails.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userDetails).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    dosignin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
           let response = {}
          let user=await  db.get().collection(collection.USER_COLLECTION).findOne({Email : userData.Email})
          if(user){
           bcrypt.compare(userData.Password, user.Password).then((status)=>{
            if(status){
                console.log("Login success");
                response.user= user
                response.status= true
                resolve(response)
            }else{
                console.log("Login failed")
                resolve({status: false})
            }
           })
          }else{
            console.log("Email not valid");
            resolve({status: false})
          }
        })
    },
    getAllProducts:(user)=>{
        try{
            return new Promise (async(resolve,reject)=>{
              let products=await  db.get().collection(collection.PRODUCT_COLLECTION).find({}).toArray()
              console.log(products);
              resolve(products)
            })
        }catch(err){
            console.log(err);
    }
    },
    addToCart:(proId,userId)=>{
        try{
            let proObj={
                item:objectId(proId),
                quantity:1
            }
            return new Promise(async(resolve,reject)=>{
                let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                if(userCart){
                    let proExist=userCart.products.findIndex(product=> product.item==proId)
                    console.log(proExist);
                    if(proExist!=-1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({'products.item':objectId(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }).then(()=>{
                            resolve()
                        })
                    }else{
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId)},
                        {
                            $push:{products:proObj}                           
                        })
                    }
                   
                }else{
                    let cartObj={
                        user:objectId(userId),
                        products:[proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                        resolve(response)
                    })
                }
            })
        }catch(err){
            console.log(err);
        }
    },
    getCartItems:(userId)=>{
        try{
            return new Promise(async(resolve,reject)=>{
                let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $lookup:{
                            from: collection.PRODUCT_COLLECTION,
                            let:{proList:'$products'},
                            pipeline:[
                                {
                                    $match:{
                                        $expr:{
                                            $in:['$_id',"$$proList"]
                                        }
                                    }
                                }
                            ],
                            as:'cartItems'
                        }
                    }
                ]).toArray()
                resolve(cartItems[0].cartItems)
            })
        }catch(err){
            console.log(err)
        }
    },
    getCartCount:(userId)=>{
        try{
            return new Promise(async(resolve,reject)=>{
                let count=0
                let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                if(cart){
                    count=cart.products.length
                }
                resolve(count)
            })
        }catch(err){
            console.log(err);
        }
    }
}