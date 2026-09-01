import { X, Upload } from 'lucide-react';
import { useRef } from 'react';

export function ImageUpload({
  images,
  onChange,
  max = 6,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = max - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    const urls: string[] = [];
    for (const file of toUpload) {
      urls.push(URL.createObjectURL(file));
    }
    onChange([...images, ...urls]);
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            <Upload size={20} />
            <span className="text-xs mt-1">Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
