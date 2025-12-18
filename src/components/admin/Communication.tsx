import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Megaphone,
  Users,
  Mail,
  Bell,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  CheckCheck,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { adminService } from '../../services';
import {
  Announcement,
  CreateAnnouncementRequest,
  Message,
  CreateMessageRequest,
  BulkMessageRequest,
  CommunicationTemplate,
  CreateTemplateRequest,
  CommunicationSummary,
  Recipient,
} from '../../types/communication.types';
import { ApiException, getUserFriendlyError } from '../../utils/errors';
import { schoolStorage, userStorage } from '../../utils/storage';

// Mock data removed - now using API data

export function Communication() {
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);

  // Form states
  const [messageRecipientId, setMessageRecipientId] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messagePriority, setMessagePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState<'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EMERGENCY' | 'HOLIDAY'>('GENERAL');
  const [announcementPriority, setAnnouncementPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [announcementTargetAudience, setAnnouncementTargetAudience] = useState<'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'SPECIFIC_CLASS' | 'SPECIFIC_SECTION'>('ALL');

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  // Define fetch functions first (before useEffect)
  const fetchSummary = useCallback(async () => {
    try {
      const response = await adminService.getCommunicationSummary();
      setSummary(response);
    } catch (error: any) {
      console.error('Error fetching communication summary:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getMessages();
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAnnouncements();
      console.log('Full API response:', response); // Ab response hi array hai

      // Use response directly (not response.data)
      const announcementsList = response.map(item => ({
        ...item,
        createdByName: `${item.createdByUser?.firstName || ''} ${item.createdByUser?.lastName || ''}`.trim() || 'Admin',
        views: item.viewsCount || 0,
      }));

      setAnnouncements(announcementsList);
      console.log('Announcements set:', announcementsList);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast.error(error.message || 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);



  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getTemplates();
      setTemplates(response.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount and tab change
  useEffect(() => {
    console.log('Communication useEffect triggered, activeTab:', activeTab);
    fetchSummary();
    if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'announcements') {
      console.log('Calling fetchAnnouncements from useEffect');
      fetchAnnouncements();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, fetchSummary, fetchMessages, fetchAnnouncements, fetchTemplates]);

  // Fetch unread count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSummary();
      if (activeTab === 'messages') {
        fetchMessages();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, fetchSummary, fetchMessages]);

  const fetchRecipients = async (role: 'STUDENT' | 'TEACHER' | 'PARENT') => {
    try {
      const response = await adminService.getRecipients({ role });
      setRecipients(response.recipients || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
      setRecipients([]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageRecipientId || !messageContent) {
      toast.error('Please select recipient and enter message');
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      const currentUser = userStorage.getUser();
      const senderId = currentUser?.id || currentUser?.uuid || '';

      if (!schoolId || !senderId) {
        toast.error('Unable to identify school or user');
        return;
      }

      const request: CreateMessageRequest = {
        schoolId,
        senderId,
        recipientId: messageRecipientId,
        subject: messageSubject || undefined,
        content: messageContent,
        priority: messagePriority,
      };

      await adminService.createMessage(request);
      toast.success('Message sent successfully!');
      setShowComposeDialog(false);
      resetMessageForm();
      await fetchMessages();
      await fetchSummary();
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessage = 'Failed to send message';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      const currentUser = userStorage.getUser();
      const createdBy = currentUser?.id || currentUser?.uuid || '';

      if (!schoolId || !createdBy) {
        toast.error('Unable to identify school or user');
        return;
      }

      const request: CreateAnnouncementRequest = {
        schoolId,
        createdBy,
        title: announcementTitle,
        content: announcementContent,
        category: announcementCategory,
        priority: announcementPriority,
        targetAudience: announcementTargetAudience,
      };

      if (editingAnnouncement) {
        await adminService.updateAnnouncement(editingAnnouncement.id, request);
        toast.success('Announcement updated successfully!');
      } else {
        await adminService.createAnnouncement(request);
        toast.success('Announcement created successfully!');
      }

      setShowAnnouncementDialog(false);
      resetAnnouncementForm();
      await fetchAnnouncements();
      await fetchSummary();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      let errorMessage = editingAnnouncement ? 'Failed to update announcement' : 'Failed to create announcement';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateType || !templateContent) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolId = schoolStorage.getSchoolId();
      if (!schoolId) {
        toast.error('Unable to identify school');
        return;
      }

      const request: CreateTemplateRequest = {
        schoolId,
        templateName,
        templateType,
        subject: templateSubject || undefined,
        content: templateContent,
      };

      if (editingTemplate) {
        await adminService.updateTemplate(editingTemplate.id, request);
        toast.success('Template updated successfully!');
      } else {
        await adminService.createTemplate(request);
        toast.success('Template created successfully!');
      }

      setShowTemplateDialog(false);
      resetTemplateForm();
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error creating template:', error);
      let errorMessage = editingTemplate ? 'Failed to update template' : 'Failed to create template';
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await adminService.deleteAnnouncement(id);
      toast.success('Announcement deleted successfully!');
      await fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await adminService.deleteTemplate(id);
      toast.success('Template deleted successfully!');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await adminService.deleteMessage(id);
      toast.success('Message deleted successfully!');
      await fetchMessages();
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    try {
      await adminService.markMessageAsRead(id);
      await fetchMessages();
      await fetchSummary();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const resetMessageForm = () => {
    setMessageRecipientId('');
    setMessageSubject('');
    setMessageContent('');
    setMessagePriority('MEDIUM');
  };

  const resetAnnouncementForm = () => {
    setEditingAnnouncement(null);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementCategory('GENERAL');
    setAnnouncementPriority('MEDIUM');
    setAnnouncementTargetAudience('ALL');
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateType('');
    setTemplateSubject('');
    setTemplateContent('');
  };

  const formatDateTime = (date: string, time?: string) => {
    const dateStr = new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  const formatDateOnly = (date: string) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A66C2]/10 to-purple-500/10 rounded-3xl blur-3xl -z-10"></div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2 tracking-tight">Communication Hub</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Manage messages, announcements, and notifications</p>
          </div>
          <Button
            onClick={() => setShowComposeDialog(true)}
            className="bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-[#0052A3] hover:to-blue-700 shadow-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose Message
          </Button>
        </div>
      </div>

      {/* Stats Grid - Compact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative">
            <p className="text-white/90 text-sm mb-2 font-medium">Messages</p>
            <h3 className="text-white text-3xl mb-1 tracking-tight">{summary?.totalMessages || messages.length}</h3>
            <p className="text-white/80 text-sm font-medium">{summary?.unreadMessages || messages.filter(m => !m.isRead).length} unread</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative">
            <p className="text-white/90 text-sm mb-2 font-medium">Announcements</p>
            <h3 className="text-white text-3xl mb-1 tracking-tight">{summary?.totalAnnouncements || announcements.length}</h3>
            <p className="text-white/80 text-sm font-medium">{summary?.recentAnnouncements || 0} recent</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative">
            <p className="text-white/90 text-sm mb-2 font-medium">Broadcasts</p>
            <h3 className="text-white text-3xl mb-1 tracking-tight">-</h3>
            <p className="text-white/80 text-sm font-medium">Coming soon</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative">
            <p className="text-white/90 text-sm mb-2 font-medium">Templates</p>
            <h3 className="text-white text-3xl mb-1 tracking-tight">{summary?.totalTemplates || templates.length}</h3>
            <p className="text-white/80 text-sm font-medium">Ready to use</p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-900 p-1 shadow-lg rounded-xl border border-gray-100 dark:border-gray-800">
          <TabsTrigger value="messages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A66C2] data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
            <Megaphone className="w-4 h-4 mr-2" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg">
            <Users className="w-4 h-4 mr-2" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

            <Card className="relative rounded-3xl p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search messages..." className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl" />
                  </div>
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No messages found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-100 dark:border-gray-800 cursor-pointer group/message"
                        onClick={() => {
                          if (!message.isRead) {
                            handleMarkMessageRead(message.id);
                          }
                        }}
                      >
                        <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-gray-800 shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-blue-600 text-white">
                            {message.senderName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm text-gray-900 dark:text-white font-medium">
                                  {message.senderName || 'Unknown'}
                                </h4>
                                {!message.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-[#0A66C2]"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                                {message.subject || 'No Subject'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {message.content.substring(0, 100)}...
                              </p>
                            </div>
                            {message.priority === 'HIGH' || message.priority === 'URGENT' && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                {message.priority} Priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateOnly(message.createdAt || '')}
                            </div>
                            {message.isRead && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCheck className="w-3 h-3" />
                                Read
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

            <Card className="relative rounded-3xl p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">All Announcements</h3>
                  <Button
                    onClick={() => setShowAnnouncementDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Target Audience</TableHead>
                        <TableHead>Posted By</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                            Loading announcements...
                          </TableCell>
                        </TableRow>
                      ) : announcements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No announcements found
                          </TableCell>
                        </TableRow>
                      ) : (
                        announcements.map((announcement) => (
                          <TableRow key={announcement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell>
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                                  {announcement.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {announcement.content}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {announcement.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {announcement.targetAudience}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {announcement.createdByName || 'Admin'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDateOnly(announcement.createdAt || '')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                <Eye className="w-4 h-4" />
                                {announcement.views || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700 border-green-200"
                              >
                                Published
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingAnnouncement(announcement);
                                    setAnnouncementTitle(announcement.title);
                                    setAnnouncementContent(announcement.content);
                                    setAnnouncementCategory(announcement.category);
                                    setAnnouncementPriority(announcement.priority || 'MEDIUM');
                                    setAnnouncementTargetAudience(announcement.targetAudience);
                                    setShowAnnouncementDialog(true);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

            <Card className="relative rounded-3xl p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">Broadcast History</h3>
                  <Button
                    onClick={() => setShowBroadcastDialog(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg rounded-xl"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    New Broadcast
                  </Button>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead>Title</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Sent Date & Time</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                          Bulk messaging feature coming soon. Use individual messages or announcements for now.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

            <Card className="relative rounded-3xl p-8 border-0 shadow-xl bg-white dark:bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">Message Templates</h3>
                  <Button
                    onClick={() => setShowTemplateDialog(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No templates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-gray-900 dark:text-white font-medium mb-1">
                              {template.templateName}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {template.templateType}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingTemplate(template);
                                setTemplateName(template.templateName);
                                setTemplateType(template.templateType);
                                setTemplateSubject(template.subject || '');
                                setTemplateContent(template.content);
                                setShowTemplateDialog(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTemplate(template.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {template.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Template</span>
                          <span>Created: {formatDateOnly(template.createdAt || '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose Message Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to students, teachers, or parents</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select
                    onValueChange={(role) => {
                      setMessageRecipientId(''); // Reset selected recipient
                      setRecipients([]); // Clear recipients list
                      if (role && role !== 'all') {
                        fetchRecipients(role as 'STUDENT' | 'TEACHER' | 'PARENT');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="PARENT">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Recipient</Label>
                  <div className="relative">
                    <Select
                      value={messageRecipientId}
                      onValueChange={setMessageRecipientId}
                    >
                      <SelectTrigger className="pr-10">
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-500">
                            {isLoading ? 'Loading recipients...' : 'No recipients available'}
                          </div>
                        ) : (
                          recipients.map((recipient) => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              {recipient.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Clear Button */}
                    {messageRecipientId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageRecipientId('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                        aria-label="Clear recipient"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="Enter message subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={6}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={messagePriority} onValueChange={(val) => setMessagePriority(val as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowComposeDialog(false);
              resetMessageForm();
            }}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-[#0052A3] hover:to-blue-700"
              onClick={handleSendMessage}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Post a new announcement for the school community</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="ann-title">Title *</Label>
                <Input
                  id="ann-title"
                  placeholder="Enter announcement title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-content">Content *</Label>
                <Textarea
                  id="ann-content"
                  placeholder="Write your announcement..."
                  rows={6}
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-category">Category</Label>
                  <Select value={announcementCategory} onValueChange={(val) => setAnnouncementCategory(val as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ACADEMIC">Academic</SelectItem>
                      <SelectItem value="EVENT">Event</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      <SelectItem value="HOLIDAY">Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ann-audience">Target Audience</Label>
                  <Select value={announcementTargetAudience} onValueChange={(val) => setAnnouncementTargetAudience(val as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="STUDENTS">Students</SelectItem>
                      <SelectItem value="TEACHERS">Teachers</SelectItem>
                      <SelectItem value="PARENTS">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-priority">Priority</Label>
                <Select value={announcementPriority} onValueChange={(val) => setAnnouncementPriority(val as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAnnouncementDialog(false);
              resetAnnouncementForm();
            }}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={handleCreateAnnouncement}
              disabled={isSubmitting}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {isSubmitting ? (editingAnnouncement ? 'Updating...' : 'Creating...') : (editingAnnouncement ? 'Update Announcement' : 'Create Announcement')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Broadcast Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Broadcast</DialogTitle>
            <DialogDescription>Send mass messages to multiple recipients</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="bc-title">Broadcast Title</Label>
                <Input id="bc-title" placeholder="Enter broadcast title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bc-message">Message</Label>
                <Textarea id="bc-message" placeholder="Write your message..." rows={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bc-recipients">Recipients</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-parents">All Parents</SelectItem>
                      <SelectItem value="all-students">All Students</SelectItem>
                      <SelectItem value="all-teachers">All Teachers</SelectItem>
                      <SelectItem value="grade-10">Grade 10 Students</SelectItem>
                      <SelectItem value="grade-11">Grade 11 Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bc-channel">Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">Email + SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bc-date">Schedule Date</Label>
                  <Input id="bc-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bc-time">Schedule Time</Label>
                  <Input id="bc-time" type="time" />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.success('Broadcast scheduled successfully!');
                setShowBroadcastDialog(false);
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={() => {
                toast.success('Broadcast sent successfully!');
                setShowBroadcastDialog(false);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Create a reusable message template</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="temp-name">Template Name *</Label>
                <Input
                  id="temp-name"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-type">Type *</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-subject">Subject (Optional)</Label>
                <Input
                  id="temp-subject"
                  placeholder="Enter template subject"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-content">Template Content *</Label>
                <Textarea
                  id="temp-content"
                  placeholder="Write your template... Use [Name], [Date], [Amount] as placeholders"
                  rows={8}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2 font-medium">Available Placeholders:</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <span>[Name]</span>
                  <span>[Date]</span>
                  <span>[Time]</span>
                  <span>[Amount]</span>
                  <span>[Class]</span>
                  <span>[Subject]</span>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTemplateDialog(false);
              resetTemplateForm();
            }}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              onClick={handleCreateTemplate}
              disabled={isSubmitting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isSubmitting ? (editingTemplate ? 'Updating...' : 'Saving...') : (editingTemplate ? 'Update Template' : 'Save Template')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
