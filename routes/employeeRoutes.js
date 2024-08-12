const express = require('express');
const router = express.Router();
const fs = require('fs');
const {Employee, Equipment} = require('../models/equipmentModel')
const uploadEmployeeImage = require('./uploadEmployeeImageRoutes');

const IMAGE_DIR = `C:/Users/MSI-PC/OneDrive/Máy tính/InternshipTMA/ManageEquipment_BE/resources/employees/`;

// get all employees
router.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        if (employees.length > 0) {
            res.json(employees); 
        } else {
            res.status(404).json({ message: 'No employee found' }); 
        }
    } catch (err) {
        console.error('Error fetching employees:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

//get employee by id
router.get('/api/employee/:id', async (req, res) => {
    const {id} = req.params;
    try {
        // Find the employee by custom ID
        const employee = await Employee.findOne({ ID: id });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        // Find all equipment borrowed by the employee
        const BorrowedEquipmentList = await Equipment.find({
            ID: { $in: employee.ListEquipmentBorrowed }
        });
        // Return the employee with the list of borrowed equipment
        res.json({ success: true, data: { ...employee.toObject(), BorrowedEquipmentList } });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

//check employee id exits
router.get('/api/employee/check/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const employee = await Employee.findOne({ID:id})
        if (employee) {
            res.json(true);
        } else {
            res.json(false);
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new employee
router.post('/api/employee', uploadEmployeeImage, async (req, res) => {
    try {
        const { id, fullName, gender, phoneNumber, email, address, dateOfBirth } = req.body;
        const image = req.file ? req.file.filename : '';
        // Check if employee with the given ID already exists
        const existingEmployee = await Employee.findOne({ ID: id });
        if (existingEmployee) {
            // If employee exists, return an error response and do not process the image
            if (image) {
                const imagePath = `${IMAGE_DIR}${image}`;      
                fs.unlink(imagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                });
            }
            return res.status(401).json({ success: false, message: 'Employee already exists' });
        }
        const newEmployee = new Employee({
            ID: id,
            Name: fullName,
            Gender: gender,
            PhoneNumber: phoneNumber,
            Email: email,
            Address: address,
            DateOfBirth: dateOfBirth,
            Image: image,
        });
        const savedEmployee = await newEmployee.save();
        res.json({ success: true, message: 'Employee added successfully', data: savedEmployee });

    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ success: false, message: 'Error adding employee', error: error.message });
    }
});

// update employee by id
router.put('/api/employee/:id', uploadEmployeeImage, async (req, res) => {
    try {
        const {id} = req.params;
        const {fullName, gender, phoneNumber, email, address, dateOfBirth } = req.body;
        const image = req.file ? req.file.filename : '';
        // Find the equipment by ID
        const employee= await Employee.findOne({ ID: id });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
         // Prepare update object
         const updateFields = {};
         if (fullName) updateFields.Name = fullName;
         if (gender) updateFields.Gender = gender;
         if (phoneNumber) updateFields.PhoneNumber = phoneNumber;
         if (email) updateFields.Email = email;
         if (address) updateFields.Address = address;
         if (dateOfBirth) updateFields.DateOfBirth = dateOfBirth;

        // Handle image update
        if (image) {
            // Store the old image filename
            const oldImage = employee.Image;
            // Update image field
            updateFields.Image = image;
            // Delete the old image if it exists
            if (oldImage) {
                const oldImagePath = `${IMAGE_DIR}${oldImage}`;      
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                });
            }
        }
         // Update employee document
         await Employee.updateOne({ ID: id }, { $set: updateFields });
         res.status(200).json({ success: true, message: 'Employee updated successfully' });
    
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
    }
});

// Delete employee by ID and its image
router.delete('/api/employee/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        // Find the employee by ID
        const employee = await Employee.findOne({ ID: id });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        // Store the image filename
        const oldImage = employee.Image;
        if (oldImage) {
            const oldImagePath = `${IMAGE_DIR}${oldImage}`; // Adjust the path as needed        
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Error deleting image:', err);
            });
        }
        // Delete the employee
        await Employee.deleteOne({ ID: id });    
        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
    }
});

//search employee by search text
router.post('/api/employees/search', async (req, res) => {
    const { searchKey } = req.body; 
    try {
        let search = {};
        // let genderSearch = null;
        // if (searchKey.includes('Male')){
        //     genderSearch = true;
        // }
        // else if (searchKey.includes('Female')){
        //     genderSearch = false;
        // }
        
        // If searchKey is provided, add text search conditions to the query
        if (searchKey) {
            search.$or = [
                { ID: { $regex: searchKey, $options: 'i' } },
                { Name: { $regex: searchKey, $options: 'i' } },
                { Gender: { $regex: searchKey, $options: 'i' } },
                { PhoneNumber: { $regex: searchKey, $options: 'i' } },
                { Email: { $regex: searchKey, $options: 'i' } },
                { Address: { $regex: searchKey, $options: 'i' } },
            ];
        }   
        // Find employee based on the search conditions
        let employeeDataList = await Employee.find(search);
        // If no data found, return an empty array
        if (employeeDataList.length === 0) {
            return res.json([]);
        } else {
            res.json(employeeDataList);
        }

    } catch (err) {
        console.error('Error fetching equipments:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;