import React from 'react';

const FormPreviewModal = ({ form, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Preview Form</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✖️
          </button>
        </div>
        <div className="space-y-4 max-h-[650px] overflow-x-auto scrollbar-hide">
          <h3 className="text-lg font-semibold">{form.title}</h3>
          <p className="text-sm text-gray-500">{form.description}</p>
          {form.questions.map((question, index) => (
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
  );
};

export default FormPreviewModal;