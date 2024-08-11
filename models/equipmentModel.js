const mongoose = require('mongoose');
// Định nghĩa schema cho các collections

const EquipmentSchema = new mongoose.Schema({
    ID: { type: String, required: true, unique: true },
    Name: { type: String, required: true },
    Status: { type: Boolean },
    Description: { type: String, required: true },
    IDEmployee: { type: mongoose.Schema.Types.String, ref: 'Employee' },
    DateBorrowed: { type: String },
    Image: { type: String }
}, {
    collection: "Equipment"
});

const EmployeeSchema = new mongoose.Schema({
    ID: { type: String, required: true, unique: true },
    Name: { type: String, required: true },
    Gender: { type: Boolean },
    DateOfBirth: { type: String },
    Address: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Email: { type: String, required: true },
    Image: { type: String },
    ListEquipmentBorrowed: [{ type: mongoose.Schema.Types.String, ref: 'Equipment' }]
}, {
    collection: "Employee"
});


// Tạo model từ các schema
const Equipment = mongoose.model('Equipment', EquipmentSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);


module.exports = { Equipment, Employee }