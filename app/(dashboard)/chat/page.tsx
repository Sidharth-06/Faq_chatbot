'use client';

import { useRouter } from 'next/navigation';

export default function ChatDefaultPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
        <span className="text-white text-2xl font-bold">FB</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800">Welcome to FAQ Chatbot</h1>
      <p className="text-gray-600 text-lg">Select a chat from the sidebar or create a new one to get started</p>
      
      <button
        onClick={() => {
          // Trigger new chat creation from sidebar
          const event = new CustomEvent('newChat');
          window.dispatchEvent(event);
        }}
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg"
      >
        Start New Chat
      </button>
    </div>
  );
}
