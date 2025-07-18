import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/chat/Header";
import { AuthContext } from "../context/AuthContext.jsx";
import filesData from "../utilities/files_docs.json";
import { renderSourceDocument } from "../utilities/sourceFormatter";
// Material Design
import {
  MdFavorite,
  MdBloodtype,
  MdOutlineWaterDrop,
  MdThermostat,
  MdOutlineMonitorHeart,
  MdOutlineCoronavirus,
  MdOutlinePsychology,
  MdMenuBook,
} from "react-icons/md";
// Game Icons
import { GiLungs, GiFootprint } from "react-icons/gi";

const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useContext(AuthContext);
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
      asthma: <GiLungs className="text-2xl sm:text-3xl" />, // match Pathways.jsx
      anaemia: <MdBloodtype className="text-2xl sm:text-3xl" />,
      chestpain: <MdFavorite className="text-2xl sm:text-3xl" />,
      copd: <GiLungs className="text-2xl sm:text-3xl" />,
      diabetic_foot_ulcer: <GiFootprint className="text-2xl sm:text-3xl" />,
      Diarrhoea: <MdOutlineWaterDrop className="text-2xl sm:text-3xl" />,
      fever: <MdThermostat className="text-2xl sm:text-3xl" />,
      heart_failure: <MdOutlineMonitorHeart className="text-2xl sm:text-3xl" />,
      pneumonia: <MdOutlineCoronavirus className="text-2xl sm:text-3xl" />,
      stroke: <MdOutlinePsychology className="text-2xl sm:text-3xl" />,
    };
    return icons[id] || <MdMenuBook className="text-2xl sm:text-3xl" />;
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

  console.log("userRole : - ", userRole)

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
      <Header
        sidebarOpen={false}
        setSidebarOpen={() => {}}
        auth={{ user: null, logout: null }}
        navigate={navigate}
        userRole={userRole}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-10">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Document Content */}
          <div className="p-8">
            <div className="document-content prose prose-lg max-w-none">
              {renderSourceDocument(filesData, documentId, null)}
            </div>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="mt-8 text-center no-print">
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
        </div> */}
      </div>
    </div>
  );
};

export default DocumentViewer;
