const { default: mongoose } = require("mongoose")

const walletSchema = new mongoose.Schema({
    description: { 
        type: String,
        enum: ['Order Payment', 'Order Return', 'Order Cancel']
    },
    type: {
        type: String,
        enum: ['Credit', 'Debit']
    },
    amount: {
        type: Number
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
