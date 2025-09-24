import { TagName, TagMeta } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface TagChipProps {
  tag: TagName;
  meta?: TagMeta;
  variant?: 'default' | 'removable' | 'clickable';
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'default' | 'lg';
}

export function TagChip({ 
  tag, 
  meta = {}, 
  variant = 'default', 
  onRemove, 
  onClick,
  size = 'default'
}: TagChipProps) {
  const tagColor = meta?.color || '#6b7280';
  
  // Calculate a light background version of the color for better readability
  const backgroundColor = tagColor + '20'; // Add 20% opacity
  const borderColor = tagColor + '40'; // Add 40% opacity for border
  
  const chipStyle = {
    backgroundColor: backgroundColor,
    borderColor: borderColor,
    borderWidth: '1px',
    borderStyle: 'solid' as const
  };
  
  // Calculate text color - use the tag color itself for better contrast
  const textColor = tagColor;
  
  const content = (
    <>
      <span className="truncate" style={{ color: textColor }}>
        {meta?.emoji && <span className="mr-1">{String(meta.emoji)}</span>}
        {String(tag)}
      </span>
      {variant === 'removable' && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-2 w-2" />
        </Button>
      )}
    </>
  );

  if (variant === 'clickable' && onClick) {
    return (
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 cursor-pointer transition-all duration-200 hover:shadow-md ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
        style={chipStyle}
        onClick={onClick}
      >
        {content}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
      style={chipStyle}
    >
      {content}
    </Badge>
  );
}