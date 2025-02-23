'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { countries } from 'countries-list';

interface Project {
  id: number;
  user: string;
  title: string;
  description: string;
  team_size: number;
  start_date: string;
  end_date: string;
  country: string;
  budget: string;
  status?: string;
  created_at: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  team_size: number;
  start_date: string;
  end_date: string;
  country: string;
  budget: string;
}

interface FilterOptions {
  status: string;
  country: string;
  dateRange: 'all' | 'week' | 'month' | 'year';
}

interface ProjectStatistics {
  total_projects: number;
  projects_with_low_feasibility: number;
  projects_with_high_feasibility: number;
}

// Convert countries object to array for dropdown
const countryList = Object.entries(countries).map(([code, country]) => ({
  code,
  name: country.name
})).sort((a, b) => a.name.localeCompare(b.name));

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    team_size: 1,
    start_date: '',
    end_date: '',
    country: '',
    budget: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    country: 'all',
    dateRange: 'all'
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [statistics, setStatistics] = useState<ProjectStatistics>({
    total_projects: 0,
    projects_with_low_feasibility: 0,
    projects_with_high_feasibility: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Redirect to login if the user is not authenticated
      router.push('/login');
    } else {
      fetchProjects();
      fetchStatistics();
    }
  }, [router]);

  const handleLogout = () => {
    // Remove tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    // Redirect to login page after logout
    router.push('/login');
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/core/api/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/core/projects/statistics/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/core/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          team_size: 1,
          start_date: '',
          end_date: '',
          country: '',
          budget: ''
        });
        // Refresh projects list
        fetchProjects();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create project');
      }
    } catch (err) {
      setError('An error occurred while creating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and pagination logic
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        filters.status === 'all' || project.status === filters.status;

      const matchesCountry = 
        filters.country === 'all' || project.country === filters.country;

      const matchesDate = () => {
        if (filters.dateRange === 'all') return true;
        const projectDate = new Date(project.created_at);
        const now = new Date();
        switch (filters.dateRange) {
          case 'week':
            return projectDate >= new Date(now.setDate(now.getDate() - 7));
          case 'month':
            return projectDate >= new Date(now.setMonth(now.getMonth() - 1));
          case 'year':
            return projectDate >= new Date(now.setFullYear(now.getFullYear() - 1));
          default:
            return true;
        }
      };

      return matchesSearch && matchesStatus && matchesCountry && matchesDate();
    });
  }, [projects, searchTerm, filters]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique countries for filter
  const uniqueCountries = useMemo(() => {
    return ['all', ...new Set(projects.map(project => project.country))];
  }, [projects]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar onLogout={handleLogout} />
      
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Project Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">Track and manage your project portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                     bg-blue-600 text-white hover:bg-blue-700
                     transition-all duration-200 ease-in-out shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                  <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h15a3 3 0 013 3v4.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{statistics.total_projects}</p>
                  <p className="ml-2 text-sm text-gray-500">projects</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-600">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Feasibility</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{statistics.projects_with_high_feasibility}</p>
                  <p className="ml-2 text-sm text-gray-500">projects</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-green-500 rounded-full" 
                style={{ 
                  width: `${(statistics.projects_with_high_feasibility / statistics.total_projects) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-600">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Low Feasibility</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{statistics.projects_with_low_feasibility}</p>
                  <p className="ml-2 text-sm text-gray-500">projects</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-1 bg-yellow-500 rounded-full" 
                style={{ 
                  width: `${(statistics.projects_with_low_feasibility / statistics.total_projects) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Projects Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Projects Overview</h2>
                <p className="text-sm text-gray-600">Manage and monitor your projects</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-64 px-4 py-2 pr-10 rounded-lg border border-gray-300 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-sm"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                       className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2">
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                         text-gray-700 bg-gray-50 border border-gray-300
                         hover:bg-gray-100 transition-all duration-200 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                    <path fillRule="evenodd" d="M3.792 2.938A40.014 40.014 0 0112 2a40.014 40.014 0 018.208.938.75.75 0 01.54.721v1.591a3 3 0 01-.879 2.121L14.76 12l5.109 4.629A3 3 0 0120.75 18.75v1.591a.75.75 0 01-.54.721A40.014 40.014 0 0112 22a40.014 40.014 0 01-8.208-.938.75.75 0 01-.54-.721v-1.591a3 3 0 01.879-2.121L9.24 12 4.131 7.371A3 3 0 013.25 5.25V3.75a.75.75 0 01.542-.812z" clipRule="evenodd" />
                  </svg>
                  Filters
                  {(filters.status !== 'all' || filters.country !== 'all' || filters.dateRange !== 'all') && (
                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : paginatedProjects.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No projects found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Team Size</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Timeline</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{project.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {project.team_size} members
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {project.country}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div>{formatDate(project.start_date)}</div>
                        <div className="text-gray-400">to</div>
                        <div>{formatDate(project.end_date)}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        ${parseInt(project.budget).toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${project.status === 'approved' ? 'bg-green-100 text-green-800' :
                             project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                             'bg-yellow-100 text-yellow-800'}`}>
                            {project.status || 'Pending'}
                          </span>
                          <button
                            onClick={() => router.push(`/project-details/${project.id}`)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 hover:text-blue-600">
                              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                              <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium
                         text-gray-700 bg-white border border-gray-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                              ${currentPage === i + 1
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium
                         text-gray-700 bg-white border border-gray-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="team_size" className="block text-sm font-medium text-gray-700 mb-1">
                        Team Size <span className="text-gray-400">(Max: 5)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="team_size"
                          value={formData.team_size}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              setFormData({...formData, team_size: Math.min(Math.max(1, value), 5)});
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) {
                              setFormData({...formData, team_size: 1});
                            } else if (value > 5) {
                              setFormData({...formData, team_size: 5});
                            }
                          }}
                          min="1"
                          max="5"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            className="w-5 h-5 text-gray-400"
                          >
                            <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                            <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Enter a number between 1 and 5</p>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                   appearance-none bg-white"
                          required
                        >
                          <option value="">Select a country</option>
                          {countryList.map(country => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                               className="w-5 h-5 text-gray-400">
                            <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        id="start_date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        id="end_date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                        Budget (USD)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          id="budget"
                          value={formData.budget}
                          onChange={(e) => {
                            // Remove any non-numeric characters
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value === '') {
                              setFormData({...formData, budget: ''});
                            } else {
                              const numberValue = parseInt(value);
                              if (!isNaN(numberValue)) {
                                // Store the raw number in state
                                setFormData({...formData, budget: numberValue.toString()});
                              }
                            }
                          }}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                               className="w-5 h-5 text-gray-400">
                            <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Enter amount in USD (numbers only)</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600
                           hover:from-blue-600 hover:to-purple-700
                           text-white text-sm font-medium rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 ease-in-out"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Project Modal */}
        {isViewModalOpen && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedProject(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedProject.title}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created by</p>
                        <p className="mt-1 text-gray-900">{selectedProject.user}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created at</p>
                        <p className="mt-1 text-gray-900">{formatDate(selectedProject.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1 text-gray-900">{selectedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Team Size</p>
                      <p className="mt-1 text-gray-900">{selectedProject.team_size} members</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Country</p>
                      <p className="mt-1 text-gray-900">{selectedProject.country}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Start Date</p>
                      <p className="mt-1 text-gray-900">{formatDate(selectedProject.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">End Date</p>
                      <p className="mt-1 text-gray-900">{formatDate(selectedProject.end_date)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Budget</p>
                    <p className="mt-1 text-gray-900">{selectedProject.budget}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${selectedProject.status === 'approved' ? 'bg-green-100 text-green-800' :
                       selectedProject.status === 'rejected' ? 'bg-red-100 text-red-800' :
                       'bg-yellow-100 text-yellow-800'}`}>
                      {selectedProject.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
