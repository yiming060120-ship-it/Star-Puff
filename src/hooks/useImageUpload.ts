/**
 * useImageUpload - 图片上传 hook
 * 支持点击选择 + 拖拽上传，校验类型和大小，转 base64 预览。
 */

import { useState, useCallback } from "react";

export function useImageUpload() {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File, onError?: (msg: string) => void) => {
    if (!file.type.startsWith("image/")) {
      onError?.("请上传图片文件（JPG/PNG）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError?.("图片不能超过 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.onerror = () => onError?.("图片读取失败，请重试");
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, onError?: (msg: string) => void) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file, onError);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, onError?: (msg: string) => void) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file, onError);
      // 允许重复选择同一文件
      e.target.value = "";
    },
    [handleFile]
  );

  const clearImage = useCallback(() => setImage(null), []);

  return { image, isDragging, setIsDragging, handleDrop, handleInputChange, clearImage };
}
