"use client";

import React from "react";
import { Card } from "ui/card";
import { Badge } from "ui/badge";
import { Smartphone, Monitor, MessageSquare } from "lucide-react";
// Removed react-tweet import to avoid chunk loading issues

interface TwitterAccount {
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

interface TweetPreviewProps {
  content: string;
  account?: TwitterAccount;
  isThread?: boolean;
  threadTweets?: string[];
  viewMode?: "desktop" | "mobile";
  showMetrics?: boolean;
  tweetId?: string; // For actual tweet embeds
}

export function TweetPreview({
  content,
  account,
  isThread = false,
  threadTweets = [],
  viewMode = "desktop",
  tweetId,
}: TweetPreviewProps) {
  // If we have a real tweet ID, show a placeholder
  if (tweetId) {
    return (
      <div className={viewMode === "mobile" ? "max-w-sm mx-auto" : "max-w-2xl"}>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="mb-2">Tweet ID: {tweetId}</div>
            <div className="text-sm">Posted tweet preview will appear here</div>
          </div>
        </Card>
      </div>
    );
  }

  const tweets = isThread ? threadTweets.filter((t) => t.trim()) : [content];

  if (!content.trim() && tweets.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="mb-2 flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start typing to see preview...
          </div>
          <div className="text-sm">
            This is a preview of how your tweet will look
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Desktop View
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile View
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  const isMobile = viewMode === "mobile";
  const containerClass = isMobile ? "max-w-sm mx-auto" : "max-w-2xl";

  return (
    <div className={containerClass}>
      <Card
        className={`${isMobile ? "rounded-none border-x-0" : "rounded-lg"} bg-white dark:bg-gray-900`}
      >
        <div className="p-4">
          <div className="mb-3 text-xs text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-3 w-3" />
            Preview Mode - {viewMode === "mobile" ? "Mobile" : "Desktop"} View
          </div>

          {tweets.map((tweet, index) => (
            <SimpleTweetPreview
              key={index}
              content={tweet}
              account={account}
              isThread={isThread}
              threadIndex={index}
              totalThreads={tweets.length}
              isMobile={isMobile}
              showBorder={index > 0}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

interface SimpleTweetPreviewProps {
  content: string;
  account?: TwitterAccount;
  isThread: boolean;
  threadIndex: number;
  totalThreads: number;
  isMobile: boolean;
  showBorder: boolean;
}

function SimpleTweetPreview({
  content,
  account,
  isThread,
  threadIndex,
  totalThreads,
  isMobile,
  showBorder,
}: SimpleTweetPreviewProps) {
  const displayName = account?.displayName || "Your Name";
  const username = account?.username || "your_username";

  return (
    <div className={`${showBorder ? "border-t pt-3 mt-3" : ""}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1">
            <span className={`font-bold ${isMobile ? "text-sm" : "text-base"}`}>
              {displayName}
            </span>
            <span
              className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
            >
              @{username}
            </span>
            {isThread && (
              <Badge variant="secondary" className="text-xs ml-1">
                {threadIndex + 1}/{totalThreads}
              </Badge>
            )}
          </div>
        </div>

        <div
          className={`${isMobile ? "text-sm" : "text-base"} whitespace-pre-wrap ml-${isMobile ? "10" : "12"}`}
        >
          <TweetContent content={content} />
        </div>

        <div
          className={`text-xs text-muted-foreground ml-${isMobile ? "10" : "12"}`}
        >
          Preview • {content.length} characters
        </div>
      </div>
    </div>
  );
}

function TweetContent({ content }: { content: string }) {
  // Simple highlighting for hashtags, mentions, and URLs
  const parts = content.split(/(\s+)/);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          return (
            <span key={index} className="text-blue-500 font-medium">
              {part}
            </span>
          );
        }
        if (part.startsWith("@")) {
          return (
            <span key={index} className="text-blue-500 font-medium">
              {part}
            </span>
          );
        }
        if (part.match(/^https?:\/\/\S+/)) {
          return (
            <span key={index} className="text-blue-500 underline">
              {part.length > 30 ? `${part.substring(0, 30)}...` : part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
