import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  extractLinks,
  getSourceSummary,
  renderSourceDocument,
  renderAnswerSources,
} from "../../utilities/sourceFormatter";
import filesData from "../../utilities/files_docs.json";
import EmptyState from "../EmptyState";

const SourcesModal = ({ open, onClose, msgIndex, history, sources }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("full");
  const [topics, setTopics] = useState([]);
  const [selected_topic, setselected_topic] = useState("");

  const [sourceSummary, setSourceSummary] = useState(null);
  const [links, setLinks] = useState([]);
  const [fullDocumentElement, setFullDocumentElement] = useState(null);
  const [answerSourcesElement, setAnswerSourceElement] = useState(null);

  useEffect(() => {
    const sourceTopics = sources ? Object.keys(sources) : [];
    setTopics(sourceTopics);
    if (sourceTopics.length > 0) {
      setselected_topic(sourceTopics[0]);
    } else {
      setselected_topic("");
    }
  }, [sources]);

  useEffect(() => {
    if (selected_topic && sources && sources[selected_topic]) {
      const sourceData = sources[selected_topic];
      setSourceSummary(getSourceSummary(filesData, selected_topic));
      setLinks(extractLinks(filesData, selected_topic));
      setFullDocumentElement(
        renderSourceDocument(filesData, selected_topic, sourceData)
      );
      setAnswerSourceElement(
        renderAnswerSources(filesData, selected_topic, sourceData)
      );
    } else {
      setSourceSummary(null);
      setLinks([]);
      setFullDocumentElement(null);
      setAnswerSourceElement(null);
    }
  }, [selected_topic, sources]);

  console.log("selected_topic:", selected_topic, sources);

  const handleViewAllPathways = () => {
    onClose();
    navigate("/pathways");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-2 sm:gap-0 relative">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Sources
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <button
              onClick={handleViewAllPathways}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto justify-center sm:order-1"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View All Pathways
            </button>
            {/* Inline close button for sm and up, absolute for mobile */}
            <button
              className="absolute right-4 top-4 sm:top-[0.7rem] sm:static sm:order-2 text-gray-400 hover:text-blue-500 text-2xl font-bold transition-colors"
              onClick={onClose}
              aria-label="Close"
              style={{ marginLeft: 0 }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Topic Selector */}
        {topics.length > 1 && (
          <div className="p-2 sm:p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-700 mr-2">
              Source Documents:
            </span>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setselected_topic(topic)}
                className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                  selected_topic === topic
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {topic.split("_").join(" ").charAt(0).toUpperCase() +
                  topic.split("_").join(" ").slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        {/* <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "answer-sources"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("answer-sources")}
          >
            Answer Sources
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "summary"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "full"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("full")}
          >
            Full Document
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "links"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("links")}
          >
            References ({links.length})
          </button>
        </div> */}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6">
          {activeTab === "answer-sources" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Sources Used for This Answer
              </h3>
              {answerSourcesElement ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  {answerSourcesElement}
                </div>
              ) : (
                <EmptyState message="No specific sources were used to generate this answer." />
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {sourceSummary ? sourceSummary.title : "Summary"}
              </h3>
              {sourceSummary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-800">Sections</div>
                      <div className="text-blue-600">
                        {sourceSummary.sections.length}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-800">
                        References
                      </div>
                      <div className="text-green-600">
                        {sourceSummary.linkCount}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-medium text-purple-800">Tables</div>
                      <div className="text-purple-600">
                        {sourceSummary.tableCount}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Document Sections:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {sourceSummary.sections.map((section, index) => (
                        <li
                          key={index}
                          dangerouslySetInnerHTML={{ __html: section }}
                        />
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <EmptyState message="A summary is not available for this document." />
              )}
            </div>
          )}

          {activeTab === "full" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Complete Document
              </h3>
              {sources && sources[selected_topic] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">💡 Highlighting:</span>{" "}
                    Sections highlighted in yellow with a yellow border indicate
                    the specific content used to generate the answer.
                  </p>
                </div>
              )}
              {fullDocumentElement ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  {fullDocumentElement}
                </div>
              ) : (
                <EmptyState message="The full document is not available to display." />
              )}
            </div>
          )}

          {activeTab === "links" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                References & Links
              </h3>
              {links && links.length > 0 ? (
                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="text-sm text-gray-600 mb-1">
                        <div
                          dangerouslySetInnerHTML={{ __html: link.content }}
                        />
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="There are no references or external links in this document." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourcesModal;
