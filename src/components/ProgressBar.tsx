interface ProgressBarProps {
  current: number;
  total: number;
  sectionTitle: string;
  partNumber: number;
  totalParts: number;
}

export default function ProgressBar({ current, total, sectionTitle, partNumber, totalParts }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-blue-600 rounded-full px-2.5 py-0.5 flex-shrink-0">
            {partNumber}/{totalParts}
          </span>
          <span className="text-lg font-semibold text-gray-700">{sectionTitle}</span>
        </div>
        <span className="text-lg text-gray-500 flex-shrink-0 ml-3">
          {current} / {total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
