var db = require('../config/connection');
var collection= require('../config/collection');
const { resolve, reject } = require('promise');
const cookieParser = require('cookie-parser');
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
    },
    storeCategory:(vendorId,Productcategory)=>{
        try{
            return new Promise(async(resolve,reject)=>{
                let catObj={
                    category: Productcategory
                }
                let catCollection=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({vendorId:objectId(vendorId)})
                if(catCollection){
                    let catExist=catCollection.category.findIndex(category=> category.category==Productcategory)
                    console.log(catExist);
                    if(catExist!=-1){
                        console.log("Category already exist");
                    }else{
                    console.log('working')
                    db.get().collection(collection.CATEGORY_COLLECTION)
                    .updateOne({vendorId:objectId(vendorId)},
                    {
                        $push:{category:catObj}
                    })
                }
                }else{
                    let catObject={
                        vendorId:objectId(vendorId),
                        category:[catObj]
                    }
                    db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catObject).then((response)=>{
                        console.log(response);
                        resolve(response)
                    })
                }
            })

        }catch(err){
            console.log(err);
        }
    }
    
}