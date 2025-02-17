import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const PublicForm = () => {
  const { link } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchForm = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${link}`);
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error('Error fetching form:', error);
      }
    };

    fetchForm();
  }, [link, isAuthenticated]);

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userEmail) {
      alert('You must be signed in to submit a response.');
      setIsSubmitting(false);
      return;
    }

    try {
      await fetch('http://localhost:5000/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          answers,
          email: userEmail,
        }),
      });

      alert('Response submitted successfully!');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = (response) => {
    const { credential } = response;
    const user = JSON.parse(atob(credential.split('.')[1])); // Decode the JWT and get the payload
    setUserEmail(user.email);
    setIsAuthenticated(true);
    localStorage.setItem('userEmail', user.email);
  };

  const handleLoginFailure = (error) => {
    console.error('Login failed:', error);
    alert('Google login failed. Please try again!');
  };

  if (!isAuthenticated) {
    return (
      <div className="absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Sign in with Google</h2>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
            useOneTap
            shape="pill"
            theme="filled_blue"
          />
        </div>
      </div>
    );
  }

  if (!form) {
    return <div>Loading...</div>;
  }

  return (
    <div className="absolute left-0 top-0 w-[100%] min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl text-center font-bold mb-4">{form.title}</h1>
        <p className="text-gray-700 text-center mb-6">{form.description}</p>

        <form onSubmit={handleSubmit}>
          {form.questions.map((question, index) => (
            <div key={question.id} className="mb-6">
              <label className="block text-lg font-medium mb-2">
                {index + 1}. {question.text}
              </label>
              {question.type === 'text' && (
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}
              {question.type === 'paragraph' && (
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}
              {['radio', 'checkbox'].includes(question.type) && (
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type={question.type}
                        name={`question-${question.id}`}
                        value={option}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className="mr-2"
                        required={question.required}
                      />
                      <label>{option}</label>
                    </div>
                  ))}
                </div>
              )}
              {question.type === 'dropdown' && (
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  required={question.required}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option, i) => (
                    <option key={i} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicForm;
