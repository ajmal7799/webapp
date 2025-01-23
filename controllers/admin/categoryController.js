const Category = require("../../models/categorySchema");
const categoryInfo = async (req, res) => {
    try {

        let search = "";
        if(req.query.search){
           search=req.query.search;
        }


        const page = parseInt(req.query.page) || 1;
        const limit = 4
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,


        });

    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
}

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name }); 

        if (existingCategory) {

            return res.status(400).json({ error: "Category already exists" })
        }
        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();
        return res.json({ message: "Category added successfuly" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" })
    }
}


const getEditCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const category = await Category.findOne({ _id: id });
        res.render("edit-category", { category: category })

    } catch (error) {
        res.redirect("/pageerror");

    }
}


const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        
        const { categoryName, description } = req.body  

        const existingCategory = await Category.findOne({ name: categoryName })

        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.status(400).json({ error: "Category existing, please choose another name" });
        }
        const updateCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description,
        }, { new: true });

        if (updateCategory) {
            res.redirect("/admin/category");
        } else {
            res.status(404).json({ error: "Category not found" });
        }


    } catch (error) {
        res.status(500).json({ error: "Internal server error" })

    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        await Category.findByIdAndDelete(categoryId);

        res.json({ success: true, message: "Category deleted successfully" })

    } catch (error) {
        res.status(500).json({ success: false, message: "failed to delete category" })
    }

}

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")

    }
}

const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } })
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")

    }
}



module.exports = {
    categoryInfo,
    addCategory,
    getEditCategory,
    editCategory,
    deleteCategory,
    getListCategory,
    getUnlistCategory


} 