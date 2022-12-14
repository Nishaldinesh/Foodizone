var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt');
const { USER_COLLECTION, VENDOR_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const { resolve, reject } = require('promise');
const { ObjectID, ObjectId } = require('bson');
var objectId = require('mongodb').ObjectId

module.exports = {
    doSignup: (userDetails) => {
        return new Promise(async (resolve, reject) => {
            userDetails.Password = await bcrypt.hash(userDetails.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userDetails).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    },
    dosignin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("Login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Login failed")
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("Email not valid");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, vendorId, userId) => {
        try {
            let proObj = {
                item: objectId(proId),
                quantity: 1
            }
            return new Promise(async (resolve, reject) => {
                let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (userCart) {
                    let vendorExist = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId), vendor: objectId(vendorId) })
                    if (vendorExist) {
                        console.log("Existing vendor");
                        let proExist = userCart.products.findIndex(product => product.item == proId)
                        if (proExist != -1) {
                            db.get().collection(collection.CART_COLLECTION)
                                .updateOne({ 'products.item': objectId(proId) },
                                    {
                                        $inc: { 'products.$.quantity': 1 }
                                    }).then(() => {
                                        resolve({ VendorExist_status: false })
                                    })
                        } else {
                            db.get().collection(collection.CART_COLLECTION)
                                .updateOne({ user: objectId(userId) },
                                    {
                                        $push: { products: proObj }
                                    }).then(() => {
                                        resolve({ VendorExist_status: false })
                                    })
                        }

                    } else {

                        if (userCart.products.length == 0) {
                            console.log("Cart has to be deleted");
                            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then((response) => {
                                let cartObj = {
                                    vendor: objectId(vendorId),
                                    user: objectId(userId),
                                    products: [proObj]
                                }
                                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                                    resolve(response)
                                    resolve(response)
                                })
                            })
                        } else {
                            console.log("New vendor coming");
                            resolve({ VendorExist_status: true })
                        }


                    }
                } else {
                    let cartObj = {
                        vendor: objectId(vendorId),
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve(response)
                    })
                }
            })
        } catch (err) {
            console.log(err);
        }
    },
    getCartItems: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            vendor: '$vendor'
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
                            item: 1, quantity: 1, vendor: 1, product: { $arrayElemAt: ['$product', 0] }

                        }
                    }
                ]).toArray()
                console.log(cartItems);
                resolve(cartItems)
            })
        } catch (err) {
            console.log(err)
        }
    },
    getUserAddress: (userId) => {
        try{
            return new Promise(async(resolve, reject) => {
                let address=await db.get().collection(collection.ADDRESS_COLLECTION).find({user:objectId(userId)} ).toArray()
                resolve(address)
            })
        }catch(err){
            console.log(err);
        }
    },
    getPlacedAddress:(userId,addressType)=>{
        try{
            return new Promise(async(resolve, reject) => {
                let address=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({user:objectId(userId),addressType:addressType}) 
                resolve(address)
            })
        }catch(err){
            console.log(err);
        }
    },

    getCartCount: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let count = 0
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (cart) {
                    count = cart.products.length
                }
                resolve(count)
            })
        } catch (err) {
            console.log(err);
        }
    },
    getAllVendors: (user) => {
        try {
            return new Promise((resolve, reject) => {
                let vendors = db.get().collection(collection.VENDOR_COLLECTION).find({}).toArray()
                resolve(vendors)
            })
        } catch (err) {
            console.log(err);
        }
    },
    getVendorDetails: (vendorId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: objectId(vendorId) }).then((vendor) => {
                    resolve(vendor)
                })
            })
        } catch (err) {
            console.log(err);
        }
    },
    getVendorProducts: (vendorId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ vendorId: vendorId }).toArray()
                resolve(products)
            })
        } catch (err) {
            console.log(err);
        }
    },
    changeProductQuantity: (details) => {
        try {
            details.quantity = parseInt(details.quantity)
            details.count = parseInt(details.count)
            return new Promise((resolve, reject) => {
                if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
                } else {
                    console.log("Worked")
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                            {
                                $inc: { 'products.$.quantity': details.count }
                            }).then((response) => {
                                resolve({ status: true })
                            })
                }
            })
        } catch (err) {
            console.log(err);
        }
    },
    getProductTotal: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            vendor: '$products.vendor'
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
                        $project: {
                            total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, total: 1, product: { $arrayElemAt: ['$product', 0] }

                        }
                    },
                ]).toArray()
                resolve(total)
            })
        } catch (err) {
            console.log(err);
        }
    },
    getTotalAmount: (userId) => {
        try {
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
                if (total.length > 0) {
                    resolve(total[0].total)
                } else {
                    resolve({ status: false })
                }


            })
        } catch (err) {
            console.log(err);
        }
    },
   getCartProductList: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                resolve(cart)
            })
        } catch (err) {
             console.log(err);
        }
    },
    addAddress: (details) => {
        try {
            return new Promise(async (resolve, reject) => {
                let addresssObj = {
                    user: objectId(details.user),
                    deliveryArea: details.deliveryArea,
                    completeAddress: details.completeAddress,
                    deliveryInstructions: details.deliveryInstructions,
                    addressType: details.addressType
                }
                let userAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectId(details.user), addressType: details.addressType })

                if (userAddress) {
                    db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(details.user), addressType: details.addressType },
                        {
                            $set: {
                                deliveryArea: details.deliveryArea,
                                completeAddress: details.completeAddress,
                                deliveryInstructions: details.deliveryInstructions,
                                addressType: details.addressType
                            }
                        }).then((response) => {
                            resolve(response)
                        })
                } else {
                    db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addresssObj).then((response) => {
                        resolve(response)
                    })
                }
            })
        } catch (err) {
            console.log(err);
        }
    },
    deleteAddress:(id)=>{
        try{
            return new Promise((resolve, reject) => {
                db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(id)}).then((response)=>{
                    resolve(response)
                })
              
            })
        }catch(err){
            console.log(err);
        }
    },
    placeOrder: (order,products,vendorId, total,userAddress) => {
        try {
            return new Promise((resolve, reject) => {
                console.log(products, total);
                let status = order['payment-method'] === 'COD' ? 'Order confirmed' : 'Order pending'
                let orderObj = {
                    userId: objectId(order.userId),
                    vendor:objectId(vendorId),
                    products: products,
                    deliveryDetails: {
                        address: userAddress.addressType,
                        deliveryArea: userAddress.deliveryArea,
                        deliveryInstruction: userAddress.deliveryInstructions,
                        completeAddress: userAddress.completeAddress
                    },
                        paymentMethod: order['payment-method'],
                        totalAmount: total,
                        status: status,
                        date: new Date(),



                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                 if(order['payment-method']==='COD'){
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                 }
                    resolve(response.insertedId)
                })
            })
        } catch (err) {
            console.log(err);
        }
    },
    getUserOrders: (userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { userId: objectId(userId) }
                    },
                    {
                        $project: {
                            deliveryDetails: '$deliveryDetails',
                            vendorId: '$vendor',
                            orderDetails:{
                                status:'$status',
                                paymentMethod: '$paymentMethod',
                                date: '$date',
                                totalAmount: '$totalAmount'
                            }
                        }
                    },
                    {
                        $lookup:{
                            from: collection.VENDOR_COLLECTION,
                            localField: 'vendorId',
                            foreignField: '_id',
                            as: 'vendorDetails'
                        }
                    },
                    {
                        $project: {
                           deliveryDetails: 1, orderDetails: 1, vendorDetails:{$arrayElemAt:['$vendorDetails',0]}

                        }
                    }
                ]).toArray()
                resolve(orders)
            })

        } catch (err) {
            console.log(err);
        }
    },
    getOrderProducts:(orderId)=>{
        try{
            return new Promise(async(resolve, reject) => {
                let products=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{_id:objectId(orderId)}
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project:{
                            item: '$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project:{
                            item:1,
                            quantity:1,
                            product:{$arrayElemAt:['$product',0]}
                        }
                    }
                ]).toArray()
                resolve(products);
            })
        }catch(err){
            console.log(err)
        }
    }
}