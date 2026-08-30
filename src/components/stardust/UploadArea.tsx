/**
 * UploadArea - 照片上传区（点击选择 + 拖拽）
 */

import { useRef } from "react";
import { motion } from "motion/react";

interface UploadAreaProps {
  image: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function UploadArea({ image, isDragging, onDragOver, onDragLeave, onDrop, onInputChange, onClear }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (image) {
    return (
      <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-purple-400/50 shadow-lg shadow-purple-500/30">
        <img src={image} alt="预览" className="w-full h-full object-cover" />
        <button
          onClick={onClear}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          title="移除照片"
        >
          ✕
        </button>
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
          点击下方风格开始生成
        </div>
      </div>
    );
  }

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-dashed
        flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300
        ${isDragging
          ? "border-pink-400 bg-pink-500/10 scale-105"
          : "border-purple-400/40 hover:border-purple-400 hover:bg-purple-500/5"}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />
      <div className="text-6xl mb-4 animate-float">📷</div>
      <p className="text-purple-200 font-medium mb-1">点击或拖拽照片到此处</p>
      <p className="text-purple-400 text-xs">支持 JPG / PNG，建议清晰正面照</p>
    </motion.div>
  );
}
