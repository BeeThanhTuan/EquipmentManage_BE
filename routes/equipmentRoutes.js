const express = require('express');
const router = express.Router();
const fs = require('fs');
const {Equipment, Employee} = require('../models/equipmentModel')
const uploadEquipmentImage = require('./uploadEquipmentImageRoutes');

const IMAGE_DIR = `C:/Users/MSI-PC/OneDrive/Máy tính/InternshipTMA/ManageEquipment_BE/resources/equipments/`;

// get all equipments
router.get('/api/equipments', async (req, res) => {
    try {
        const equipments = await Equipment.find();
        if (equipments.length > 0) {
            res.json(equipments); 
        } else {
            res.status(404).json({ message: 'No equipment found' }); 
        }
    } catch (err) {
        console.error('Error fetching equipments:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

//get all equipments instock
router.get('/api/equipments/instock', async (req, res) => {
    try {
        // Tìm tất cả thiết bị với status = false
        const equipments = await Equipment.find({ Status: false });

        if (equipments.length > 0) {
            res.json(equipments); 
        } else {
            res.status(404).json({ message: 'No equipment found' }); 
        }
    } catch (err) {
        console.error('Error fetching equipments:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

//get all equipments borrowed
router.get('/api/equipments/borrowed', async (req, res) => {
    try {
        // Tìm tất cả thiết bị với status = true
        const equipments = await Equipment.find({ Status: true });

        if (equipments.length > 0) {
            res.json(equipments); 
        } else {
            res.status(404).json({ message: 'No equipment found' }); 
        }
    } catch (err) {
        console.error('Error fetching equipments:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

//get equipment by id
router.get('/api/equipment/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const equipment = await Equipment.findOne({ID:id})
        if (equipment) {
            res.json(equipment);
        } else {
            res.status(404).json({ message: 'Equipment not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

//check equipment id exits
router.get('/api/equipment/check/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const equipment = await Equipment.findOne({ID:id})
        if (equipment) {
            res.json(true);
        } else {
            res.json(false);
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new equipment
router.post('/api/equipment', uploadEquipmentImage, async (req, res) => {
    try {
        const { id, name, description } = req.body;
        const image = req.file ? req.file.filename : '';
        // Check if equipment with the given ID already exists
        const existingEquipment = await Equipment.findOne({ ID: id });
        if (existingEquipment) {
            // If equipment exists, return an error response and do not process the image
            if (image) {
                const imagePath = `${IMAGE_DIR}${image}`;      
                fs.unlink(imagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                });
            }
            return res.status(401).json({ success: false, message: 'Equipment already exists' });
        }
        const newEquipment = new Equipment({
            ID: id,
            Name: name,
            Status: false, 
            Description: description,
            Image: image,
        });
        const savedEquipment = await newEquipment.save();
        res.json({ success: true, message: 'Equipment added successfully', data: savedEquipment });

    } catch (error) {
        console.error('Error adding equipment:', error);
        res.status(500).json({ success: false, message: 'Error adding equipment', error: error.message });
    }
});

function getCurrentDateFormatted() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
    const year = now.getFullYear();
    // Format as DD/MM/YYYY
    return `${day}/${month}/${year}`;
}

// Update equipment
router.put('/api/equipment/:id', uploadEquipmentImage, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, idEmployee } = req.body;
        const image = req.file ? req.file.filename : null;
        const dateBorrowed = getCurrentDateFormatted();
        // Find the equipment by ID
        const equipment = await Equipment.findOne({ ID: id });
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        // Store the old image filename
        const oldImage = equipment.Image;
        // Update equipment properties
        if (name) equipment.Name = name;
        if (description) equipment.Description = description;
        if (image) {
            // Delete the old image if it exists
            if (oldImage) {
                const oldImagePath = `${IMAGE_DIR}${oldImage}`;
                // Adjust the path as needed
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Error deleting old image:', err);
                });
            }
            equipment.Image = image; // Update image if provided
        }
        // Update status and dateBorrowed if idEmployee is different
        if (idEmployee) {
            if (idEmployee !== equipment.IDEmployee) {
                equipment.IDEmployee = idEmployee;
                equipment.Status = true;
                equipment.DateBorrowed = dateBorrowed;
            }
        } else {
            equipment.IDEmployee = '';
            equipment.Status = false;
            equipment.DateBorrowed = ''; 
        }
        // Save updated equipment
        const updatedEquipment = await equipment.save();
        res.json({ success: true, message: 'Equipment updated successfully', data: updatedEquipment });

    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ success: false, message: 'Error updating equipment', error: error.message });
    }
});

// Delete equipment by ID and its image
router.delete('/api/equipment/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        // Find the equipment by ID
        const equipment = await Equipment.findOne({ ID: id });
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        // Store the image filename
        const oldImage = equipment.Image;
        if (oldImage) {
            const oldImagePath = `${IMAGE_DIR}${oldImage}`; // Adjust the path as needed        
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Error deleting image:', err);
            });
        }
        // Delete the equipment
        await Equipment.deleteOne({ ID: id });    
        res.json({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ success: false, message: 'Error deleting equipment', error: error.message });
    }
});

//search equipments by search text
router.post('/api/equipments/search', async (req, res) => {
    const { status, searchKey } = req.body; 
    try {
        let search = {};
        // If status is provided, add condition to the query
        if (status) {
            if (status === 'instock') {
                search.Status = false;
            } else if (status === 'borrowed') {
                search.Status = true;
            }
        }   
        // If searchKey is provided, add text search conditions to the query
        if (searchKey) {
            search.$or = [
                { ID: { $regex: searchKey, $options: 'i' } },
                { Name: { $regex: searchKey, $options: 'i' } }
            ];
        }   
        // Find equipment based on the search conditions
        let equipmentDataList = await Equipment.find(search);
        // If no data found, return an empty array
        if (equipmentDataList.length === 0) {
            return res.json([]);
        } else {
            res.json(equipmentDataList);
        }

    } catch (err) {
        console.error('Error fetching equipments:', err); 
        res.status(500).json({ message: 'Internal server error' });
    }
});

//borrowed  equipment
router.post('/api/borrow-equipment', async (req, res) => {
    const { employeeID, equipmentID } = req.body;
    const dateBorrowed = getCurrentDateFormatted();
    try {
        const employee = await Employee.findOne({ ID: employeeID });
        const equipment = await Equipment.findOne({ ID: equipmentID });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Ensure ListEquipmentBorrowed is array
        if (!Array.isArray(employee.ListEquipmentBorrowed)) {
            employee.ListEquipmentBorrowed = [];
        }

        if (equipment.IDEmployee) {
            return res.status(400).json({ success: false, message: 'Equipment is already borrowed' });
        }

        // Update ListEquipmentBorrowed 
        if (!employee.ListEquipmentBorrowed.includes(equipmentID)) {
            employee.ListEquipmentBorrowed.push(equipmentID);
            await employee.save();
        }

        // Update equipment with the employee's ID
        equipment.IDEmployee = employeeID;
        equipment.DateBorrowed = dateBorrowed;
        equipment.Status = true;
        await equipment.save();
        res.json({ success: true, message: 'Equipment borrowed successfully', data: equipment });

    } catch (error) {
        console.error('Error borrowing equipment:', error);
        res.status(500).json({ success: false, message: 'Error borrowing equipment', error: error.message });
    }
});

//return borrowed equipment
router.post('/api/return-equipment', async (req, res) => {
    const { employeeID, equipmentID } = req.body;
    try {
        // Find the employee by ID
        const employee = await Employee.findOne({ ID: employeeID });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Find the equipment by ID
        const equipment = await Equipment.findOne({ ID: equipmentID });
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // Check if the equipment is currently borrowed by the employee
        if (equipment.IDEmployee !== employeeID) {
            return res.status(400).json({ success: false, message: 'Equipment is not borrowed by this employee' });
        }

        // Update the employee's ListEquipmentBorrowed
        if (Array.isArray(employee.ListEquipmentBorrowed) && employee.ListEquipmentBorrowed.includes(equipmentID)) {
            employee.ListEquipmentBorrowed = employee.ListEquipmentBorrowed.filter(id => id !== equipmentID);
            await employee.save();
        }

        // Update the equipment to mark it as returned
        equipment.IDEmployee = ''; 
        equipment.DateBorrowed = '';
        equipment.Status = false; // Mark the equipment as available
        await equipment.save();

        res.json({ success: true, message: 'Equipment returned successfully', data: equipment });

    } catch (error) {
        console.error('Error returning equipment:', error);
        res.status(500).json({ success: false, message: 'Error returning equipment', error: error.message });
    }
});

module.exports = router;