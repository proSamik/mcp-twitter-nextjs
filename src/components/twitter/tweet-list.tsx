"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { 
  MessageSquare, 
  Calendar, 
  Edit, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  CalendarPlus
} from "lucide-react";
import { TweetEntity } from "@/lib/db/pg/schema.pg";
import { useTweetListWebSocket } from "@/lib/websocket/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TweetListProps {
  userId: string;
}

export function TweetList({ userId }: TweetListProps) {
  const [tweets, setTweets] = useState<TweetEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTweet, setEditingTweet] = useState<TweetEntity | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");

  // Set up WebSocket for real-time updates
  const { setTweets: setWebSocketTweets } = useTweetListWebSocket(userId, (updatedTweets) => {
    console.log("Real-time tweet update:", updatedTweets);
    setTweets(updatedTweets);
  });

  // Fetch initial tweets once, then rely on WebSocket for updates
  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/twitter/tweets');
      const data = await response.json();
      
      if (data.success) {
        setTweets(data.tweets);
        setWebSocketTweets(data.tweets); // Initialize WebSocket state
      } else {
        toast.error("Failed to fetch tweets");
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error("Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/twitter/tweets?tweetId=${tweetId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Tweet deleted successfully");
        // WebSocket will handle the UI update
      } else {
        toast.error(data.error || "Failed to delete tweet");
      }
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error("Failed to delete tweet");
    }
  };

  // Handler to open edit dialog for a draft
  const handleEditDraft = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
    setScheduleDate("");
    setEditContent(tweet.content || "");
  };

  // Handler to open edit dialog for a scheduled tweet
  const handleEditScheduled = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
    setEditContent(tweet.content || "");
    
    // Pre-populate schedule date if editing a scheduled tweet
    if (tweet.scheduledFor) {
      // Convert UTC date to local datetime-local format for input field
      const utcDate = new Date(tweet.scheduledFor);
      // Convert to local time for datetime-local input
      const localISOTime = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduleDate(localISOTime);
    } else {
      setScheduleDate("");
    }
  };

  // Handler to schedule a draft
  const handleScheduleDraft = async () => {
    if (!editingTweet) return;
    try {
      const response = await fetch('/api/twitter/tweets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: 'schedule',
          scheduledFor: new Date(scheduleDate).toISOString(), // Convert to UTC ISO string
          content: editContent !== editingTweet.content ? editContent : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Draft scheduled successfully');
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || 'Failed to schedule draft');
      }
    } catch (_error) {
      toast.error('Failed to schedule draft');
    } finally {
      setEditDialogOpen(false);
    }
  };

  // Handler to reschedule an existing scheduled tweet
  const handleReschedule = async () => {
    if (!editingTweet || !scheduleDate) return;
    
    try {
      const response = await fetch('/api/twitter/tweets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: 'reschedule',
          scheduledFor: new Date(scheduleDate).toISOString(), // Convert to UTC ISO string
          content: editContent !== editingTweet.content ? editContent : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Tweet rescheduled successfully');
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || 'Failed to reschedule tweet');
      }
    } catch (_error) {
      toast.error('Failed to reschedule tweet');
    } finally {
      setEditDialogOpen(false);
    }
  };
  // Handler to post a draft immediately
  const handlePostDraft = async () => {
    if (!editingTweet) return;
    try {
      const response = await fetch('/api/twitter/tweets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId: editingTweet.nanoId,
          action: 'post',
          content: editContent !== editingTweet.content ? editContent : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Draft posted successfully');
        // WebSocket will handle the UI update automatically
      } else {
        toast.error(data.error || 'Failed to post draft');
      }
    } catch (_error) {
      toast.error('Failed to post draft');
    } finally {
      setEditDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle2 className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const drafts = tweets.filter(tweet => tweet.status === 'draft');
  const scheduled = tweets.filter(tweet => tweet.status === 'scheduled');
  const posted = tweets.filter(tweet => tweet.status === 'posted');

  const TweetCard = ({ tweet }: { tweet: TweetEntity }) => (
    <Card key={tweet.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(tweet.status)}
            <Badge className={getStatusColor(tweet.status)}>
              {tweet.status}
            </Badge>
            {tweet.tweetType === 'thread' && (
              <Badge variant="outline">Thread</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {tweet.status === 'posted' && tweet.twitterTweetId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`https://twitter.com/i/web/status/${tweet.twitterTweetId}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {tweet.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditDraft(tweet)}
                className="mr-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {tweet.status === 'scheduled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditScheduled(tweet)}
                className="mr-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteTweet(tweet.nanoId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3 whitespace-pre-wrap">{tweet.content}</p>
        
        <div className="space-y-2">
          {tweet.hashtags && tweet.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tweet.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {tweet.mentions && tweet.mentions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tweet.mentions.map((mention, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  @{mention}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            {tweet.createdAt && (
              <span>Created {format(new Date(tweet.createdAt), "MMM d, h:mm a")}</span>
            )}
            {tweet.scheduledFor && (
              <span>Scheduled for {format(new Date(tweet.scheduledFor), "MMM d, h:mm a")}</span>
            )}
            {tweet.postedAt && (
              <span>Posted {format(new Date(tweet.postedAt), "MMM d, h:mm a")}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tweets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Your Tweets</CardTitle>
        </div>
        <CardDescription>
          Manage your drafts, scheduled tweets, and posted content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({tweets.length})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled ({scheduled.length})
            </TabsTrigger>
            <TabsTrigger value="posted">
              Posted ({posted.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {tweets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tweets yet. Start by composing your first tweet!</p>
              </div>
            ) : (
              tweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
            )}
          </TabsContent>
          
          <TabsContent value="drafts" className="space-y-4 mt-4">
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No drafts saved.</p>
              </div>
            ) : (
              drafts.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
            )}
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4 mt-4">
            {scheduled.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tweets.</p>
              </div>
            ) : (
              scheduled.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
            )}
          </TabsContent>
          
          <TabsContent value="posted" className="space-y-4 mt-4">
            {posted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posted tweets.</p>
              </div>
            ) : (
              posted.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Tweet Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTweet?.status === 'draft' ? 'Edit Draft' : 'Edit Scheduled Tweet'}
            </DialogTitle>
            <DialogDescription>
              {editingTweet?.status === 'draft' 
                ? 'Convert this draft to a scheduled or posted tweet.'
                : 'Reschedule this tweet to a new time or post it immediately.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tweet Content:</label>
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="What's happening?"
                className="min-h-[100px] resize-none"
                maxLength={280}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{editContent.length}/280 characters</span>
                {editContent.length > 280 && (
                  <span className="text-red-500">Tweet exceeds character limit</span>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {editingTweet?.status === 'draft' 
                  ? 'Schedule for (optional):' 
                  : 'New schedule time:'
                }
              </label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            {editingTweet?.status === 'scheduled' && editingTweet.scheduledFor && (
              <div className="text-sm text-muted-foreground">
                Currently scheduled for: {format(new Date(editingTweet.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              {editingTweet?.status === 'draft' ? (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={handlePostDraft}
                    disabled={!editContent.trim() || editContent.length > 280}
                  >
                    <Send className="h-4 w-4 mr-1" /> Post Now
                  </Button>
                  <Button 
                    onClick={handleScheduleDraft} 
                    disabled={!scheduleDate || !editContent.trim() || editContent.length > 280}
                  >
                    <CalendarPlus className="h-4 w-4 mr-1" /> Schedule
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={handlePostDraft}
                    disabled={!editContent.trim() || editContent.length > 280}
                  >
                    <Send className="h-4 w-4 mr-1" /> Post Now
                  </Button>
                  <Button 
                    onClick={handleReschedule} 
                    disabled={!scheduleDate || !editContent.trim() || editContent.length > 280}
                  >
                    <Clock className="h-4 w-4 mr-1" /> Reschedule
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}