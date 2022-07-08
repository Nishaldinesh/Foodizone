var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collection');
const { response } = require('../app');
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
    }
}