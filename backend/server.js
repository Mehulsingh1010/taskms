// server.js
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const mongouri = 'mongodb+srv://mehulsingh2022:SM68pAXvtEP2z8QM@taskmanagement.gefgr.mongodb.net/?retryWrites=true&w=majority&appName=taskmanagement';


mongoose.connect(mongouri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
// models/User.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// models/Task.js
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, '1234', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      '1234',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      '1234',
      { expiresIn: '24h' }
    );

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Task Routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.user.userId
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Add these new admin middleware and routes after your existing authenticateToken middleware

// Admin middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Admin Routes
  // Get all users
  app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
      const users = await User.find({}, '-password'); // Exclude password field
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all tasks from all users
  app.get('/api/admin/tasks', authenticateToken, isAdmin, async (req, res) => {
    try {
      const tasks = await Task.find().populate('userId', 'username email'); // Include user details
      res.json(tasks);
    } catch (error) {
      console.error('Get all tasks error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get tasks for specific user
  app.get('/api/admin/users/:userId/tasks', authenticateToken, isAdmin, async (req, res) => {
    try {
      const tasks = await Task.find({ userId: req.params.userId })
                             .populate('userId', 'username email');
      res.json(tasks);
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Modify existing task route to allow admin to see all tasks
  app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      let tasks;
      
      if (user.role === 'admin') {
        tasks = await Task.find().populate('userId', 'username email');
      } else {
        tasks = await Task.find({ userId: req.user.userId });
      }
      
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: error.message });
    }
  });

// Add this with your other task routes
app.post('/api/admin/tasks/assign', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { title, description, dueDate, priority, assignedUserId } = req.body;
      
      const task = await Task.create({
        title,
        description,
        dueDate,
        priority,
        userId: assignedUserId, // This will be the ID of the user we're assigning the task to
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
  
      const populatedTask = await Task.findById(task._id).populate('userId', 'username email');
      res.status(201).json(populatedTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });


  app.get('/api/tasks/assigned', authenticateToken, async (req, res) => {
    try {
      const tasks = await Task.find({ assignedUserId: req.user._id });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching assigned tasks' });
    }
  });

  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));