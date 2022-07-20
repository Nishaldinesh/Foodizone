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
    addToCart:(proId,vendorId,userId)=>{
        try{
            let proObj={
                item:objectId(proId),
                quantity:1
            }
            return new Promise(async(resolve,reject)=>{
                let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                if(userCart){
                    let vendorExist=await db.get().collection(collection.CART_COLLECTION).findOne({vendor:objectId(vendorId)})
                    if(vendorExist){
                        console.log("Existing vendor");
                        let proExist=userCart.products.findIndex(product=> product.item==proId)
                        if(proExist!=-1){
                            db.get().collection(collection.CART_COLLECTION)
                            .updateOne({'products.item':objectId(proId)},
                            {
                                $inc:{'products.$.quantity':1}
                            }).then(()=>{
                                resolve()
                            })
                        } else{
                            db.get().collection(collection.CART_COLLECTION)
                            .updateOne({user:objectId(userId)},
                            {
                                $push:{products:proObj}                           
                            })
                        }
                       
                    }else{
                        console.log("new vendor coming");
                    
                        resolve({status:true})
                      
                    }
                }else{
                    let cartObj={
                        vendor:objectId(vendorId),
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
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity',
                            vendor:'$products.vendor'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
    
                        }
                    }
                ]).toArray()
                resolve(cartItems)
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
    },
    getAllVendors:(user)=>{
        try{
            return new Promise((resolve,reject)=>{
               let vendors= db.get().collection(collection.VENDOR_COLLECTION).find({}).toArray()
               resolve(vendors)
            })
        }catch(err){
            console.log(err);
        }
    },
    getVendorDetails:(vendorId)=>{
        try{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:objectId(vendorId)}).then((vendor)=>{
                    resolve(vendor)
                })
            })
        }catch(err){
            console.log(err);
        }
    },
    getVendorProducts:(vendorId)=>{
        try{
            return new Promise(async(resolve,reject)=>{
                let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({vendorId:vendorId}).toArray()
                resolve(products)
                })
        }catch(err){
            console.log(err);
        }
    },
    changeProductQuantity:(details)=>{
        try{
             details.quantity= parseInt(details.quantity)
             details.count= parseInt(details.count)
            return new Promise((resolve, reject) => {
                if(details.count == -1 && details.quantity == 1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                    {
                        $pull: {products:{item: objectId(details.product)}}
                    }).then((response)=>{
                        resolve({removeProduct:true})
                    })
                }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
                    {
                        $inc: {'products.$.quantity':details.count}
                    }).then((response)=>{
                        resolve({status:true})
                    })
                }
            })
        }catch(err){
            console.log(err);
        }
    },
    getProductTotal:(userId)=>{
        try{
            return new Promise(async(resolve,reject)=>{
               let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity',
                            vendor:'$products.vendor'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
    
                        }
                    },
                    {
                        $project:{
                            total:{$sum:{$multiply:['$quantity','$product.Price']}}
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1,total:1, product: { $arrayElemAt: ['$product', 0] }
    
                        }
                    },
                ]).toArray()
                resolve(total)
            })
        }catch(err){
            console.log(err);
        }
    },
    getTotalAmount:(userId)=>{
        try{
            return new Promise(async (resolve, reject) => {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    }, {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
    
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.Price', to: 'int' } }] } }
                        }
                    }
                ]).toArray()
    
    console.log(total[0].total);
                resolve(total[0].total)
            })
        }catch(err){
            console.log(err);
        }
    }
}