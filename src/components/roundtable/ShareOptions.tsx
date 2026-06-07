"use client";

type ShareOptionsProps = {
  onCard: () => void;
  onVideo: () => void;
  onClose: () => void;
};

export function ShareOptions({ onCard, onVideo, onClose }: ShareOptionsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-[320px] rounded-lg border-2 border-[#6A6A6A] bg-[#0A0A0A] px-5 py-5">
        <p className="font-pixel text-center text-white" style={{ fontSize: 18 }}>
          分享这场圆桌
        </p>
        <p className="font-pixel mt-4 text-center text-[#D3D1D1]" style={{ fontSize: 12, lineHeight: "18px" }}>
          选择卡片快速分享，或生成一段对话回放视频。
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCard}
            className="font-pixel h-[34px] flex-1 rounded-sm border border-[#454545] bg-[#111111] text-white"
            style={{ fontSize: 13 }}
          >
            卡片
          </button>
          <button
            type="button"
            onClick={onVideo}
            className="font-pixel h-[34px] flex-1 rounded-sm border border-[#89B93B] bg-[#B1FD00] text-black"
            style={{ fontSize: 13 }}
          >
            视频
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="font-pixel mt-5 block w-full text-center text-[#D3D1D1]"
          style={{ fontSize: 13 }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
