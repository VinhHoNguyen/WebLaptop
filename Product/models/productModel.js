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
    stock: {
        "type": "Number",
        min: 0
    },
    specs: {
        brand: { "type": "String" },
        cpu: { "type": "String" },
        gpu: { "type": "String" },
        ramGb: { "type": "Number" },
        storageGb: { "type": "Number" },
        display: { "type": "String" }
    }
}, {
    timestamps: true,
})

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);