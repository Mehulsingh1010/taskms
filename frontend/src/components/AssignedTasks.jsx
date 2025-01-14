import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AssignedTasks = () => {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/tasks/assigned`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setAssignedTasks(response.data);
      } catch (error) {
        console.error('Error fetching assigned tasks:', error);
      }
    };

    fetchAssignedTasks();
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Tasks Assigned by Admin</h2>
      <div className="space-y-4">
        {assignedTasks.map((task) => (
          <div
            key={task._id}
            className={`border p-4 rounded shadow ${
              task.priority === 'high'
                ? 'border-red-300'
                : task.priority === 'medium'
                ? 'border-yellow-300'
                : 'border-green-300'
            }`}
          >
            <h3 className="font-bold">{task.title}</h3>
            <p>{task.description}</p>
            <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            <p>Priority: {task.priority}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedTasks;
