import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUserPlus, FiUsers, FiFileText, FiMessageSquare, FiMail, FiUser, FiX, FiArrowLeft } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    faculty: 0,
    forms: 0,
    responses: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [formsList, setFormsList] = useState([]);
  const [responsesList, setResponsesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: ''
  });
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormPreviewModal, setShowFormPreviewModal] = useState(false);
 // const [selectedFormResponses, setSelectedFormResponses] = useState([]);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  
  const handleFormPreview = async (form) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/forms/${form._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedForm(res.data);
      setShowFormPreviewModal(true);
    } catch (error) {
      console.error('Error fetching form details:', error);
      toast.error('Failed to load form details');
    }
  };

  const handleCloseFormPreviewModal = () => {
    setShowFormPreviewModal(false);
    setSelectedForm(null);
  };
  const handleDownloadCSV = async (formId) => {
    console.log('Form ID:', formId);
    const token = localStorage.getItem('token');
    try {
      // Fetch form details to get the title
      const formRes = await axios.get(`http://localhost:5000/api/admin/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formTitle = formRes.data.title || `form_${formId}`;
  
      // Fetch responses as CSV
      const res = await axios.get(`http://localhost:5000/api/admin/responses/download/csv/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
  
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading form:', error);
      toast.error('Failed to download form');
    }
  };
  const handleDownloadPDF = async (formId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/responses/download/pdf/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for handling binary data
      });
  
      // Create a blob URL for the PDF file
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_${formId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };
  


  // const handleShowResponses = async (formId) => {
  //   const token = localStorage.getItem('token');
  //   try {
  //     const res = await axios.get(`http://localhost:5000/api/admin/responses/${formId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //    // console.log('Server Response:', res.data); 

  //     // Transform answers into an array for each response
  //     const formattedResponses = res.data.map(response => {
  //       const answersArray = response.questions.map(question => {
  //         return response.answers[question.id] || ''; // Use question ID to get the answer
  //       });

  //       return {
  //         ...response, // Keep other properties (e.g., email, questions)
  //         answers: answersArray, // Replace the answers object with the transformed array
  //       };
  //     });

  //     setSelectedFormResponses(formattedResponses);
  //     setShowResponsesModal(true); // Show the modal
  //   } catch (error) {
  //     console.error('Error fetching responses:', error);
  //     toast.error('Failed to load responses');
  //   }
  // };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'faculty') {
      fetchFacultyList();
    } else if (activeTab === 'forms') {
      fetchFormsList();
    } 
    
  }, [activeTab]);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        faculty: res.data.facultyCount,
        forms: res.data.formsCount,
        responses: res.data.responsesCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const fetchFacultyList = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/faculty', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacultyList(res.data);
    } catch (error) {
      console.error('Error fetching faculty list:', error);
      toast.error('Failed to load faculty details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormsList = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/forms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormsList(res.data);
    } catch (error) {
      console.error('Error fetching forms list:', error);
      toast.error('Failed to load forms details');
    } finally {
      setLoading(false);
    }
  };

  // const fetchResponsesList = async () => {
  //   setLoading(true);
  //   const token = localStorage.getItem('token');
  //   try {
  //     const res = await axios.get('http://localhost:5000/api/admin/responses', {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setResponsesList(res.data);
  //     console.log(res.data);
  //   } catch (error) {
  //     console.error('Error fetching responses list:', error);
  //     toast.error('Failed to load responses details');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyForm.email || !facultyForm.name) {
      toast.error('Please enter both name and email');
      return;
    }

    const toastId = toast.loading('Creating faculty account...');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/create',
        facultyForm,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success('Faculty created successfully!', { id: toastId });
      setFacultyForm({ name: '', email: '' });
      setShowFacultyModal(false);
      fetchStats();
      fetchFacultyList();
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error(error.response?.data?.error || 'Failed to create faculty', { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleCardClick = (tab) => {
    setActiveTab(tab);
  };
  const handleFormDownloadType = async (formId) => {
    setDownloadModal(true);
    setSelectedForm(formId);
  }
  const handleCloseDownloadModal = async () => {
    setDownloadModal(false);
    setSelectedForm(null);
  }

  return (
    <div className="absolute left-0 top-0 w-[100%] min-h-screen bg-gray-50 flex flex-col items-center">
      <Toaster position="top-center" />

      {/* Navigation Bar - Full Width but Content Centered */}
      <nav className="bg-white shadow-sm w-full">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-0">
              <div className="flex-shrink-0 flex items-center">
                <span className="bg-blue-600 text-white font-semibold rounded-md text-lg px-3 py-1">Admin</span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2  text-sm font-medium  ${
                    activeTab === 'dashboard' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered with Fixed Width */}
      <main className="max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Clickable Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div onClick={() => handleCardClick('faculty')} className="cursor-pointer">
                <StatCard 
                  icon={<FiUsers className="w-6 h-6 text-blue-600" />}
                  title="Total Faculty"
                  value={stats.faculty}
                  color="blue"
                />
              </div>
              <div onClick={() => handleCardClick('forms')} className="cursor-pointer">
                <StatCard 
                  icon={<FiFileText className="w-6 h-6 text-green-600" />}
                  title="Total Forms"
                  value={stats.forms}
                  color="green"
                />
              </div>
              {/* <div onClick={() => handleCardClick('responses')} className="cursor-pointer">
                <StatCard 
                  icon={<FiMessageSquare className="w-6 h-6 text-purple-600" />}
                  title="Total Responses"
                  value={stats.responses}
                  color="purple"
                />
              </div> */}
            </div>
          </>
        )}

        {/* Back to Dashboard Button */}
        {activeTab !== 'dashboard' && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        )}

        {/* Faculty List */}
        {activeTab === 'faculty' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <FiUsers className="w-5 h-5 text-gray-600" />
                <span>Faculty List</span>
              </h2>
              <button
                onClick={() => setShowFacultyModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <FiUserPlus className="w-5 h-5" />
                <span>Add Faculty</span>
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forms Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {facultyList.map((faculty) => (
                      <tr key={faculty._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <FiUser className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <FiMail className="mr-2" />
                            {faculty.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {faculty.formsCount || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {facultyList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No faculty members found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Forms List */}
        {activeTab === 'forms' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <FiFileText className="w-5 h-5 text-gray-600" />
                <span>Forms List</span>
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formsList.map((form) => (
                      <tr key={form._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleFormPreview(form)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {form.title}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{form.createdBy || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(form.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {form.responsesCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                           onClick={()=>window.open("/responses/"+form._id)}
                            className="text-sm font-medium text-green-600 hover:text-green-800"
                          >
                            Show Responses
                          </button>
                          <button
                            onClick={() => handleFormDownloadType(form._id)}
                            className="text-sm font-medium text-red-600 hover:text-green-800"
                          >
                            Download
                          </button>
                          
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {formsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No forms found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {downloadModal && selectedForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Download Form</h2>
                <button 
                  onClick={handleCloseDownloadModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✖️
                </button>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => handleDownloadPDF(selectedForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownloadCSV(selectedForm)} 
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Form Preview Modal */}  
        {showFormPreviewModal && selectedForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Preview Form</h2>
                <button 
                  onClick={handleCloseFormPreviewModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✖️
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{selectedForm.title}</h3>
                <p className="text-sm text-gray-500">{selectedForm.description}</p>
                {selectedForm.questions.map((question, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-4">
                    <p className="font-medium">{index + 1}. {question.text}</p>
                    <p className="text-sm text-gray-500">
                      {question.type} • {question.required ? 'Required' : 'Optional'}
                    </p>
                    {['radio', 'checkbox', 'dropdown'].includes(question.type) && (
                      <div className="mt-2 space-y-2">
                        {question.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <input
                              type={question.type === 'checkbox' ? 'checkbox' : 'radio'}
                              disabled
                              className="rounded border-gray-300"
                            />
                            <label className="text-sm text-gray-600">{option}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Responses Modal */}
        {/* {showResponsesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Form Responses</h2>
                <button 
                  onClick={() => setShowResponsesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✖️
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      {selectedFormResponses[0]?.questions.map((question, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {question.text}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedFormResponses.map((response, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{response.email}</div>
                        </td>
                        {response.answers.map((answer, idx) => (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {answer}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )} */}
      </main>

      {/* Faculty Creation Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Faculty</h3>
              <button
                onClick={() => setShowFacultyModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateFaculty}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter faculty name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter faculty email"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Create Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;