"use client";

import React, { useState } from "react";
import { Tweet } from "react-tweet";
import { Card, CardContent } from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { ExternalLink, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TweetEmbedProps {
  tweetId: string;
  tweetContent?: string;
  showPreview?: boolean;
  className?: string;
}

export function TweetEmbed({ 
  tweetId, 
  tweetContent, 
  showPreview = false, 
  className = "" 
}: TweetEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(showPreview);
  const [embedError, setEmbedError] = useState(false);

  const handleTogglePreview = () => {
    setIsExpanded(!isExpanded);
  };

  const handleViewOnTwitter = () => {
    window.open(`https://twitter.com/i/web/status/${tweetId}`, '_blank');
  };

  const handleEmbedError = () => {
    setEmbedError(true);
    toast.error("Failed to load tweet embed. The tweet may have been deleted or made private.");
  };

  if (!tweetId) {
    return null;
  }

  return (
    <Card className={`border-l-4 border-l-green-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Posted Tweet
            </Badge>
            <span className="text-sm text-muted-foreground">
              ID: {tweetId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTogglePreview}
              className="text-xs"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show Preview
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewOnTwitter}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Twitter
            </Button>
          </div>
        </div>

        {/* Original content preview */}
        {tweetContent && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-400">
            <p className="text-sm text-muted-foreground mb-1">Original content:</p>
            <p className="text-sm whitespace-pre-wrap">{tweetContent}</p>
          </div>
        )}

        {/* Embedded tweet preview */}
        {isExpanded && (
          <div className="mt-3">
            {embedError ? (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Unable to load tweet embed
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    The tweet may have been deleted, made private, or there&apos;s a network issue.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Tweet 
                  id={tweetId}
                  onError={handleEmbedError}
                  components={{
                    TweetNotFound: ({ error }) => (
                      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Tweet not found
                          </p>
                          <p className="text-xs text-yellow-600 mt-1">
                            {error?.message || "This tweet may have been deleted or is not accessible."}
                          </p>
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TweetEmbed;