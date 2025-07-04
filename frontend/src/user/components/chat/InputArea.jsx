import { useRef } from "react";
import { FiSend } from "react-icons/fi";

const InputArea = ({
  message,
  setMessage,
  sendMessage,
  isLoading,
  isLoadingMessages,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="flex-shrink-0 bg-gradient-to-t from-blue-50/90 to-blue-50/70 backdrop-blur-sm py-2 md:py-3">
      <div className="px-3 md:px-6">
        <div className="relative rounded-xl md:rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm border border-blue-100 p-1.5 md:p-2">
          <form onSubmit={sendMessage} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your clinical question..."
              className="w-full px-3 py-3 md:px-4 md:py-4 pr-12 md:pr-16 bg-transparent rounded-lg md:rounded-xl focus:outline-none transition-all text-sm md:text-base"
              disabled={isLoading || isLoadingMessages}
            />
            <div className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex items-center">
              <button
                type="submit"
                disabled={isLoading || isLoadingMessages}
                className="p-2 md:p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 rounded-full transition-all duration-200"
                aria-label="Send text message"
              >
                <FiSend className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </form>
          <p className="text-[10px] md:text-xs text-center mt-1 md:mt-2 text-gray-500">
            FingerTips provides medical information but is not a substitute for
            professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
