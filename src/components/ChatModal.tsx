
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Farmer, User } from '@/types';
import { Send, MessageSquare, X } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  senderName: string;
  isCurrentUser: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: Farmer | null;
  currentUser: User | null;
}

export default function ChatModal({ isOpen, onClose, farmer, currentUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentUserName = currentUser?.firstName || "You";
  const farmerName = farmer?.name || "Farmer";

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && farmer) {
      setMessages([
        {
          id: 'greeting1',
          text: `Hi there! You are now chatting with ${farmerName}.`,
          senderId: 'system',
          timestamp: new Date(),
          senderName: 'System',
          isCurrentUser: false,
        },
      ]);
    } else {
      setMessages([]); 
    }
    setNewMessage('');
  }, [isOpen, farmer, farmerName]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !farmer) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: newMessage,
      senderId: currentUser.id,
      timestamp: new Date(),
      senderName: currentUserName,
      isCurrentUser: true,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');

    setTimeout(() => {
      const farmerReply: Message = {
        id: `reply_${Date.now()}`,
        text: `Thanks for your message! I'll get back to you soon regarding "${userMessage.text.substring(0, 20)}...". (This is a mock reply)`,
        senderId: farmer.id,
        timestamp: new Date(),
        senderName: farmerName,
        isCurrentUser: false,
      };
      setMessages(prevMessages => [...prevMessages, farmerReply]);
    }, 1000 + Math.random() * 1000);
  };
  
  const getValidSrcForImage = (url?: string, defaultSize: string = "40x40"): string => {
    if (!url) {
      return `https://placehold.co/${defaultSize}.png`;
    }
  
    let processedUrl = url;
    const hintMarker = '" data-ai-hint="';
    const hintIndex = processedUrl.indexOf(hintMarker);
  
    if (processedUrl.startsWith('https://placehold.co') && hintIndex !== -1) {
      processedUrl = processedUrl.substring(0, hintIndex);
    }
    if (processedUrl.endsWith('"')) {
      processedUrl = processedUrl.slice(0, -1);
    }
  
    if (processedUrl.startsWith('data:image') || processedUrl.startsWith('http')) {
      try { 
        if (processedUrl.startsWith('http')) new URL(processedUrl); 
        return processedUrl; 
      } catch (e) { 
        console.warn(`Invalid image URL processed: ${processedUrl}, falling back to placeholder.`);
      }
    }
    return `https://placehold.co/${defaultSize}.png`;
  };


  const farmerImage = farmer ? getValidSrcForImage(farmer.profilePictureUrl) : `https://placehold.co/40x40.png`;
  const farmerImageHint = "profile picture";
  const currentUserImage = currentUser ? getValidSrcForImage(currentUser.profilePictureUrl) : `https://placehold.co/40x40.png`;
  const currentUserImageHint = currentUser?.role === 'farmer' ? 'farmer portrait' : 'user profile';


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center">
            <MessageSquare size={24} className="mr-2 text-primary" />
            Chat with {farmerName}
          </DialogTitle>
           <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isCurrentUser && msg.senderId !== 'system' && (
                  <Image 
                    src={farmerImage} 
                    alt={msg.senderName} 
                    width={32} height={32} 
                    className="rounded-full object-cover"
                    data-ai-hint={farmerImageHint}
                   />
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow ${
                    msg.senderId === 'system' 
                      ? 'bg-muted text-muted-foreground text-xs text-center w-full' 
                      : msg.isCurrentUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card text-card-foreground border rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  {msg.senderId !== 'system' && (
                    <p className={`text-xs mt-1 ${msg.isCurrentUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
                      {msg.senderName}, {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {msg.isCurrentUser && msg.senderId !== 'system' && (
                   <Image 
                    src={currentUserImage} 
                    alt={msg.senderName} 
                    width={32} height={32} 
                    className="rounded-full object-cover"
                    data-ai-hint={currentUserImageHint}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow"
              disabled={!currentUser || !farmer}
            />
            <Button type="submit" disabled={!newMessage.trim() || !currentUser || !farmer} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send size={18} />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
