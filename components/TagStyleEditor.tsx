import { useState } from 'react';
import { TagMeta, TagName } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Palette, Check, X } from 'lucide-react';

interface TagStyleEditorProps {
  tag: TagName;
  meta: TagMeta;
  onUpdate: (tag: TagName, meta: TagMeta) => void;
  onDelete?: (tag: TagName) => void;
  children: React.ReactNode;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
];

const PRESET_EMOJIS = [
  '🔍', '🚨', '💡', '⚡', '✅', '🎯', '📝', '🔥', '💎', '🎨',
  '🚀', '💰', '📊', '🎉', '⭐', '🔔', '📌', '🏆', '💪', '🌟'
];

export function TagStyleEditor({ tag, meta, onUpdate, onDelete, children }: TagStyleEditorProps) {
  const [open, setOpen] = useState(false);
  const [editedName, setEditedName] = useState(String(tag || ''));
  const [editedColor, setEditedColor] = useState(meta?.color || '#6b7280');
  const [editedEmoji, setEditedEmoji] = useState(meta?.emoji || '');
  const [customColor, setCustomColor] = useState('');

  // Reset form state when opening to prevent content shifts
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to current values when opening
      setEditedName(String(tag || ''));
      setEditedColor(meta?.color || '#6b7280');
      setEditedEmoji(meta?.emoji || '');
      setCustomColor('');
    }
    setOpen(newOpen);
  };

  const handleSave = () => {
    const trimmedName = String(editedName || '').trim();
    if (trimmedName) {
      onUpdate(trimmedName, {
        color: editedColor,
        emoji: editedEmoji
      });
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setEditedName(String(tag || ''));
    setEditedColor(meta?.color || '#6b7280');
    setEditedEmoji(meta?.emoji || '');
    setCustomColor('');
    setOpen(false);
  };

  const handleColorSelect = (color: string) => {
    setEditedColor(color);
    setCustomColor('');
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setEditedColor(color);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4" 
        align="start" 
        side="right" 
        sideOffset={15}
        avoidCollisions={true}
        sticky="always"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <h3 className="font-medium">Edit Tag Style</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter tag name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: color,
                      borderColor: editedColor === color ? '#000' : 'transparent'
                    }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  type="color"
                  value={customColor || editedColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-8 p-0 border rounded cursor-pointer"
                />
                <Input
                  placeholder="#hex color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="flex-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label>Emoji (optional)</Label>
              <div className="mt-2 grid grid-cols-10 gap-1">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`w-6 h-6 text-sm hover:bg-accent rounded transition-colors ${
                      editedEmoji === emoji ? 'bg-accent ring-1 ring-primary' : ''
                    }`}
                    onClick={() => setEditedEmoji(editedEmoji === emoji ? '' : emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or type custom emoji"
                value={String(editedEmoji)}
                onChange={(e) => setEditedEmoji(String(e.target.value).slice(0, 2))}
                className="mt-2 text-xs"
                maxLength={2}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div 
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border"
                style={{ backgroundColor: String(editedColor), borderColor: String(editedColor) }}
              >
                {editedEmoji && <span className="text-white">{String(editedEmoji)}</span>}
                <span className="text-white">{String(editedName)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(tag);
                    setOpen(false);
                  }}
                >
                  Delete Tag
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!String(editedName || '').trim()}>
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}