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

    }
}