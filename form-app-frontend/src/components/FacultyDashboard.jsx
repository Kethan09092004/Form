import React, { useState, useEffect } from 'react';
import FormCard from './FormCard';


const FacultyDashboard = () => {
  const [forms, setForms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'paragraph', label: 'Long Answer' },
    { value: 'radio', label: 'Multiple Choice (Single)' },
    { value: 'checkbox', label: 'Multiple Choice (Multiple)' },
    { value: 'dropdown', label: 'Dropdown' }
  ];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'text',
    text: '',
    required: false,
    options: []
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchForms();
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchForms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch forms');
      const data = await response.json();
      setForms(data);
    } catch (error) {
      showAlert('Failed to fetch forms', 'error');
    }
  };

  const handleCreateForm = async () => {
    if (!formData.title || formData.questions.length === 0) {
      showAlert('Please add a title and at least one question', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create form');
      
      showAlert('Form created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', questions: [] });
      fetchForms();
    } catch (error) {
      showAlert('Failed to create form', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/forms/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete form');
      
      showAlert('Form deleted successfully!');
      fetchForms();
    } catch (error) {
      showAlert('Failed to delete form', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  const addQuestion = () => {
    if (!currentQuestion.text) {
      showAlert('Question text is required', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
    }));
    setCurrentQuestion({
      type: 'text',
      text: '',
      required: false,
      options: []
    });
  };

  const removeQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  return (
    <div className=" absolute left-0 top-0 w-[100%] min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded ${alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {alert.message}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              📄 Faculty Portal
            </h1>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            📄 Your Forms
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            ➕ Create New Form
          </button>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} onDelete={handleDeleteForm} />
          ))}
        </div>

        {/* Empty State */}
        {forms.length === 0 && (
          <div className="bg-white rounded-lg shadow-md text-center py-12">
            <p className="text-lg text-gray-500">📄 No forms created yet</p>
          </div>
        )}

        {/* Create Form Modal */}
        {isModalOpen && (
          <div className=" fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[650px] overflow-x-auto scrollbar-hide">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Form</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✖️
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Form Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                
                <textarea
                  placeholder="Form Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Add Question</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Question Text"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion(prev => ({
                        ...prev,
                        type: e.target.value,
                        options: ['radio', 'checkbox', 'dropdown'].includes(e.target.value) ? [''] : []
                      }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {questionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    {['radio', 'checkbox', 'dropdown'].includes(currentQuestion.type) && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = e.target.value;
                                setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                              }}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                            <button
                              onClick={() => {
                                const newOptions = [...currentQuestion.options];
                                newOptions.splice(index, 1);
                                setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              ✖️
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setCurrentQuestion(prev => ({
                            ...prev,
                            options: [...prev.options, '']
                          }))}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          ➕ Add Option
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentQuestion.required}
                        onChange={(e) => setCurrentQuestion(prev => ({
                          ...prev,
                          required: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm text-gray-600">Required</label>
                    </div>

                    <button 
                      onClick={addQuestion}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      ➕ Add Question
                    </button>
                  </div>
                </div>

                {/* Question List */}
                {formData.questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{index + 1}. {question.text}</p>
                        <p className="text-sm text-gray-500">
                          {questionTypes.find(t => t.value === question.type)?.label}
                          {question.required && ' • Required'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end space-x-4 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateForm}
                    disabled={isCreating}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {isCreating ? 'Creating...' : 'Create Form'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;