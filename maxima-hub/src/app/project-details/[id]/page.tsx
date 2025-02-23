'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

interface AIEvaluation {
  id: number;
  project: number;
  detailed_description: string;
  plan: string;
  analysis: string;
  feasibility_score: number;
  created_at: string;
}

interface ProjectTask {
  id: number;
  task: string;
  team_member_number: number;
  start_date_time: string;
  end_date_time: string;
  description: string;
  estimate_salary: number;
  created_at: string;
}

interface PageParams {
  id: string;
}

export default function ProjectDetails({ params }: { params: PageParams }) {
  const projectId = params.id;
  
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(true);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else {
      fetchProjectDetails();
      fetchAIEvaluation();
      fetchProjectTasks();
    }
  }, [router, projectId]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/core/api/projects/${projectId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        setError('Failed to fetch project details');
      }
    } catch (err) {
      setError('An error occurred while fetching project details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIEvaluation = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/core/projects/${projectId}/ai-evaluation/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI evaluation:', err);
    } finally {
      setIsLoadingEvaluation(false);
    }
  };

  const fetchProjectTasks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/core/api/project/${projectId}/tasks/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch project tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleGenerateTasks = async () => {
    setIsGeneratingTasks(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/core/api/projects/tasks/generate/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId
        })
      });

      if (res.ok) {
        await fetchProjectTasks();
      }
    } catch (err) {
      console.error('Failed to generate tasks:', err);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    router.push('/login');
  };

  const handleExportProjectDetails = () => {
    if (!project) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    let yPosition = 20;
    const marginBottom = 20;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper function to add text and insert a new page if needed
    const addText = (text: string, fontSize: number = 12, lineHeight: number = 20) => {
      doc.setFontSize(fontSize);
      doc.text(text, 20, yPosition);
      yPosition += lineHeight;
      if (yPosition > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // --- Project Info ---
    addText(project.title, 20, 30);
    addText(`Description: ${project.description || ''}`);
    addText(`Team Size: ${project.team_size}`);
    addText(`Budget: ${project.budget || ''}`);
    addText(`Location: ${project.country || ''}`);
    addText(`Created: ${formatDate(project.created_at)}`);
    yPosition += 10; // extra spacing
    
    // --- AI Evaluation Info ---
    if (evaluation) {
      addText("AI Evaluation", 16, 20);
      addText(`Feasibility Score: ${evaluation.feasibility_score.toFixed(1)}`);
      addText(`Analysis: ${evaluation.analysis || ''}`);
      if (evaluation.plan) {
        addText(`Plan: ${evaluation.plan}`);
      }
      if (evaluation.detailed_description) {
        addText(`Details: ${evaluation.detailed_description}`);
      }
      yPosition += 10;
    }

    // --- Project Tasks Info ---
    if (tasks.length > 0) {
      addText("Project Tasks", 16, 20);
      tasks.forEach((task, index) => {
        addText(`Task ${index + 1}: ${task.task || ''}`);
        addText(`Team Member: ${task.team_member_number}`, 12, 15);
        addText(`Estimated Salary: $${task.estimate_salary}`, 12, 15);
        addText(`Start: ${formatDate(task.start_date_time)}`, 12, 15);
        addText(`End: ${formatDate(task.end_date_time)}`, 12, 15);
        yPosition += 5;
      });
    }

    // Save the PDF file
    doc.save(`${project.title}-report.pdf`);
  };

  const handleExportAsImagePDF = async () => {
    const exportElement = document.getElementById('exportable');
    if (!exportElement) return;

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Get the total height of the content
    const totalHeight = exportElement.scrollHeight;
    let position = 0;
    
    while (position < totalHeight) {
      // Capture the visible portion of the element
      const canvas = await html2canvas(exportElement, {
        scrollY: -position,
        windowHeight: pdfHeight,
        useCORS: true,
        scale: 2, // Increase scale for better quality
        logging: true, // Optional: for debugging
        allowTaint: true, // Allow cross-origin images
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate aspect ratio and dimensions
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      
      // Add the image to the current page
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      
      // Move position for next page
      position += pdfHeight;
      
      // Add new page if there's more content
      if (position < totalHeight) {
        pdf.addPage();
      }
    }

    pdf.save(`${project?.title || 'report'}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error || 'Project not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar onLogout={handleLogout} />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Wrap the desired export content in a container with a unique ID */}
        <div id="exportable">
          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto mb-8">
            <nav className="flex items-center space-x-3 text-sm text-gray-500">
              <button 
                onClick={() => router.push('/dashboard')}
                className="hover:text-gray-700 transition-colors flex items-center group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                     className="w-5 h-5 mr-1 group-hover:text-blue-500 transition-colors">
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
                Dashboard
              </button>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 font-medium">{project.title}</span>
            </nav>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Project Header, Timeline, AI Analysis, and Project Tasks */}
              <div className="lg:col-span-2 space-y-8">
                {/* Project Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
                        <p className="text-gray-600 leading-relaxed">{project.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${project.status === 'approved' ? 'bg-green-100 text-green-800' :
                         project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                         'bg-yellow-100 text-yellow-800'}`}>
                        {project.status || 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Team Size</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{project.team_size}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Budget</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{project.budget}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{project.country}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="mt-2 text-lg font-semibold text-gray-900">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-sm font-medium text-gray-500">Start Date</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(project.start_date)}</p>
                      </div>
                      <div className="flex-[2] mx-4 relative">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <div className="absolute -top-2 left-[40%] transform -translate-x-1/2">
                          <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-white"></div>
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-sm font-medium text-gray-500">End Date</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(project.end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">AI Project Analysis</h2>
                  </div>
                  <div className="p-6">
                    {isLoadingEvaluation ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : evaluation ? (
                      <div className="space-y-6">
                        {/* Feasibility Score */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">Feasibility Score</span>
                            <div className="group relative">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48">
                                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2">
                                  Score ranges from 0 to 10, higher is better
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  evaluation.feasibility_score >= 7 ? 'bg-green-500' :
                                  evaluation.feasibility_score >= 4 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(evaluation.feasibility_score / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-lg font-semibold text-gray-900">
                              {evaluation.feasibility_score.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Analysis */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Analysis</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{evaluation.analysis}</p>
                          </div>
                        </div>

                        {/* Detailed Description if available */}
                        {evaluation.detailed_description && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Detailed Description</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-700 whitespace-pre-wrap">{evaluation.detailed_description}</p>
                            </div>
                          </div>
                        )}

                        {/* Project Plan if available */}
                        {evaluation.plan && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Project Plan</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-700 whitespace-pre-wrap">{evaluation.plan}</p>
                            </div>
                          </div>
                        )}

                        {/* Last Updated */}
                        <div className="text-sm text-gray-500">
                          Last updated: {formatDate(evaluation.created_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No AI analysis available for this project.
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Tasks */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Project Tasks</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage team tasks and assignments</p>
                    </div>
                    {!isLoadingTasks && tasks.length === 0 && (
                      <button
                        onClick={handleGenerateTasks}
                        disabled={isGeneratingTasks}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                                 text-white bg-gradient-to-r from-blue-500 to-purple-600
                                 hover:from-blue-600 hover:to-purple-700
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-200 ease-in-out
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isGeneratingTasks ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Tasks...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2">
                              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
                            </svg>
                            Generate Tasks
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    {isLoadingTasks ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : tasks.length > 0 ? (
                      <div className="space-y-6">
                        {tasks.map((task) => (
                          <div key={task.id} className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="text-lg font-medium text-gray-900">{task.task}</h3>
                                <p className="text-sm text-gray-500">Team Member #{task.team_member_number}</p>
                                <p className="text-sm text-gray-500">Estimated Salary: ${task.estimate_salary}</p>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Task #{task.id}
                              </span>
                            </div>

                            <p className="text-gray-600">{task.description}</p>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Start Date</p>
                                <div className="mt-1 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 mr-1.5">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-gray-900">
                                    {new Date(task.start_date_time).toLocaleString('en-US', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">End Date</p>
                                <div className="mt-1 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400 mr-1.5">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-gray-900">
                                    {new Date(task.end_date_time).toLocaleString('en-US', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 pt-2">
                              Created: {formatDate(task.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 mx-auto text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Tasks Found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Click the generate button above to create tasks for this project.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar - Right Column */}
              <div className="space-y-8">
                {/* Created By */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Project Owner</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg text-white font-semibold">{project.user.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{project.user}</p>
                        <p className="text-sm text-gray-500">Project Lead</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {!isLoadingTasks && tasks.length === 0 && (
                        <button
                          onClick={handleGenerateTasks}
                          disabled={isGeneratingTasks}
                          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium
                                   text-white bg-gradient-to-r from-blue-500 to-purple-600
                                   hover:from-blue-600 hover:to-purple-700
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-200 ease-in-out"
                        >
                          {isGeneratingTasks ? 'Generating Tasks...' : 'Generate Tasks'}
                        </button>
                      )}
                      <button
                        onClick={handleExportProjectDetails}
                        className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium
                                   text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200
                                   transition-all duration-200 ease-in-out"
                      >
                        Export Project Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions: Export Button (outside of the exportable area) */}
        <div className="max-w-7xl mx-auto mt-8">
          <button
            onClick={handleExportAsImagePDF}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium 
                       text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200
                       transition-all duration-200 ease-in-out"
          >
            Export as Styled PDF
          </button>
        </div>
      </main>
    </div>
  );
} 