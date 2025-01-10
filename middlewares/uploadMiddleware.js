const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Fungsi untuk menghasilkan nama file random
const generateRandomFilename = (file) => {
    // Mengambil ekstensi file asli
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Membuat random string dengan panjang 8 karakter
    const randomString = crypto.randomBytes(4).toString('hex');
    
    // Menambahkan timestamp untuk memastikan keunikan
    const timestamp = Date.now();
    
    // Menggabungkan semuanya menjadi nama file
    return `image_${timestamp}_${randomString}${fileExtension}`;
};

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder untuk menyimpan file
    },
    filename: (req, file, cb) => {
        // Menggunakan fungsi generateRandomFilename untuk membuat nama file random
        const randomFilename = generateRandomFilename(file);
        console.log('Generated random filename:', randomFilename); // Debug log
        cb(null, randomFilename);
    }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
};

// Inisialisasi multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // Batas maksimum 25MB
});

module.exports = upload;