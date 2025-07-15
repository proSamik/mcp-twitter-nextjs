"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import { Calendar } from "ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { Send, Calendar as CalendarIcon, Clock, Hash, AtSign, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TwitterAccount {
  id: string;
  username: string;
  displayName: string;
}

export function TweetComposer() {
  const [content, setContent] = useState("");
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);

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

    if (!scheduledDate) {
      toast.error("Please select a date");
      return;
    }

    if (getCharacterCount(content) > 280) {
      toast.error("Tweet exceeds 280 character limit");
      return;
    }

    // Combine date and time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (scheduledDateTime <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

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
          scheduledFor: scheduledDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Tweet scheduled for ${format(scheduledDateTime, "MMM d, yyyy 'at' h:mm a")}`);
        setContent("");
        setScheduledDate(undefined);
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

    setSaving(true);
    try {
      // This would typically save to drafts - for now, we'll use the MCP API
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('apiKey') || ''}`,
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'create_tweet',
            arguments: {
              content,
              status: 'draft',
              tweetType: 'single',
              twitterAccountId: selectedAccount,
            },
          },
          id: Date.now(),
        }),
      });

      const data = await response.json();

      if (data.result && !data.error) {
        toast.success("Draft saved successfully!");
        setContent("");
      } else {
        toast.error("Failed to save draft");
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
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          <CardTitle>Tweet Composer</CardTitle>
        </div>
        <CardDescription>
          Create and schedule your tweets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Time</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
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
              disabled={!content.trim() || !selectedAccount || scheduling}
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
      </CardContent>
    </Card>
  );
}