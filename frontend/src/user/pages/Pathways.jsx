import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/chat/Header";
import { AuthContext } from "../context/AuthContext.jsx";
import filesData from "../utilities/files_docs.json";
// Material Design
import { MdFavorite, MdBloodtype, MdOutlineWaterDrop, MdThermostat, MdOutlineMonitorHeart, MdOutlineCoronavirus, MdOutlinePsychology, MdMenuBook } from "react-icons/md";
// Game Icons
import { GiLungs, GiFootprint } from "react-icons/gi";

const Pathways = () => {
  const [pathways, setPathways] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useContext(AuthContext);

  useEffect(() => {
    // Extract pathway data from filesData
    const pathwayList = Object.keys(filesData).map((key) => {
      const data = filesData[key];
      const firstLine = data.lines?.L1?.content || key;
      const title = firstLine.replace(" Pathway", "").replace(" pathway", "");

      return {
        id: key,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: getPathwayDescription(data),
        icon: getPathwayIcon(key),
        color: "bg-[white]",
        //  getPathwayColor(key),
      };
    });
    setPathways(pathwayList);
  }, []);

  const getPathwayDescription = (data) => {
    // Prefer the 'description' field if present
    if (data.description) {
      return data.description;
    }
    // Fallback: Try to find a description from the content
    const lines = Object.values(data.lines || {});
    for (let line of lines) {
      if (
        line.content &&
        line.content.length > 50 &&
        line.content.length < 200
      ) {
        return line.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
      }
    }
    return "Comprehensive medical pathway and guidelines for healthcare professionals.";
  };

  const getPathwayIcon = (key) => {
    const icons = {
      asthma: <GiLungs className="text-3xl" />,
      anaemia: <MdBloodtype className="text-3xl" />,
      chestpain: <MdFavorite className="text-3xl" />,
      copd: <GiLungs className="text-3xl" />,
      diabetic_foot_ulcer: <GiFootprint className="text-3xl" />,
      Diarrhoea: <MdOutlineWaterDrop className="text-3xl" />,
      fever: <MdThermostat className="text-3xl" />,
      heart_failure: <MdOutlineMonitorHeart className="text-3xl" />,
      pneumonia: <MdOutlineCoronavirus className="text-3xl" />,
      stroke: <MdOutlinePsychology className="text-3xl" />,
    };
    return icons[key] || <MdMenuBook className="text-3xl" />;
  };

  const getPathwayColor = (key) => {
    const colors = {
      asthma: "bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500",
      anaemia: "bg-gradient-to-r from-rose-700 via-rose-600 to-rose-500",
      chestpain: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500",
      copd: "bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500",
      diabetic_foot_ulcer: "bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500",
      Diarrhoea: "bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500",
      fever: "bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-500",
      heart_failure: "bg-gradient-to-r from-red-700 via-red-600 to-red-500",
      pneumonia: "bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500",
      stroke: "bg-gradient-to-r from-violet-700 via-violet-600 to-violet-500"
    };
    return colors[key] || "from-gray-500 to-gray-600";
  };

  const handleCardClick = (pathwayId) => {
    navigate(`/document/${pathwayId}`);
  };

  const handleBackClick = () => {
    // Simple and reliable: always go back to chat
    navigate('/chat');
  };

  console.log("pathways", pathways);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header
        sidebarOpen={false}
        setSidebarOpen={() => {}}
        auth={{ user: null, logout: null }}
        navigate={navigate}
        userRole={userRole}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Comprehensive Medical Guidelines
          </h2>
          <p className="text-gray-600">
            Access evidence-based clinical pathways and treatment guidelines for
            various medical conditions.
          </p>
        </div>

        {/* Pathways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pathways.map((pathway) => (
            <div
              key={pathway.id}
              onClick={() => handleCardClick(pathway.id)}
              className="group cursor-pointer flex flex-col rounded-2xl shadow-lg border border-gray-200 bg-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:border-blue-400 overflow-hidden"
              style={{
                minHeight: "290px",
                maxHeight: "290px",
              }}
            >
              {/* Card Header */}
              <div
                className={`px-6 py-5 flex items-center gap-3 ${pathway.color}`}
                style={{ minHeight: "50px" }}
              >
                <span className="text-3xl flex-shrink-0">{pathway.icon}</span>
                <h3
                  className="text-lg font-bold leading-tight truncate"
                  title={pathway.title}
                >
                  {pathway.title}
                </h3>
              </div>
              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-between px-6 py-5 bg-white">
                <p
                  className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3"
                  style={{ minHeight: "54px" }}
                >
                  {pathway.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Click to view full pathway
                  </span>
                  <button
                    className="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold text-sm px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(pathway.id);
                    }}
                  >
                    View
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {pathways.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Pathways...
            </h3>
            <p className="text-gray-600">
              Please wait while we load the available medical pathways.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pathways;
