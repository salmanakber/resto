"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Send, 
  PaperclipIcon,
  Image,
  Smile,
  Bell,
  AlertCircle,
  Hash
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface ChatUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: {
    name: string;
    type: "image" | "file";
    url: string;
  }[];
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  unreadCount: number;
  participants: string[];
  isImportant?: boolean;
}

// Mock data
const mockUsers: ChatUser[] = [
  {
    id: "user-001",
    name: "Jamie Chen",
    role: "Head Chef",
    avatar: "/avatars/chef.png",
    isOnline: true
  },
  {
    id: "user-002",
    name: "Sara Miller",
    role: "Line Cook",
    avatar: "/avatars/chef3.png",
    isOnline: true
  },
  {
    id: "user-003",
    name: "Alex Wong",
    role: "Sous Chef",
    avatar: "/avatars/chef2.png",
    isOnline: false,
    lastSeen: "10 minutes ago"
  },
  {
    id: "user-004",
    name: "Emily Davis",
    role: "Server",
    avatar: "/avatars/server.png",
    isOnline: true
  },
  {
    id: "user-005",
    name: "Mark Johnson",
    role: "Manager",
    avatar: "/avatars/manager.png",
    isOnline: true
  }
];

const mockChannels: ChatChannel[] = [
  {
    id: "channel-001",
    name: "kitchen-general",
    description: "General kitchen communication",
    unreadCount: 0,
    participants: ["user-001", "user-002", "user-003", "user-004", "user-005"]
  },
  {
    id: "channel-002",
    name: "urgent-updates",
    description: "Critical and time-sensitive messages",
    unreadCount: 3,
    participants: ["user-001", "user-002", "user-003", "user-004", "user-005"],
    isImportant: true
  },
  {
    id: "channel-003",
    name: "inventory",
    description: "Stock updates and requests",
    unreadCount: 1,
    participants: ["user-001", "user-003", "user-005"]
  },
  {
    id: "channel-004",
    name: "special-orders",
    description: "Discuss special customer requests",
    unreadCount: 0,
    participants: ["user-001", "user-002", "user-003", "user-004"]
  }
];

const mockMessages: Record<string, ChatMessage[]> = {
  "channel-001": [
    {
      id: "msg-001",
      senderId: "user-001",
      content: "Good morning team! We have a busy day ahead with two large reservations for lunch.",
      timestamp: "2023-06-12T08:00:00Z",
      isRead: true
    },
    {
      id: "msg-002",
      senderId: "user-003",
      content: "I've prepped the vegetables for the special. Should I start on the sauces now?",
      timestamp: "2023-06-12T08:05:00Z",
      isRead: true
    },
    {
      id: "msg-003",
      senderId: "user-002",
      content: "The new knife set has arrived! They're in the storage room.",
      timestamp: "2023-06-12T08:10:00Z",
      isRead: true
    },
    {
      id: "msg-004",
      senderId: "user-001",
      content: "Yes Alex, please start on the sauces. Sara, thanks for letting us know about the knives.",
      timestamp: "2023-06-12T08:12:00Z",
      isRead: true
    },
    {
      id: "msg-005",
      senderId: "user-004",
      content: "Just a heads up from the front - we have a VIP customer coming in at 1 PM. They usually order the chef's special.",
      timestamp: "2023-06-12T09:30:00Z",
      isRead: true
    },
    {
      id: "msg-006",
      senderId: "user-001",
      content: "Thanks for the heads up, Emily. We'll make sure to prepare something exceptional.",
      timestamp: "2023-06-12T09:32:00Z",
      isRead: true,
      attachments: [
        {
          name: "special_menu.jpg",
          type: "image",
          url: "https://placehold.co/400x300/e2e8f0/1e293b?text=Special+Menu"
        }
      ]
    },
    {
      id: "msg-007",
      senderId: "user-002",
      content: "I'll handle that special. My shift doesn't end until 3.",
      timestamp: "2023-06-12T09:35:00Z",
      isRead: true
    }
  ],
  "channel-002": [
    {
      id: "msg-008",
      senderId: "user-005",
      content: "ATTENTION: We have a health inspector coming tomorrow at 10 AM. Everyone please review the checklist I'm attaching and ensure your stations meet all requirements.",
      timestamp: "2023-06-12T10:00:00Z",
      isRead: false,
      attachments: [
        {
          name: "inspection_checklist.pdf",
          type: "file",
          url: "/files/inspection_checklist.pdf"
        }
      ]
    },
    {
      id: "msg-009",
      senderId: "user-001",
      content: "I'll make sure the kitchen is up to standards. Everyone on shift today will do a thorough clean before closing.",
      timestamp: "2023-06-12T10:05:00Z",
      isRead: false
    },
    {
      id: "msg-010",
      senderId: "user-003",
      content: "URGENT: We've run out of chicken. I've called our supplier for an emergency delivery, but we need to adjust the menu for lunch service.",
      timestamp: "2023-06-12T11:30:00Z",
      isRead: false
    }
  ],
  "channel-003": [
    {
      id: "msg-011",
      senderId: "user-003",
      content: "Inventory update: We're running low on the following items:\n- Olive oil (2 bottles left)\n- Basmati rice (5kg left)\n- Fresh basil\n\nI've added them to the order form for tomorrow.",
      timestamp: "2023-06-12T11:00:00Z",
      isRead: false
    },
    {
      id: "msg-012",
      senderId: "user-005",
      content: "I've approved the order. Is there anything else we need urgently?",
      timestamp: "2023-06-12T11:05:00Z",
      isRead: true
    },
    {
      id: "msg-013",
      senderId: "user-001",
      content: "We should also stock up on heavy cream and dark chocolate. The dessert special has been popular this week.",
      timestamp: "2023-06-12T11:10:00Z",
      isRead: true
    }
  ],
  "channel-004": [
    {
      id: "msg-014",
      senderId: "user-004",
      content: "We have a customer with a garlic allergy requesting the pasta special. Is it possible to prepare it without garlic?",
      timestamp: "2023-06-12T12:30:00Z",
      isRead: true
    },
    {
      id: "msg-015",
      senderId: "user-002",
      content: "Yes, I can substitute with a bit of shallot and herb mix. Let them know it'll take about 5 minutes extra.",
      timestamp: "2023-06-12T12:32:00Z",
      isRead: true
    },
    {
      id: "msg-016",
      senderId: "user-004",
      content: "Perfect, thanks Sara!",
      timestamp: "2023-06-12T12:33:00Z",
      isRead: true
    }
  ]
};

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

