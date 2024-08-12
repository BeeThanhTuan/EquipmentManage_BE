const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'resources/equipments'); // Thư mục chứa ảnh
    },
    filename: function(req, file, cb) {
        // Tạo tên tệp tin duy nhất bằng cách thêm thời gian hiện tại vào tên tệp tin gốc
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Cấu hình multer để chỉ chấp nhận ảnh
const uploadEquipmentImage = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Kiểm tra xem tệp tin có phải là ảnh không
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Chỉ chấp nhận các tệp tin ảnh!'));
        }
        cb(null, true);
    }
}).single('image');

module.exports = uploadEquipmentImage;