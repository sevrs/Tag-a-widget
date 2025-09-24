import { useState } from 'react';
import { TagName, TagRegistry, ItemRegistry, FilterState } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Search, Filter, Download, X } from 'lucide-react';
import { TagChip } from './TagChip';
import { Checkbox } from './ui/checkbox';
import { StorageManager } from '../lib/storage';
import { toast } from 'sonner@2.0.3';

interface FilterViewProps {
  tagRegistry: TagRegistry;
  items: ItemRegistry;
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  onSelectItems: (itemIds: string[]) => void;
}

export function FilterView({ 
  tagRegistry, 
  items, 
  filter, 
  onFilterChange, 
  onSelectItems 
}: FilterViewProps) {
  const [tagInput, setTagInput] = useState('');

  const availableTags = Object.keys(tagRegistry).sort((a, b) => a.localeCompare(b));
  const filteredItems = Object.values(items).filter(item => {
    // Search query filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesDescription = item.description?.toLowerCase().includes(query) || false;
      const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Tag filter
    if (filter.selectedTags.length > 0) {
      const hasAnySelectedTag = filter.selectedTags.some(tag => item.tags.includes(tag));
      if (!hasAnySelectedTag) {
        return false;
      }
    }

    // Untagged filter
    if (filter.showUntagged && item.tags.length > 0) {
      return false;
    }

    return true;
  });

  const handleAddTagFilter = () => {
    const tagsToAdd = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const validTags = tagsToAdd.filter(tag => availableTags.includes(tag));
    
    if (validTags.length === 0) {
      toast.error('No valid tags found');
      return;
    }

    const newSelectedTags = [...new Set([...filter.selectedTags, ...validTags])];
    onFilterChange({ ...filter, selectedTags: newSelectedTags });
    setTagInput('');
  };

  const handleRemoveTagFilter = (tag: TagName) => {
    const newSelectedTags = filter.selectedTags.filter(t => t !== tag);
    onFilterChange({ ...filter, selectedTags: newSelectedTags });
  };

  const handleClearFilters = () => {
    onFilterChange({
      searchQuery: '',
      selectedTags: [],
      showUntagged: false
    });
  };

  const handleSelectFilteredItems = () => {
    const itemIds = filteredItems.map(item => item.id);
    onSelectItems(itemIds);
    toast.success(`Selected ${itemIds.length} filtered item(s)`);
  };

  const handleExportFiltered = async () => {
    if (filteredItems.length === 0) {
      toast.error('No items to export');
      return;
    }

    // Create a temporary registry with only filtered items
    const tempItems: ItemRegistry = {};
    filteredItems.forEach(item => {
      tempItems[item.id] = item;
    });

    // Generate CSV for filtered items
    const rows: string[] = ["itemId,itemName,description,tags"];
    filteredItems.forEach(item => {
      const name = item.name.replaceAll('"', '""');
      const description = (item.description || '').replaceAll('"', '""');
      const tags = item.tags.join('|');
      rows.push(`"${item.id}","${name}","${description}","${tags}"`);
    });

    const csv = rows.join('\n');
    
    try {
      await navigator.clipboard.writeText(csv);
      toast.success(`Exported ${filteredItems.length} item(s) to clipboard`);
    } catch (error) {
      // Fallback: create downloadable file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filtered-items.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filteredItems.length} item(s) as CSV`);
    }
  };

  const hasActiveFilters = filter.searchQuery || filter.selectedTags.length > 0 || filter.showUntagged;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </div>
          <div className="flex gap-2">
            {filteredItems.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleSelectFilteredItems}>
                  Select All ({filteredItems.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportFiltered}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name, description, or tags..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Tag filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add tag filters (comma-separated)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTagFilter()}
              className="flex-1"
            />
            <Button onClick={handleAddTagFilter} disabled={!tagInput.trim()}>
              Add
            </Button>
          </div>
          
          {filter.selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filter.selectedTags.map(tag => (
                <TagChip
                  key={tag}
                  tag={tag}
                  meta={tagRegistry[tag]}
                  variant="removable"
                  size="sm"
                  onRemove={() => handleRemoveTagFilter(tag)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Show untagged option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-untagged"
            checked={filter.showUntagged}
            onCheckedChange={(checked) => onFilterChange({ 
              ...filter, 
              showUntagged: checked === true 
            })}
          />
          <label htmlFor="show-untagged" className="text-sm cursor-pointer">
            Show only untagged items
          </label>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <span>
            {filteredItems.length} item(s) match your filters
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary">
              {[
                filter.searchQuery && 'search',
                filter.selectedTags.length > 0 && `${filter.selectedTags.length} tags`,
                filter.showUntagged && 'untagged'
              ].filter(Boolean).join(', ')}
            </Badge>
          )}
        </div>

        {/* Quick tag suggestions */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Available tags:</p>
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 10).map(tag => (
                <TagChip
                  key={tag}
                  tag={tag}
                  meta={tagRegistry[tag]}
                  variant="clickable"
                  size="sm"
                  onClick={() => {
                    if (!filter.selectedTags.includes(tag)) {
                      onFilterChange({ 
                        ...filter, 
                        selectedTags: [...filter.selectedTags, tag] 
                      });
                    }
                  }}
                />
              ))}
              {availableTags.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{availableTags.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}