import { Button } from './ui/button';
import { StorageManager } from '../lib/storage';
import { Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PluginFooterProps {
  nodeCount: number;
  tagCount: number;
  selectedCount: number;
}

export function PluginFooter({ nodeCount, tagCount, selectedCount }: PluginFooterProps) {
  const handleExportAll = async () => {
    const csv = StorageManager.exportToCSV();
    try {
      await navigator.clipboard.writeText(csv);
      toast.success('Data exported to clipboard as CSV');
    } catch (error) {
      // Fallback: create downloadable file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'figjam-tagger-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data downloaded as CSV');
    }
  };

  const simulateRefresh = () => {
    toast.info('In FigJam, this would refresh the canvas data');
  };

  return (
    <div className="border-t bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{nodeCount} nodes</span>
          <span>{tagCount} tags</span>
          {selectedCount > 0 && (
            <span className="text-primary font-medium">{selectedCount} selected</span>
          )}
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={simulateRefresh}
            className="text-xs px-2 py-1 h-auto"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExportAll}
            className="text-xs px-2 py-1 h-auto"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}