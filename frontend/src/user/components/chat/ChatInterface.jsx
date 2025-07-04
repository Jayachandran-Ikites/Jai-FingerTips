import { useRef, useState, useEffect } from "react";
import { FiUser, FiMessageCircle } from "react-icons/fi";
import { HiOutlineFingerPrint, HiOutlineLightBulb } from "react-icons/hi";
import MarkdownRenderer from "../MarkdownRenderer.jsx";
import SourcesModal from "./SourcesModal.jsx";

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

  return (
    <main className="flex-1 overflow-hidden px-3 md:px-6 pt-3 md:pt-6 pb-[20px]">
      {/* Sources Modal */}
      <SourcesModal
        open={sourcesModal.open}
        onClose={() => setSourcesModal({ open: false, msgIndex: null })}
        msgIndex={sourcesModal.msgIndex}
        history={history}
        sources={currentSources}
      />
      <div className="h-full overflow-y-auto rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 p-3 md:p-6">
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
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start pb-[3rem]"
                } animate-fadeIn`}
              >
                <div
                  className={`flex gap-2 md:gap-3 max-w-[85%] ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
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
                    className={`relative rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm max-w-[calc(100%-3rem)] ${
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
                          className="absolute left-0 translate-y-full mt-0 -mb-6 text-gray-400 hover:text-blue-500 flex items-center bg-white rounded-full shadow px-2 py-1 border border-blue-100"
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
                          className="absolute right-0 translate-y-full mt-0 -mb-6 text-gray-400 hover:text-blue-500 flex items-center bg-white rounded-full shadow px-[0.6rem] py-[0.37rem] text-[0.75rem] border border-blue-100 leading-4 font-medium"
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
