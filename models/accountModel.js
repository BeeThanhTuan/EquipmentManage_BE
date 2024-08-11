const mongoose = require('mongoose');

// Định nghĩa schema cho đối tượng User
const AccountSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    Name: { type: String, required: true},
}, {
    collection: "Account"
});

// Tạo model User từ schema
const Account = mongoose.model('Account', AccountSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Account;