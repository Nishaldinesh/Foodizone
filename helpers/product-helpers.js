var db = require('../config/connection');
var collection= require('../config/collection');
const { resolve, reject } = require('promise');
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(productDetails)=>{
        try{
        return new Promise((resolve,reject)=>{
            console.log(productDetails);
            productDetails.Price= parseFloat(productDetails.Price)
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productDetails).then((data)=>{
                console.log(data.insertedId);
                resolve(data.insertedId)
            })
        })    
    }
    catch (err) {
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