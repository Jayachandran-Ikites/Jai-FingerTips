import React from 'react';
import { FiFileText } from 'react-icons/fi';

const EmptyState = ({ message }) => {
  return (
    <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <FiFileText className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-800">No Content Available</h3>
      <p className="mt-1 text-sm text-gray-500">{message || 'There is no data to display for this section.'}</p>
    </div>
  );
};

export default EmptyState; 