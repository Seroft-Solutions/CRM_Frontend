// Debug logging that survives page refreshes
export function persistentLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
  
  console.log(logEntry);
  
  // Store in localStorage for debugging
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  
  // Keep only last 20 logs
  if (logs.length > 20) {
    logs.splice(0, logs.length - 20);
  }
  
  localStorage.setItem('debug_logs', JSON.stringify(logs));
}

export function getDebugLogs() {
  return JSON.parse(localStorage.getItem('debug_logs') || '[]');
}

export function clearDebugLogs() {
  localStorage.removeItem('debug_logs');
}
