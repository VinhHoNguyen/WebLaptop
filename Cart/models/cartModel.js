const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
{
    UserId: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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

cartSchema.index({ UserId: 1, ProductId: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);