import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AfterSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title, link } = location.state || {};

  const handleSubmitAnotherResponse = () => {
    // Navigate to the form with the correct identifier
    navigate(`/form/${link}`);
  };

  const handleEditResponse = () => {
    // Navigate to the form with the correct identifier and pass responseId for editing
    navigate(`/form/${link}`, { state: { responseId: "your-response-id" } });
  };

  return (
    <div className="absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {/* Form Name */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>

        {/* Thank You Message */}
        <p className="text-gray-600 mb-6">Thank you for submitting!</p>

        {/* Buttons */}
        <div className="flex flex-col space-y-4">
          {/* Submit Another Response Button */}
          <button
            onClick={handleSubmitAnotherResponse}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Submit Another Response
          </button>

          {/* Edit Response Button */}
          <button
            onClick={handleEditResponse}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
          >
            Edit Response
          </button>
        </div>
      </div>
    </div>
  );
};

export default AfterSubmission;