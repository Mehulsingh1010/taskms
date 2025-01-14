import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });
  const [isEditing, setIsEditing] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, logout } = useAuth();

  const fetchUsers = async () => {
    if (user.role === 'admin') {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchTasks = async () => {
    try {
      let url = 'http://localhost:5000/api/tasks';
      if (user.role === 'admin' && selectedUser) {
        url = `http://localhost:5000/api/admin/users/${selectedUser}/tasks`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, [selectedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/tasks/${isEditing}`,
          newTask,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
      } else {
        await axios.post('http://localhost:5000/api/tasks', newTask, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
      setIsEditing(null);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {user.role === 'admin' ? 'Admin Dashboard' : 'Task Dashboard'}
          </h1>
          <p className="text-gray-600">Welcome, {user.username}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>

      {user.role === 'admin' && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Filter by User</h2>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value || null)}
            className="w-full md:w-1/3 px-3 py-2 border rounded"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username} ({u.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {(!user.role === 'admin' || !selectedUser) && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEditing ? 'Update Task' : 'Add Task'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div
            key={task._id}
            className={`border p-4 rounded-lg shadow-lg flex flex-col space-y-4
              ${task.priority === 'high' ? 'border-red-300' : 
                task.priority === 'medium' ? 'border-yellow-300' : 'border-green-300'}`}
          >
            <h3 className="font-bold text-xl">{task.title}</h3>
            <p>{task.description}</p>
            <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            <p>Priority: {task.priority}</p>
            {user.role === 'admin' && task.userId && (
              <p className="text-sm text-gray-600">
                Created by: {task.userId.username || 'Unknown'}
              </p>
            )}
            {(!user.role === 'admin' || !selectedUser) && (
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(task._id);
                    setNewTask({
                      title: task.title,
                      description: task.description,
                      dueDate: task.dueDate.split('T')[0],
                      priority: task.priority
                    });
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskDashboard;
