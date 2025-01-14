import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'assign'
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    assignedUserId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchAllTasks();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/tasks', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUserTasks = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}/tasks`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/api/admin/tasks/assign',
        newTask,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      
      setTasks(prev => [...prev, response.data]);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        assignedUserId: ''
      });
      alert('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Error assigning task');
    }
  };

  const ViewTasksSection = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">View User Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Users list */}
          <div className="col-span-1 border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-3">Users</h3>
            {users.map((u) => (
              <div 
                key={u._id} 
                className={`p-2 mb-2 rounded cursor-pointer ${
                  selectedUser === u._id ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
                onClick={() => fetchUserTasks(u._id)}
              >
                <p className="font-medium">{u.username}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
              </div>
            ))}
          </div>

          {/* Tasks list */}
          <div className="col-span-2 border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedUser ? 'User Tasks' : 'All Tasks'}
              </h3>
              {selectedUser && (
                <button
                  onClick={fetchAllTasks}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  View All Tasks
                </button>
              )}
            </div>
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task._id} className="border p-4 rounded shadow">
                  <h3 className="font-bold">{task.title}</h3>
                  <p className="text-gray-700">{task.description}</p>
                  <p className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  <p className="text-sm">Priority: {task.priority}</p>
                  <p className="text-sm text-gray-600">
                    Created by: {task.userId?.username || 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AssignTaskSection = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Assign Task to User</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block mb-1 font-medium">Assign to:</label>
          <select
            name="assignedUserId"
            value={newTask.assignedUserId}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.username} ({u.email})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Title:</label>
          <input
            type="text"
            name="title"
            value={newTask.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description:</label>
          <textarea
            name="description"
            value={newTask.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows="4"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Due Date:</label>
          <input
            type="date"
            name="dueDate"
            value={newTask.dueDate}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Priority:</label>
          <select
            name="priority"
            value={newTask.priority}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
        >
          Assign Task
        </button>
      </form>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-6 py-2 font-medium ${
            activeTab === 'view' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('view')}
        >
          View Tasks
        </button>
        <button
          className={`px-6 py-2 font-medium ${
            activeTab === 'assign' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('assign')}
        >
          Assign Tasks
        </button>
      </div>

      {/* Content Section */}
      {activeTab === 'view' ? <ViewTasksSection /> : <AssignTaskSection />}
    </div>
  );
};

export default AdminDashboard;