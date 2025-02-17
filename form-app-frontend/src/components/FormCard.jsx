import React, { useState } from 'react';
import FormPreviewModal from './FormPreviewModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { FiDownload } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
const FormCard = ({ form, onDelete }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedForm,setSelectedForm]=useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const handleFormDownloadType = async (formId) => {
    setDownloadModal(true);
    setSelectedForm(formId);
  }
  const handleCloseDownloadModal = async () => {
    setDownloadModal(false);
    setSelectedForm(null);
  }
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


  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
     
      <div className='flex  gap-4'>
        <div>
        <h3 className="text-lg font-semibold text-gray-800 truncate">{form.title}</h3>
      
      <p className="text-sm text-gray-500 mt-2">
        Created: {new Date(form.createdAt).toLocaleDateString()}
      </p>
        </div>

      <div className='mt-3 flex items-center gap-2 justify-between border-t pt-3'>
      <button 
          onClick={() => window.open(`/responses/${form.id}`)}
          className="text-blue-600 hover:text-blue-700 flex items-center"
        >
         👁️ Response
        </button>
        <button 
          onClick={() => handleFormDownloadType(form._id)}
          className="text-green-600 hover:text-green-700 flex items-center"
        >
          <FaFileDownload />
        </button>
      </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <a
          href={form.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 flex items-center"
        >
          🔗 Form Link
        </a>
        <button 
          onClick={() => setIsPreviewOpen(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center"
        >
          👁️ Preview
        </button>
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-red-600 hover:text-red-700 flex items-center"
        >
          🗑️ Delete
        </button>
      </div>

      {isPreviewOpen && (
        <FormPreviewModal form={form} onClose={() => setIsPreviewOpen(false)} />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          form={form}
          onConfirm={() => {
            onDelete(form.id);
            setIsDeleteModalOpen(false);
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
              {downloadModal && (
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
                  onClick={() => handleDownloadPDF(form.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownloadCSV(form.id)} 
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default FormCard;