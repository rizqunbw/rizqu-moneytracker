import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay = ({ messages }: { messages: string[] }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-lg font-semibold">Please wait...</p>
      <p className="mt-2 text-sm text-muted-foreground">{messages[messageIndex]}</p>
    </div>
  );
};