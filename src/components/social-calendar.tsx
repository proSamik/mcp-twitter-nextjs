"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecureMediaGrid } from "@/components/ui/secure-media";
import { TweetEmbed } from "@/components/twitter/tweet-embed";
import { MediaTweetEditor } from "@/components/twitter/media-tweet-editor";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  getDate,
} from "date-fns";
import { TweetEntity } from "@/lib/db/pg/schema.pg";
import Link from "next/link";
import { toast } from "sonner";

interface SocialCalendarProps {
  userId: string;
}

export function SocialCalendar({ userId }: SocialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tweets, setTweets] = useState<TweetEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Fetch tweets for calendar
  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/twitter/tweets");
      const data = await response.json();

      if (data.success) {
        setTweets(data.tweets);
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTweetsForDate = (date: Date) => {
    return tweets.filter((tweet) => {
      // For scheduled tweets, use scheduledFor date
      if (tweet.status === "scheduled" && tweet.scheduledFor) {
        return isSameDay(new Date(tweet.scheduledFor), date);
      }
      // For posted tweets, use postedAt date
      if (tweet.status === "posted" && tweet.postedAt) {
        return isSameDay(new Date(tweet.postedAt), date);
      }
      // For drafts, use createdAt date
      if (tweet.status === "draft" && tweet.createdAt) {
        return isSameDay(new Date(tweet.createdAt), date);
      }
      // For failed tweets, use createdAt or scheduledFor date
      if (tweet.status === "failed") {
        if (tweet.scheduledFor) {
          return isSameDay(new Date(tweet.scheduledFor), date);
        }
        if (tweet.createdAt) {
          return isSameDay(new Date(tweet.createdAt), date);
        }
      }
      return false;
    });
  };

  const getStatusSymbol = (status: string, _index: number) => {
    const colors = {
      posted: "bg-green-500",
      scheduled: "bg-blue-500",
      draft: "bg-gray-500",
      failed: "bg-red-500",
    };

    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${colors[status as keyof typeof colors]} mr-1`}
      ></span>
    );
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(day); // Create a copy to avoid closure issues
        const dayTweets = getTweetsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isToday = isSameDay(currentDay, new Date());

        days.push(
          <div
            key={currentDay.toString()}
            className={`
              min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
              ${isCurrentMonth ? "bg-white" : "bg-gray-50"} 
              ${isToday ? "bg-blue-50 border-blue-300" : ""}
              relative
            `}
            onClick={() => {
              setSelectedDate(currentDay);
              setShowDayModal(true);
            }}
          >
            <div className="text-xs font-medium text-gray-600 mb-1">
              {getDate(currentDay)}
            </div>
            <div className="space-y-1">
              {dayTweets.slice(0, 4).map((tweet, index) => (
                <div key={tweet.nanoId} className="flex items-center gap-1">
                  {getStatusSymbol(tweet.status, index)}
                  <span className="text-xs truncate flex-1">{index + 1}</span>
                </div>
              ))}
              {dayTweets.length > 4 && (
                <div className="text-xs text-gray-500">
                  +{dayTweets.length - 4} more
                </div>
              )}
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>,
      );
      days = [];
    }

    return rows;
  };

  const weekDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Social Calendar</h1>
            <p className="text-muted-foreground">
              View and manage your scheduled social media posts
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-0">{renderCalendarGrid()}</div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm">Posted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-500"></span>
              <span className="text-sm">Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm">Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Modal - Full Width */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="!max-w-none !w-[98vw] !h-[95vh] p-0 m-2 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>All tweets for this day</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
            {selectedDate && (
              <DayTweetList
                userId={userId}
                selectedDate={selectedDate}
                tweets={getTweetsForDate(selectedDate)}
                onRefresh={() => fetchTweets()}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Day-specific tweet list component for calendar modal
 */
interface DayTweetListProps {
  userId: string;
  selectedDate: Date;
  tweets: TweetEntity[];
  onRefresh: () => void;
}

function DayTweetList({ selectedDate, tweets, onRefresh }: DayTweetListProps) {
  const [collapsedTweets, setCollapsedTweets] = useState<Set<string>>(
    new Set(),
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTweet, setEditingTweet] = useState<TweetEntity | null>(null);

  const toggleCollapse = (tweetId: string) => {
    setCollapsedTweets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tweetId)) {
        newSet.delete(tweetId);
      } else {
        newSet.add(tweetId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No tweets for this day</h3>
        <p>
          No tweets were scheduled or posted on{" "}
          {format(selectedDate, "MMMM d, yyyy")}
        </p>
      </div>
    );
  }

  // Handler to open edit dialog for a draft
  const handleEditDraft = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
  };

  // Handler to open edit dialog for a scheduled tweet
  const handleEditScheduled = (tweet: TweetEntity) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
  };

  // Handler for when tweet is updated from editor
  const handleTweetUpdate = () => {
    setEditDialogOpen(false);
    setEditingTweet(null);
    onRefresh(); // Refresh the calendar data
  };

  // Handler to delete a tweet
  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/twitter/tweets?tweetId=${tweetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet deleted successfully");
        onRefresh(); // Refresh the calendar data
      } else {
        toast.error(data.error || "Failed to delete tweet");
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  // Handler for when edit is cancelled
  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingTweet(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Found {tweets.length} tweet{tweets.length !== 1 ? "s" : ""} for this
          day
        </div>

        {tweets.map((tweet) => (
          <Card
            key={tweet.nanoId}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleCollapse(tweet.nanoId)}
                    className="p-1 h-auto"
                  >
                    {collapsedTweets.has(tweet.nanoId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  {getStatusIcon(tweet.status)}
                  <Badge className={getStatusColor(tweet.status)}>
                    {tweet.status}
                  </Badge>
                  {tweet.tweetType === "thread" && (
                    <Badge variant="outline">Thread</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {tweet.status === "posted" && tweet.twitterTweetId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        window.open(
                          `https://twitter.com/i/web/status/${tweet.twitterTweetId}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {tweet.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDraft(tweet)}
                      className="mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {tweet.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditScheduled(tweet)}
                      className="mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {(tweet.status === "draft" ||
                    tweet.status === "scheduled") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTweet(tweet.nanoId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {!collapsedTweets.has(tweet.nanoId) && (
              <CardContent className="max-h-96 overflow-y-auto">
                {/* Show content and media for drafts and scheduled tweets */}
                {tweet.status !== "posted" && (
                  <>
                    {tweet.tweetType === "thread" &&
                    tweet.threadTweets &&
                    tweet.threadTweets.length > 0 ? (
                      <div className="space-y-4">
                        {tweet.threadTweets.map(
                          (threadTweet: any, index: number) => (
                            <div
                              key={index}
                              className="border-l-2 border-gray-200 pl-4"
                            >
                              <div className="text-sm font-medium text-gray-600 mb-1">
                                Tweet {index + 1}
                              </div>
                              <p className="text-sm mb-2 whitespace-pre-wrap">
                                {threadTweet.content}
                              </p>
                              {threadTweet.mediaIds &&
                                threadTweet.mediaIds.length > 0 && (
                                  <div className="mb-2">
                                    <SecureMediaGrid
                                      mediaKeys={threadTweet.mediaIds}
                                    />
                                  </div>
                                )}
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm mb-3 whitespace-pre-wrap">
                          {tweet.content}
                        </p>
                        {tweet.mediaUrls && tweet.mediaUrls.length > 0 && (
                          <div className="mb-4">
                            <SecureMediaGrid mediaKeys={tweet.mediaUrls} />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Show embedded tweet for posted tweets */}
                {tweet.status === "posted" && tweet.twitterTweetId && (
                  <div className="mb-4">
                    <TweetEmbed
                      tweetId={tweet.twitterTweetId}
                      showPreview={true}
                      className="mb-3"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {tweet.hashtags && tweet.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tweet.hashtags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {tweet.mentions && tweet.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tweet.mentions.map((mention, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    {tweet.createdAt && (
                      <span>
                        Created{" "}
                        {format(new Date(tweet.createdAt), "MMM d, h:mm a")}
                      </span>
                    )}
                    {tweet.scheduledFor && (
                      <span>
                        Scheduled for{" "}
                        {format(new Date(tweet.scheduledFor), "MMM d, h:mm a")}{" "}
                        (local)
                      </span>
                    )}
                    {tweet.postedAt && (
                      <span>
                        Posted{" "}
                        {format(new Date(tweet.postedAt), "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Tweet Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTweet?.status === "draft"
                ? "Edit Draft"
                : "Edit Scheduled Tweet"}
            </DialogTitle>
            <DialogDescription>
              {editingTweet?.status === "draft"
                ? "Convert this draft to a scheduled or posted tweet."
                : "Reschedule this tweet to a new time or post it immediately."}
            </DialogDescription>
          </DialogHeader>
          {editingTweet && (
            <MediaTweetEditor
              tweet={editingTweet}
              onUpdate={handleTweetUpdate}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
