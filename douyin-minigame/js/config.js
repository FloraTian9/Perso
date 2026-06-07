module.exports = {
  // Replace with the deployed Perso web origin, for example:
  // API_BASE_URL: "https://perso.example.com"
  // Do not put Qwen or Supabase secrets in the minigame client.
  API_BASE_URL: "https://perso.lat",
  ENABLE_MOCK_GENERATION: true,
  FORCE_MOCK_GENERATION: false,
  DEFAULT_VOICE_ENABLED: true,
  DEFAULT_BGM_ENABLED: false,
  // 背景音走部署后的 public/audio，不放进小游戏包。
  BGM_TRACKS: {
    emotion: "/audio/bgm-emotion.mp3?v=20260607-soft",
    life: "/audio/bgm-life.mp3?v=20260607-soft",
    story: "/audio/bgm-story.mp3?v=20260607-soft",
    playful: "/audio/bgm-playful.mp3?v=20260607-soft",
    rational: "/audio/bgm-rational.mp3?v=20260607-soft"
  },
  // 抖音开发者平台 -> 小游戏 -> 运营/能力 -> 分享设置里审核通过后得到的分享 ID。
  // 没有配置时，小游戏会拦截分享调用并显示提示，避免直接触发系统 share error。
  SHARE_TEMPLATE_ID: "",
  SHARE_VIDEO_TEMPLATE_ID: "",
  DEFAULT_TOPIC: "今晚吃什么？",
  DEFAULT_PERSONAS: ["INTJ", "ENFP", "ISTJ", "ESTP"],
  PERSONA_IDS: [
    "INTJ",
    "INTP",
    "ENTJ",
    "ENTP",
    "INFJ",
    "INFP",
    "ENFJ",
    "ENFP",
    "ISTJ",
    "ISFJ",
    "ESTJ",
    "ESFJ",
    "ISTP",
    "ISFP",
    "ESTP",
    "ESFP"
  ]
};
