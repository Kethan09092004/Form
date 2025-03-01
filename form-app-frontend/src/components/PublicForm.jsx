import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const PublicForm = () => {
  const { link } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("formAuth") === "true");

  // Retrieve answers from localStorage or set default empty object
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem("answers");
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });

  const [time, setTime] = useState(1);

  // Update localStorage with answers every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    localStorage.setItem("answers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchForm = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${link}`);
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
      }
    };

    fetchForm();
  }, [link, isAuthenticated]);

  const formId = form?.id;
  const submittedAt = new Date().toISOString();

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userEmail) {
      alert("You must be signed in to submit a response.");
      setIsSubmitting(false);
      return;
    }

    try {
      await fetch("http://localhost:5000/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          answers,
          email: userEmail,
        }),
      });

      navigate("/submitted", { state: { title: form.title, link, formId, userEmail, submittedAt } });
      localStorage.removeItem("answers");
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = (response) => {
    const { credential } = response;
    const user = JSON.parse(atob(credential.split(".")[1]));
    setUserEmail(user.email);
    setIsAuthenticated(true);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("formAuth", "true");
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("formAuth");
    setUserEmail("");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Sign in with Google</h2>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => alert("Google login failed. Please try again!")}
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
      {/* Top Navbar */}
      <div className="absolute top-4 left-60 flex items-center">
        {userEmail && (
          <span className="text-gray-800 font-medium">Welcome, {userEmail}</span>
        )}
      </div>

      <div className="absolute top-4 right-10">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
        <h1 className="text-2xl text-center font-bold mb-4">{form.title}</h1>
        <p className="text-gray-700 text-center mb-6">{form.description}</p>

        <form onSubmit={handleSubmit}>
          {form.questions.map((question, index) => (
            <div key={question.id} className="mb-6">
              <label className="block text-lg font-medium mb-2">
                {index + 1}. {question.text}
              </label>
              {question.type === "text" && (
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}
              {question.type === "paragraph" && (
                <textarea
                  value={answers[question.id] || ""}
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}
              {["radio", "checkbox"].includes(question.type) && (
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type={question.type}
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className="mr-2"
                        required={question.required}
                      />
                      <label>{option}</label>
                    </div>
                  ))}
                </div>
              )}
              {question.type === "dropdown" && (
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={answers[question.id] || ""}
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
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicForm;
