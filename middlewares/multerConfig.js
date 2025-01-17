// const multer = require('multer');
// const path = require('path');

// // Configure storage
// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, 'public/uploads/product-images/');
//     },
//     filename: function(req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });

// // Create upload middleware
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith('image/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Not an image! Please upload only images.'));
//         }
//     }
// });

// module.exports = upload;








// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure upload directory exists
// const uploadDir = 'public/uploads/product-images/';
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configure storage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         // Log the incoming file
//         console.log('Processing file:', {
//             fieldname: file.fieldname,
//             originalname: file.originalname,
//             mimetype: file.mimetype
//         });

//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         // Create a safe filename
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         const filename = uniqueSuffix + ext;

//         console.log('Generated filename:', filename);
//         cb(null, filename);
//     }
// });

// // File filter function with detailed logging
// const fileFilter = (req, file, cb) => {
//     console.log('Checking file:', file.originalname);

//     // Check file type
//     if (!file.mimetype.startsWith('image/')) {
//         console.log('Rejected file:', file.originalname, '- Invalid mime type:', file.mimetype);
//         return cb(new Error('Invalid file type. Only images are allowed.'), false);
//     }

//     // Check file extension
//     const validExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (!validExtensions.includes(ext)) {
//         console.log('Rejected file:', file.originalname, '- Invalid extension:', ext);
//         return cb(new Error('Invalid file extension. Only .png, .jpg, .jpeg, .gif are allowed.'), false);
//     }

//     console.log('Accepted file:', file.originalname);
//     cb(null, true);
// };

// // Create upload middleware with error handling
// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB limit
//         files: 5 // Maximum 5 files per upload
//     },
//     fileFilter: fileFilter
// });

// // Wrapper function for better error handling
// const uploadMiddleware = (fieldName) => {
//     return (req, res, next) => {
//         const uploadHandler = upload.array(fieldName, 5);

//         uploadHandler(req, res, (err) => {
//             if (err) {
//                 console.error('Upload error:', err);
//                 if (err instanceof multer.MulterError) {
//                     // Multer-specific errors
//                     if (err.code === 'LIMIT_FILE_SIZE') {
//                         return res.status(400).json({
//                             success: false,
//                             message: 'File too large. Maximum size is 5MB'
//                         });
//                     }
//                     if (err.code === 'LIMIT_FILE_COUNT') {
//                         return res.status(400).json({
//                             success: false,
//                             message: 'Too many files. Maximum is 5 files'
//                         });
//                     }
//                     return res.status(400).json({
//                         success: false,
//                         message: `Upload error: ${err.code}`
//                     });
//                 }
//                 // Other errors
//                 return res.status(400).json({
//                     success: false,
//                     message: err.message
//                 });
//             }

//             // Log successful upload
//             if (req.files) {
//                 console.log('Successfully uploaded files:', req.files.map(f => ({
//                     filename: f.filename,
//                     size: f.size,
//                     mimetype: f.mimetype
//                 })));
//             }

//             next();
//         });
//     };
// };

// module.exports = uploadMiddleware;





const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/products');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;