"use client";

import React, { useState, useEffect } from "react";
import { Card } from "ui/card";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion";
import { Send, Calendar as CalendarIcon, Clock, Hash, AtSign, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTwitterWebSocket } from "@/lib/websocket/client";

interface TwitterAccount {
  id: string;
  username: string;
  displayName: string;
}

interface TweetComposerProps {
  userId?: string;
}

export function TweetComposer({ userId }: TweetComposerProps = {}) {
  const [content, setContent] = useState("");
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set up WebSocket for real-time feedback
  useTwitterWebSocket(userId || null, {
    onTweetCreated: (tweet) => {
      console.log("Real-time: Tweet created", tweet);
      if (tweet.status === 'draft') {
        toast.success("Draft saved and synced!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." saved successfully`
        });
      } else if (tweet.status === 'scheduled') {
        toast.success("Tweet scheduled successfully!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." scheduled via UI sync`
        });
      }
    },
    onTweetUpdated: (tweet) => {
      console.log("Real-time: Tweet updated", tweet);
      if (tweet.status === 'draft') {
        toast.success("Draft updated!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." was updated`
        });
      } else if (tweet.status === 'scheduled') {
        toast.success("Tweet scheduled!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." was scheduled`
        });
      }
    },
    onTweetDeleted: (tweetId) => {
      console.log("Real-time: Tweet deleted", tweetId);
      toast.success("Tweet deleted!", {
        description: "Tweet was deleted successfully"
      });
    },
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/twitter/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const getCharacterCount = (text: string) => {
    // Twitter's character counting is complex, this is a simplified version
    return text.length;
  };

  const getCharacterColor = (count: number) => {
    if (count > 280) return "text-destructive";
    if (count > 260) return "text-orange-500";
    return "text-muted-foreground";
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractMentions = (text: string) => {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  };

  const handlePostNow = async () => {
    if (!content.trim()) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    if (getCharacterCount(content) > 280) {
      toast.error("Tweet exceeds 280 character limit");
      return;
    }

    setPosting(true);
    try {
      const response = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          twitterAccountId: selectedAccount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet posted successfully!");
        setContent("");
      } else {
        toast.error(data.error || "Failed to post tweet");
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      toast.error("Failed to post tweet");
    } finally {
      setPosting(false);
    }
  };

  const handleScheduleTweet = async () => {
    if (!content.trim()) {
      toast.error("Tweet content is required");
      return;
    }
    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }
    if (!scheduleDateTime) {
      toast.error("Please select a schedule time");
      return;
    }
    if (getCharacterCount(content) > 280) {
      toast.error("Tweet exceeds 280 character limit");
      return;
    }
    // Use datetime-local input directly (like tweet-list edit dialog)
    const localDateTime = new Date(scheduleDateTime);
    
    // Validate: must be in the future and within 7 days
    const now = new Date();
    const delayMs = localDateTime.getTime() - now.getTime();
    if (delayMs < 0) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    if (delayMs > 604800000) { // 7 days in milliseconds
      toast.error("You can only schedule tweets up to 7 days in advance.");
      return;
    }
    
    // Send local datetime directly (server will handle timezone conversion)
    const scheduledForLocal = scheduleDateTime;
    setScheduling(true);
    try {
      const response = await fetch('/api/twitter/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          twitterAccountId: selectedAccount,
          scheduledFor: scheduledForLocal,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Send user's timezone
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Tweet scheduled for ${format(localDateTime, "MMM d, yyyy 'at' h:mm a")}`);
        setContent("");
        setScheduleDateTime("");
        setIsScheduled(false);
      } else {
        toast.error(data.error || "Failed to schedule tweet");
      }
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      toast.error("Failed to schedule tweet");
    } finally {
      setScheduling(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    setSaving(true);
    try {
      // Use the internal Twitter API to save as draft
      const response = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          twitterAccountId: selectedAccount,
          saveDraft: true, // Save to database but don't post to Twitter
          status: 'draft', // Mark as draft status
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Draft saved successfully!");
        setContent("");
      } else {
        toast.error(data.error || "Failed to save draft");
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const characterCount = getCharacterCount(content);
  const hashtags = extractHashtags(content);
  const mentions = extractMentions(content);

  return (
    <Card>
      <Accordion type="single" collapsible defaultValue="composer">
        <AccordionItem value="composer">
          <AccordionTrigger className="px-6 py-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <div>
                <div className="text-lg font-semibold">Tweet Composer</div>
                <div className="text-sm text-muted-foreground">Create and schedule your tweets</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-6 pb-6 space-y-4">
              {/* Account Selection */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          @{account.username} ({account.displayName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tweet Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">What&apos;s happening?</label>
                  <span className={`text-sm ${getCharacterColor(characterCount)}`}>
                    {characterCount}/280
                  </span>
                </div>
                <Textarea
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={300} // Allow slightly over for better UX
                />
              </div>

              {/* Hashtags and Mentions */}
              {(hashtags.length > 0 || mentions.length > 0) && (
                <div className="space-y-2">
                  {hashtags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {mentions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      {mentions.map((mention, index) => (
                        <Badge key={index} variant="outline">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduling Options */}
              {isScheduled && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Schedule Tweet</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Schedule for:</label>
                    <Input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={e => setScheduleDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={!content.trim() || saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                
                <Button
                  onClick={() => setIsScheduled(!isScheduled)}
                  variant="outline"
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {isScheduled ? "Cancel Schedule" : "Schedule"}
                </Button>
                
                {isScheduled ? (
                  <Button
                    onClick={handleScheduleTweet}
                    disabled={!content.trim() || !selectedAccount || !scheduleDateTime || scheduling}
                    className="flex-1"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {scheduling ? "Scheduling..." : "Schedule Tweet"}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePostNow}
                    disabled={!content.trim() || !selectedAccount || posting || characterCount > 280}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {posting ? "Posting..." : "Post Now"}
                  </Button>
                )}
              </div>

              {accounts.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Please connect a Twitter account to start composing tweets
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}