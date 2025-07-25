import { useRef, useState, useEffect } from "react";
import { FiUser, FiMessageCircle, FiPrinter, FiInfo } from "react-icons/fi";
import { HiOutlineFingerPrint, HiOutlineLightBulb } from "react-icons/hi";
import MarkdownRenderer from "../MarkdownRenderer.jsx";
import SourcesModal from "./SourcesModal.jsx";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Simple modal for summary
function SummaryModal({ open, onClose, summary, isLoading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-full sm:max-w-2xl md:max-w-lg border border-blue-100 flex flex-col relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 relative">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 flex items-center gap-2">
            <FiInfo className="w-6 h-6 text-blue-500" /> Chat Summary
          </h2>
          <button
            className="absolute right-4 top-4 text-gray-400 hover:text-blue-500 text-2xl font-bold transition-colors"
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: 0 }}
          >
            &times;
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
            {isLoading ? "Loading summary..." : summary}
          </div>
        </div>
      </div>
    </div>
  );
}

const exportChatAsPDF = async (convId) => {
  try {
    const token = localStorage.getItem('token');
    const resp = await api.get(`/chat/conversation/${convId}/export/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob', // Important: receive as binary
    });

    // Try to get filename from Content-Disposition header
    let filename = `CONV-${convId}.pdf`;
    const disposition = resp.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      filename = disposition.split('filename=')[1].replace(/["']/g, '');
    }

    // Create a URL for the file and download
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 500);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('Failed to export chat as PDF.');
  }
};


const ChatInterface = ({
  history,
  isLoading,
  isLoadingMessages,
  dummyQA,
  setFeedbackModal,
  convId,
  bottomRef,
  inputValue,
  setInputValue,
  onSend,
}) => {
  // Modal state for sources
  console.log("ChatInterface rendered with history:", history);
  const [sourcesModal, setSourcesModal] = useState({
    open: false,
    msgIndex: null,
  });
  const [currentSources, setCurrentSources] = useState({});
  const chatAreaRef = useRef(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

   const [summary, setSummary] = useState("");
   const [isSummarizing, setIsSummarizing] = useState(false);
 
   // Fetch summary from backend
   const fetchSummary = async () => {
    setIsSummarizing(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await api.get(`/chat/conversation/${convId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Axios puts the response data in resp.data
      const data = resp.data;
      setSummary(data.summary || 'No summary available.');
    } catch (err) {
      console.error(err);
      setSummary('Error loading summary.');
    } finally {
      setIsSummarizing(false);
    }
  };
 
   // Handle summary button click
   const handleSummaryClick = () => {
     setSummaryOpen(true);
     fetchSummary();
   };


  return (
    <main className="flex-1 overflow-hidden px-3 md:px-6 pt-3 md:pt-6 pb-[20px] relative">
      {/* Export PDF & Summary Buttons */}
      {history.length > 0 && (
        <div className="absolute rounded-full bottom-[2rem] right-[2.5rem] flex flex-col items-end gap-3 no-print z-10">
          <button
            onClick={handleSummaryClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-semibold flex items-center justify-center h-[2.5rem] w-[2.5rem]"
            title="Show Chat Summary"
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <HiOutlineLightBulb className="w-5 h-5 animate-spin" />
            ) : (
              <FiInfo className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => exportChatAsPDF(convId)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-semibold flex items-center justify-center h-[2.5rem] w-[2.5rem]"
            title="Export Chat as PDF"
          >
            <FiPrinter className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Chat Summary Modal */}
      <SummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        isLoading={isSummarizing}
      />

      {/* Sources Modal */}
      <SourcesModal
        open={sourcesModal.open}
        onClose={() => setSourcesModal({ open: false, msgIndex: null })}
        msgIndex={sourcesModal.msgIndex}
        history={history}
        sources={currentSources}
      />

      <div
        ref={chatAreaRef}
        id="chat-area"
        className="h-full overflow-y-auto print:overflow-visible print:h-auto rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 p-3 md:p-6"
      >
        {isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-3 md:p-6 text-gray-500">
            <div className="flex space-x-2 items-center">
              <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
            </div>
            <p className="mt-4">Loading messages...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex-col items-center gap-10 h-[100%] content-evenly justify-center">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center text-center p-3 md:p-6 text-gray-500">
              <HiOutlineLightBulb className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-gray-800 mb-2">
                Welcome to FingerTips
              </h3>
              <p className="max-w-md text-gray-500 mb-4 text-sm">
                Select a question to get started, or type your own below.
              </p>
            </div>
            <div className="h-auto rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 md:p-6 p-3 w-[90%] mw-[75rem] m-auto ">
              <ul className="min-w-0 px-0 sm:px-2 md:px-0 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dummyQA?.map((msg, i) => (
                  <li key={i} className="h-full" style={{ marginTop: "0px" }}>
                    <button
                      className="w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-blue-100 bg-white hover:bg-blue-50 transition text-gray-500 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm md:text-base h-full"
                      onClick={() => setInputValue(msg.content)}
                    >
                      {msg.content}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-2 md:gap-3 max-w-[85%]">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-700 flex items-center justify-center">
                    <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="rounded-xl px-4 py-2 bg-white border border-gray-100 shadow-sm">
                    <div className="flex space-x-2 items-center h-4 md:h-5">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`chat-message flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start pb-[3rem]"
                } animate-fadeIn`}
              >
                <div
                  className={`flex flex-col gap-2 md:gap-3 w-full sm:max-w-[85%] ${
                    msg.role === "user"
                      ? "items-end sm:items-end md:flex-row-reverse"
                      : "md:flex-row"
                  }`}
                >
                  <div
                    className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-0 sm:mb-[0.25rem]"
                        : "bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-700"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </div>
                  <div
                    className={`relative rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm max-w-[100%] md:max-w-[calc(100%-3rem)] ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    <div
                      className={`prose prose-xs md:prose-sm max-w-none ${
                        msg.role === "user" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {msg.type === "audio" ? (
                        <audio
                          controls
                          src={msg.content}
                          className="w-full mt-1"
                        />
                      ) : msg.role === "user" ? (
                        <p className="text-sm md:text-base">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                    {/* Feedback icon (bottom left, outside the answer boundary) */}
                    {msg.role === "assistant" && (
                      <>
                        <button
                          className="no-print absolute left-0 translate-y-full mt-0 -mb-6 text-gray-400 hover:text-blue-500 flex items-center bg-white rounded-full shadow px-2 py-1 border border-blue-100"
                          style={{ transform: "translateY(100%)" }}
                          title="Leave feedback"
                          onClick={() => {
                            setFeedbackModal({
                              isOpen: true,
                              conversationId: convId,
                              messageId: msg.id,
                            });
                          }}
                        >
                          <FiMessageCircle className="w-5 h-5 mr-1" />
                          <span className="text-xs font-medium">Feedback</span>
                        </button>
                        <button
                          className="no-print absolute right-0 translate-y-full mt-0 -mb-6 text-gray-400 hover:text-blue-500 flex items-center bg-white rounded-full shadow px-[0.6rem] py-[0.37rem] text-[0.75rem] border border-blue-100 leading-4 font-medium"
                          onClick={() => {
                            setCurrentSources(msg?.sources || {});
                            setSourcesModal({ open: true, msgIndex: i });
                          }}
                        >
                          Sources
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-2 md:gap-3 max-w-[85%]">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-700 flex items-center justify-center">
                    <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="rounded-xl px-4 py-2 bg-white border border-gray-100 shadow-sm">
                    <div className="flex space-x-2 items-center h-4 md:h-5">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </main>
  );
};

export default ChatInterface;
