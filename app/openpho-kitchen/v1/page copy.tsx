"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogOut, Mic, MicOff, Plus, HelpCircle, Sun, Moon, ChefHat, CheckCircle, CheckSquare, Calendar, History, RotateCcw, Printer, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import axios from 'axios';
import { useTheme } from "next-themes";
import { getSocket, initializeSocket } from "@/lib/socket-client";
import { toast } from "sonner";

interface KitchenOrder {
  id: string;
  orderId: string;
  status: 'pending' | 'preparing' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  order: {
    orderNumber: string;
    items: string;
    table?: {
      number: number;
    };
  };
  assigner: {
    firstName: string;
    lastName: string;
  };
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    // Initialize audio for notifications
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    let socket = getSocket();
    if (!socket) socket = initializeSocket();
    wsRef.current = socket;

    socket.on("kitchenOrderUpdate", (data) => {
      fetchOrders();
      playNotification();
      speakNotification("New order received!");
    });

    return () => {
      socket.off("kitchenOrderUpdate");
    };
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/kitchen/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept order
  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/restaurant/kitchen/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchOrders();
        toast.success('Order accepted');
        speakNotification(`Order ${data.order.order.orderNumber} accepted`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  // Voice command handling
  const handleVoiceCommand = (transcript: string) => {
    const command = transcript.toLowerCase();
    
    if (command.includes('accept order')) {
      const orderNumber = command.match(/\d+/)?.[0];
      if (orderNumber) {
        const order = orders.find(o => o.order.orderNumber.includes(orderNumber));
        if (order) {
          acceptOrder(order.orderId);
        }
      }
    } else if (command.includes('refresh')) {
      fetchOrders();
    }
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  // Play notification sound
  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Text-to-speech notification
  const speakNotification = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "default"}
            onClick={toggleVoiceRecognition}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Stop Voice" : "Start Voice"}
          </Button>
          <Button variant="outline" onClick={fetchOrders}>
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="relative">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">Order #{order.order.orderNumber}</h3>
                  {order.order.table && (
                    <p className="text-sm text-gray-500">Table {order.order.table.number}</p>
                  )}
                </div>
                <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>

              <div className="space-y-2">
                {(() => {
                  const items = typeof order.order.items === 'string' 
                    ? JSON.parse(order.order.items) 
                    : order.order.items;
                  return items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      {item.prepTime && (
                        <span className="text-gray-500">{item.prepTime} mins</span>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {order.status === 'pending' && (
                <Button 
                  className="w-full mt-4"
                  onClick={() => acceptOrder(order.orderId)}
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Accept Order
                </Button>
              )}

              {order.status === 'preparing' && order.startedAt && (
                <div className="mt-2 text-sm text-gray-500">
                  Started: {new Date(order.startedAt).toLocaleTimeString()}
                </div>
              )}

              {order.status === 'completed' && order.completedAt && (
                <div className="mt-2 text-sm text-green-500 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed: {new Date(order.completedAt).toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
