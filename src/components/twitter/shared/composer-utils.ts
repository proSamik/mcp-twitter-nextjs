// Simple utilities without twitter-text dependency

export interface TwitterAccount {
  id: string;
  username: string;
  displayName: string;
}

export interface Community {
  id: string;
  name: string;
  communityId: string;
  description?: string;
  isActive: boolean;
}

export interface TweetFormData {
  content: string;
  selectedAccount: string;
  selectedCommunity?: string;
  isScheduled: boolean;
  scheduleDateTime: string;
  isThread: boolean;
  threadTweets: string[];
}

export const getCharacterCount = (text: string): number => {
  // Simple character counting - Twitter's algorithm is more complex but this works for basic use
  return text.length;
};

export const getCharacterColor = (_count: number): string => {
  // No limits, just show character count in muted color
  return "text-muted-foreground";
};

export const extractHashtags = (text: string): string[] => {
  // Simple regex extraction for hashtags
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
};

export const extractMentions = (text: string): string[] => {
  // Simple regex extraction for mentions
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map((mention) => mention.substring(1)) : [];
};

export const extractUrls = (text: string): string[] => {
  // Simple regex extraction for URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlRegex);
  return matches || [];
};

export const validateTweet = (text: string): boolean => {
  // Simple validation - basic length check
  return text.length <= 280 && text.length > 0;
};

export const autoLinkTweet = (text: string): string => {
  // Simple auto-linking for preview purposes
  return text
    .replace(
      /#(\w+)/g,
      '<a href="https://twitter.com/hashtag/$1" target="_blank" class="text-blue-500">#$1</a>',
    )
    .replace(
      /@(\w+)/g,
      '<a href="https://twitter.com/$1" target="_blank" class="text-blue-500">@$1</a>',
    )
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-500">$1</a>',
    );
};

export const splitIntoThreads = (
  text: string,
  maxLength: number = 270,
): string[] => {
  const words = text.split(" ");
  const threads: string[] = [];
  let currentThread = "";

  for (const word of words) {
    const testThread = currentThread ? `${currentThread} ${word}` : word;

    if (getCharacterCount(testThread) <= maxLength) {
      currentThread = testThread;
    } else {
      if (currentThread) {
        threads.push(currentThread);
        currentThread = word;
      } else {
        // Single word is too long, split it
        threads.push(word.substring(0, maxLength));
        currentThread = word.substring(maxLength);
      }
    }
  }

  if (currentThread) {
    threads.push(currentThread);
  }

  // Add thread numbers if multiple tweets
  if (threads.length > 1) {
    return threads.map(
      (thread, index) => `${thread} ${index + 1}/${threads.length}`,
    );
  }

  return threads;
};

export const validateScheduleTime = (
  dateTime: string,
): { valid: boolean; error?: string } => {
  const localDateTime = new Date(dateTime);
  const now = new Date();
  const delayMs = localDateTime.getTime() - now.getTime();

  if (delayMs < 0) {
    return { valid: false, error: "Scheduled time must be in the future" };
  }

  if (delayMs > 604800000) {
    // 7 days in milliseconds
    return {
      valid: false,
      error: "You can only schedule tweets up to 7 days in advance",
    };
  }

  return { valid: true };
};

export const formatTweetForPreview = (text: string): string => {
  // Format text for Twitter-like preview
  return autoLinkTweet(text);
};
