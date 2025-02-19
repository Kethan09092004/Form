import axios from "axios";
import React from "react";
import toast from "react-hot-toast";
import { PDFDocument } from 'pdf-lib';
import { useLocation, useNavigate } from "react-router-dom";

const AfterSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title, link, formId, userEmail, submittedAt } = location.state || {};

  const handleSubmitAnotherResponse = () => {
    navigate(`/form/${link}`);
  };

  async function addLogoToPdf(pdfBytes, logoUrl) {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    
    // Loop through all pages and add logo
    for (const page of pages) {
        page.drawImage(logoImage, {
            x: 50,
            y: page.getHeight() - 100,
            width: 100,
            height: 50,
        });
    }


    // Save the modified PDF
    return await pdfDoc.save();
  }

  const DownLoadResponse = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/responses/download/userpdf?formId=${formId}&userEmail=${encodeURIComponent(userEmail)}&submittedAt=${encodeURIComponent(submittedAt)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const pdfBytes = await res.data.arrayBuffer();
      const modifiedPdfBytes = await addLogoToPdf(pdfBytes, 'https://res.cloudinary.com/dw6ysqs5g/image/upload/v1739884585/Screenshot_2025-02-18_183132_fbvy6m.png');

      // Create a blob and download
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}_response.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF downloaded successfully with logo!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">Thank you for submitting!</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleSubmitAnotherResponse}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Submit Another Response
          </button>
          <button
            onClick={DownLoadResponse}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
          >
            Download Response
          </button>
        </div>
      </div>
    </div>
  );
};

export default AfterSubmission;
