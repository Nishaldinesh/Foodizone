var db =require('../config/connection')
var collection= require('../config/collection')
var objectId= require('mongodb').ObjectId
var bcrypt = require ('bcrypt')
const { resolve, reject } = require('promise')

module.exports={
    doSignup:(vendorDetails)=>{
        return new Promise(async(resolve,reject)=>{
            vendorDetails.Password=await bcrypt.hash(vendorDetails.Password, 10)
            db.get().collection(collection.VENDOR_COLLECTION).insertOne(vendorDetails).then((response)=>{
                console.log(response)
                resolve(response)
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
    }
}