const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
{
    UserId: 
    {
        type: String 
    },

    ProductId: 
    {
        type: String 
    },

    quantity:
    {
        type: Number,
        default: 1,
        min: 1
    }
}, 

{
    timestamps: true
}

);

module.exports = mongoose.model("Cart", cartSchema);