const Address = require("../../models/addressSchema")


const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user_id: req.user._id });
        
        res.render('addresses', { addresses,messages: req.flash()  });
    } catch (error) {
        console.error("Error fetching addresses:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const addAddress = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        }

        const newAddress = new Address({
            user_id: req.user._id,
            city: req.body.city,
            state: req.body.state,
            pin_code: req.body.pin_code,
            landmark: req.body.landmark,
            alternative_no: req.body.alternative_no,
            addresstype: req.body.addresstype,
        });

        await newAddress.save();
        req.flash("success","addres added successfully!")
        res.redirect("/addresses");
    } catch (error) {
        console.error("Error adding address:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const editAddress = async (req, res) => {
    try {
        const { address_id, city, state, pin_code, landmark, alternative_no, addresstype } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(
            address_id,
            { city, state, pin_code, landmark, alternative_no, addresstype },
            { new: true }
        );
        

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
        req.flash("success", "Address updated successfully!");
        res.redirect("/addresses");
    } catch (error) {   
        console.error("Error editing address:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAddresses = async (req,res)=>{
    const {id} = req.params;
    // console.log(id)
    try {
        const deleteAddress = await Address.findByIdAndDelete(id)
        if(!deleteAddress){
            return res.status(404).json({success:false,message:"Addres not found"})
        } 
       req.flash("success","Addres deleted successfully");
       return res.json({ success: true });


        
    } catch (error) {
        console.error("deleting error",error.message);
    }
}





module.exports = {
    getAddresses,
    addAddress,
    editAddress,
    deleteAddresses


}