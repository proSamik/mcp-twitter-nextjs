"use client";

import React, { useState, useEffect } from "react";
import { Card } from "ui/card";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui/accordion";
import {
  Send,
  Calendar as CalendarIcon,
  Clock,
  Hash,
  AtSign,
  Save,
  Plus,
  Trash2,
  Users,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTwitterWebSocket } from "@/lib/websocket/client";
import {
  TwitterAccount,
  Community,
  getCharacterCount,
  getCharacterColor,
  extractHashtags,
  extractMentions,
  validateScheduleTime,
  splitIntoThreads,
} from "../shared/composer-utils";

interface TextTweetComposerProps {
  userId?: string;
}

export function TextTweetComposer({ userId }: TextTweetComposerProps = {}) {
  const [content, setContent] = useState("");
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [isThread, setIsThread] = useState(false);
  const [threadTweets, setThreadTweets] = useState<string[]>([""]);
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set up WebSocket for real-time feedback
  useTwitterWebSocket(userId || null, {
    onTweetCreated: (tweet) => {
      console.log("Real-time: Tweet created", tweet);
      if (tweet.status === "draft") {
        toast.success("Draft saved and synced!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." saved successfully`,
        });
      } else if (tweet.status === "scheduled") {
        toast.success("Tweet scheduled successfully!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." scheduled via UI sync`,
        });
      }
    },
    onTweetUpdated: (tweet) => {
      console.log("Real-time: Tweet updated", tweet);
      if (tweet.status === "draft") {
        toast.success("Draft updated!", {
          description: `Draft "${tweet.content.substring(0, 50)}..." was updated`,
        });
      } else if (tweet.status === "scheduled") {
        toast.success("Tweet scheduled!", {
          description: `Tweet "${tweet.content.substring(0, 50)}..." was scheduled`,
        });
      }
    },
    onTweetDeleted: (tweetId) => {
      console.log("Real-time: Tweet deleted", tweetId);
      toast.success("Tweet deleted!", {
        description: "Tweet was deleted successfully",
      });
    },
  });

  useEffect(() => {
    fetchAccounts();
    fetchCommunities();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/twitter/accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities");
      const data = await response.json();

      if (data.success) {
        setCommunities(data.communities);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const addThreadTweet = () => {
    setThreadTweets([...threadTweets, ""]);
  };

  const removeThreadTweet = (index: number) => {
    if (threadTweets.length > 1) {
      const newTweets = threadTweets.filter((_, i) => i !== index);
      setThreadTweets(newTweets);
    }
  };

  const updateThreadTweet = (index: number, value: string) => {
    const newTweets = [...threadTweets];
    newTweets[index] = value;
    setThreadTweets(newTweets);
  };

  const autoSplitToThread = () => {
    if (content.trim()) {
      const splits = splitIntoThreads(content, 270);
      setThreadTweets(splits);
      setIsThread(true);
      setContent("");
      toast.success(`Content split into ${splits.length} tweets`);
    }
  };

  const handlePostNow = async () => {
    const contentToPost = isThread
      ? threadTweets.filter((t) => t.trim())
      : [content];

    if (contentToPost.length === 0 || !contentToPost[0].trim()) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    // Character count validation removed - no limits

    setPosting(true);
    try {
      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread
            ? threadTweets.filter((t) => t.trim())
            : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet posted successfully!");
        setContent("");
        setThreadTweets([""]);
        setIsThread(false);
        setSelectedCommunity("none");
      } else {
        toast.error(data.error || "Failed to post tweet");
      }
    } catch (error) {
      console.error("Error posting tweet:", error);
      toast.error("Failed to post tweet");
    } finally {
      setPosting(false);
    }
  };

  const handleScheduleTweet = async () => {
    const contentToPost = isThread
      ? threadTweets.filter((t) => t.trim())
      : [content];

    if (contentToPost.length === 0 || !contentToPost[0].trim()) {
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

    const validation = validateScheduleTime(scheduleDateTime);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Character count validation removed - no limits

    const localDateTime = new Date(scheduleDateTime);
    setScheduling(true);
    try {
      const response = await fetch("/api/twitter/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: isThread ? null : content,
          isThread,
          threadTweets: isThread
            ? threadTweets.filter((t) => t.trim())
            : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          scheduledFor: scheduleDateTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(
          `Tweet scheduled for ${format(localDateTime, "MMM d, yyyy 'at' h:mm a")}`,
        );
        setContent("");
        setThreadTweets([""]);
        setIsThread(false);
        setScheduleDateTime("");
        setIsScheduled(false);
        setSelectedCommunity("none");
      } else {
        toast.error(data.error || "Failed to schedule tweet");
      }
    } catch (error) {
      console.error("Error scheduling tweet:", error);
      toast.error("Failed to schedule tweet");
    } finally {
      setScheduling(false);
    }
  };

  const handleSaveDraft = async () => {
    const contentToSave = isThread
      ? threadTweets.filter((t) => t.trim()).join("\n\n")
      : content;

    if (!contentToSave.trim()) {
      toast.error("Tweet content is required");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select a Twitter account");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/twitter/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentToSave,
          isThread,
          threadTweets: isThread
            ? threadTweets.filter((t) => t.trim())
            : undefined,
          twitterAccountId: selectedAccount,
          communityId:
            selectedCommunity === "none"
              ? undefined
              : selectedCommunity || undefined,
          saveDraft: true,
          status: "draft",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Draft saved successfully!");
        setContent("");
        setThreadTweets([""]);
        setIsThread(false);
        setSelectedCommunity("none");
      } else {
        toast.error(data.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const currentContent = isThread ? threadTweets.join("\n\n") : content;
  const characterCount = getCharacterCount(currentContent);
  const hashtags = extractHashtags(currentContent);
  const mentions = extractMentions(currentContent);

  return (
    <div className="">
      {/* Composer */}
      <Card>
        <Accordion type="single" collapsible defaultValue="composer">
          <AccordionItem value="composer">
            <AccordionTrigger className="px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-lg font-semibold">
                    Text Tweet Composer
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Create text tweets and threads
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-6 space-y-4">
                {/* Account Selection */}
                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account</label>
                    <Select
                      value={selectedAccount}
                      onValueChange={setSelectedAccount}
                    >
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

                {/* Community Selection */}
                {communities.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Community (Optional)
                    </label>
                    <Select
                      value={selectedCommunity}
                      onValueChange={setSelectedCommunity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select community (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Community</SelectItem>
                        {communities.map((community) => (
                          <SelectItem
                            key={community.id}
                            value={community.communityId}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {community.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Thread Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Compose Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={!isThread ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsThread(false);
                        setThreadTweets([""]);
                      }}
                    >
                      Single Tweet
                    </Button>
                    <Button
                      variant={isThread ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsThread(true)}
                    >
                      Thread
                    </Button>
                  </div>
                </div>

                {/* Tweet Content */}
                {!isThread ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        What&apos;s happening?
                      </label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${getCharacterColor(characterCount)}`}
                        >
                          {characterCount} chars
                        </span>
                        {content.length > 280 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={autoSplitToThread}
                            className="text-xs"
                          >
                            Split to Thread
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      placeholder="What's happening?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Thread ({threadTweets.length} tweets)
                      </label>
                    </div>
                    {threadTweets.map((tweet, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Tweet {index + 1}</label>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm ${getCharacterColor(getCharacterCount(tweet))}`}
                            >
                              {getCharacterCount(tweet)} chars
                            </span>
                            {threadTweets.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeThreadTweet(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Textarea
                          placeholder={`Tweet ${index + 1}...`}
                          value={tweet}
                          onChange={(e) =>
                            updateThreadTweet(index, e.target.value)
                          }
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    ))}
                    {/* Add Tweet Button - moved to bottom */}
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addThreadTweet}
                        className="w-full max-w-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tweet
                      </Button>
                    </div>
                  </div>
                )}

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
                      <span className="text-sm font-medium">
                        Schedule Tweet
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm">Schedule for:</label>
                      <Input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
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
                    disabled={!currentContent.trim() || saving}
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
                      disabled={
                        !currentContent.trim() ||
                        !selectedAccount ||
                        !scheduleDateTime ||
                        scheduling
                      }
                      className="flex-1"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduling ? "Scheduling..." : "Schedule Tweet"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePostNow}
                      disabled={
                        !currentContent.trim() || !selectedAccount || posting
                      }
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
    </div>
  );
}
