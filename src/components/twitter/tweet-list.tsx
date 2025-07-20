"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Input } from "ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import {
  MessageSquare,
  Calendar,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TweetEntity } from "@/lib/db/pg/schema.pg";
import { useTweetListWebSocket } from "@/lib/websocket/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { TweetEmbed } from "./tweet-embed";
import { SecureMediaGrid } from "@/components/ui/secure-media";
import { MediaTweetEditor } from "./media-tweet-editor";

interface TweetListProps {
  userId: string;
}

export function TweetList({ userId }: TweetListProps) {
  const [tweets, setTweets] = useState<TweetEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTweet, setEditingTweet] = useState<TweetEntity | null>(null);
  const [collapsedTweets, setCollapsedTweets] = useState<Set<string>>(
    new Set(),
  );

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Set up WebSocket for real-time updates
  const { setTweets: setWebSocketTweets } = useTweetListWebSocket(
    userId,
    (_updatedTweets) => {
      console.log("Real-time tweet update received, refreshing tweet list");
      // Refresh the tweet list to get the latest data with current filters/pagination
      fetchTweets(currentPage);
    },
  );

  // Fetch tweets when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchTweets(1);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, fromDate, toDate]);

  // Fetch tweets when page changes
  useEffect(() => {
    fetchTweets();
  }, [currentPage]);

  const fetchTweets = async (page = currentPage) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (fromDate) {
        params.append("fromDate", fromDate);
      }

      if (toDate) {
        params.append("toDate", toDate);
      }

      const response = await fetch(`/api/twitter/tweets?${params}`);
      const data = await response.json();

      if (data.success) {
        setTweets(data.tweets);
        setWebSocketTweets(data.tweets); // Initialize WebSocket state

        // Update pagination state
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        }
      } else {
        toast.error("Failed to fetch tweets");
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
      toast.error("Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/twitter/tweets?tweetId=${tweetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tweet deleted successfully");
        // Refresh the tweet list to ensure accurate count and pagination
        fetchTweets(currentPage);
      } else {
        toast.error(data.error || "Failed to delete tweet");
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete tweet");
    }
  };

  // Handler to open edit dialog for a draft
  const handleEditDraft = (tweet: any) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
  };

  // Handler to open edit dialog for a scheduled tweet
  const handleEditScheduled = (tweet: any) => {
    setEditingTweet(tweet);
    setEditDialogOpen(true);
  };

  // Handler for when tweet is updated from editor
  const handleTweetUpdate = () => {
    setEditDialogOpen(false);
    setEditingTweet(null);
    // Refresh the tweet list to show the updated tweet
    fetchTweets(currentPage);
  };

  // Handler for when edit is cancelled
  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingTweet(null);
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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // Use tweets directly from API (already sorted and filtered)
  const sortedTweets = tweets;
  const drafts = tweets.filter((tweet) => tweet.status === "draft");
  const scheduled = tweets.filter((tweet) => tweet.status === "scheduled");
  const posted = tweets.filter((tweet) => tweet.status === "posted");

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

  const TweetCard = ({ tweet }: { tweet: TweetEntity }) => (
    <Card className="hover:shadow-md transition-shadow">
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
      {!collapsedTweets.has(tweet.nanoId) && (
        <CardContent>
          {/* Show content and media for drafts and scheduled tweets */}
          {tweet.status !== "posted" && (
            <>
              {tweet.tweetType === "thread" &&
              tweet.threadTweets &&
              tweet.threadTweets.length > 0 ? (
                // Render thread tweets individually with their media
                <div className="space-y-4">
                  {tweet.threadTweets.map((threadTweet: any, index: number) => (
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
                            <SecureMediaGrid mediaKeys={threadTweet.mediaIds} />
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                // Single tweet content
                <>
                  <p className="text-sm mb-3 whitespace-pre-wrap">
                    {tweet.content}
                  </p>
                  {/* Show media preview for single tweets */}
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
                <span>
                  Created {format(new Date(tweet.createdAt), "MMM d, h:mm a")}
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
                  Posted {format(new Date(tweet.postedAt), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      )}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Your Tweets</CardTitle>
            <Badge variant="outline">({totalCount})</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <CardDescription>
          Manage your drafts, scheduled tweets, and posted content
        </CardDescription>

        {/* Search and Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tweets, hashtags, mentions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="posted">Posted</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {sortedTweets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tweets yet. Start by composing your first tweet!</p>
              </div>
            ) : (
              sortedTweets.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4 mt-4">
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No drafts saved.</p>
              </div>
            ) : (
              drafts.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4 mt-4">
            {scheduled.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tweets.</p>
              </div>
            ) : (
              scheduled.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="posted" className="space-y-4 mt-4">
            {posted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posted tweets.</p>
              </div>
            ) : (
              posted.map((tweet) => (
                <TweetCard key={tweet.nanoId} tweet={tweet} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}{" "}
              to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              tweets
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
