import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileCheck } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

const FileDropZone = ({ onFileSelect, selectedFile }: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ${
        isDragging
          ? 'border-primary bg-primary/5 shadow-glow'
          : selectedFile
          ? 'border-primary/40 bg-primary/5'
          : 'border-border hover:border-muted-foreground'
      }`}
    >
      {selectedFile ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <FileCheck className="h-8 w-8 text-primary" />
          <p className="font-medium text-foreground">{selectedFile.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatSize(selectedFile.size)}
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Drop a file here or click to browse
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default FileDropZone;
