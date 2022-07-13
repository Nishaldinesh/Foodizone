var db =require('../config/connection')
var collection= require('../config/collection')
var objectId= require('mongodb').ObjectId
var bcrypt = require ('bcrypt')
const { resolve, reject } = require('promise')
const { response } = require('../app')

module.exports={
    doSignup:(vendorDetails)=>{
        return new Promise(async(resolve,reject)=>{
            vendorDetails.Password=await bcrypt.hash(vendorDetails.Password, 10)
            db.get().collection(collection.VENDOR_COLLECTION).insertOne(vendorDetails).then((data)=>{
                resolve(data.insertedId)
            })
        })
    },
    doSignin:(vendorData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
           let vendor=await db.get().collection(collection.VENDOR_COLLECTION).findOne({Email :vendorData.Email})
           if(vendor){
            bcrypt.compare(vendorData.Password, vendor.Password).then((status)=>{
                if(status){
                    console.log("Login success vendor");
                    response.vendor= vendor
                    response.status = true
                    resolve(response)
                }else{
                    console.log("Login failed");
                    resolve({status:false})
                }
            })
           }else{
            console.log("Email not found");
            resolve({status:false})
           }
        })
    },
    getProducts:(vendorId)=>{
        try{
            return new Promise(async(resolve,reject)=>{
             let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({vendorId:(vendorId)}).toArray()
                resolve(products)
            })
        }catch(err){
            console.log(err);
        }
    },
    getProductDetails:(proId)=>{
        try{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                    resolve(product)
                })
            })
        }catch(err){
            console.log(err)
        }
    },
    editProduct:(proId, proDetails)=>{
        try{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:objectId(proId)},{
                    $set:{
                        ProductName: proDetails.ProductName,
                        Category: proDetails.Category,
                        Price: proDetails.Price,
                        Description: proDetails.Description,
                        vendorId: proDetails.vendorId,
                        ShopLocation: proDetails.ShopLocation,
                        ShopName: proDetails.ShopName
                    }
                }).then((response)=>{
                    resolve(response)
                })
            })
        }catch(err){
            console.log(err);
        }
    },
    removeProduct:(proId)=>{
        try{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((resposne)=>{
                    resolve(resposne)
                })
            })
        }catch(err){
            console.log(err);
        }
    }
}