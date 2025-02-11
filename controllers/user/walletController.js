const Wallet = require("../../models/walletSchema");
const User = require("../../models/userSchema");

const getWallet = async (req, res) => {
    try {

        const userId = req.user._id;
        const userData = await User.findOne({_id:req.session.user._id})
        const wallets = await Wallet.find({ userId }).sort({ createdAt: -1 }).lean()
        wallets.forEach(element => {
            const day = String(element.createdAt.getDate()).padStart(2, 0);
            const month = String(element.createdAt.getMonth() + 1).padStart(2, 0);
            const year = element.createdAt.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;
            element.formattedCreatedAt = formattedDate
        })
        const sumOfcredit = wallets.reduce((sum, element) => {
            if (element.type == "Credit") {
                sum += element.amount
            }
            return sum
        }, 0)
        console.log(sumOfcredit)

        const sumOfDebit = wallets.reduce((sum, element) => {
            if (element.type == "Debit") {
                sum += element.amount
            }
            return sum
        }, 0)

        const balanceAmount = sumOfcredit - sumOfDebit
        
        res.render('wallet', {
            user:userData,
            userId,
            wallets,
            balanceAmount,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "server error" })

    }
}
module.exports = {
    getWallet

}