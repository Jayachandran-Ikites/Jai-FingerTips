import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import filesData from "../utilities/files_docs.json";
import { renderSourceDocument } from "../utilities/sourceFormatter";

const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId && filesData[documentId]) {
      const data = filesData[documentId];
      const firstLine = data.lines?.L1?.content || documentId;
      const title = firstLine.replace(" Pathway", "").replace(" pathway", "");
      setDocumentTitle(title.charAt(0).toUpperCase() + title.slice(1));
      setDocumentData(data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [documentId]);

  const getDocumentIcon = (id) => {
    const icons = {
      asthma: "🫁",
      anaemia: "🩸",
      chestpain: "💔",
      copd: "🫁",
      diabetic_foot_ulcer: "🦶",
      Diarrhoea: "💧",
      fever: "🌡️",
      heart_failure: "❤️",
      pneumonia: "🫁",
      stroke: "🧠",
    };
    return icons[id] || "📋";
  };

  const getDocumentColor = (id) => {
    const colors = {
      asthma: "from-blue-500 to-blue-600",
      anaemia: "from-red-500 to-red-600",
      chestpain: "from-pink-500 to-pink-600",
      copd: "from-cyan-500 to-cyan-600",
      diabetic_foot_ulcer: "from-orange-500 to-orange-600",
      Diarrhoea: "from-green-500 to-green-600",
      fever: "from-yellow-500 to-yellow-600",
      heart_failure: "from-red-500 to-red-600",
      pneumonia: "from-indigo-500 to-indigo-600",
      stroke: "from-purple-500 to-purple-600",
    };
    return colors[id] || "from-gray-500 to-gray-600";
  };

  const handleBackToPathways = () => {
    navigate("/pathways");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Document Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested document could not be found.
          </p>
          <button
            onClick={handleBackToPathways}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Pathways
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-50 text-gray-800 shadow-lg no-print fixed top-0 left-0 w-full z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 md:px-7 lg:px-8 xl:px-8 2xl:px-8">
          <div className="flex sm:flex-row sm:items-center sm:justify-between py-[0.5rem] l:py-[1rem] lg:py-[1rem] 2xl:py-[1rem]">
            <div className="flex flex-col sm:flex-row sm:items-center w-full">
              <div className="flex items-center w-full">
                <button
                  onClick={handleBackToPathways}
                  className="mr-2 sm:mr-4 p-2 pl-0 pr-0 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-2xl sm:text-3xl mr-2 sm:mr-4">
                  {getDocumentIcon(documentId)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-[0.9rem] sm:text-2xl font-bold truncate">{documentTitle}</h1>
                  <p className="text-xs sm:text-sm italic whitespace-nowrap">Medical Pathway & Guidelines</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex items-center px-3 sm:px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors w-auto sm:w-[4rem] md:w-auto xl:w-auto 2xl:w-auto justify-center border border-grey-500"
              >
                <svg
                  className="w-5 h-5 mr-0 sm:mr-0 md:mr-2 xl:mr-2 2xl:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span className="hidden sm:hidden md:block xl:block 2xl:block">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Document Content */}
          <div className="p-8">
            <div className="document-content prose prose-lg max-w-none">
              {renderSourceDocument(filesData, documentId, null)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center no-print">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              This document contains evidence-based clinical guidelines and
              pathways for healthcare professionals.
            </p>
            <button
              onClick={handleBackToPathways}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Pathways
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
