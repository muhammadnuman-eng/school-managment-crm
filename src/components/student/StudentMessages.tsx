import { useState } from 'react';
import { Send, Search, Paperclip, MoreVertical, User, Loader2, RefreshCw, Bell } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useMessages, useAnnouncements, useSendMessage } from '../../hooks/useStudentData';
import type { Message } from '../../services/studentApi';

// Skeleton loader
function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-1 h-[600px]" />
        <Skeleton className="lg:col-span-2 h-[600px]" />
      </div>
    </div>
  );
}

export function StudentMessages() {
  // API Hooks - Based on student-panel-apis.json
  // COMM_02: /student/communications/messages
  const { data: messages, loading: messagesLoading, error: messagesError, refetch: refetchMessages } = useMessages();
  
  // COMM_01: /student/communications/announcements
  const { data: announcements, loading: announcementsLoading } = useAnnouncements();
  
  // COMM_03: /student/communications/messages (POST)
  const { sendMessage, loading: sending } = useSendMessage();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const loading = messagesLoading;

  // Filter messages
  const filteredMessages = messages?.filter(msg =>
    msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const unreadCount = messages?.filter(msg => !msg.isRead).length || 0;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !replyTo) return;
    
    const result = await sendMessage({
      recipientUserId: replyTo.sender.id,
      subject: `Re: ${replyTo.subject}`,
      content: messageText.trim(),
      priority: 'NORMAL',
    });

    if (result) {
      setMessageText('');
      setReplyTo(null);
      refetchMessages();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'teacher': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'parent': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'NORMAL': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      case 'LOW': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with your teachers and school
          </p>
          {messagesError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load messages. Please try again.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => refetchMessages()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Messages Interface */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="messages" className="relative">
            Messages
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements">
            Announcements
            {announcements && announcements.length > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                {announcements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <Card className="lg:col-span-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        } ${!message.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm truncate ${!message.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                                {message.sender.name}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-xs ${getRoleColor(message.sender.role)}`}>
                                {message.sender.role}
                              </Badge>
                              {message.priority === 'HIGH' && (
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(message.priority)}`}>
                                  High
                                </Badge>
                              )}
                            </div>
                            <p className={`text-xs truncate ${!message.isRead ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                              {message.subject || message.content.substring(0, 50)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No messages found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Message Detail / Compose */}
            <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              {selectedMessage ? (
                <>
                  {/* Message Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedMessage.sender.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(selectedMessage.sender.role)}`}>
                            {selectedMessage.sender.role}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(selectedMessage.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Message Content */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {selectedMessage.subject && (
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedMessage.subject}
                        </h2>
                      )}
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedMessage.content}
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-end gap-3">
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="resize-none flex-1"
                        onFocus={() => setReplyTo(selectedMessage)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        disabled={sending || !messageText.trim()}
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg text-gray-900 dark:text-white mb-2">No message selected</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose a message from the list to view details
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">School Announcements</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {announcementsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : announcements && announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        announcement.priority === 'HIGH' 
                          ? 'bg-red-100 dark:bg-red-900/20' 
                          : 'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        <Bell className={`w-6 h-6 ${
                          announcement.priority === 'HIGH'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                          {announcement.priority === 'HIGH' && (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                              Important
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(announcement.date).toLocaleDateString()}</span>
                          {announcement.author && <span>By: {announcement.author}</span>}
                          <Badge variant="outline" className="text-xs">
                            {announcement.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p>No announcements available</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