export default function KitchenChatPage() {
  const [activeTab, setActiveTab] = useState<"channels" | "direct">("channels");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("channel-001");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(mockMessages);
  const [newMessage, setNewMessage] = useState<string>("");
  const [channels, setChannels] = useState<ChatChannel[]>(mockChannels);
  const [users] = useState<ChatUser[]>(mockUsers);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock current user - In a real app, this would come from authentication
  const currentUser = users[0]; // Jamie Chen (Head Chef)
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannelId]);
  
  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    
    // Mark messages as read when channel is selected
    setChannels(prevChannels => 
      prevChannels.map(channel => 
        channel.id === channelId 
          ? { ...channel, unreadCount: 0 } 
          : channel
      )
    );
    
    // Mark all messages in this channel as read
    setMessages(prevMessages => ({
      ...prevMessages,
      [channelId]: (prevMessages[channelId] || []).map(msg => ({ ...msg, isRead: true }))
    }));
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    
    setMessages(prevMessages => ({
      ...prevMessages,
      [selectedChannelId]: [...(prevMessages[selectedChannelId] || []), newMsg]
    }));
    
    setNewMessage("");
  };
  
  const activeChannel = channels.find(channel => channel.id === selectedChannelId);
  const activeChannelMessages = messages[selectedChannelId] || [];
  
  // Get user details by ID
  const getUserById = (userId: string): ChatUser | undefined => {
    return users.find(user => user.id === userId);
  };
  
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r flex-shrink-0 h-full overflow-y-auto">
        <Tabs defaultValue="channels" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="px-4 py-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="direct">Direct</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="channels" className="m-0">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Search channels..." 
                  className="pl-8"
                />
                <MessageCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-1">
                {channels.map(channel => (
                  <button
                    key={channel.id}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-100 ${
                      selectedChannelId === channel.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleChannelSelect(channel.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className={`h-5 w-5 ${channel.isImportant ? 'text-red-500' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {channel.description}
                        </div>
                      </div>
                    </div>
                    
                    {channel.unreadCount > 0 && (
                      <Badge 
                        variant="outline" 
                        className={`${
                          channel.isImportant 
                            ? 'bg-red-100 text-red-600 border-red-200'
                            : 'bg-blue-100 text-blue-600 border-blue-200'
                        }`}
                      >
                        {channel.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="direct" className="m-0">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Search users..." 
                  className="pl-8"
                />
                <MessageCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-1">
                {users.filter(user => user.id !== currentUser.id).map(user => (
                  <button
                    key={user.id}
                    className="w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.isOnline ? 'Online' : `Last seen ${user.lastSeen}`}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Chat Area */}
      <div className="flex-grow flex flex-col h-full">
        {/* Channel Header */}
        {activeChannel && (
          <div className="border-b px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-1">
                <Hash className="h-5 w-5 text-gray-500" />
                {activeChannel.name}
              </h2>
              <p className="text-sm text-muted-foreground">{activeChannel.description}</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="text-gray-500">
                {activeChannel.participants.length} members
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Notification Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All messages</DropdownMenuItem>
                  <DropdownMenuItem>Mentions only</DropdownMenuItem>
                  <DropdownMenuItem>Nothing</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-grow p-6 overflow-y-auto">
          {activeChannelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No messages yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to send a message in #{activeChannel?.name}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeChannelMessages.map((message, index) => {
                const sender = getUserById(message.senderId);
                const showAvatar = index === 0 || 
                  activeChannelMessages[index - 1].senderId !== message.senderId;
                
                return (
                  <div key={message.id} className={`flex ${
                    showAvatar ? 'mt-6' : 'mt-2'
                  }`}>
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 mt-1 mr-3">
                        <AvatarImage src={sender?.avatar} alt={sender?.name} />
                        <AvatarFallback>{sender?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-11" /> // Space reserved for avatar
                    )}
                    
                    <div className="flex-grow">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{sender?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-1">
                        <div className="whitespace-pre-line text-sm">
                          {message.content}
                        </div>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((attachment, i) => (
                              attachment.type === "image" ? (
                                <div key={i} className="border rounded-md overflow-hidden">
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name}
                                    className="max-w-xs max-h-40 object-cover"
                                  />
                                </div>
                              ) : (
                                <div key={i} className="flex items-center gap-2 border rounded-md px-3 py-2">
                                  <PaperclipIcon className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm">{attachment.name}</span>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <button className="text-gray-500 hover:text-gray-700">
              <PaperclipIcon className="h-5 w-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Image className="h-5 w-5" />
            </button>
            <div className="flex-grow">
              <Input
                placeholder={`Message #${activeChannel?.name}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <Smile className="h-5 w-5" />
            </button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 