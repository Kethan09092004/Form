import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ViewResponses = () => {
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formId } = useParams(); // Extract formId correctly from URL params

  // Fetch responses from the backend
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/responses/${formId}`);
        setResponses(res.data);
      } catch (error) {
        console.error('Error fetching responses:', error);
      }
    };

    if (formId) {
      fetchResponses();
    }
  }, [formId]);

  // Open modal with selected response
  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  return (
    <div className="absolute left-0 top-0 w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">Form Responses</h1>
      <div className="overflow-x-auto rounded-lg shadow-sm max-w-[80%] bg-white">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {responses.map((response, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {response.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewResponse(response)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                  >
                    View Response
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing responses */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
  {selectedResponse && (
    <div className='max-h-[650px] overflow-x-auto scrollbar-hide'>
      <h2 className="text-xl font-bold mb-4">User Response</h2>
      <div className="space-y-4">
        {Array.isArray(selectedResponse.questions) ? (
          selectedResponse.questions.map((question, index) => (
            <div key={question.id}>
              <p className="font-semibold">{question.text}</p>
              <p className="text-gray-600">
                {selectedResponse.answers && typeof selectedResponse.answers === "object"
                  ? selectedResponse.answers[question.id] || "No answer provided"
                  : "No answer provided"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No questions available.</p>
        )}
      </div>
    </div>
  )}
</Modal>

    </div>
  );
};

export default ViewResponses;
