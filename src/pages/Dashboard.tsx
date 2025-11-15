import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, Box, Paper } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { People, CheckCircle, Assignment, TrendingUp } from '@mui/icons-material';
import { apiService, Resource, Task } from '../services/api';
import './dashboard.scss';

interface Stats {
  total_resources: number;
  available_resources: number;
  busy_resources: number;
  total_tasks: number;
  pending_tasks: number;
  assigned_tasks: number;
  average_workload: number;
}

const COLORS = ['#053687', '#f97905', '#3a3a38', '#27ae60', '#e74c3c', '#f39c12', '#3498db'];

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, resourcesRes, tasksRes] = await Promise.all([
        apiService.getStats(),
        apiService.getAllResources(),
        apiService.getAllTasks()
      ]);

      setStats(statsRes.stats);
      setResources(resourcesRes.resources);
      setTasks(tasksRes.tasks);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Department distribution
  const departmentData = resources.reduce((acc: any[], resource) => {
    const existing = acc.find(item => item.name === resource.department);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: resource.department, value: 1 });
    }
    return acc;
  }, []);

  // Availability distribution
  const availabilityData = [
    { name: 'Available', value: stats?.available_resources || 0 },
    { name: 'Busy', value: stats?.busy_resources || 0 }
  ];

  // Expertise distribution
  const expertiseData = resources.reduce((acc: any[], resource) => {
    const existing = acc.find(item => item.name === resource.expertise_level);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: resource.expertise_level, value: 1 });
    }
    return acc;
  }, []);

  // Task priority distribution
  const priorityData = tasks.reduce((acc: any[], task) => {
    const existing = acc.find(item => item.name === task.priority);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: task.priority, value: 1 });
    }
    return acc;
  }, []);

  // Workload distribution
  const workloadData = [
    { range: '0-25%', count: resources.filter(r => r.current_workload < 25).length },
    { range: '26-50%', count: resources.filter(r => r.current_workload >= 25 && r.current_workload < 50).length },
    { range: '51-75%', count: resources.filter(r => r.current_workload >= 50 && r.current_workload < 75).length },
    { range: '76-100%', count: resources.filter(r => r.current_workload >= 75).length }
  ];

  // Get assigned tasks
  const assignedTasks = tasks.filter(task => task.assigned_resource !== null);

  if (loading) {
    return (
      <Container maxWidth="lg" className="dashboard-container">
        <Box className="loading-container">
          <div className="loading-spinner" />
          <Typography variant="h6">Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="dashboard-container">
      <Typography variant="h2" className="dashboard-title">
        System Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} className="stats-grid">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-content">
                <Box className="stat-icon primary">
                  <People fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h3" className="stat-value">
                    {stats?.total_resources}
                  </Typography>
                  <Typography className="stat-label">Total Resources</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-content">
                <Box className="stat-icon success">
                  <CheckCircle fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h3" className="stat-value success">
                    {stats?.available_resources}
                  </Typography>
                  <Typography className="stat-label">Available</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-content">
                <Box className="stat-icon warning">
                  <Assignment fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h3" className="stat-value warning">
                    {stats?.assigned_tasks}
                  </Typography>
                  <Typography className="stat-label">Assigned Tasks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-content">
                <Box className="stat-icon secondary">
                  <TrendingUp fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h3" className="stat-value secondary">
                    {stats?.average_workload}%
                  </Typography>
                  <Typography className="stat-label">Avg Workload</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} className="charts-grid">
        {/* Department Distribution */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-card">
            <Typography variant="h6" className="chart-title">
              Department Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Availability Status */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-card">
            <Typography variant="h6" className="chart-title">
              Availability Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#27ae60" />
                  <Cell fill="#e74c3c" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Expertise Levels */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-card">
            <Typography variant="h6" className="chart-title">
              Expertise Levels
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expertiseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expertiseData.map((_, index) => (
                    <Cell key={`cell index-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Task Priority */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-card">
            <Typography variant="h6" className="chart-title">
              Task Priority Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Workload Distribution */}
        <Grid item xs={12}>
          <Paper className="chart-card">
            <Typography variant="h6" className="chart-title">
              Workload Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#053687" name="Number of Resources" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Assigned Tasks Table */}
      <Paper className="tasks-table">
        <Typography variant="h6" className="table-title">
          Assigned Tasks ({assignedTasks.length})
        </Typography>
        {assignedTasks.length > 0 ? (
          <Box className="tasks-list">
            {assignedTasks.map(task => {
              const assignedResource = resources.find(r => r.id === task.assigned_resource);
              return (
                <Box key={task.id} className="task-item">
                  <Box className="task-info">
                    <Typography variant="subtitle1" className="task-title">
                      {task.title}
                    </Typography>
                    <Typography variant="body2" className="task-description">
                      {task.description}
                    </Typography>
                    <Box className="task-meta">
                      <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                      <span className="hours-badge">{task.estimated_hours}h</span>
                    </Box>
                  </Box>
                  {assignedResource && (
                    <Box className="assigned-to">
                      <Typography variant="caption">Assigned to:</Typography>
                      <Typography variant="body2" className="resource-name">
                        {assignedResource.name}
                      </Typography>
                      <Typography variant="caption" className="resource-dept">
                        {assignedResource.department} • {assignedResource.current_workload}% workload
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box className="empty-state">
            <Assignment className="empty-icon" />
            <Typography>No tasks assigned yet</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}










