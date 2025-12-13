/**
 * Formats match time from various formats to human-readable display
 */
export const formatMatchTime = (timeString: string | undefined | null): string => {
  if (!timeString) return 'TBD';
  
  try {
    // Handle ISO timestamp format (2025-12-20T14:30:00+00:00)
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      if (isToday) {
        return `Today ${timeFormatted}`;
      } else if (isTomorrow) {
        return `Tomorrow ${timeFormatted}`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    }

    // Handle simple time format like "15:00"
    if (timeString.includes(':') && timeString.length <= 5) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      if (isNaN(hour)) return timeString;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }

    // Return as-is for other formats
    return timeString;
  } catch (error) {
    return timeString || 'TBD';
  }
};

/**
 * Formats date for display in match cards
 */
export const formatMatchDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

/**
 * Gets relative time string (e.g., "2 hours ago", "Just now")
 */
export const getRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString || '';
  }
};
