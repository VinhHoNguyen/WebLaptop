const mongoose = require('mongoose');

const productSchema =  new mongoose.Schema({
    name:{
        "type": "String",
         required: true
        },
    price: {
        "type": "Number"
    },
    description: {
        "type": "String"
    },
    category: {
        "type": "String"
    },
    image: {
        "type": "String"
    },
    specs: {
        brand: { "type": "String" },
        cpu: { "type": "String" },
        gpu: { "type": "String" },
        ramGb: { "type": "Number" },
        storageGb: { "type": "Number" },
        display: { "type": "String" }
    }
})

module.exports = mongoose.model('Product', productSchema);