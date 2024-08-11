const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Account = require('../models/accountModel');


// get all account
router.get('/api/accounts', async(req, res) => {
    try {
        const account = await Account.find();
        if (account.length > 0) {
            res.json(account);
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

//get account by id
router.get('/api/account/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const account = await Account.findById(id).select('-_id -Password');
        if (account) {
            res.json(account);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

//update name account
router.put('/api/account/updateName', async(req, res) => {
    const {email, name} = req.body
    try {
        const account = await Account.findOne({Email: email});
        if (!account) {
            return res.status(404).json({ message: 'Email is not exits' });
        }
        account.Name = name;
        const updatedAccount = await account.save(); 
        res.json(updatedAccount);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

// login
router.post('/api/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        // Tìm tài khoản trong cơ sở dữ liệu dựa trên email
        const account = await Account.findOne({ Email: email });
        // Kiểm tra xem tài khoan có tồn tại không
        if (!account) {
            return res.status(404).json({ message: 'Email invalid' });
        }
        // So sánh mật khẩu nhập vào với mật khẩu lưu trong cơ sở dữ liệu
        const isPasswordValid = await password === account.Password;
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        // Nếu mọi thứ hợp lệ, tạo JSON Web Token (JWT)
        const token = jwt.sign({id: account._id} , 'ntt-secret-key', { expiresIn: '1h' });
        res.json({
            token
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;