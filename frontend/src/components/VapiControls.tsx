import { useVapi } from "../context/VapiProvider";
import { validateVapiConfig } from "../config";

export const VapiControls = () => {
  const {
    status,
    messages,
    isSpeaking,
    isMuted,
    deviceId,
    hardwareMode,
    startConversation,
    stopConversation,
    toggleMute,
    clearHistory,
  } = useVapi();

  const isConfigured = validateVapiConfig();

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const formatMessage = (msg: any) => {
    switch (msg.type) {
      case "transcript":
        return msg.metadata?.role === "user"
          ? `You: ${msg.content}`
          : `AI: ${msg.content}`;
      case "function-call":
        return `Function: ${msg.content}`;
      default:
        return msg.content;
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Voice AI Controls</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm text-slate-400 capitalize">{status}</span>
        </div>
      </div>

      {!isConfigured && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">
            Vapi is not configured. Please add VITE_VAPI_PUBLIC_KEY and
            VITE_VAPI_ASSISTANT_ID to your .env file.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Mode</p>
          <p className="text-lg font-semibold">
            {hardwareMode === "ai" ? "AI Mode" : "Radio Mode"}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Device ID</p>
          <p className="text-sm font-mono">{deviceId.substring(0, 8)}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Speaking</p>
          <p className="text-lg">{isSpeaking ? "Yes" : "No"}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Muted</p>
          <p className="text-lg">{isMuted ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {status === "idle" || status === "disconnected" ? (
          <button
            onClick={async () => {
              console.log('🖱️  Start Voice button clicked');
              console.log('📊 Current status:', status);
              console.log('📊 isConfigured:', isConfigured);
              try {
                await startConversation();
              } catch (error) {
                console.error('❌ Error from startConversation:', error);
              }
            }}
            disabled={!isConfigured}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Start Voice
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={stopConversation}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Stop
            </button>
          </>
        )}
      </div>

      <button
        onClick={clearHistory}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm mb-4"
      >
        Clear History
      </button>

      <div className="bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
        <p className="text-xs text-slate-400 mb-2">
          Message History ({messages.length})
        </p>
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No messages yet. Start a conversation or press the hardware button.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.slice(-10).map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.metadata?.role === "user"
                    ? "bg-blue-900/30"
                    : "bg-slate-700"
                }`}
              >
                <p className="text-xs text-slate-400 mb-1">{msg.type}</p>
                <p className="text-sm">{formatMessage(msg)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">Hardware Service</p>
        <p className="text-sm text-slate-300">
          Press the physical button to start/stop voice conversations.
          The hardware service automatically switches between radio and AI modes.
        </p>
      </div>

      {/* Debug Panel */}
      <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-yellow-600/30">
        <p className="text-xs text-yellow-400 mb-2 font-semibold">🔍 Debug Info</p>
        <div className="space-y-1 text-xs font-mono">
          <p className="text-slate-400">
            Status: <span className="text-white">{status}</span>
          </p>
          <p className="text-slate-400">
            Configured: <span className="text-white">{isConfigured ? 'Yes' : 'No'}</span>
          </p>
          <p className="text-slate-400">
            Active: <span className="text-white">{status === 'connected' ? 'Yes' : 'No'}</span>
          </p>
          <p className="text-slate-400">
            Messages: <span className="text-white">{messages.length}</span>
          </p>
        </div>
        <button
          onClick={() => {
            console.log('🔍 === VAPI DEBUG INFO ===');
            console.log('Status:', status);
            console.log('Messages:', messages);
            console.log('isConfigured:', isConfigured);
            console.log('Device ID:', deviceId);
            console.log('Hardware Mode:', hardwareMode);
            console.log('📋 Check browser Network tab (filter by "WS") for WebSocket connections to Vapi');
            console.log('📋 Look for connections to wss://api.vapi.ai or similar');
            alert('Debug info logged to console. Check Network tab for WebSocket connections.');
          }}
          className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          Log Debug Info
        </button>
      </div>
    </div>
  );
};
