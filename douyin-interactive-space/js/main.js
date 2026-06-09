var config = window.config;

var PRESET_TOPICS = [
  "你们喜欢毛姆的《刀锋》吗？",
  "被老师批评了怎么办？",
  "异地恋值不值得坚持？"
];

var GROUP_COLORS = {
  NT: { avatarBg: "#FFC700" },
  NF: { avatarBg: "#5B5CF3" },
  SJ: { avatarBg: "#B1FD00" },
  SP: { avatarBg: "#A3F8FF" }
};

var PERSONA_GROUP = {
  INTJ: "NT", INTP: "NT", ENTJ: "NT", ENTP: "NT",
  INFJ: "NF", INFP: "NF", ENFJ: "NF", ENFP: "NF",
  ISTJ: "SJ", ISFJ: "SJ", ESTJ: "SJ", ESFJ: "SJ",
  ISTP: "SP", ISFP: "SP", ESTP: "SP", ESFP: "SP"
};

var SENSITIVE_PATTERNS = [/政治/, /宗教/, /选举/, /政党/, /民族仇恨/, /极端主义/];
var TYPEWRITER_INTERVAL_MS = 180;
var BETWEEN_MESSAGE_TICKS = 10;
var PARTICIPANT_BETWEEN_MESSAGE_TICKS = 5;
var TOUCH_TAP_MOVE_THRESHOLD = 14;
var LOADING_PROGRESS_FRAME = { left: 38, top: 83, width: 225, height: 24 };
var LOADING_IMAGE_WIDTH = 300;
var LOADING_CONTENT_OFFSET_Y = 56;
var AVATAR_LABEL_COVER_RATIO = 0.42;
var SELECTION_AVATAR_LABEL_OFFSET_Y = 7;
var SELECTION_AVATAR_LABEL_TEXT_OFFSET_Y = 0.5;
var SELECTION_LOGO_OFFSET_Y = -14;
var PIXEL_FONT_PATH = "assets/fonts/VonwaonBitmap-12px.ttf";
var PIXEL_FONT_FAMILY = "VonwaonBitmap";
var SIDEBAR_PROMPT_STORAGE_KEY = "perso_sidebar_prompt_seen";
var WARNING_ICON_HEIGHT = 13;
var SPEECH_BUBBLE_PADDING_X = 24;
var SPEECH_BUBBLE_PADDING_RIGHT = 24;
var SPEECH_BUBBLE_TEXT_FONT_SIZE = 15;
var SPEECH_BUBBLE_LINE_HEIGHT = 24;
var TTS_MAX_TEXT_CHARS = 180;
var TTS_PENDING_FALLBACK_MS = 900;
var MAX_DIALOG_CONTENT_CHARS = 90;
var NOTE_ACTION_BUTTON_WIDTH = 108;
var NOTE_ACTION_BUTTON_HEIGHT = 58;
var PARTICIPANT_INPUT_MAX_CHARS = 120;
var PARTICIPANT_FOOTER_HEIGHT = 142;
var USER_BUBBLE_COLORS = { bubbleBg: "#E5E5E5", bubbleText: "#111111" };
var BGM_VOLUME = 0.46;
var BGM_DUCKED_VOLUME = 0.18;
var BGM_TRACKS = config.BGM_TRACKS || {};
var SHARE_VIDEO_MAX_MS = 58000;

var PERSONA_VOICE_PROFILES = {
  INTJ: { base: 160, variance: 18, type: "sawtooth", volume: 0.045, duration: 0.045, step: 3 },
  INTP: { base: 185, variance: 28, type: "triangle", volume: 0.036, duration: 0.05, step: 4 },
  ENTJ: { base: 145, variance: 16, type: "square", volume: 0.044, duration: 0.04, step: 3 },
  ENTP: { base: 260, variance: 58, type: "square", volume: 0.034, duration: 0.035, step: 2 },
  INFJ: { base: 210, variance: 20, type: "triangle", volume: 0.032, duration: 0.06, step: 4 },
  INFP: { base: 245, variance: 36, type: "sine", volume: 0.033, duration: 0.07, step: 4 },
  ENFJ: { base: 235, variance: 32, type: "triangle", volume: 0.038, duration: 0.052, step: 3 },
  ENFP: { base: 315, variance: 72, type: "sine", volume: 0.035, duration: 0.04, step: 2 },
  ISTJ: { base: 135, variance: 10, type: "square", volume: 0.036, duration: 0.045, step: 4 },
  ISFJ: { base: 205, variance: 18, type: "sine", volume: 0.03, duration: 0.065, step: 4 },
  ESTJ: { base: 155, variance: 14, type: "square", volume: 0.046, duration: 0.038, step: 3 },
  ESFJ: { base: 255, variance: 44, type: "triangle", volume: 0.04, duration: 0.045, step: 3 },
  ISTP: { base: 120, variance: 12, type: "sawtooth", volume: 0.033, duration: 0.038, step: 5 },
  ISFP: { base: 235, variance: 24, type: "sine", volume: 0.028, duration: 0.075, step: 5 },
  ESTP: { base: 280, variance: 66, type: "sawtooth", volume: 0.044, duration: 0.032, step: 2 },
  ESFP: { base: 350, variance: 82, type: "sine", volume: 0.04, duration: 0.035, step: 2 }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTouchPoint(touch) {
  if (!touch) return null;
  var x = typeof touch.clientX === "number" ? touch.clientX : touch.x;
  var y = typeof touch.clientY === "number" ? touch.clientY : touch.y;
  if (typeof x !== "number") x = touch.pageX;
  if (typeof y !== "number") y = touch.pageY;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return { x: x, y: y };
}

function normalizeOrigin(value) {
  return value ? value.replace(/\/$/, "") : "";
}

function safeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  var trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function isPersona(value) {
  return config.PERSONA_IDS.indexOf(value) >= 0;
}

function isSensitiveTopic(topic) {
  return SENSITIVE_PATTERNS.some(function check(pattern) {
    return pattern.test(topic);
  });
}

function isInvalidDomainError(error) {
  var message = error && (error.errMsg || error.message) ? String(error.errMsg || error.message) : "";
  return /url is not valid domain|invalid domain|合法域名|白名单/i.test(message);
}

function formatNetworkFailMessage(error) {
  if (isInvalidDomainError(error)) {
    return "手机真机拦截了 API 域名。请在抖音小游戏后台把 API_BASE_URL 加到 request 合法域名。";
  }
  return error && error.errMsg ? error.errMsg : "请求失败，请检查域名白名单和网络。";
}

function roundedRect(ctx, x, y, w, h, r) {
  var radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  var lines = [];
  var current = "";
  var chars = String(text || "").split("");

  for (var i = 0; i < chars.length; i += 1) {
    var next = current + chars[i];
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = chars[i];
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && chars.join("").length > lines.join("").length) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, Math.max(0, lines[maxLines - 1].length - 1)) + "...";
  }

  return lines;
}

function fitSingleLineText(ctx, text, maxWidth) {
  var source = String(text || "");
  if (ctx.measureText(source).width <= maxWidth) return source;
  var ellipsis = "...";
  var result = source;
  while (result.length > 0 && ctx.measureText(result + ellipsis).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result ? result + ellipsis : ellipsis;
}

function readKeyboardEventValue(event, fallback) {
  var fallbackText = typeof fallback === "string" ? fallback : "";
  var candidates = [];
  var sawEmptyValue = false;

  if (event && typeof event === "object") {
    candidates.push(event.value);
    candidates.push(event.text);
    candidates.push(event.data);
    if (event.detail && typeof event.detail === "object") {
      candidates.push(event.detail.value);
      candidates.push(event.detail.text);
      candidates.push(event.detail.data);
    }
    if (event.target && typeof event.target === "object") {
      candidates.push(event.target.value);
      candidates.push(event.target.text);
      candidates.push(event.target.data);
    }
  }

  for (var i = 0; i < candidates.length; i += 1) {
    if (typeof candidates[i] === "string") {
      if (candidates[i].length > 0) return candidates[i];
      sawEmptyValue = true;
    } else if (typeof candidates[i] === "number") {
      return String(candidates[i]);
    }
  }

  return sawEmptyValue && !fallbackText ? "" : fallbackText;
}

function extractSseTokens(text) {
  var output = "";
  var lines = text.split(/\r?\n/);

  for (var i = 0; i < lines.length; i += 1) {
    var line = lines[i].trim();
    if (line.indexOf("data:") !== 0) continue;

    var raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;

    try {
      var payload = JSON.parse(raw);
      if (payload && payload.type === "token" && typeof payload.content === "string") {
        output += payload.content;
      }
      if (payload && payload.type === "raw" && typeof payload.content === "string") {
        output += payload.content;
      }
    } catch (error) {}
  }

  return output;
}

function extractDialogObjects(raw) {
  var objects = [];
  var depth = 0;
  var start = -1;
  var inString = false;
  var escaping = false;

  for (var i = 0; i < raw.length; i += 1) {
    var ch = raw[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === "\\") escaping = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(raw.slice(start, i + 1)));
        } catch (error) {}
        start = -1;
      }
    }
  }

  return objects;
}

function splitDialogContent(content, maxChars) {
  var normalized = String(content || "").replace(/\s+/g, " ").trim();
  var limit = maxChars || MAX_DIALOG_CONTENT_CHARS;
  var units;
  var chunks = [];
  var current = "";

  function pushCurrent() {
    var text = current.trim();
    if (text) chunks.push(text);
    current = "";
  }

  if (!normalized) return [];
  if (normalized.length <= limit) return [normalized];

  units = normalized.match(/[^。！？!?；;，,]+[。！？!?；;，,]?/g) || [normalized];
  for (var i = 0; i < units.length; i += 1) {
    var piece = units[i].trim();
    if (!piece) continue;

    if (piece.length > limit) {
      pushCurrent();
      for (var j = 0; j < piece.length; j += limit) {
        var sliced = piece.slice(j, j + limit).trim();
        if (sliced) chunks.push(sliced);
      }
      continue;
    }

    if (current && current.length + piece.length > limit) pushCurrent();
    current += piece;
  }

  pushCurrent();
  return chunks.length ? chunks : [normalized.slice(0, limit)];
}

function parseRoundtableMessages(responseText) {
  var tokenText = extractSseTokens(responseText);
  var raw = tokenText || responseText;
  var objects = extractDialogObjects(raw);
  var messages = [];

  for (var i = 0; i < objects.length; i += 1) {
    var item = objects[i];
    if (!item || !isPersona(item.persona) || typeof item.content !== "string") continue;
    var parts = splitDialogContent(item.content, MAX_DIALOG_CONTENT_CHARS);
    for (var j = 0; j < parts.length; j += 1) {
      messages.push({
        persona: item.persona,
        content: parts[j],
        label: typeof item.label === "string" ? item.label : "",
        turn: messages.length + 1
      });
    }
  }

  return messages;
}

function PersoMinigame() {
  this.tt = typeof tt !== "undefined" ? tt : null;
  if (!this.tt) throw new Error("Douyin minigame runtime is required.");

  this.canvas = this.tt.createCanvas();
  this.ctx = this.canvas.getContext("2d");
  this.systemInfo = this.tt.getSystemInfoSync();
  this.menuButtonRect = null;
  if (this.tt.getMenuButtonBoundingClientRect) {
    try {
      this.menuButtonRect = this.tt.getMenuButtonBoundingClientRect();
    } catch (error) {}
  }
  this.pixelFontFamily = PIXEL_FONT_FAMILY;
  if (this.tt.loadFont) {
    try {
      this.pixelFontFamily = this.tt.loadFont(PIXEL_FONT_PATH) || PIXEL_FONT_FAMILY;
    } catch (error) {}
  }
  this.pixelRatio = this.systemInfo.pixelRatio || 1;
  this.width = this.systemInfo.windowWidth || this.systemInfo.screenWidth || 375;
  this.height = this.systemInfo.windowHeight || this.systemInfo.screenHeight || 667;
  this.canvas.width = this.width * this.pixelRatio;
  this.canvas.height = this.height * this.pixelRatio;
  this.ctx.scale(this.pixelRatio, this.pixelRatio);
  this.ctx.imageSmoothingEnabled = false;

  this.selected = config.DEFAULT_PERSONAS.slice(0);
  this.selectedTopic = PRESET_TOPICS[0];
  this.customTopic = "";
  this.mode = "participant";
  this.atmosphere = "plain";
  this.atmosphereSelected = false;
  this.noteOverlayTarget = null;
  this.noteDraftText = "";
  this.editingNoteText = false;
  this.participantDraftText = "";
  this.editingParticipantText = false;
  this.participantInputPending = false;
  this.pendingPrivateNote = null;
  this.resumeContinuationAfterNoteCancel = false;
  this.generationRequestId = 0;
  this.page = "selection";
  this.status = "idle";
  this.error = "";
  this.messages = [];
  this.tableMessages = [];
  this.activeMessageIndex = 0;
  this.visibleChars = 0;
  this.messageHoldTicks = 0;
  this.liveMessageIndex = 0;
  this.liveVisibleChars = 0;
  this.liveHoldTicks = 0;
  this.playbackTimer = null;
  this.playbackPaused = false;
  this.voiceEnabled = config.DEFAULT_VOICE_ENABLED !== false;
  this.bgmEnabled = config.DEFAULT_BGM_ENABLED !== false;
  this.bgmAudioContext = null;
  this.bgmMood = "";
  this.bgmPlaying = false;
  this.bgmPlayRequested = false;
  this.bgmDucked = false;
  this.voiceAudioContext = null;
  this.voiceAudioMode = "";
  this.voiceAudioReady = false;
  this.voiceWebAudioSource = null;
  this.voiceWebAudioGain = null;
  this.lastVoiceTickAt = 0;
  this.lastVoiceKey = "";
  this.voiceMessageKey = "";
  this.ttsAudioCache = {};
  this.ttsFailedKeys = {};
  this.ttsPrefetchingKeys = {};
  this.ttsPendingKey = "";
  this.ttsPendingStartedAt = 0;
  this.ttsPlaybackKey = "";
  this.ttsPlaybackMessageIndex = -1;
  this.ttsPlaybackStartedAt = 0;
  this.ttsPlaybackDuration = 0;
  this.ttsPlaybackReady = false;
  this.ttsPlaybackEnded = false;
  this.ttsError = "";
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.thinkingPersona = "";
  this.progressDragging = false;
  this.progressDragRatio = 1;
  this.isAtLiveEdge = true;
  this.loadingStartedAt = 0;
  this.loadingProgress = 0;
  this.loadingDotFrame = 0;
  this.loadingTimer = null;
  this.editingCustomTopic = false;
  this.launchScene = "";
  this.sidebarReturned = false;
  this.sidebarPromptVisible = false;
  this.sidebarPromptSeen = false;
  this.shareOverlayVisible = false;
  this.shareCardPreviewVisible = false;
  this.shareCardNotice = "";
  this.settingsOverlayVisible = false;
  this.shareVideoState = "idle";
  this.shareVideoMessages = [];
  this.shareVideoStartedAt = 0;
  this.shareVideoPreviewStartedAt = 0;
  this.shareVideoPreviewElapsed = 0;
  this.shareVideoPreviewPlaying = false;
  this.shareVideoDurationMs = 0;
  this.shareVideoFrameTimer = null;
  this.shareVideoStopTimer = null;
  this.shareVideoRecorder = null;
  this.shareVideoRunId = 0;
  this.shareVideoError = "";
  this.shareVideoNotice = "";
  this.shareVideoVoiceKey = "";
  this.shareVideoResultPath = "";
  this.shareVideoResultBlob = null;
  this.shareVideoResultMimeType = "";
  this.shareVideoShareInProgress = false;
  if (this.tt.getStorageSync) {
    try {
      this.sidebarPromptSeen = this.tt.getStorageSync(SIDEBAR_PROMPT_STORAGE_KEY) === "1";
    } catch (error) {}
  }
  this.scrollY = 0;
  this.maxScrollY = 0;
  this.contentHeight = 0;
  this.footerHeight = 64;
  this.rects = {};
  this.images = {};
  this.touchStart = null;
  this.touchFallbackTimer = null;
  this.keyboardComposing = false;
  this.lastTapAt = 0;
  this.lastTapX = -9999;
  this.lastTapY = -9999;

  this.loadAssets();
  this.bindEvents();
  this.bindLaunchEvents();
  this.render();
}

PersoMinigame.prototype.createImage = function createImage(src) {
  var image = this.canvas.createImage ? this.canvas.createImage() : this.tt.createImage();
  var self = this;
  image.onload = function onLoad() {
    self.render();
  };
  image.src = src;
  return image;
};

PersoMinigame.prototype.pixelFont = function pixelFont(size, weight) {
  return (weight ? weight + " " : "") + size + "px " + this.pixelFontFamily + ", sans-serif";
};

PersoMinigame.prototype.getSpeechBubbleTextWidth = function getSpeechBubbleTextWidth(w) {
  return Math.max(0, w - SPEECH_BUBBLE_PADDING_X - SPEECH_BUBBLE_PADDING_RIGHT);
};

PersoMinigame.prototype.getSpeechBubbleLines = function getSpeechBubbleLines(ctx, content, w, maxLines) {
  ctx.font = this.pixelFont(SPEECH_BUBBLE_TEXT_FONT_SIZE);
  return wrapText(ctx, content, this.getSpeechBubbleTextWidth(w), maxLines);
};

PersoMinigame.prototype.personaSpritePath = function personaSpritePath(id) {
  if (id === "INFP") return "assets/sprites/INFP/think/think_1.png";
  return "assets/sprites/" + id + "/" + id.toLowerCase() + ".png";
};

PersoMinigame.prototype.loadAssets = function loadAssets() {
  this.images.bg = this.createImage("assets/bg/table-bg.png");
  this.images.title = this.createImage("assets/images/title.png");
  this.images.button = this.createImage("assets/images/button.png");
  this.images.button1 = this.createImage("assets/images/button-1.png");
  this.images.warning = this.createImage("assets/images/warning-icon.png");
  this.images.back = this.createImage("assets/images/back.png");
  this.images.settings = this.createImage("assets/images/settings.svg");
  this.images.share = this.createImage("assets/images/share.png");
  this.images.sound = this.createImage("assets/images/sound.svg");
  this.images.noSound = this.createImage("assets/images/no-sound.svg");
  this.images.page = this.createImage("assets/images/page.svg");
  this.images.user = this.createImage("assets/sprites/user/user.png");
  this.images.userBadge = this.createImage("assets/sprites/user/badge.png");
  this.images.loading0 = this.createImage("assets/images/loading/loading-0.png");
  this.images.loading1 = this.createImage("assets/images/loading/loading-1.png");
  this.images.loading2 = this.createImage("assets/images/loading/loading-2.png");
  this.images.loading3 = this.createImage("assets/images/loading/loading-3.png");

  for (var i = 0; i < config.PERSONA_IDS.length; i += 1) {
    var id = config.PERSONA_IDS[i];
    this.images[id] = this.createImage(this.personaSpritePath(id));
    this.images[id + "Badge"] = this.createImage("assets/sprites/" + id + "/badge.png");
  }
};

PersoMinigame.prototype.handleTouchStartEvent = function handleTouchStartEvent(event) {
  var touch = event && event.touches && event.touches[0] ? event.touches[0] : event;
  var point = this.normalizeTouchPoint(getTouchPoint(touch));
  if (!point) return;
  this.ensureVoiceAudio();
  if (this.tt.unlockAudio) this.tt.unlockAudio();
  this.touchStart = {
    x: point.x,
    y: point.y,
    scrollY: this.scrollY,
    moved: false
  };
  var hitRoundtableControl = this.page === "roundtable" && (
    this.hit(this.rects.settings, point.x, point.y) ||
    this.hit(this.rects.playToggle, point.x, point.y) ||
    this.hit(this.rects.end, point.x, point.y)
  );
  if (this.page === "roundtable" && !this.settingsOverlayVisible && !hitRoundtableControl && this.hit(this.rects.progress, point.x, point.y)) {
    this.touchStart.moved = true;
    this.progressDragging = true;
    this.seekProgress(point.x);
  }
};

PersoMinigame.prototype.handleTouchMoveEvent = function handleTouchMoveEvent(event) {
  var touch = event && event.touches && event.touches[0] ? event.touches[0] : event;
  var point = this.normalizeTouchPoint(getTouchPoint(touch));
  if (!point || !this.touchStart) return;

  if (this.progressDragging) {
    this.touchStart.moved = true;
    this.seekProgress(point.x);
    return;
  }

  if (this.page !== "selection") return;

  var dy = point.y - this.touchStart.y;
  if (Math.abs(dy) > TOUCH_TAP_MOVE_THRESHOLD) this.touchStart.moved = true;
  this.scrollY = clamp(this.touchStart.scrollY - dy, 0, this.maxScrollY);
  this.render();
};

PersoMinigame.prototype.handleTouchEndEvent = function handleTouchEndEvent(event) {
  var changed = event && event.changedTouches && event.changedTouches[0];
  var fallbackTouch = event && event.touches && event.touches[0];
  var point = this.normalizeTouchPoint(getTouchPoint(changed || event));
  var start = this.touchStart;
  this.touchStart = null;
  if (!point) point = this.normalizeTouchPoint(getTouchPoint(fallbackTouch));
  if (!point && start) point = { x: start.x, y: start.y };
  if (this.progressDragging) {
    this.progressDragging = false;
    if (point) this.seekProgress(point.x);
    this.render();
    return;
  }
  if (!point || !start || start.moved) return;
  this.handleTapDeduped(point.x, point.y);
};

PersoMinigame.prototype.handleTapDeduped = function handleTapDeduped(x, y) {
  var now = Date.now();
  var dx = x - this.lastTapX;
  var dy = y - this.lastTapY;
  if (now - this.lastTapAt < 120 && Math.sqrt(dx * dx + dy * dy) < 8) return;
  this.lastTapAt = now;
  this.lastTapX = x;
  this.lastTapY = y;
  this.handleTap(x, y);
};

PersoMinigame.prototype.shouldUseCanvasKeyboard = function shouldUseCanvasKeyboard() {
  if (this.tt && this.tt.showKeyboard) return false;
  var platform = String(this.systemInfo.platform || "").toLowerCase();
  if (platform === "ios" || platform === "android") return false;
  return platform === "devtools" || platform === "windows" || platform === "mac" || typeof window !== "undefined";
};

PersoMinigame.prototype.getActiveCanvasInput = function getActiveCanvasInput() {
  if (this.editingParticipantText) {
    return { key: "participantDraftText", max: PARTICIPANT_INPUT_MAX_CHARS };
  }
  if (this.editingNoteText) {
    return { key: "noteDraftText", max: 80 };
  }
  if (this.editingCustomTopic) {
    return { key: "customTopic", max: 300 };
  }
  return null;
};

PersoMinigame.prototype.updateActiveCanvasInput = function updateActiveCanvasInput(value) {
  var target = this.getActiveCanvasInput();
  if (!target) return false;
  this[target.key] = String(value || "").slice(0, target.max);
  this.error = "";
  this.render();
  return true;
};

PersoMinigame.prototype.appendActiveCanvasInput = function appendActiveCanvasInput(text) {
  var target = this.getActiveCanvasInput();
  if (!target || !text) return false;
  this[target.key] = String((this[target.key] || "") + text).slice(0, target.max);
  this.error = "";
  this.render();
  return true;
};

PersoMinigame.prototype.finishCanvasKeyboardInput = function finishCanvasKeyboardInput() {
  if (!this.getActiveCanvasInput()) return false;
  this.editingParticipantText = false;
  this.editingNoteText = false;
  this.editingCustomTopic = false;
  this.keyboardComposing = false;
  this.render();
  return true;
};

PersoMinigame.prototype.handleCanvasKeyboardEvent = function handleCanvasKeyboardEvent(event) {
  var target = this.getActiveCanvasInput();
  if (!target) return;

  var key = event && typeof event.key === "string" ? event.key : "";
  if (key === "Enter") {
    if (event.preventDefault) event.preventDefault();
    this.finishCanvasKeyboardInput();
    return;
  }
  if (key === "Escape") {
    if (event.preventDefault) event.preventDefault();
    this.finishCanvasKeyboardInput();
    return;
  }
  if (key === "Backspace") {
    if (event.preventDefault) event.preventDefault();
    this.updateActiveCanvasInput(String(this[target.key] || "").slice(0, -1));
    return;
  }
  if (key === "Delete") {
    if (event.preventDefault) event.preventDefault();
    this.updateActiveCanvasInput("");
    return;
  }
  if (this.keyboardComposing || !key || key.length !== 1) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.preventDefault) event.preventDefault();
  this.appendActiveCanvasInput(key);
};

PersoMinigame.prototype.handleCanvasCompositionEnd = function handleCanvasCompositionEnd(event) {
  this.keyboardComposing = false;
  var value = event && typeof event.data === "string" ? event.data : "";
  if (value) this.appendActiveCanvasInput(value);
};

PersoMinigame.prototype.handleCanvasPaste = function handleCanvasPaste(event) {
  if (!this.getActiveCanvasInput()) return;
  var clipboard = event && event.clipboardData;
  var text = clipboard && clipboard.getData ? clipboard.getData("text") : "";
  if (!text) return;
  if (event.preventDefault) event.preventDefault();
  this.appendActiveCanvasInput(text);
};

PersoMinigame.prototype.bindCanvasKeyboardEvents = function bindCanvasKeyboardEvents() {
  var self = this;
  var target = null;
  if (typeof document !== "undefined" && document.addEventListener) target = document;
  else if (typeof window !== "undefined" && window.addEventListener) target = window;
  else if (typeof globalThis !== "undefined" && globalThis.addEventListener) target = globalThis;
  else if (this.canvas && this.canvas.addEventListener) target = this.canvas;
  if (!target) return;

  target.addEventListener("keydown", function onKeydown(event) {
    self.handleCanvasKeyboardEvent(event);
  });
  target.addEventListener("compositionstart", function onCompositionStart() {
    self.keyboardComposing = true;
  });
  target.addEventListener("compositionend", function onCompositionEnd(event) {
    self.handleCanvasCompositionEnd(event);
  });
  target.addEventListener("paste", function onPaste(event) {
    self.handleCanvasPaste(event);
  });
};

PersoMinigame.prototype.bindEvents = function bindEvents() {
  var self = this;
  this.bindCanvasKeyboardEvents();

  if (this.tt.onTouchStart) {
    this.tt.onTouchStart(function onTouchStart(event) {
      self.handleTouchStartEvent(event);
    });
  }

  if (this.tt.onTouchMove) {
    this.tt.onTouchMove(function onTouchMove(event) {
      self.handleTouchMoveEvent(event);
    });
  }

  if (this.tt.onTouchEnd) {
    this.tt.onTouchEnd(function onTouchEnd(event) {
      self.handleTouchEndEvent(event);
    });
  }

  if (this.canvas && this.canvas.addEventListener) {
    this.canvas.addEventListener("touchstart", function onCanvasTouchStart(event) {
      if (event.preventDefault) event.preventDefault();
      self.handleTouchStartEvent(event);
    });
    this.canvas.addEventListener("touchmove", function onCanvasTouchMove(event) {
      if (event.preventDefault) event.preventDefault();
      self.handleTouchMoveEvent(event);
    });
    this.canvas.addEventListener("touchend", function onCanvasTouchEnd(event) {
      if (event.preventDefault) event.preventDefault();
      self.handleTouchEndEvent(event);
    });
    this.canvas.addEventListener("mousedown", function onCanvasMouseDown(event) {
      var point = self.normalizeTouchPoint(getTouchPoint(event));
      if (!point) return;
      self.touchStart = {
        x: point.x,
        y: point.y,
        scrollY: self.scrollY,
        moved: false
      };
    });
    this.canvas.addEventListener("mouseup", function onCanvasMouseUp(event) {
      var point = self.normalizeTouchPoint(getTouchPoint(event));
      var start = self.touchStart;
      self.touchStart = null;
      if (!point && start) point = { x: start.x, y: start.y };
      if (!point || !start || start.moved) return;
      self.handleTapDeduped(point.x, point.y);
    });
  }

  if (this.tt.onWheel || this.tt.onMouseWheel) {
    var bindWheel = this.tt.onWheel || this.tt.onMouseWheel;
    bindWheel.call(this.tt, function onWheel(event) {
      if (self.page !== "selection" || self.maxScrollY <= 0) return;
      var deltaY = typeof event.deltaY === "number" ? event.deltaY : 0;
      if (!deltaY && typeof event.wheelDelta === "number") deltaY = -event.wheelDelta;
      if (!deltaY) return;
      self.scrollY = clamp(self.scrollY + deltaY, 0, self.maxScrollY);
      self.render();
    });
  }

  if (this.tt.onKeyboardInput) {
    this.tt.onKeyboardInput(function onKeyboardInput(event) {
      if (self.editingParticipantText) {
        self.participantDraftText = readKeyboardEventValue(event, self.participantDraftText).slice(0, PARTICIPANT_INPUT_MAX_CHARS);
      } else if (self.editingNoteText) {
        self.noteDraftText = readKeyboardEventValue(event, self.noteDraftText).slice(0, 80);
      } else if (self.editingCustomTopic) {
        self.customTopic = readKeyboardEventValue(event, self.customTopic).slice(0, 300);
      } else {
        return;
      }
      self.error = "";
      self.render();
    });
  }

  if (this.tt.onKeyboardConfirm) {
    this.tt.onKeyboardConfirm(function onKeyboardConfirm(event) {
      if (self.editingParticipantText) {
        self.participantDraftText = readKeyboardEventValue(event, self.participantDraftText).slice(0, PARTICIPANT_INPUT_MAX_CHARS);
        self.editingParticipantText = false;
      } else if (self.editingNoteText) {
        self.noteDraftText = readKeyboardEventValue(event, self.noteDraftText).slice(0, 80);
        self.editingNoteText = false;
      } else if (self.editingCustomTopic) {
        self.customTopic = readKeyboardEventValue(event, self.customTopic).slice(0, 300);
        self.editingCustomTopic = false;
      } else {
        return;
      }
      if (self.tt.hideKeyboard) self.tt.hideKeyboard();
      self.render();
    });
  }

  if (this.tt.onKeyboardComplete) {
    this.tt.onKeyboardComplete(function onKeyboardComplete(event) {
      if (self.editingParticipantText) {
        self.participantDraftText = readKeyboardEventValue(event, self.participantDraftText).slice(0, PARTICIPANT_INPUT_MAX_CHARS);
        self.editingParticipantText = false;
      } else if (self.editingNoteText) {
        self.noteDraftText = readKeyboardEventValue(event, self.noteDraftText).slice(0, 80);
        self.editingNoteText = false;
      } else if (self.editingCustomTopic) {
        self.customTopic = readKeyboardEventValue(event, self.customTopic).slice(0, 300);
        self.editingCustomTopic = false;
      } else {
        return;
      }
      self.render();
    });
  }

  if (this.tt.onKeyboardBlur) {
    this.tt.onKeyboardBlur(function onKeyboardBlur(event) {
      if (self.editingParticipantText) {
        self.participantDraftText = readKeyboardEventValue(event, self.participantDraftText).slice(0, PARTICIPANT_INPUT_MAX_CHARS);
        self.editingParticipantText = false;
      } else if (self.editingNoteText) {
        self.noteDraftText = readKeyboardEventValue(event, self.noteDraftText).slice(0, 80);
        self.editingNoteText = false;
      } else if (self.editingCustomTopic) {
        self.customTopic = readKeyboardEventValue(event, self.customTopic).slice(0, 300);
        self.editingCustomTopic = false;
      } else {
        return;
      }
      self.render();
    });
  }
};

PersoMinigame.prototype.normalizeTouchPoint = function normalizeTouchPoint(point) {
  if (!point) return null;
  var x = point.x;
  var y = point.y;
  var ratio = this.pixelRatio || 1;
  var rect = null;
  if (this.canvas && this.canvas.getBoundingClientRect) {
    try {
      rect = this.canvas.getBoundingClientRect();
    } catch (error) {}
  }
  if (
    rect &&
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.left - 2 &&
    x <= rect.left + rect.width + 2 &&
    y >= rect.top - 2 &&
    y <= rect.top + rect.height + 2
  ) {
    return {
      x: (x - rect.left) * this.width / rect.width,
      y: (y - rect.top) * this.height / rect.height
    };
  }
  if (ratio > 1 && (x > this.width || y > this.height)) {
    x /= ratio;
    y /= ratio;
  }
  return { x: x, y: y };
};

PersoMinigame.prototype.bindLaunchEvents = function bindLaunchEvents() {
  var self = this;
  if (!this.tt.onShow) return;

  this.tt.onShow(function onShow(options) {
    self.launchScene = options && options.scene ? String(options.scene) : "";
    if (self.launchScene === "sidebar") {
      self.sidebarReturned = true;
      self.markSidebarPromptSeen();
      self.error = "已从侧边栏返回，圆桌灵感 +1";
    }
    self.render();
  });
};

PersoMinigame.prototype.ensureVoiceAudio = function ensureVoiceAudio() {
  if (this.voiceAudioContext) {
    if (this.voiceAudioMode === "webaudio" && this.voiceAudioContext.state === "suspended" && this.voiceAudioContext.resume) {
      this.voiceAudioContext.resume();
    }
    return this.voiceAudioContext;
  }

  try {
    if (this.tt.isBrowserAdapter) {
      var BrowserAudioContextCtor =
        typeof AudioContext !== "undefined"
          ? AudioContext
          : typeof webkitAudioContext !== "undefined"
            ? webkitAudioContext
            : null;
      if (BrowserAudioContextCtor) this.voiceAudioContext = new BrowserAudioContextCtor();
      if (this.voiceAudioContext) this.voiceAudioMode = "webaudio";
    } else if (this.tt.createInnerAudioContext) {
      var self = this;
      this.voiceAudioContext = this.tt.createInnerAudioContext();
      this.voiceAudioMode = "inner";
      this.voiceAudioContext.obeyMuteSwitch = false;
      this.voiceAudioContext.volume = 0.72;
      if (this.voiceAudioContext.onCanplay) {
        this.voiceAudioContext.onCanplay(function onVoiceCanplay() {
          self.ttsPlaybackReady = true;
          var duration = Number(self.voiceAudioContext && self.voiceAudioContext.duration);
          if (duration > 0) self.ttsPlaybackDuration = duration;
        });
      }
      if (this.voiceAudioContext.onPlay) {
        this.voiceAudioContext.onPlay(function onVoicePlay() {
          self.ttsPlaybackReady = true;
          if (!self.ttsPlaybackStartedAt) self.ttsPlaybackStartedAt = Date.now();
        });
      }
      if (this.voiceAudioContext.onEnded) {
        this.voiceAudioContext.onEnded(function onVoiceEnded() {
          self.ttsPlaybackEnded = true;
          self.ttsPlaybackReady = true;
        });
      }
      if (this.voiceAudioContext.onError) {
        this.voiceAudioContext.onError(function onVoiceError(error) {
          if (self.ttsPlaybackKey) self.ttsFailedKeys[self.ttsPlaybackKey] = true;
          if (self.voiceMessageKey) self.ttsFailedKeys[self.voiceMessageKey] = true;
          self.ttsPendingKey = "";
          self.ttsPendingStartedAt = 0;
          self.ttsPlaybackKey = "";
          self.ttsPlaybackMessageIndex = -1;
          self.ttsPlaybackReady = false;
          self.ttsPlaybackEnded = false;
          self.ttsError = error && error.errMsg ? error.errMsg + "，已切回文字播放" : "语音播放失败，已切回文字播放";
          self.render();
        });
      }
    } else if (this.tt.createWebAudioContext) {
      this.voiceAudioContext = this.tt.createWebAudioContext();
      this.voiceAudioMode = "webaudio";
    } else {
      var AudioContextCtor =
        typeof AudioContext !== "undefined"
          ? AudioContext
          : typeof webkitAudioContext !== "undefined"
            ? webkitAudioContext
            : null;
      if (AudioContextCtor) this.voiceAudioContext = new AudioContextCtor();
      if (this.voiceAudioContext) this.voiceAudioMode = "webaudio";
    }
  } catch (error) {
    this.voiceAudioContext = null;
    this.voiceAudioMode = "";
  }

  this.voiceAudioReady = !!this.voiceAudioContext;
  return this.voiceAudioContext;
};

PersoMinigame.prototype.getTtsMessageKey = function getTtsMessageKey(message, messageIndex) {
  var speechText = this.getTtsSpeechText(message);
  if (!message || !speechText) return "";
  return (typeof messageIndex === "number" ? messageIndex : this.activeMessageIndex) + ":" + message.persona + ":" + speechText;
};

PersoMinigame.prototype.getTtsSpeechText = function getTtsSpeechText(message) {
  if (!message || typeof message.content !== "string") return "";
  return message.content.slice(0, TTS_MAX_TEXT_CHARS);
};

PersoMinigame.prototype.getSpeechCharWeight = function getSpeechCharWeight(ch) {
  if (/[，。！？；：、,.!?;:]/.test(ch)) return 2.4;
  if (/["“”'‘’（）()\[\]《》<>]/.test(ch)) return 0.45;
  if (/\s/.test(ch)) return 0.35;
  if (/[A-Za-z0-9]/.test(ch)) return 0.65;
  return 1;
};

PersoMinigame.prototype.getSpeechWeightTotal = function getSpeechWeightTotal(text) {
  var total = 0;
  for (var i = 0; i < text.length; i += 1) total += this.getSpeechCharWeight(text[i]);
  return Math.max(1, total);
};

PersoMinigame.prototype.getWeightedSpeechCharIndex = function getWeightedSpeechCharIndex(text, ratio) {
  if (!text) return 0;
  var target = this.getSpeechWeightTotal(text) * clamp(ratio, 0, 1);
  var cursor = 0;
  for (var i = 0; i < text.length; i += 1) {
    cursor += this.getSpeechCharWeight(text[i]);
    if (cursor >= target) return i + 1;
  }
  return text.length;
};

PersoMinigame.prototype.toggleVoice = function toggleVoice() {
  this.voiceEnabled = !this.voiceEnabled;
  if (this.voiceEnabled) this.ensureVoiceAudio();
  else this.stopVoiceAudio();
  this.render();
};

PersoMinigame.prototype.getBgmMoodForTopic = function getBgmMoodForTopic(topic) {
  var text = String(topic || "").toLowerCase();
  if (/恋爱|喜欢|分手|异地|暧昧|朋友|友情|家庭|父母|关系|爱|crush|date/.test(text)) return "emotion";
  if (/迷茫|人生|未来|工作|辞职|焦虑|选择|三十|30|gap|year|毕业|自由|成长/.test(text)) return "life";
  if (/书|小说|电影|毛姆|刀锋|文学|作品|角色|故事|音乐|艺术|the razor/.test(text)) return "story";
  if (/吐槽|好笑|尴尬|离谱|八卦|发疯|搞笑|吃什么|饭|玩|快乐|笑/.test(text)) return "playful";
  if (/决策|效率|职场|赚钱|创业|计划|目标|kpi|996|逻辑|理性|方案|执行/.test(text)) return "rational";
  return "life";
};

PersoMinigame.prototype.ensureBgmAudio = function ensureBgmAudio() {
  if (this.bgmAudioContext) return this.bgmAudioContext;
  if (!this.tt.createInnerAudioContext) return null;

  try {
    if (this.tt.setInnerAudioOption) {
      try {
        this.tt.setInnerAudioOption({
          obeyMuteSwitch: false,
          mixWithOther: true
        });
      } catch (optionError) {}
    }
    this.bgmAudioContext = this.tt.createInnerAudioContext();
    this.bgmAudioContext.obeyMuteSwitch = false;
    this.bgmAudioContext.loop = true;
    this.bgmAudioContext.autoplay = false;
    this.bgmAudioContext.volume = BGM_VOLUME;
    if (this.bgmAudioContext.onCanplay) {
      var canplaySelf = this;
      this.bgmAudioContext.onCanplay(function onBgmCanplay() {
        if (!canplaySelf.bgmEnabled || !canplaySelf.bgmPlayRequested || !canplaySelf.bgmAudioContext.play) return;
        try {
          canplaySelf.bgmAudioContext.volume = canplaySelf.bgmDucked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
          canplaySelf.bgmAudioContext.play();
        } catch (error) {}
      });
    }
    if (this.bgmAudioContext.onPlay) {
      var playSelf = this;
      this.bgmAudioContext.onPlay(function onBgmPlay() {
        playSelf.bgmPlaying = true;
      });
    }
    if (this.bgmAudioContext.onError) {
      var self = this;
      this.bgmAudioContext.onError(function onBgmError(error) {
        self.bgmPlaying = false;
        self.bgmPlayRequested = false;
        self.ttsError = error && error.errMsg ? "背景音播放失败：" + error.errMsg : "背景音播放失败";
        self.render();
      });
    }
  } catch (error) {
    this.bgmAudioContext = null;
  }
  return this.bgmAudioContext;
};

PersoMinigame.prototype.getBgmAudioSrc = function getBgmAudioSrc(mood) {
  var path = BGM_TRACKS[mood] || BGM_TRACKS.life || "";
  var apiBaseUrl;
  if (!path) return "";
  if (/^(https?:|ttfile:|wxfile:|file:)/.test(path)) return path;
  if (path.charAt(0) !== "/") return path;
  apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  if (!apiBaseUrl) return "";
  return apiBaseUrl + path;
};

PersoMinigame.prototype.startBgmForCurrentTopic = function startBgmForCurrentTopic() {
  // 临时禁用背景音，避免录制提交视频时混入噪音；恢复时删掉这一行。
  return;
  if (!this.bgmEnabled) return;
  var mood = this.getBgmMoodForTopic(this.currentTopic());
  var src = this.getBgmAudioSrc(mood);
  var audio = this.ensureBgmAudio();
  if (!audio || !src) return;

  try {
    audio.loop = true;
    audio.volume = this.bgmDucked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
    if (this.bgmMood !== mood || !this.bgmPlaying) {
      if (audio.stop) {
        try {
          audio.stop();
        } catch (stopError) {}
      }
      audio.src = src;
      this.bgmPlayRequested = true;
      if (audio.seek) {
        try {
          audio.seek(0);
        } catch (seekError) {}
      }
      audio.play();
      this.bgmMood = mood;
    }
  } catch (error) {
    this.bgmPlaying = false;
    this.bgmPlayRequested = false;
  }
};

PersoMinigame.prototype.setBgmDucked = function setBgmDucked(ducked) {
  this.bgmDucked = !!ducked;
  if (!this.bgmAudioContext) return;
  try {
    this.bgmAudioContext.volume = this.bgmDucked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
  } catch (error) {}
};

PersoMinigame.prototype.stopBgm = function stopBgm() {
  if (this.bgmAudioContext && this.bgmAudioContext.stop) {
    try {
      this.bgmAudioContext.stop();
    } catch (error) {}
  }
  this.bgmPlaying = false;
  this.bgmPlayRequested = false;
  this.bgmMood = "";
};

PersoMinigame.prototype.toggleBgm = function toggleBgm() {
  this.bgmEnabled = !this.bgmEnabled;
  if (this.bgmEnabled && (this.page === "loading" || this.page === "roundtable")) this.startBgmForCurrentTopic();
  else this.stopBgm();
  this.render();
};

PersoMinigame.prototype.exitToSelection = function exitToSelection() {
  this.stopLoadingLoop();
  this.stopPlaybackLoop();
  this.clearShareVideoTimers();
  this.stopVoiceAudio();
  this.stopBgm();
  this.page = "selection";
  this.status = "idle";
  this.error = "";
  this.atmosphere = "plain";
  this.atmosphereSelected = false;
  this.thinkingVisible = false;
  this.sidebarPromptVisible = false;
  this.shareOverlayVisible = false;
  this.shareCardPreviewVisible = false;
  this.shareCardNotice = "";
  this.shareVideoState = "idle";
  this.shareVideoPreviewPlaying = false;
  this.shareVideoPreviewElapsed = 0;
  this.shareVideoNotice = "";
  this.shareVideoError = "";
  this.clearShareVideoResult();
  this.settingsOverlayVisible = false;
  this.noteOverlayTarget = null;
  this.pendingPrivateNote = null;
  this.participantDraftText = "";
  this.editingParticipantText = false;
  this.participantInputPending = false;
  this.render();
};

PersoMinigame.prototype.openSettingsOverlay = function openSettingsOverlay() {
  this.settingsOverlayVisible = true;
  this.shareOverlayVisible = false;
  this.shareCardPreviewVisible = false;
  this.render();
};

PersoMinigame.prototype.handleSettingsTap = function handleSettingsTap(x, y) {
  if (this.hit(this.rects.settingsSound, x, y)) {
    this.toggleVoice();
    return true;
  }
  if (this.hit(this.rects.settingsBgm, x, y)) {
    this.toggleBgm();
    return true;
  }
  if (this.hit(this.rects.settingsExit, x, y)) {
    this.exitToSelection();
    return true;
  }
  if (this.status === "done" && this.hit(this.rects.settingsShare, x, y)) {
    this.settingsOverlayVisible = false;
    if (this.getVisibleShareMessages().length) this.openShareOptions();
    else this.shareCard();
    this.render();
    return true;
  }
  if (!this.hit(this.rects.settingsPanel, x, y)) {
    this.settingsOverlayVisible = false;
    this.render();
    return true;
  }
  return true;
};

PersoMinigame.prototype.stopVoiceAudio = function stopVoiceAudio() {
  if (this.voiceAudioMode === "inner" && this.voiceAudioContext && this.voiceAudioContext.stop) {
    try {
      this.voiceAudioContext.stop();
    } catch (error) {}
  }
  if (this.voiceAudioMode === "webaudio" && this.voiceWebAudioSource) {
    try {
      this.voiceWebAudioSource.stop(0);
    } catch (error) {}
    try {
      this.voiceWebAudioSource.disconnect();
    } catch (error) {}
    this.voiceWebAudioSource = null;
  }
  this.voiceMessageKey = "";
  this.ttsPendingKey = "";
  this.ttsPendingStartedAt = 0;
  this.ttsPlaybackKey = "";
  this.ttsPlaybackMessageIndex = -1;
  this.ttsPlaybackStartedAt = 0;
  this.ttsPlaybackDuration = 0;
  this.ttsPlaybackReady = false;
  this.ttsPlaybackEnded = false;
};

PersoMinigame.prototype.pauseVoiceAudio = function pauseVoiceAudio() {
  if (this.voiceAudioMode === "inner" && this.voiceAudioContext && this.voiceAudioContext.pause && this.ttsPlaybackKey) {
    try {
      this.voiceAudioContext.pause();
    } catch (error) {}
  }
};

PersoMinigame.prototype.resumeVoiceAudio = function resumeVoiceAudio() {
  if (!this.voiceEnabled || this.voiceAudioMode !== "inner" || !this.voiceAudioContext || !this.ttsPlaybackKey) return false;
  if (!this.voiceAudioContext.play || this.ttsPlaybackEnded) return false;
  try {
    this.voiceAudioContext.play();
    return true;
  } catch (error) {
    return false;
  }
};

PersoMinigame.prototype.canUseTtsForMessage = function canUseTtsForMessage(message) {
  if (!this.voiceEnabled || !message || !isPersona(message.persona) || !message.content) return false;
  if (!normalizeOrigin(config.API_BASE_URL)) return false;
  var audio = this.ensureVoiceAudio();
  return !!audio && (this.voiceAudioMode === "inner" || this.voiceAudioMode === "webaudio");
};

PersoMinigame.prototype.playMessageTtsIfNeeded = function playMessageTtsIfNeeded(message, messageIndex) {
  if (!this.canUseTtsForMessage(message)) return false;

  var key = this.getTtsMessageKey(message, messageIndex);
  if (this.ttsFailedKeys[key]) return false;
  if (this.voiceMessageKey === key) {
    if (this.ttsPlaybackKey === key || this.ttsPendingKey === key) return true;
    if (this.ttsAudioCache[key]) {
      if (this.playbackPaused) return true;
      this.playTtsAudioSource(this.ttsAudioCache[key], key, messageIndex);
      return true;
    }
    return false;
  }
  this.voiceMessageKey = key;
  this.ttsPendingKey = key;
  this.ttsPendingStartedAt = Date.now();
  this.ttsPlaybackKey = "";
  this.ttsPlaybackMessageIndex = -1;
  this.ttsPlaybackStartedAt = 0;
  this.ttsPlaybackDuration = 0;
  this.ttsPlaybackReady = false;
  this.ttsPlaybackEnded = false;
  this.ttsError = "";

  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  if (!apiBaseUrl) {
    this.ttsError = "配置 API_BASE_URL 后可播放真实语音";
    return false;
  }

  var audio = this.ensureVoiceAudio();
  if (!audio || (this.voiceAudioMode !== "inner" && this.voiceAudioMode !== "webaudio")) {
    this.voiceMessageKey = "";
    this.ttsPendingKey = "";
    this.ttsPendingStartedAt = 0;
    return false;
  }

  var audioUrl = this.getTtsAudioUrl(message);
  if (this.ttsAudioCache[key]) {
    this.playTtsAudioSource(this.ttsAudioCache[key], key, messageIndex);
    return true;
  }

  if (this.tt.downloadFile && !this.tt.isBrowserAdapter) {
    this.downloadAndPlayTts(audioUrl, key, messageIndex);
    return true;
  }

  this.playTtsAudioSource(audioUrl, key, messageIndex);
  return true;
};

PersoMinigame.prototype.playTtsAudioSource = function playTtsAudioSource(src, key, messageIndex) {
  if (!this.voiceEnabled || this.voiceMessageKey !== key) return;

  var audio = this.ensureVoiceAudio();
  if (!audio) return;
  if (this.voiceAudioMode === "webaudio") {
    this.playTtsWebAudioSource(src, key, messageIndex);
    return;
  }
  if (this.voiceAudioMode !== "inner") return;

  try {
    audio.obeyMuteSwitch = false;
    audio.volume = 0.72;
    audio.src = src;
    if (audio.seek) {
      try {
        audio.seek(0);
      } catch (seekError) {}
    }
    this.ttsPendingKey = "";
    this.ttsPendingStartedAt = 0;
    this.ttsPlaybackKey = key;
    this.ttsPlaybackMessageIndex = typeof messageIndex === "number" ? messageIndex : this.liveMessageIndex;
    this.ttsPlaybackStartedAt = 0;
    this.ttsPlaybackDuration = 0;
    this.ttsPlaybackReady = false;
    this.ttsPlaybackEnded = false;
    if (this.playbackPaused && this.shareVideoState !== "recording") return;
    var playResult = audio.play();
    if (playResult && typeof playResult.catch === "function") {
      var self = this;
      playResult.catch(function onAudioPlayRejected(error) {
        if (self.voiceMessageKey !== key && self.ttsPlaybackKey !== key) return;
        self.ttsFailedKeys[key] = true;
        self.ttsPendingKey = "";
        self.ttsPendingStartedAt = 0;
        self.ttsPlaybackKey = "";
        self.ttsPlaybackMessageIndex = -1;
        self.ttsError = self.tt && self.tt.isBrowserAdapter
          ? ""
          : error && error.message
            ? error.message + "，已切回文字播放"
            : "语音播放失败，已切回文字播放";
        self.render();
      });
    }
    this.ttsError = "";
  } catch (error) {
    this.ttsFailedKeys[key] = true;
    this.ttsPendingKey = "";
    this.ttsPendingStartedAt = 0;
    this.ttsPlaybackKey = "";
    this.ttsPlaybackMessageIndex = -1;
    this.ttsError = this.tt && this.tt.isBrowserAdapter ? "" : "语音播放失败，已切回文字播放";
  }
};

PersoMinigame.prototype.decodeAudioBuffer = function decodeAudioBuffer(audio, bytes) {
  return new Promise(function decode(resolve, reject) {
    try {
      var result = audio.decodeAudioData(
        bytes.slice(0),
        function onDecodeSuccess(buffer) {
          resolve(buffer);
        },
        function onDecodeFail(error) {
          reject(error || new Error("decodeAudioData failed"));
        }
      );
      if (result && typeof result.then === "function") result.then(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

PersoMinigame.prototype.playTtsWebAudioSource = function playTtsWebAudioSource(src, key, messageIndex) {
  var self = this;
  var audio = this.ensureVoiceAudio();
  if (!audio || this.voiceAudioMode !== "webaudio") {
    this.ttsFailedKeys[key] = true;
    this.ttsPendingKey = "";
    this.ttsPendingStartedAt = 0;
    return;
  }

  this.ttsPendingKey = key;
  this.ttsPendingStartedAt = Date.now();
  this.ttsPlaybackKey = "";
  this.ttsPlaybackMessageIndex = -1;
  this.ttsPlaybackStartedAt = 0;
  this.ttsPlaybackDuration = 0;
  this.ttsPlaybackReady = false;
  this.ttsPlaybackEnded = false;

  if (audio.state === "suspended" && audio.resume) {
    try {
      audio.resume();
    } catch (resumeError) {}
  }

  fetch(src, { mode: "cors", cache: "no-store" })
    .then(function onTtsFetch(response) {
      if (!response.ok) throw new Error("TTS fetch " + response.status);
      return response.arrayBuffer();
    })
    .then(function onTtsBytes(bytes) {
      return self.decodeAudioBuffer(audio, bytes);
    })
    .then(function onTtsDecoded(buffer) {
      if (!self.voiceEnabled || self.voiceMessageKey !== key) return;

      if (self.voiceWebAudioSource) {
        try {
          self.voiceWebAudioSource.stop(0);
        } catch (stopError) {}
        try {
          self.voiceWebAudioSource.disconnect();
        } catch (disconnectError) {}
      }

      var source = audio.createBufferSource();
      var gain = audio.createGain();
      source.buffer = buffer;
      gain.gain.value = 0.72;
      source.connect(gain);
      gain.connect(audio.destination);
      source.onended = function onWebAudioEnded() {
        if (self.ttsPlaybackKey !== key) return;
        self.ttsPlaybackEnded = true;
        self.ttsPlaybackReady = true;
        self.voiceWebAudioSource = null;
      };

      self.voiceWebAudioSource = source;
      self.voiceWebAudioGain = gain;
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      self.ttsPlaybackKey = key;
      self.ttsPlaybackMessageIndex = typeof messageIndex === "number" ? messageIndex : self.liveMessageIndex;
      self.ttsPlaybackStartedAt = Date.now();
      self.ttsPlaybackDuration = buffer.duration || 0;
      self.ttsPlaybackReady = true;
      self.ttsPlaybackEnded = false;
      source.start(0);
      self.ttsError = "";
      self.render();
    })
    .catch(function onTtsWebAudioError(error) {
      if (self.voiceMessageKey !== key && self.ttsPendingKey !== key && self.ttsPlaybackKey !== key) return;
      self.ttsFailedKeys[key] = true;
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      self.ttsPlaybackKey = "";
      self.ttsPlaybackMessageIndex = -1;
      self.ttsPlaybackReady = false;
      self.ttsPlaybackEnded = false;
      self.ttsError = self.tt && self.tt.isBrowserAdapter
        ? ""
        : error && error.message
          ? error.message + "，已切回文字播放"
          : "WebAudio 语音播放失败，已切回文字播放";
      self.render();
    });
};

PersoMinigame.prototype.downloadAndPlayTts = function downloadAndPlayTts(url, key, messageIndex) {
  var self = this;

  this.tt.downloadFile({
    url: url,
    success: function success(response) {
      var statusCode = response.statusCode || 200;
      var tempFilePath = response.tempFilePath || response.filePath;
      if (statusCode >= 400 || !tempFilePath) {
        if (self.voiceMessageKey !== key) return;
        self.ttsError = "语音请求失败（" + statusCode + "）";
        self.ttsFailedKeys[key] = true;
        self.ttsPendingKey = "";
        self.ttsPendingStartedAt = 0;
        self.render();
        return;
      }

      self.ttsAudioCache[key] = tempFilePath;
      if (self.voiceMessageKey !== key) {
        self.render();
        return;
      }
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      if (!self.playbackPaused || self.shareVideoState === "recording") self.playTtsAudioSource(tempFilePath, key, messageIndex);
      self.render();
    },
    fail: function fail(error) {
      if (self.voiceMessageKey !== key) return;
      self.ttsError = "语音下载失败，已切回文字播放";
      if (error && error.errMsg) self.ttsError = error.errMsg + "，已切回文字播放";
      self.ttsFailedKeys[key] = true;
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      self.render();
    }
  });
};

PersoMinigame.prototype.updateVisibleCharsFromTts = function updateVisibleCharsFromTts(message, messageIndex) {
  var key = this.getTtsMessageKey(message, messageIndex);
  if (!key || this.ttsFailedKeys[key]) return false;

  this.playMessageTtsIfNeeded(message, messageIndex);
  if (this.ttsFailedKeys[key]) return false;

  if (this.ttsPlaybackKey !== key) {
    if (this.ttsPendingKey === key) {
      if (!this.ttsPendingStartedAt) this.ttsPendingStartedAt = Date.now();
      if (Date.now() - this.ttsPendingStartedAt > TTS_PENDING_FALLBACK_MS) {
        this.ttsFailedKeys[key] = true;
        this.ttsPendingKey = "";
        this.ttsPendingStartedAt = 0;
        this.ttsPlaybackKey = "";
        this.ttsPlaybackMessageIndex = -1;
        this.ttsError = this.tt && this.tt.isBrowserAdapter ? "" : "语音加载较慢，已切回文字播放";
        return false;
      }
      return true;
    }
    return false;
  }

  var fullLength = message.content.length;
  var speechText = this.getTtsSpeechText(message);
  var speechLength = speechText.length;
  if (fullLength <= 0 || speechLength <= 0) return false;

  if (this.ttsPlaybackEnded) {
    this.liveVisibleChars = Math.max(this.liveVisibleChars, speechLength);
    return fullLength <= speechLength;
  }

  var audio = this.voiceAudioContext;
  var duration = Number(audio && audio.duration);
  if (!(duration > 0)) duration = Number(this.ttsPlaybackDuration);

  var currentTime = Number(audio && audio.currentTime);
  if (!(currentTime >= 0)) currentTime = 0;
  if (this.voiceAudioMode === "webaudio" && this.ttsPlaybackStartedAt) {
    currentTime = (Date.now() - this.ttsPlaybackStartedAt) / 1000;
  }
  if (!this.ttsPlaybackStartedAt && currentTime > 0) {
    this.ttsPlaybackStartedAt = Date.now() - currentTime * 1000;
  }
  var startedElapsedMs = this.ttsPlaybackStartedAt ? Date.now() - this.ttsPlaybackStartedAt : 0;

  if (!(duration > 0)) {
    if (this.ttsPlaybackReady || this.ttsPlaybackStartedAt || currentTime > 0) {
      var fallbackDurationMs = Math.max(1200, this.getSpeechWeightTotal(speechText) * 130);
      var fallbackTarget = startedElapsedMs > 0
        ? this.getWeightedSpeechCharIndex(speechText, clamp(startedElapsedMs / fallbackDurationMs, 0, 1))
        : 1;
      this.liveVisibleChars = Math.max(1, this.liveVisibleChars, Math.min(fallbackTarget, speechLength));
    }
    return true;
  }

  this.ttsPlaybackDuration = duration;
  var audioRatio = clamp(currentTime / duration, 0, 1);
  if (audioRatio <= 0 && startedElapsedMs > 0) audioRatio = clamp(startedElapsedMs / (duration * 1000), 0, 1);
  var targetChars = this.getWeightedSpeechCharIndex(speechText, audioRatio);
  if (targetChars <= 0 && (this.ttsPlaybackReady || this.ttsPlaybackStartedAt || currentTime > 0)) targetChars = 1;
  if (currentTime >= duration - 0.05) targetChars = speechLength;
  targetChars = clamp(targetChars, 0, speechLength);

  if (targetChars > this.liveVisibleChars) this.liveVisibleChars = targetChars;

  return true;
};

PersoMinigame.prototype.playPersonaVoiceTick = function playPersonaVoiceTick(persona, charIndex, content) {
  if (!this.voiceEnabled || !isPersona(persona)) return;

  var profile = PERSONA_VOICE_PROFILES[persona] || PERSONA_VOICE_PROFILES.INTJ;
  if (charIndex <= 0 || charIndex % profile.step !== 0) return;

  var key = persona + ":" + this.activeMessageIndex + ":" + charIndex;
  if (key === this.lastVoiceKey) return;

  var nowMs = Date.now();
  if (nowMs - this.lastVoiceTickAt < 28) return;

  var audio = this.ensureVoiceAudio();
  if (!audio) return;

  if (this.voiceAudioMode === "inner") {
    try {
      audio.stop();
      audio.src = "assets/audio/voice-" + persona + ".wav";
      audio.volume = profile.volume * 14;
      audio.play();
      this.lastVoiceKey = key;
      this.lastVoiceTickAt = nowMs;
    } catch (error) {}
    return;
  }

  if (!audio.createOscillator || !audio.createGain || !audio.destination) return;

  var charCode = content && content.charCodeAt(charIndex - 1) ? content.charCodeAt(charIndex - 1) : charIndex;
  var frequency = profile.base + (charCode % Math.max(1, profile.variance));
  var now = audio.currentTime || 0;
  var duration = profile.duration;

  try {
    var oscillator = audio.createOscillator();
    var gain = audio.createGain();
    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    if (gain.gain.exponentialRampToValueAtTime) {
      gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    } else {
      gain.gain.setValueAtTime(profile.volume, now + 0.008);
      gain.gain.setValueAtTime(0.0001, now + duration);
    }

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);

    this.lastVoiceKey = key;
    this.lastVoiceTickAt = nowMs;
  } catch (error) {}
};

PersoMinigame.prototype.getTopReserved = function getTopReserved() {
  var safeTop = this.systemInfo.safeArea ? Math.max(0, this.systemInfo.safeArea.top || 0) : 0;
  return Math.max(58, safeTop > 0 ? safeTop : 44);
};

PersoMinigame.prototype.handleTap = function handleTap(x, y) {
  var id;

  if (this.page === "roundtable") {
    this.handleRoundtableTap(x, y);
    return;
  }

  if (this.page === "loading") {
    if (this.settingsOverlayVisible) {
      this.handleSettingsTap(x, y);
      return;
    }
    if (this.hit(this.rects.settings, x, y)) {
      this.openSettingsOverlay();
      return;
    }
    return;
  }

  if (this.page !== "selection") return;

  if (this.hit(this.rects.start, x, y)) {
    this.handleStart();
    return;
  }

  if (this.hit(this.rects.customTopic, x, y)) {
    this.focusCustomTopic();
    return;
  }

  if (this.hit(this.rects.modeParticipant, x, y)) {
    this.mode = "participant";
    this.render();
    return;
  }

  if (this.hit(this.rects.modeSpectator, x, y)) {
    this.mode = "fun";
    this.render();
    return;
  }

  for (id in this.rects.personas) {
    if (Object.prototype.hasOwnProperty.call(this.rects.personas, id) && this.hit(this.rects.personas[id], x, y)) {
      this.togglePersona(id);
      return;
    }
  }

  for (var i = 0; i < PRESET_TOPICS.length; i += 1) {
    if (this.hit(this.rects.topics[i], x, y)) {
      this.selectedTopic = PRESET_TOPICS[i];
      this.customTopic = "";
      this.error = "";
      this.render();
      return;
    }
  }
};

PersoMinigame.prototype.hit = function hit(rect, x, y) {
  if (!rect) return false;
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
};

PersoMinigame.prototype.markSidebarPromptSeen = function markSidebarPromptSeen() {
  this.sidebarPromptSeen = true;
  this.sidebarPromptVisible = false;
  if (this.tt.setStorageSync) {
    try {
      this.tt.setStorageSync(SIDEBAR_PROMPT_STORAGE_KEY, "1");
    } catch (error) {}
  }
};

PersoMinigame.prototype.maybeShowSidebarPrompt = function maybeShowSidebarPrompt() {
  if (this.sidebarPromptSeen || this.sidebarReturned || !this.tt.navigateToScene || this.tableMessages.length === 0) return;
  this.sidebarPromptVisible = true;
};

PersoMinigame.prototype.finishRoundtableExperience = function finishRoundtableExperience() {
  this.status = "done";
  this.playbackPaused = true;
  this.setBgmDucked(false);
  this.maybeShowSidebarPrompt();
};

PersoMinigame.prototype.isDoneReplayAtEnd = function isDoneReplayAtEnd() {
  var message = this.tableMessages[this.activeMessageIndex];
  if (!message) return true;
  return (
    this.activeMessageIndex >= this.tableMessages.length - 1 &&
    this.visibleChars >= message.content.length &&
    this.messageHoldTicks >= this.getBetweenMessageTicks()
  );
};

PersoMinigame.prototype.resetDoneReplayToStart = function resetDoneReplayToStart() {
  if (!this.tableMessages.length) return;
  this.activeMessageIndex = 0;
  this.visibleChars = 0;
  this.messageHoldTicks = 0;
  this.liveMessageIndex = this.tableMessages.length - 1;
  this.liveVisibleChars = (this.tableMessages[this.liveMessageIndex] || { content: "" }).content.length;
  this.liveHoldTicks = this.getBetweenMessageTicks();
  this.isAtLiveEdge = false;
  this.progressDragRatio = 0;
  this.stopVoiceAudio();
};

PersoMinigame.prototype.tickDoneReplay = function tickDoneReplay() {
  var message = this.tableMessages[this.activeMessageIndex];
  if (!message) {
    this.playbackPaused = true;
    this.stopPlaybackLoop();
    this.render();
    return;
  }

  if (this.visibleChars < message.content.length) {
    if (this.canUseTtsForMessage(message)) {
      this.liveVisibleChars = this.visibleChars;
      var isTtsDriven = this.updateVisibleCharsFromTts(message, this.activeMessageIndex);
      if (isTtsDriven) {
        this.visibleChars = Math.max(this.visibleChars, Math.min(message.content.length, this.liveVisibleChars));
        this.render();
        return;
      }
    }
    this.visibleChars += 1;
    this.render();
    return;
  }

  this.messageHoldTicks += 1;
  if (this.messageHoldTicks < this.getBetweenMessageTicks()) {
    this.render();
    return;
  }

  if (this.activeMessageIndex < this.tableMessages.length - 1) {
    this.stopVoiceAudio();
    this.activeMessageIndex += 1;
    this.visibleChars = 0;
    this.messageHoldTicks = 0;
    this.render();
    return;
  }

  this.playbackPaused = true;
  this.stopPlaybackLoop();
  this.stopVoiceAudio();
  this.render();
};

PersoMinigame.prototype.getPlaybackToggleLabel = function getPlaybackToggleLabel() {
  if (this.status === "done") return this.playbackPaused ? "播放" : "暂停";
  return this.playbackPaused ? "继续" : "暂停";
};

PersoMinigame.prototype.getVisibleShareMessages = function getVisibleShareMessages() {
  if (!this.tableMessages.length) return [];
  var end = this.status === "done"
    ? Math.min(this.tableMessages.length, this.liveMessageIndex + 1)
    : Math.min(this.tableMessages.length, this.activeMessageIndex + 1);
  if (end <= 0) end = Math.min(this.tableMessages.length, 1);
  return this.tableMessages.slice(0, end);
};

PersoMinigame.prototype.openShareOptions = function openShareOptions() {
  if (!this.getVisibleShareMessages().length) {
    this.error = "还没有可分享的对话";
    return;
  }
  this.shareVideoError = "";
  this.shareVideoNotice = "";
  this.shareVideoPreviewPlaying = false;
  this.shareCardNotice = "";
  this.shareOverlayVisible = true;
};

PersoMinigame.prototype.formatShareError = function formatShareError(prefix, error) {
  var message = error && (error.errMsg || error.message) ? String(error.errMsg || error.message) : "";
  return message ? prefix + "：" + message : prefix;
};

PersoMinigame.prototype.getShareCardFileName = function getShareCardFileName() {
  var topic = this.currentTopic().slice(0, 18).replace(/[\\/:*?"<>|\s]+/g, "-");
  return "perso-card" + (topic ? "-" + topic : "") + ".png";
};

PersoMinigame.prototype.downloadDataUrl = function downloadDataUrl(dataUrl, fileName) {
  if (typeof document === "undefined") return false;
  var link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

PersoMinigame.prototype.dataUrlToBlob = function dataUrlToBlob(dataUrl) {
  var parts = dataUrl.split(",");
  var mimeMatch = parts[0].match(/data:([^;]+);base64/);
  var mime = mimeMatch ? mimeMatch[1] : "image/png";
  var binary = atob(parts[1] || "");
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

PersoMinigame.prototype.shareCardImageFallback = function shareCardImageFallback() {
  if (typeof document === "undefined") {
    this.error = "当前环境不支持生成分享卡片";
    this.render();
    return;
  }

  try {
    var scale = Math.min(3, Math.max(2, this.pixelRatio || (typeof window !== "undefined" ? window.devicePixelRatio : 2) || 2));
    var cardCanvas = document.createElement("canvas");
    var cardCtx = cardCanvas.getContext("2d");
    cardCanvas.width = Math.round(360 * scale);
    cardCanvas.height = Math.round(480 * scale);
    this.drawH5StyleShareCard(cardCtx, 0, 0, scale);

    var dataUrl = cardCanvas.toDataURL("image/png");
    var fileName = this.getShareCardFileName();
    if (typeof navigator !== "undefined" && navigator.share && typeof File !== "undefined") {
      try {
        var blob = this.dataUrlToBlob(dataUrl);
        var file = new File([blob], fileName, { type: "image/png" });
        var payload = {
          files: [file],
          title: "Perso 人格圆桌",
          text: "来听人格圆桌怎么聊"
        };
        if (!navigator.canShare || navigator.canShare(payload)) {
          var self = this;
          this.error = "";
          this.shareCardNotice = "正在打开分享面板";
          this.render();
          navigator.share(payload).then(function onShareSuccess() {
            self.shareCardNotice = "分享卡片已发送";
            self.render();
          }).catch(function onShareFail(error) {
            if (error && error.name === "AbortError") {
              self.shareCardNotice = "";
            } else if (self.downloadDataUrl(dataUrl, fileName)) {
              self.shareCardNotice = "已生成分享卡片图片";
            } else {
              self.error = self.formatShareError("分享卡片失败", error);
            }
            self.render();
          });
          return;
        }
      } catch (shareError) {}
    }

    var didDownload = this.downloadDataUrl(dataUrl, fileName);
    if (didDownload) {
      this.error = "";
      this.shareCardNotice = "已生成分享卡片图片";
    } else {
      this.error = "当前环境不支持下载分享卡片";
    }
  } catch (error) {
    this.error = this.formatShareError("生成分享卡片失败", error);
  }
  this.render();
};

PersoMinigame.prototype.shareCard = function shareCard() {
  if (!this.tt.shareAppMessage) {
    this.shareCardImageFallback();
    return;
  }
  if (!config.SHARE_TEMPLATE_ID) {
    this.shareCardImageFallback();
    return;
  }

  var self = this;
  try {
    this.tt.shareAppMessage({
      channel: "invite",
      templateId: config.SHARE_TEMPLATE_ID,
      title: "Perso 人格圆桌：" + this.currentTopic().slice(0, 28),
      desc: "来听人格圆桌怎么聊",
      query: "topic=" + encodeURIComponent(this.currentTopic().slice(0, 120)),
      success: function success() {
        self.error = "";
        self.render();
      },
      fail: function fail(error) {
        self.error = self.formatShareError("分享卡片失败", error);
        self.render();
      }
    });
  } catch (error) {
    this.error = this.formatShareError("分享卡片失败", error);
    this.render();
  }
};

PersoMinigame.prototype.getShareMessageDuration = function getShareMessageDuration(message) {
  var content = message && message.content ? message.content : "";
  var speechText = this.getTtsSpeechText(message) || content;
  var speechWeight = this.getSpeechWeightTotal(speechText || content);
  var readableMs = speechWeight * 125;
  return clamp(1500 + readableMs, 3200, 9000);
};

PersoMinigame.prototype.prepareShareVideoTimeline = function prepareShareVideoTimeline(messages) {
  var total = 0;
  for (var i = 0; i < messages.length; i += 1) {
    total += this.getShareMessageDuration(messages[i]);
  }
  if (total <= SHARE_VIDEO_MAX_MS) return messages;

  var trimmed = [];
  total = 0;
  for (var j = 0; j < messages.length; j += 1) {
    var duration = this.getShareMessageDuration(messages[j]);
    if (total + duration > SHARE_VIDEO_MAX_MS) break;
    trimmed.push(messages[j]);
    total += duration;
  }
  return trimmed.length ? trimmed : messages.slice(0, 1);
};

PersoMinigame.prototype.openShareVideoPreview = function openShareVideoPreview() {
  var messages = this.prepareShareVideoTimeline(this.getVisibleShareMessages());
  if (!messages.length) {
    this.shareOverlayVisible = true;
    this.shareVideoError = "还没有可分享的对话";
    this.render();
    return;
  }

  this.stopPlaybackLoop();
  this.stopVoiceAudio();
  this.setBgmDucked(false);
  this.shareOverlayVisible = false;
  this.clearShareVideoResult();
  this.shareVideoMessages = messages;
  this.shareVideoDurationMs = 0;
  for (var i = 0; i < messages.length; i += 1) {
    this.shareVideoDurationMs += this.getShareMessageDuration(messages[i]);
    this.prefetchTtsForMessage(messages[i], i);
  }
  this.shareVideoState = "preview";
  this.shareVideoPreviewStartedAt = 0;
  this.shareVideoPreviewElapsed = Math.min(180, Math.max(0, this.shareVideoDurationMs - 1));
  this.shareVideoPreviewPlaying = false;
  this.shareVideoError = "";
  this.shareVideoNotice = "";
  this.shareVideoVoiceKey = "";
  this.shareVideoResultPath = "";
  this.render();
};

PersoMinigame.prototype.startShareVideo = function startShareVideo() {
  this.openShareVideoPreview();
};

PersoMinigame.prototype.startShareVideoExport = function startShareVideoExport() {
  if (!this.shareVideoMessages.length) {
    this.openShareVideoPreview();
    return;
  }

  if (!this.tt.getGameRecorderManager) {
    this.recordShareVideoWithMediaRecorder();
    return;
  }

  this.pauseShareVideoPreview();
  this.stopVoiceAudio();
  this.setBgmDucked(true);
  this.shareVideoState = "recording";
  this.shareVideoStartedAt = Date.now();
  this.shareVideoRunId += 1;
  this.shareVideoError = "";
  this.shareVideoNotice = "正在生成视频";
  this.shareVideoVoiceKey = "";
  this.render();

  var self = this;
  var runId = this.shareVideoRunId;
  var recorder = this.tt.getGameRecorderManager();
  this.shareVideoRecorder = recorder;
  if (!recorder || !recorder.start || !recorder.stop) {
    this.shareVideoState = "idle";
    this.shareOverlayVisible = true;
    this.shareVideoError = "录屏组件不可用，请用真机测试";
    this.setBgmDucked(false);
    this.render();
    return;
  }

  if (recorder.onStop) {
    recorder.onStop(function onRecorderStop(response) {
      if (self.shareVideoRunId !== runId) return;
      self.clearShareVideoTimers();
      self.shareVideoState = "preview";
      self.shareVideoPreviewPlaying = false;
      self.shareVideoPreviewElapsed = 0;
      self.shareVideoError = "";
      self.shareVideoNotice = "";
      self.setBgmDucked(false);
      var videoPath = response && (response.videoPath || response.tempFilePath);
      if (videoPath) {
        self.shareVideoResultPath = videoPath;
        if (self.tt.shareAppMessage && config.SHARE_VIDEO_TEMPLATE_ID) {
          self.shareRecordedVideo(videoPath);
        } else {
          self.saveRecordedVideo(videoPath);
        }
      } else {
        self.shareVideoError = "视频生成失败";
        self.render();
      }
    });
  }

  if (recorder.onError) {
    recorder.onError(function onRecorderError(error) {
      if (self.shareVideoRunId !== runId) return;
      self.clearShareVideoTimers();
      self.shareVideoState = "preview";
      self.shareVideoError = error && error.errMsg ? error.errMsg : "录屏失败";
      self.setBgmDucked(false);
      self.render();
    });
  }

  try {
    recorder.start({
      duration: Math.ceil((this.shareVideoDurationMs + 1200) / 1000)
    });
  } catch (error) {
    this.shareVideoState = "preview";
    this.shareVideoError = error && error.errMsg ? error.errMsg : "录屏启动失败，请用真机测试";
    this.setBgmDucked(false);
    this.render();
    return;
  }

  this.shareVideoFrameTimer = setInterval(function tickShareVideo() {
    if (self.shareVideoRunId !== runId || self.shareVideoState !== "recording") return;
    self.render();
  }, 80);

  this.shareVideoStopTimer = setTimeout(function stopShareVideo() {
    if (self.shareVideoRunId !== runId || self.shareVideoState !== "recording") return;
    try {
      recorder.stop();
    } catch (error) {
      self.clearShareVideoTimers();
      self.shareVideoState = "preview";
      self.shareVideoError = "录屏停止失败";
      self.setBgmDucked(false);
      self.render();
    }
  }, this.shareVideoDurationMs);
};

PersoMinigame.prototype.clearShareVideoTimers = function clearShareVideoTimers() {
  if (this.shareVideoFrameTimer !== null) {
    clearInterval(this.shareVideoFrameTimer);
    this.shareVideoFrameTimer = null;
  }
  if (this.shareVideoStopTimer !== null) {
    clearTimeout(this.shareVideoStopTimer);
    this.shareVideoStopTimer = null;
  }
};

PersoMinigame.prototype.playShareVideoPreview = function playShareVideoPreview() {
  var self = this;
  if (this.shareVideoState !== "preview" || !this.shareVideoMessages.length) return;
  this.clearShareVideoTimers();
  this.stopVoiceAudio();
  this.shareVideoPreviewPlaying = true;
  this.shareVideoPreviewStartedAt = Date.now() - this.shareVideoPreviewElapsed;
  this.shareVideoFrameTimer = setInterval(function tickShareVideoPreview() {
    if (self.shareVideoState !== "preview" || !self.shareVideoPreviewPlaying) return;
    self.shareVideoPreviewElapsed = Date.now() - self.shareVideoPreviewStartedAt;
    if (self.shareVideoPreviewElapsed >= self.shareVideoDurationMs) {
      self.shareVideoPreviewElapsed = Math.max(0, self.shareVideoDurationMs - 1);
      self.shareVideoPreviewPlaying = false;
      self.clearShareVideoTimers();
    }
    self.render();
  }, 80);
  this.render();
};

PersoMinigame.prototype.pauseShareVideoPreview = function pauseShareVideoPreview() {
  if (this.shareVideoState !== "preview") return;
  if (this.shareVideoPreviewPlaying) {
    this.shareVideoPreviewElapsed = Date.now() - this.shareVideoPreviewStartedAt;
  }
  this.shareVideoPreviewElapsed = clamp(this.shareVideoPreviewElapsed, 0, Math.max(0, this.shareVideoDurationMs - 1));
  this.shareVideoPreviewPlaying = false;
  this.clearShareVideoTimers();
  this.stopVoiceAudio();
  this.render();
};

PersoMinigame.prototype.toggleShareVideoPreviewPlayback = function toggleShareVideoPreviewPlayback() {
  if (this.shareVideoPreviewPlaying) this.pauseShareVideoPreview();
  else this.playShareVideoPreview();
};

PersoMinigame.prototype.clearShareVideoResult = function clearShareVideoResult() {
  if (this.shareVideoResultPath && /^blob:/.test(this.shareVideoResultPath) && typeof URL !== "undefined") {
    try {
      URL.revokeObjectURL(this.shareVideoResultPath);
    } catch (error) {}
  }
  this.shareVideoResultPath = "";
  this.shareVideoResultBlob = null;
  this.shareVideoResultMimeType = "";
  this.shareVideoShareInProgress = false;
};

PersoMinigame.prototype.getShareVideoFileName = function getShareVideoFileName(mimeType) {
  var topic = this.currentTopic().slice(0, 18).replace(/[\\/:*?"<>|\s]+/g, "-");
  var type = String(mimeType || this.shareVideoResultMimeType || "").toLowerCase();
  var ext = type.indexOf("mp4") >= 0 ? "mp4" : "webm";
  return "perso-video" + (topic ? "-" + topic : "") + "." + ext;
};

PersoMinigame.prototype.downloadBlobUrl = function downloadBlobUrl(url, fileName) {
  if (typeof document === "undefined" || !url) return false;
  var link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

PersoMinigame.prototype.getShareVideoRecorderOptions = function getShareVideoRecorderOptions() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return {};
  var candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.640028",
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];
  for (var i = 0; i < candidates.length; i += 1) {
    try {
      if (MediaRecorder.isTypeSupported(candidates[i])) return { mimeType: candidates[i] };
    } catch (error) {}
  }
  return {};
};

PersoMinigame.prototype.shareBrowserRecordedVideo = function shareBrowserRecordedVideo(videoPath) {
  var blob = this.shareVideoResultBlob;
  var fileName = this.getShareVideoFileName(blob && blob.type);
  var self = this;

  if (this.shareVideoShareInProgress) {
    this.shareVideoError = "";
    this.shareVideoNotice = "分享面板已打开";
    this.render();
    return true;
  }

  if (blob && typeof navigator !== "undefined" && navigator.share && typeof File !== "undefined") {
    try {
      var file = new File([blob], fileName, { type: blob.type || "video/webm" });
      var payload = {
        files: [file],
        title: "Perso 人格圆桌",
        text: "来听人格圆桌怎么聊"
      };
      if (!navigator.canShare || navigator.canShare(payload)) {
        this.shareVideoShareInProgress = true;
        this.shareVideoError = "";
        this.shareVideoNotice = "正在打开分享面板";
        this.render();
        navigator.share(payload).then(function onShareSuccess() {
          self.shareVideoShareInProgress = false;
          self.shareVideoError = "";
          self.shareVideoNotice = "视频已分享";
          self.exitToSelection();
        }).catch(function onShareFail(error) {
          self.shareVideoShareInProgress = false;
          if (error && error.name === "AbortError") {
            self.shareVideoError = "";
            self.shareVideoNotice = "已取消分享";
          } else if (error && /already in progress/i.test(String(error.message || error.errMsg || error))) {
            self.shareVideoError = "";
            self.shareVideoNotice = "分享面板已打开";
          } else {
            self.shareVideoError = self.formatShareError("分享视频失败", error);
            self.shareVideoNotice = "";
          }
          self.render();
        });
        return true;
      }
    } catch (error) {
      this.shareVideoShareInProgress = false;
      if (/already in progress/i.test(String(error && (error.message || error.errMsg) || error))) {
        this.shareVideoError = "";
        this.shareVideoNotice = "分享面板已打开";
        this.render();
        return true;
      }
    }
  }

  if (this.downloadBlobUrl(videoPath, fileName)) {
    this.shareVideoError = "";
    this.shareVideoNotice = "已尝试保存；若无弹窗则当前容器不支持";
    this.render();
    return true;
  }

  this.shareVideoError = "当前环境不支持直接保存视频";
  this.shareVideoNotice = "";
  this.render();
  return false;
};

PersoMinigame.prototype.recordShareVideoWithMediaRecorder = function recordShareVideoWithMediaRecorder() {
  var recordCanvas;
  var recordCtx;
  var stream;
  var recorder;
  var chunks = [];
  var options = {};
  var self = this;
  var runId;

  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    this.shareVideoError = "当前环境不支持生成视频";
    this.shareVideoNotice = "";
    this.render();
    return;
  }

  this.pauseShareVideoPreview();
  this.stopVoiceAudio();
  this.setBgmDucked(true);
  this.shareVideoState = "recording";
  this.shareVideoStartedAt = Date.now();
  this.shareVideoRunId += 1;
  this.shareVideoError = "";
  this.shareVideoNotice = "正在生成视频";
  this.shareVideoVoiceKey = "";
  runId = this.shareVideoRunId;

  try {
    recordCanvas = document.createElement("canvas");
    recordCanvas.width = this.width * this.pixelRatio;
    recordCanvas.height = this.height * this.pixelRatio;
    recordCtx = recordCanvas.getContext("2d");
    recordCtx.scale(this.pixelRatio, this.pixelRatio);
    recordCtx.imageSmoothingEnabled = false;
    this.drawShareVideoFrameToContext(recordCtx, 0);
    if (!recordCanvas.captureStream) throw new Error("captureStream unavailable");
    stream = recordCanvas.captureStream(30);
    options = this.getShareVideoRecorderOptions();
    recorder = new MediaRecorder(stream, options);
  } catch (error) {
    this.shareVideoState = "preview";
    this.shareVideoError = this.formatShareError("视频生成失败", error);
    this.shareVideoNotice = "";
    this.setBgmDucked(false);
    this.render();
    return;
  }

  this.shareVideoRecorder = recorder;
  recorder.ondataavailable = function onDataAvailable(event) {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };
  recorder.onerror = function onMediaRecorderError(error) {
    if (self.shareVideoRunId !== runId) return;
    self.clearShareVideoTimers();
    self.shareVideoState = "preview";
    self.shareVideoPreviewPlaying = false;
    self.shareVideoError = self.formatShareError("视频生成失败", error);
    self.shareVideoNotice = "";
    self.setBgmDucked(false);
    self.render();
  };
  recorder.onstop = function onMediaRecorderStop() {
    if (self.shareVideoRunId !== runId) return;
    self.clearShareVideoTimers();
    self.shareVideoState = "preview";
    self.shareVideoPreviewPlaying = false;
    self.shareVideoPreviewElapsed = 0;
    self.setBgmDucked(false);

    if (!chunks.length) {
      self.shareVideoError = "视频生成失败";
      self.shareVideoNotice = "";
      self.render();
      return;
    }

    var generatedType = recorder.mimeType || options.mimeType || "video/webm";
    var blob = new Blob(chunks, { type: generatedType });
    var url = URL.createObjectURL(blob);
    self.clearShareVideoResult();
    self.shareVideoResultPath = url;
    self.shareVideoResultBlob = blob;
    self.shareVideoResultMimeType = blob.type || generatedType;
    self.shareVideoError = "";
    self.shareVideoNotice = /mp4/i.test(self.shareVideoResultMimeType)
      ? "视频已生成，再点保存/分享"
      : "已生成 WebM，手机可能无法保存";
    self.render();
  };

  try {
    recorder.start();
  } catch (error) {
    this.shareVideoState = "preview";
    this.shareVideoError = this.formatShareError("视频生成失败", error);
    this.shareVideoNotice = "";
    this.setBgmDucked(false);
    this.render();
    return;
  }

  this.render();
  this.shareVideoFrameTimer = setInterval(function tickShareVideoRecording() {
    if (self.shareVideoRunId !== runId || self.shareVideoState !== "recording") return;
    self.drawShareVideoFrameToContext(recordCtx, Date.now() - self.shareVideoStartedAt);
    self.render();
  }, 80);
  this.shareVideoStopTimer = setTimeout(function stopShareVideoRecording() {
    if (self.shareVideoRunId !== runId || self.shareVideoState !== "recording") return;
    try {
      recorder.stop();
    } catch (error) {
      self.clearShareVideoTimers();
      self.shareVideoState = "preview";
      self.shareVideoError = self.formatShareError("视频生成失败", error);
      self.shareVideoNotice = "";
      self.setBgmDucked(false);
      self.render();
    }
  }, this.shareVideoDurationMs);
};

PersoMinigame.prototype.shareRecordedVideo = function shareRecordedVideo(videoPath) {
  if (!this.tt.shareAppMessage) {
    this.shareVideoError = "视频已生成，但当前环境不支持分享";
    this.render();
    return;
  }
  if (!config.SHARE_VIDEO_TEMPLATE_ID) {
    this.shareVideoError = "视频已生成；先在 js/config.js 配置 SHARE_VIDEO_TEMPLATE_ID";
    this.render();
    return;
  }

  var self = this;
  try {
    this.tt.shareAppMessage({
      title: "Perso 人格圆桌：" + this.currentTopic().slice(0, 28),
      channel: "video",
      templateId: config.SHARE_VIDEO_TEMPLATE_ID,
      videoPath: videoPath,
      extra: {
        videoPath: videoPath,
        videoTopics: ["Perso", "MBTI", "人格圆桌"]
      },
      success: function success() {
        self.error = "";
        self.shareVideoError = "";
        self.shareVideoNotice = "分享视频已发送";
        self.shareOverlayVisible = false;
        self.exitToSelection();
      },
      fail: function fail(error) {
        self.shareOverlayVisible = true;
        self.shareVideoError = self.formatShareError("视频分享失败", error);
        self.render();
      }
    });
  } catch (error) {
    this.shareOverlayVisible = true;
    this.shareVideoError = this.formatShareError("视频分享失败", error);
    this.render();
  }
};

PersoMinigame.prototype.saveRecordedVideo = function saveRecordedVideo(videoPath) {
  if (!videoPath) {
    this.shareVideoError = "没有可保存的视频";
    this.render();
    return;
  }
  if (!this.tt.saveVideoToPhotosAlbum) {
    this.shareBrowserRecordedVideo(videoPath);
    return;
  }

  var self = this;
  try {
    this.tt.saveVideoToPhotosAlbum({
      filePath: videoPath,
      success: function success() {
        self.error = "";
        self.shareVideoError = "";
        self.shareVideoNotice = "视频已保存";
        self.exitToSelection();
      },
      fail: function fail(error) {
        self.shareVideoError = self.formatShareError("保存视频失败", error);
        self.render();
      }
    });
  } catch (error) {
    this.shareVideoError = this.formatShareError("保存视频失败", error);
    this.render();
  }
};

PersoMinigame.prototype.closeShareVideoPreview = function closeShareVideoPreview() {
  this.pauseShareVideoPreview();
  this.clearShareVideoTimers();
  this.stopVoiceAudio();
  this.shareVideoState = "idle";
  this.clearShareVideoResult();
  this.shareVideoNotice = "";
  this.shareVideoError = "";
  this.render();
};

PersoMinigame.prototype.handleShareVideoPreviewTap = function handleShareVideoPreviewTap(x, y) {
  if (this.hit(this.rects.shareVideoPlay, x, y)) {
    this.toggleShareVideoPreviewPlayback();
    return true;
  }
  if (this.hit(this.rects.shareVideoConfirm, x, y)) {
    if (this.shareVideoShareInProgress) {
      this.shareVideoError = "";
      this.shareVideoNotice = "分享面板已打开";
      this.render();
    } else if (this.shareVideoResultPath) this.saveRecordedVideo(this.shareVideoResultPath);
    else this.startShareVideoExport();
    return true;
  }
  if (this.hit(this.rects.shareVideoToSelection, x, y)) {
    this.exitToSelection();
    return true;
  }
  if (this.hit(this.rects.shareVideoBack, x, y)) {
    this.closeShareVideoPreview();
    return true;
  }
  return true;
};

PersoMinigame.prototype.handleShareVideoResultTap = function handleShareVideoResultTap(x, y) {
  if (this.hit(this.rects.shareVideoConfirm, x, y)) {
    this.shareRecordedVideo(this.shareVideoResultPath);
    return true;
  }
  if (this.hit(this.rects.shareVideoSave, x, y)) {
    this.saveRecordedVideo(this.shareVideoResultPath);
    return true;
  }
  if (this.hit(this.rects.shareVideoToSelection, x, y)) {
    this.exitToSelection();
    return true;
  }
  if (this.hit(this.rects.shareVideoBack, x, y)) {
    this.shareVideoState = "idle";
    this.clearShareVideoResult();
    this.render();
    return true;
  }
  return true;
};

PersoMinigame.prototype.togglePersona = function togglePersona(id) {
  var index = this.selected.indexOf(id);
  if (index >= 0) {
    this.selected.splice(index, 1);
    this.error = "";
  } else if (this.selected.length < 4) {
    this.selected.push(id);
    this.error = "";
  } else {
    this.error = "最多选择 4 个人格";
  }

  this.render();
};

PersoMinigame.prototype.focusCustomTopic = function focusCustomTopic() {
  var self = this;
  this.editingCustomTopic = true;
  this.editingNoteText = false;
  this.editingParticipantText = false;
  if (this.shouldUseCanvasKeyboard()) {
    this.error = "";
    this.render();
    return;
  }
  if (!this.tt.showKeyboard) {
    this.error = "当前环境不支持键盘输入。";
    this.render();
    return;
  }

  this.tt.showKeyboard({
    defaultValue: this.customTopic,
    maxLength: 300,
    multiple: true,
    confirmType: "done",
    confirmHold: false,
    showConfirmBar: true,
    success: function success() {
      self.error = "";
      self.render();
    },
    fail: function fail(error) {
      self.editingCustomTopic = false;
      self.error = error && error.errMsg ? error.errMsg : "键盘打开失败，请再点一次自由输入。";
      self.render();
    }
  });
  this.render();
};

PersoMinigame.prototype.focusNoteInput = function focusNoteInput() {
  var self = this;
  this.editingNoteText = true;
  this.editingCustomTopic = false;
  this.editingParticipantText = false;
  if (this.shouldUseCanvasKeyboard()) {
    this.error = "";
    this.render();
    return;
  }
  if (!this.tt.showKeyboard) {
    this.error = "当前环境不支持键盘输入。";
    this.render();
    return;
  }

  this.tt.showKeyboard({
    defaultValue: this.noteDraftText,
    maxLength: 80,
    multiple: true,
    confirmType: "done",
    confirmHold: false,
    showConfirmBar: true,
    success: function success() {
      self.error = "";
      self.render();
    },
    fail: function fail(error) {
      self.editingNoteText = false;
      self.error = error && error.errMsg ? error.errMsg : "键盘打开失败，请再点一次纸条输入。";
      self.render();
    }
  });
  this.render();
};

PersoMinigame.prototype.prepareParticipantInterruption = function prepareParticipantInterruption() {
  if (this.mode !== "participant" || this.page !== "roundtable" || this.status === "done") return;

  var visibleEnd = Math.min(this.liveMessageIndex + 1, this.tableMessages.length);
  if (visibleEnd <= 0 && this.tableMessages.length) visibleEnd = 1;
  var hadFuture = this.tableMessages.length > visibleEnd;

  if (hadFuture) {
    this.tableMessages = this.tableMessages.slice(0, visibleEnd);
    this.messages = this.tableMessages;
    this.activeMessageIndex = Math.max(0, Math.min(this.activeMessageIndex, this.tableMessages.length - 1));
    this.liveMessageIndex = Math.max(0, Math.min(this.liveMessageIndex, this.tableMessages.length - 1));
  }

  this.participantInputPending = true;
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.generationRequestId += 1;

  if (this.isLiveMessageReadyToAdvance()) {
    this.status = "waiting";
    this.stopPlaybackLoop();
    this.stopVoiceAudio();
    this.syncDisplayToLive();
  } else {
    this.status = "generating";
    this.playbackPaused = false;
    this.startPlaybackLoop();
  }
};

PersoMinigame.prototype.focusParticipantInput = function focusParticipantInput() {
  var self = this;
  this.prepareParticipantInterruption();
  this.editingParticipantText = true;
  this.editingNoteText = false;
  this.editingCustomTopic = false;
  if (this.shouldUseCanvasKeyboard()) {
    this.error = "";
    this.render();
    return;
  }
  if (!this.tt.showKeyboard) {
    this.error = "当前环境不支持键盘输入。";
    this.render();
    return;
  }

  this.tt.showKeyboard({
    defaultValue: this.participantDraftText,
    maxLength: PARTICIPANT_INPUT_MAX_CHARS,
    multiple: true,
    confirmType: "done",
    confirmHold: false,
    showConfirmBar: true,
    success: function success() {
      self.error = "";
      self.render();
    },
    fail: function fail(error) {
      self.editingParticipantText = false;
      self.error = error && error.errMsg ? error.errMsg : "键盘打开失败，请再点一次输入框。";
      self.render();
    }
  });
  this.render();
};

PersoMinigame.prototype.navigateToSidebar = function navigateToSidebar() {
  var self = this;

  if (!this.tt.navigateToScene) {
    this.error = "当前环境不支持侧边栏能力。";
    this.render();
    return;
  }

  this.tt.navigateToScene({
    scene: "sidebar",
    success: function success() {
      self.markSidebarPromptSeen();
      self.error = "从侧边栏返回即可领取圆桌灵感。";
      self.render();
    },
    fail: function fail(error) {
      self.error = error && error.errMsg ? error.errMsg : "侧边栏引导失败";
      self.render();
    }
  });
};

PersoMinigame.prototype.currentTopic = function currentTopic() {
  return safeText(this.customTopic, this.selectedTopic);
};

PersoMinigame.prototype.getTtsAudioUrl = function getTtsAudioUrl(message) {
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  if (!apiBaseUrl || !message) return "";
  if (this.tt && this.tt.isBrowserAdapter) {
    return apiBaseUrl + "/api/tts-mp3/" + encodeURIComponent(message.persona) + "/speech.mp3?text=" + encodeURIComponent(this.getTtsSpeechText(message));
  }
  return apiBaseUrl + "/api/tts?persona=" + encodeURIComponent(message.persona) + "&text=" + encodeURIComponent(this.getTtsSpeechText(message));
};

PersoMinigame.prototype.prepareRoundtable = function prepareRoundtable(messages) {
  var self = this;
  var first = messages && messages[0];
  var key = this.getTtsMessageKey(first, 0);
  var audioUrl = this.getTtsAudioUrl(first);
  var audio = first && this.canUseTtsForMessage(first);

  if (!audio || !key || !audioUrl || this.ttsAudioCache[key] || !this.tt.downloadFile || this.tt.isBrowserAdapter) {
    this.openRoundtable(messages);
    return;
  }

  var done = false;
  this.voiceMessageKey = key;
  this.ttsPendingKey = key;
  this.ttsPendingStartedAt = Date.now();
  this.ttsError = "";
  this.render();

  this.tt.downloadFile({
    url: audioUrl,
    success: function success(response) {
      if (done) return;
      done = true;
      var statusCode = response.statusCode || 200;
      var tempFilePath = response.tempFilePath || response.filePath;
      if (statusCode < 400 && tempFilePath) {
        self.ttsAudioCache[key] = tempFilePath;
      } else {
        self.ttsFailedKeys[key] = true;
      }
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      self.openRoundtable(messages);
    },
    fail: function fail() {
      if (done) return;
      done = true;
      self.ttsFailedKeys[key] = true;
      self.ttsPendingKey = "";
      self.ttsPendingStartedAt = 0;
      self.openRoundtable(messages);
    }
  });
};

PersoMinigame.prototype.prefetchTtsForMessage = function prefetchTtsForMessage(message, messageIndex) {
  var self = this;
  var key = this.getTtsMessageKey(message, messageIndex);
  var audioUrl = this.getTtsAudioUrl(message);
  if (!key || !audioUrl || this.ttsAudioCache[key] || this.ttsFailedKeys[key] || this.ttsPrefetchingKeys[key]) return;
  if (!this.canUseTtsForMessage(message) || !this.tt.downloadFile || this.tt.isBrowserAdapter) return;

  this.ttsPrefetchingKeys[key] = true;
  this.tt.downloadFile({
    url: audioUrl,
    success: function success(response) {
      delete self.ttsPrefetchingKeys[key];
      var statusCode = response.statusCode || 200;
      var tempFilePath = response.tempFilePath || response.filePath;
      if (statusCode < 400 && tempFilePath) self.ttsAudioCache[key] = tempFilePath;
      else self.ttsFailedKeys[key] = true;
    },
    fail: function fail() {
      delete self.ttsPrefetchingKeys[key];
      self.ttsFailedKeys[key] = true;
    }
  });
};

PersoMinigame.prototype.prefetchUpcoming = function prefetchUpcoming() {
  if (this.noteOverlayTarget || this.pendingPrivateNote) return;
  var remaining = this.tableMessages.length - this.liveMessageIndex - 1;
  if (this.mode !== "participant" && remaining <= 1) this.requestContinuation(false);
  this.prefetchTtsForMessage(this.tableMessages[this.liveMessageIndex + 1], this.liveMessageIndex + 1);
};

PersoMinigame.prototype.handleStart = function handleStart() {
  var topic = this.currentTopic();
  if (this.selected.length < 2) {
    this.error = "至少选择 2 个人格";
    this.render();
    return;
  }
  if (!topic.trim()) {
    this.error = "先给圆桌一个话题。";
    this.render();
    return;
  }
  if (isSensitiveTopic(topic)) {
    this.error = "这个话题暂时不适合圆桌生成。换一个更日常的问题试试。";
    this.render();
    return;
  }

  this.generateOpening();
};

PersoMinigame.prototype.generateOpening = function generateOpening() {
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  var self = this;

  if (this.status === "loading") return;
  if (config.FORCE_MOCK_GENERATION || (!apiBaseUrl && config.ENABLE_MOCK_GENERATION)) {
    this.showLoading();
    var selfForMock = this;
    setTimeout(function finishMock() {
      selfForMock.prepareRoundtable(selfForMock.createMockMessages());
    }, 900);
    return;
  }
  if (!apiBaseUrl) {
    this.error = "先在 js/config.js 配置 API_BASE_URL。";
    this.render();
    return;
  }

  this.status = "loading";
  this.showLoading();
  this.error = "";
  this.messages = [];
  this.render();

  this.tt.request({
    url: apiBaseUrl + "/api/chat",
    method: "POST",
    header: { "Content-Type": "application/json" },
    data: {
      topic: this.currentTopic().slice(0, 120),
      mode: this.mode,
      phase: "opening",
      opening: this.mode === "participant",
      atmosphere: this.atmosphere,
      personas: this.selected
    },
    success: function success(response) {
      var statusCode = response.statusCode || 200;
      var responseText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data || {});

      if (statusCode >= 400) {
        self.status = "idle";
        self.error = self.readError(responseText, statusCode);
        self.render();
        return;
      }

      var messages = parseRoundtableMessages(responseText);
      if (messages.length) {
        self.prepareRoundtable(messages);
      } else {
        self.page = "selection";
        self.status = "idle";
        self.error = "没有解析到圆桌消息，请检查后端响应。";
        self.stopLoadingLoop();
        self.render();
      }
    },
	    fail: function fail(error) {
	      if (config.ENABLE_MOCK_GENERATION) {
	        self.error = "";
	        self.prepareRoundtable(self.createMockMessages());
	        return;
	      }
	      self.page = "selection";
	      self.status = "idle";
	      self.stopLoadingLoop();
	      self.error = formatNetworkFailMessage(error);
	      self.render();
	    }
	  });
	};

PersoMinigame.prototype.createMockMessages = function createMockMessages() {
  var topic = this.currentTopic();
  var personas = this.selected.length ? this.selected : config.DEFAULT_PERSONAS;
  var lines = [
    "我先确认一下题目边界。\"" + topic + "\"如果只是情绪表达，答案会很散；如果是要决策，就得先定标准。",
    "但这个话题好玩的地方就是每个人标准不一样。有人要效率，有人要感觉，圆桌才会吵起来。",
    "我会先看它能不能落到现实行动上。讨论可以很热闹，但最后最好能留下一个可执行的判断。",
    "说白了，别把它聊成论文。先开一局，谁的判断最离谱，现场就能看出来。",
    "我有点在意你们都默认它必须马上有答案。有些问题先允许它悬着，反而能看到真正卡住的地方。",
    "如果把它放到一个普通晚上，答案可能没那么宏大。谁愿意先做一个小动作，谁就已经赢一半了。",
    "我不同意只看行动。这个话题背后一定有关系里的期待，不说出来，行动只是在绕开重点。",
    "那就拆成两件事：现在能做什么，以及做完以后怎么判断有没有变好。别让讨论停在感受里。",
    "你看，这就是分歧。有人要结论，有人要过程，有人要情绪被看见。这个圆桌才开始有意思。",
    "我建议别急着选边。先问一句：如果三个月后回头看，哪种选择会让自己少一点后悔？",
    "可以，但别把三个月后想得太完美。真正能执行的方案，通常今天晚上就能做第一步。",
    "所以暂时的结论是：别追求一个漂亮答案，先找一个能让你继续往前走的小判断。"
  ];
  var labels = ["追问", "反驳", "落地", "打断", "补充", "转译"];

  return lines.map(function mapLine(content, index) {
    return {
      persona: personas[index % personas.length],
      content: content,
      label: labels[index % labels.length],
      turn: index + 1
    };
  });
};

PersoMinigame.prototype.showLoading = function showLoading() {
  var self = this;
  this.page = "loading";
  this.status = "loading";
  this.loadingStartedAt = Date.now();
  this.loadingProgress = 0;
  this.loadingDotFrame = 0;
  this.setBgmDucked(false);
  this.startBgmForCurrentTopic();
  this.stopLoadingLoop();
  this.loadingTimer = setInterval(function tickLoading() {
    var elapsed = Date.now() - self.loadingStartedAt;
    if (elapsed < 3000) self.loadingProgress = Math.min(70, self.loadingProgress + 0.7);
    else self.loadingProgress = Math.min(90, self.loadingProgress + 0.08);
    self.loadingDotFrame = Math.floor(elapsed / 400) % 4;
    self.render();
  }, 50);
};

PersoMinigame.prototype.stopLoadingLoop = function stopLoadingLoop() {
  if (this.loadingTimer !== null) {
    clearInterval(this.loadingTimer);
    this.loadingTimer = null;
  }
};

PersoMinigame.prototype.openRoundtable = function openRoundtable(messages) {
  this.stopLoadingLoop();
  this.startBgmForCurrentTopic();
  this.page = "roundtable";
  this.status = "generating";
  this.tableMessages = messages;
  this.messages = messages;
  this.activeMessageIndex = 0;
  this.visibleChars = 0;
  this.messageHoldTicks = 0;
  this.liveMessageIndex = 0;
  this.liveVisibleChars = 0;
  this.liveHoldTicks = 0;
  this.playbackPaused = false;
  this.progressDragging = false;
  this.progressDragRatio = 1;
  this.isAtLiveEdge = true;
  this.lastVoiceKey = "";
  this.lastVoiceTickAt = 0;
  this.voiceMessageKey = "";
  this.ttsFailedKeys = {};
  this.ttsPendingKey = "";
  this.ttsPendingStartedAt = 0;
  this.ttsPlaybackKey = "";
  this.ttsPlaybackMessageIndex = -1;
  this.ttsPlaybackStartedAt = 0;
  this.ttsPlaybackDuration = 0;
  this.ttsPlaybackReady = false;
  this.ttsPlaybackEnded = false;
  this.ttsError = "";
  this.noteOverlayTarget = null;
  this.pendingPrivateNote = null;
  this.resumeContinuationAfterNoteCancel = false;
  this.participantDraftText = "";
  this.editingParticipantText = false;
  this.participantInputPending = false;
  this.thinkingVisible = false;
  this.generationRequestId += 1;
  this.startPlaybackLoop();
  this.render();
  if (this.mode !== "participant") this.requestContinuation(false);
};

PersoMinigame.prototype.requestContinuation = function requestContinuation(showThinking, forceBeyondLimit, forcedFirstPersona) {
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  var self = this;
  if (config.FORCE_MOCK_GENERATION) {
    this.appendMockContinuation();
    return;
  }
  if (this.mode === "participant" || !apiBaseUrl || this.isFetchingContinuation || (!forceBeyondLimit && this.tableMessages.length >= 12)) return;

  this.isFetchingContinuation = true;
  if (showThinking) this.thinkingVisible = true;
  this.thinkingPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : "";
  var requestId = ++this.generationRequestId;
  this.tt.request({
    url: apiBaseUrl + "/api/chat",
    method: "POST",
    header: { "Content-Type": "application/json" },
    data: {
      topic: this.currentTopic().slice(0, 120),
      mode: this.mode === "participant" ? "participant" : "fun",
      phase: "continuation",
      atmosphere: this.atmosphere,
      nextPersona: isPersona(forcedFirstPersona) ? forcedFirstPersona : "",
      personas: this.selected,
      messages: this.tableMessages
    },
    success: function success(response) {
      if (requestId !== self.generationRequestId) return;
      var statusCode = response.statusCode || 200;
      var responseText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data || {});

      if (statusCode >= 400) {
        self.isFetchingContinuation = false;
        self.thinkingVisible = false;
        self.thinkingPersona = "";
        if (self.liveMessageIndex >= self.tableMessages.length - 1) self.finishRoundtableExperience();
        self.render();
        return;
      }

      var nextMessages = parseRoundtableMessages(responseText);
      if (isPersona(forcedFirstPersona) && nextMessages.length) nextMessages[0].persona = forcedFirstPersona;
      var shouldAdvanceFromCurrent = self.shouldAdvanceFromCompletedLiveMessage();
      var firstNewIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      for (var i = 0; i < nextMessages.length; i += 1) {
        nextMessages[i].turn = self.tableMessages.length + 1;
        self.tableMessages.push(nextMessages[i]);
      }
      self.messages = self.tableMessages;
      if (shouldAdvanceFromCurrent && nextMessages.length) self.advanceLiveMessageTo(firstNewIndex);
      if (forceBeyondLimit && nextMessages.length && self.isLiveMessageReadyToAdvance()) {
        self.liveHoldTicks = self.getBetweenMessageTicks();
        self.messageHoldTicks = self.getBetweenMessageTicks();
      }
      if (self.status === "done" && nextMessages.length) {
        self.status = "generating";
        self.startPlaybackLoop();
      }
      self.render();
    },
    fail: function fail(error) {
      if (requestId !== self.generationRequestId) return;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      if (isInvalidDomainError(error)) self.ttsError = formatNetworkFailMessage(error);
      if (self.liveMessageIndex >= self.tableMessages.length - 1) self.finishRoundtableExperience();
      self.render();
    }
  });
};

PersoMinigame.prototype.appendMockContinuation = function appendMockContinuation() {
  if (this.isFetchingContinuation || this.tableMessages.length >= 12) return;
  var source = this.createMockMessages();
  var added = 0;
  for (var i = this.tableMessages.length; i < source.length && added < 4; i += 1) {
    source[i].turn = this.tableMessages.length + 1;
    this.tableMessages.push(source[i]);
    added += 1;
  }
  this.messages = this.tableMessages;
  if (this.status === "done" && added > 0) {
    this.status = "generating";
    this.startPlaybackLoop();
  }
};

PersoMinigame.prototype.createMockNoteMessage = function createMockNoteMessage(targetPersona, note) {
  var suffix = "好，我换个说法。";
  if (note.indexOf("重点") >= 0) suffix = "那我直接说重点。";
  else if (note.indexOf("真心") >= 0) suffix = "那我说句没那么体面、但更真实的话。";
  else if (note.indexOf("反驳") >= 0) suffix = "我先反驳一下刚才那个判断。";

  return {
    persona: targetPersona,
    content: suffix + "这个问题卡住你的地方，不是没有答案，而是每个答案背后都有一个你不太想付的代价。",
    label: "打断",
    turn: this.tableMessages.length + 1
  };
};

PersoMinigame.prototype.createMockParticipantReply = function createMockParticipantReply(userMessage, forcedFirstPersona) {
  var personas = this.selected.length ? this.selected : config.DEFAULT_PERSONAS;
  var currentPersona = (this.tableMessages[this.liveMessageIndex] || {}).persona;
  var currentIndex = personas.indexOf(currentPersona);
  var firstPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : personas[(currentIndex + 1 + personas.length) % personas.length] || personas[0];
  var firstIndex = personas.indexOf(firstPersona);
  if (firstIndex < 0) firstIndex = currentIndex;
  var secondPersona = personas[(firstIndex + 1 + personas.length) % personas.length] || personas[0];
  var firstText = "我接住你这句。\"" + userMessage.slice(0, 32) + "\" 其实把问题从抽象讨论拉回你自己的判断了。";
  var secondText = "我会再补一刀：现在别急着找标准答案，先看哪个选择会让你明天就能行动。";

  return [
    {
      persona: firstPersona,
      content: firstText,
      label: "回应",
      turn: this.tableMessages.length + 1
    },
    {
      persona: secondPersona,
      content: secondText,
      label: "补充",
      turn: this.tableMessages.length + 2
    }
  ];
};

PersoMinigame.prototype.createMockParticipantAutoContinuation = function createMockParticipantAutoContinuation(forcedFirstPersona) {
  var personas = this.selected.length ? this.selected : config.DEFAULT_PERSONAS;
  var currentPersona = (this.tableMessages[this.liveMessageIndex] || {}).persona;
  var currentIndex = personas.indexOf(currentPersona);
  var firstPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : personas[(currentIndex + 1 + personas.length) % personas.length] || personas[0];
  var firstIndex = personas.indexOf(firstPersona);
  if (firstIndex < 0) firstIndex = currentIndex;
  var lines = [
    "我先接一下上一句。这个点不是要马上得出结论，而是看它到底卡在哪个选择上。",
    "但如果一直停在分析里，就会变成绕圈。至少要说清楚现在最不想承担的那个代价。",
    "我会补一个现实判断：别急着把它讲漂亮，先看明天真的能不能做一步。",
    "也别把话说死。这个话题有趣的地方，就是每个人在意的东西不一样。"
  ];
  var labels = ["回应", "反驳", "落地", "补充"];

  return lines.map(function mapLine(content, index) {
    return {
      persona: personas[(firstIndex + index + personas.length) % personas.length] || personas[0],
      content: content,
      label: labels[index % labels.length],
      turn: this.tableMessages.length + index + 1
    };
  }, this);
};

PersoMinigame.prototype.createAtmosphereMockMessage = function createAtmosphereMockMessage() {
  var personas = this.selected.length ? this.selected : config.DEFAULT_PERSONAS;
  var currentPersona = (this.tableMessages[this.liveMessageIndex] || {}).persona;
  var currentIndex = personas.indexOf(currentPersona);
  var persona = personas[(currentIndex + 1 + personas.length) % personas.length] || personas[0];
  var prefix = "说人话就是";
  var label = "转译";

  if (this.atmosphere === "sharp") {
    prefix = "那我说得难听一点";
    label = "打断";
  } else if (this.atmosphere === "sincere") {
    prefix = "认真讲";
    label = "补充";
  } else if (this.atmosphere === "assertive") {
    prefix = "我直接下判断";
    label = "反驳";
  }

  return {
    persona: persona,
    content: prefix + "，这件事现在最重要的不是继续分析，而是把你真正犹豫的那个代价讲清楚。",
    label: label,
    turn: this.tableMessages.length + 1
  };
};

PersoMinigame.prototype.openPrivateNote = function openPrivateNote(targetPersona) {
  if (!isPersona(targetPersona) || this.selected.indexOf(targetPersona) < 0 || this.status === "done") return;

  var visibleEnd = Math.min(this.liveMessageIndex + 1, this.tableMessages.length);
  this.tableMessages = this.tableMessages.slice(0, visibleEnd);
  this.messages = this.tableMessages;
  this.activeMessageIndex = Math.max(0, Math.min(this.activeMessageIndex, this.tableMessages.length - 1));
  this.liveMessageIndex = Math.max(0, Math.min(this.liveMessageIndex, this.tableMessages.length - 1));
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.thinkingPersona = "";
  this.pendingPrivateNote = null;
  this.resumeContinuationAfterNoteCancel = false;
  this.noteOverlayTarget = targetPersona;
  this.noteDraftText = "";
  this.editingNoteText = false;
  this.generationRequestId += 1;
  this.render();
};

PersoMinigame.prototype.queuePrivateNote = function queuePrivateNote(targetPersona, note) {
  if (!isPersona(targetPersona) || this.selected.indexOf(targetPersona) < 0 || this.status === "done") return;
  this.pendingPrivateNote = {
    targetPersona: targetPersona,
    content: note
  };
  this.noteOverlayTarget = null;
  this.noteDraftText = "";
  this.editingNoteText = false;
  this.resumeContinuationAfterNoteCancel = false;
  this.status = "generating";
  this.playbackPaused = false;
  if (this.isLiveMessageReadyToAdvance() && this.applyPendingPrivateNote()) return;
  this.startPlaybackLoop();
  this.render();
};

PersoMinigame.prototype.cancelPrivateNote = function cancelPrivateNote() {
  this.noteOverlayTarget = null;
  this.pendingPrivateNote = null;
  this.noteDraftText = "";
  this.editingNoteText = false;
  this.thinkingPersona = "";
  if (this.mode === "participant" || this.status === "done") {
    this.render();
    return;
  }

  if (this.isLiveMessageReadyToAdvance()) {
    this.resumeContinuationAfterPrivateNoteCancel();
  } else {
    this.resumeContinuationAfterNoteCancel = true;
    this.startPlaybackLoop();
    this.render();
  }
};

PersoMinigame.prototype.isLiveMessageComplete = function isLiveMessageComplete() {
  var message = this.tableMessages[this.liveMessageIndex];
  return !!message && this.liveVisibleChars >= message.content.length;
};

PersoMinigame.prototype.isCurrentLiveTtsActive = function isCurrentLiveTtsActive() {
  var message = this.tableMessages[this.liveMessageIndex];
  if (!message || !this.ttsPlaybackKey || this.ttsPlaybackEnded) return false;
  if (this.ttsPlaybackKey !== this.getTtsMessageKey(message, this.liveMessageIndex)) return false;
  var audio = this.voiceAudioContext;
  var duration = Number(audio && audio.duration);
  if (!(duration > 0)) duration = Number(this.ttsPlaybackDuration);
  var currentTime = Number(audio && audio.currentTime);
  if (this.voiceAudioMode === "webaudio") {
    currentTime = this.ttsPlaybackStartedAt ? (Date.now() - this.ttsPlaybackStartedAt) / 1000 : 0;
  }
  if (duration > 0 && currentTime >= duration - 0.08) return false;
  return true;
};

PersoMinigame.prototype.isLiveMessageReadyToAdvance = function isLiveMessageReadyToAdvance() {
  return this.isLiveMessageComplete() && !this.isCurrentLiveTtsActive();
};

PersoMinigame.prototype.applyPendingPrivateNote = function applyPendingPrivateNote() {
  var note = this.pendingPrivateNote;
  if (!note) return false;
  this.pendingPrivateNote = null;
  this.applyPrivateNote(note.targetPersona, note.content, true);
  return true;
};

PersoMinigame.prototype.resumeContinuationAfterPrivateNoteCancel = function resumeContinuationAfterPrivateNoteCancel() {
  this.resumeContinuationAfterNoteCancel = false;
  this.status = "generating";
  this.playbackPaused = false;

  if (config.FORCE_MOCK_GENERATION || !normalizeOrigin(config.API_BASE_URL)) {
    this.tableMessages.push(this.createAtmosphereMockMessage());
    this.messages = this.tableMessages;
    this.startPlaybackLoop();
    this.render();
    return;
  }

  this.startPlaybackLoop();
  this.requestContinuation(true);
  this.render();
};

PersoMinigame.prototype.applyPrivateNote = function applyPrivateNote(targetPersona, note, forceThinking) {
  if (!isPersona(targetPersona) || this.selected.indexOf(targetPersona) < 0 || this.status === "done") return;

  var hadBufferedFuture = this.tableMessages.length > this.liveMessageIndex + 1;
  var visibleEnd = Math.min(this.liveMessageIndex + 1, this.tableMessages.length);
  this.tableMessages = this.tableMessages.slice(0, visibleEnd);
  this.messages = this.tableMessages;
  this.activeMessageIndex = Math.min(this.activeMessageIndex, this.tableMessages.length - 1);
  this.liveMessageIndex = Math.min(this.liveMessageIndex, this.tableMessages.length - 1);
  this.liveHoldTicks = this.getBetweenMessageTicks();
  this.messageHoldTicks = this.getBetweenMessageTicks();
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.thinkingPersona = "";
  this.generationRequestId += 1;

  if (config.FORCE_MOCK_GENERATION || !normalizeOrigin(config.API_BASE_URL)) {
    this.tableMessages.push(this.createMockNoteMessage(targetPersona, note));
    this.status = "generating";
    this.playbackPaused = false;
    this.startPlaybackLoop();
    this.render();
    return;
  }

  this.requestPrivateNote(targetPersona, note, forceThinking || hadBufferedFuture);
};

PersoMinigame.prototype.applyAtmosphereChange = function applyAtmosphereChange(nextAtmosphere) {
  if (this.atmosphereSelected && this.atmosphere === nextAtmosphere) return;
  this.atmosphere = nextAtmosphere;
  this.atmosphereSelected = true;
  if (this.mode === "participant" || this.page !== "roundtable" || this.status === "done") {
    this.render();
    return;
  }

  var hadBufferedFuture = this.tableMessages.length > this.liveMessageIndex + 1;
  var forcedFirstPersona = "";
  if (hadBufferedFuture && this.tableMessages[this.liveMessageIndex + 1]) {
    forcedFirstPersona = this.tableMessages[this.liveMessageIndex + 1].persona;
  } else {
    forcedFirstPersona = this.getNextPersonaAfter((this.tableMessages[this.liveMessageIndex] || {}).persona);
  }
  if (hadBufferedFuture) {
    var visibleEnd = Math.min(this.liveMessageIndex + 1, this.tableMessages.length);
    this.tableMessages = this.tableMessages.slice(0, visibleEnd);
    this.messages = this.tableMessages;
    this.activeMessageIndex = Math.max(0, Math.min(this.activeMessageIndex, this.tableMessages.length - 1));
    this.liveMessageIndex = Math.max(0, Math.min(this.liveMessageIndex, this.tableMessages.length - 1));
  }
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.thinkingPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : "";
  this.generationRequestId += 1;
  this.status = "generating";
  this.playbackPaused = false;
  if (this.isLiveMessageReadyToAdvance()) {
    this.liveHoldTicks = this.getBetweenMessageTicks();
    this.messageHoldTicks = this.getBetweenMessageTicks();
  }

  if (config.FORCE_MOCK_GENERATION || !normalizeOrigin(config.API_BASE_URL)) {
    var mockMessage = this.createAtmosphereMockMessage();
    if (isPersona(forcedFirstPersona)) mockMessage.persona = forcedFirstPersona;
    this.tableMessages.push(mockMessage);
    this.messages = this.tableMessages;
    this.startPlaybackLoop();
    this.render();
    return;
  }

  this.startPlaybackLoop();
  this.requestContinuation(hadBufferedFuture, true, forcedFirstPersona);
  this.render();
};

PersoMinigame.prototype.submitParticipantMessage = function submitParticipantMessage() {
  if (this.mode !== "participant" || this.page !== "roundtable" || this.status === "done") return;

  var text = this.participantDraftText.trim();
  if (!text) {
    this.focusParticipantInput();
    return;
  }

  var visibleEnd = Math.min(this.liveMessageIndex + 1, this.tableMessages.length);
  if (visibleEnd <= 0 && this.tableMessages.length) visibleEnd = 1;
  var historyBeforeUser = this.tableMessages.slice(0, visibleEnd);
  var previousPersona = (historyBeforeUser[historyBeforeUser.length - 1] || {}).persona;
  var forcedReplyPersona = this.getNextPersonaAfter(previousPersona);
  var userMessage = {
    persona: "user",
    content: text,
    label: "",
    turn: historyBeforeUser.length + 1
  };
  if (this.tt.hideKeyboard) this.tt.hideKeyboard();
  this.stopVoiceAudio();
  this.participantDraftText = "";
  this.editingParticipantText = false;
  this.participantInputPending = false;
  this.tableMessages = historyBeforeUser.concat([userMessage]);
  this.messages = this.tableMessages;
  this.liveMessageIndex = this.tableMessages.length - 1;
  this.liveVisibleChars = 0;
  this.liveHoldTicks = 0;
  this.activeMessageIndex = this.liveMessageIndex;
  this.visibleChars = this.liveVisibleChars;
  this.messageHoldTicks = 0;
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
  this.isFetchingContinuation = false;
  this.thinkingVisible = false;
  this.pendingPrivateNote = null;
  this.noteOverlayTarget = null;
  this.generationRequestId += 1;
  this.status = "generating";
  this.playbackPaused = false;
  this.startPlaybackLoop();
  this.render();
  this.requestParticipantTurn(historyBeforeUser, text, forcedReplyPersona);
};

PersoMinigame.prototype.requestParticipantTurn = function requestParticipantTurn(historyBeforeUser, userMessage, forcedFirstPersona) {
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  var self = this;
  var requestId = ++this.generationRequestId;

  if (config.FORCE_MOCK_GENERATION || !apiBaseUrl) {
    var mockMessages = this.createMockParticipantReply(userMessage, forcedFirstPersona);
    if (isPersona(forcedFirstPersona) && mockMessages.length) mockMessages[0].persona = forcedFirstPersona;
    for (var m = 0; m < mockMessages.length; m += 1) this.tableMessages.push(mockMessages[m]);
    this.messages = this.tableMessages;
    this.render();
    return;
  }

  this.isFetchingContinuation = true;
  this.thinkingVisible = true;
  this.thinkingPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : "";
  this.render();

  this.tt.request({
    url: apiBaseUrl + "/api/chat",
    method: "POST",
    header: { "Content-Type": "application/json" },
    data: {
      topic: this.currentTopic().slice(0, 120),
      mode: "participant",
      phase: "continuation",
      atmosphere: this.atmosphere,
      personas: this.selected,
      messages: historyBeforeUser,
      userMessage: userMessage
    },
    success: function success(response) {
      if (requestId !== self.generationRequestId) return;
      var statusCode = response.statusCode || 200;
      var responseText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data || {});
      var nextMessages = statusCode >= 400 ? [] : parseRoundtableMessages(responseText);

      if (!nextMessages.length) nextMessages = self.createMockParticipantReply(userMessage, forcedFirstPersona);
      if (isPersona(forcedFirstPersona) && nextMessages.length) nextMessages[0].persona = forcedFirstPersona;
      var shouldAdvanceFromUser = self.shouldAdvanceFromCompletedLiveMessage();
      var firstReplyIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      for (var i = 0; i < nextMessages.length; i += 1) {
        nextMessages[i].turn = self.tableMessages.length + 1;
        self.tableMessages.push(nextMessages[i]);
      }
      self.messages = self.tableMessages;
      if (shouldAdvanceFromUser) self.advanceLiveMessageTo(firstReplyIndex);
      self.status = "generating";
      self.startPlaybackLoop();
      self.render();
    },
    fail: function fail(error) {
      if (requestId !== self.generationRequestId) return;
      var fallbackMessages = self.createMockParticipantReply(userMessage, forcedFirstPersona);
      if (isPersona(forcedFirstPersona) && fallbackMessages.length) fallbackMessages[0].persona = forcedFirstPersona;
      var shouldAdvanceFromUser = self.shouldAdvanceFromCompletedLiveMessage();
      var firstReplyIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      if (isInvalidDomainError(error)) self.ttsError = formatNetworkFailMessage(error);
      for (var i = 0; i < fallbackMessages.length; i += 1) {
        fallbackMessages[i].turn = self.tableMessages.length + 1;
        self.tableMessages.push(fallbackMessages[i]);
      }
      self.messages = self.tableMessages;
      if (shouldAdvanceFromUser) self.advanceLiveMessageTo(firstReplyIndex);
      self.status = "generating";
      self.startPlaybackLoop();
      self.render();
    }
  });
};

PersoMinigame.prototype.requestParticipantAutoContinuation = function requestParticipantAutoContinuation(showThinking) {
  if (this.mode !== "participant" || this.isFetchingContinuation || this.status === "done") return;
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  var self = this;
  var current = this.tableMessages[this.liveMessageIndex] || {};
  var forcedFirstPersona = this.getNextPersonaAfter(current.persona);
  var requestId = ++this.generationRequestId;

  if (config.FORCE_MOCK_GENERATION || !apiBaseUrl) {
    var mockMessages = this.createMockParticipantAutoContinuation(forcedFirstPersona);
    for (var m = 0; m < mockMessages.length; m += 1) this.tableMessages.push(mockMessages[m]);
    this.messages = this.tableMessages;
    this.status = "generating";
    this.startPlaybackLoop();
    this.render();
    return;
  }

  this.isFetchingContinuation = true;
  this.thinkingVisible = !!showThinking;
  this.thinkingPersona = isPersona(forcedFirstPersona) ? forcedFirstPersona : "";
  this.status = "generating";
  this.render();

  this.tt.request({
    url: apiBaseUrl + "/api/chat",
    method: "POST",
    header: { "Content-Type": "application/json" },
    data: {
      topic: this.currentTopic().slice(0, 120),
      mode: "participant",
      phase: "continuation",
      atmosphere: this.atmosphere,
      personas: this.selected,
      messages: this.tableMessages
    },
    success: function success(response) {
      if (requestId !== self.generationRequestId) return;
      var statusCode = response.statusCode || 200;
      var responseText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data || {});
      var nextMessages = statusCode >= 400 ? [] : parseRoundtableMessages(responseText);
      if (!nextMessages.length) nextMessages = self.createMockParticipantAutoContinuation(forcedFirstPersona);
      if (isPersona(forcedFirstPersona) && nextMessages.length) nextMessages[0].persona = forcedFirstPersona;
      var shouldAdvanceFromCurrent = self.shouldAdvanceFromCompletedLiveMessage();
      var firstNewIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      for (var i = 0; i < nextMessages.length; i += 1) {
        nextMessages[i].turn = self.tableMessages.length + 1;
        self.tableMessages.push(nextMessages[i]);
      }
      self.messages = self.tableMessages;
      if (shouldAdvanceFromCurrent) self.advanceLiveMessageTo(firstNewIndex);
      self.status = "generating";
      self.startPlaybackLoop();
      self.render();
    },
    fail: function fail(error) {
      if (requestId !== self.generationRequestId) return;
      var fallbackMessages = self.createMockParticipantAutoContinuation(forcedFirstPersona);
      var shouldAdvanceFromCurrent = self.shouldAdvanceFromCompletedLiveMessage();
      var firstNewIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      if (isInvalidDomainError(error)) self.ttsError = formatNetworkFailMessage(error);
      for (var i = 0; i < fallbackMessages.length; i += 1) {
        fallbackMessages[i].turn = self.tableMessages.length + 1;
        self.tableMessages.push(fallbackMessages[i]);
      }
      self.messages = self.tableMessages;
      if (shouldAdvanceFromCurrent) self.advanceLiveMessageTo(firstNewIndex);
      self.status = "generating";
      self.startPlaybackLoop();
      self.render();
    }
  });
};

PersoMinigame.prototype.shouldAdvanceFromCompletedLiveMessage = function shouldAdvanceFromCompletedLiveMessage() {
  var current = this.tableMessages[this.liveMessageIndex];
  return (
    this.isAtLiveEdge &&
    current &&
    this.liveMessageIndex >= this.tableMessages.length - 1 &&
    this.isLiveMessageReadyToAdvance() &&
    (this.isFetchingContinuation || this.thinkingVisible)
  );
};

PersoMinigame.prototype.advanceLiveMessageTo = function advanceLiveMessageTo(index) {
  if (index < 0 || index >= this.tableMessages.length) return;
  this.stopVoiceAudio();
  this.liveMessageIndex = index;
  this.liveVisibleChars = 0;
  this.liveHoldTicks = 0;
  this.activeMessageIndex = this.liveMessageIndex;
  this.visibleChars = this.liveVisibleChars;
  this.messageHoldTicks = 0;
  this.lastVoiceKey = "";
  this.voiceMessageKey = "";
  this.isAtLiveEdge = true;
  this.progressDragRatio = 1;
};

PersoMinigame.prototype.requestPrivateNote = function requestPrivateNote(targetPersona, note, showThinking) {
  var apiBaseUrl = normalizeOrigin(config.API_BASE_URL);
  var self = this;
  var requestId = ++this.generationRequestId;

  this.isFetchingContinuation = true;
  this.thinkingVisible = !!showThinking;
  this.thinkingPersona = targetPersona;
  this.status = "generating";
  this.playbackPaused = false;
  this.render();

  this.tt.request({
    url: apiBaseUrl + "/api/chat",
    method: "POST",
    header: { "Content-Type": "application/json" },
    data: {
      topic: this.currentTopic().slice(0, 120),
      mode: "fun",
      phase: "note",
      atmosphere: this.atmosphere,
      personas: this.selected,
      messages: this.tableMessages,
      privateNote: {
        targetPersona: targetPersona,
        content: note
      }
    },
    success: function success(response) {
      if (requestId !== self.generationRequestId) return;
      var statusCode = response.statusCode || 200;
      var responseText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data || {});
      var nextMessages = statusCode >= 400 ? [] : parseRoundtableMessages(responseText);
      if (!nextMessages.length) nextMessages = [self.createMockNoteMessage(targetPersona, note)];
      var shouldAdvanceFromCurrent = self.shouldAdvanceFromCompletedLiveMessage();
      var firstNewIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      nextMessages[0].persona = targetPersona;
      nextMessages[0].turn = self.tableMessages.length + 1;
      self.tableMessages.push(nextMessages[0]);
      self.messages = self.tableMessages;
      if (shouldAdvanceFromCurrent) self.advanceLiveMessageTo(firstNewIndex);
      self.startPlaybackLoop();
      self.render();
      self.requestContinuation(false);
    },
    fail: function fail(error) {
      if (requestId !== self.generationRequestId) return;
      var shouldAdvanceFromCurrent = self.shouldAdvanceFromCompletedLiveMessage();
      var firstNewIndex = self.tableMessages.length;
      self.isFetchingContinuation = false;
      self.thinkingVisible = false;
      self.thinkingPersona = "";
      if (isInvalidDomainError(error)) self.ttsError = formatNetworkFailMessage(error);
      self.tableMessages.push(self.createMockNoteMessage(targetPersona, note));
      self.messages = self.tableMessages;
      if (shouldAdvanceFromCurrent) self.advanceLiveMessageTo(firstNewIndex);
      self.startPlaybackLoop();
      self.render();
    }
  });
};

PersoMinigame.prototype.startPlaybackLoop = function startPlaybackLoop() {
  var self = this;
  this.stopPlaybackLoop();
  this.playbackTimer = setInterval(function tickPlayback() {
    if (self.page !== "roundtable" || self.playbackPaused || self.tableMessages.length === 0) return;
    if (self.status === "done") {
      self.tickDoneReplay();
      return;
    }
    var message = self.tableMessages[self.liveMessageIndex];
    if (!message) {
      self.finishRoundtableExperience();
      self.stopPlaybackLoop();
      self.render();
      return;
    }
    self.prefetchUpcoming();

    if (self.liveVisibleChars < message.content.length) {
      var isTtsDriven = self.canUseTtsForMessage(message) && self.updateVisibleCharsFromTts(message, self.liveMessageIndex);
      if (!isTtsDriven) self.liveVisibleChars += 1;
      if (self.isAtLiveEdge) self.syncDisplayToLive();
      self.render();
      return;
    }

    if (self.isCurrentLiveTtsActive()) {
      if (self.isAtLiveEdge) self.syncDisplayToLive();
      self.render();
      return;
    }

    if (self.noteOverlayTarget && !self.pendingPrivateNote) {
      self.liveHoldTicks = self.getBetweenMessageTicks();
      if (self.isAtLiveEdge) self.syncDisplayToLive();
      self.render();
      return;
    }

    if (self.applyPendingPrivateNote()) {
      if (self.isAtLiveEdge) self.syncDisplayToLive();
      return;
    }

    self.liveHoldTicks += 1;
    if (self.isAtLiveEdge) self.syncDisplayToLive();
    if (self.liveHoldTicks < self.getBetweenMessageTicks()) {
      self.render();
      return;
    }

    self.liveHoldTicks = 0;
    if (self.resumeContinuationAfterNoteCancel) {
      self.resumeContinuationAfterPrivateNoteCancel();
      return;
    }
    if (self.liveMessageIndex < self.tableMessages.length - 1) {
      self.stopVoiceAudio();
      self.liveMessageIndex += 1;
      self.liveVisibleChars = 0;
      self.lastVoiceKey = "";
      self.voiceMessageKey = "";
    } else if (self.isFetchingContinuation) {
      self.status = "generating";
    } else if (self.mode === "participant") {
      self.requestParticipantAutoContinuation(true);
      return;
    } else {
      self.finishRoundtableExperience();
      self.stopPlaybackLoop();
      self.stopVoiceAudio();
    }
    if (self.isAtLiveEdge) self.syncDisplayToLive();
    self.render();
  }, TYPEWRITER_INTERVAL_MS);
};

PersoMinigame.prototype.stopPlaybackLoop = function stopPlaybackLoop() {
  if (this.playbackTimer !== null) {
    clearInterval(this.playbackTimer);
    this.playbackTimer = null;
  }
};

PersoMinigame.prototype.getBetweenMessageTicks = function getBetweenMessageTicks() {
  return this.mode === "participant" ? PARTICIPANT_BETWEEN_MESSAGE_TICKS : BETWEEN_MESSAGE_TICKS;
};

PersoMinigame.prototype.syncDisplayToLive = function syncDisplayToLive() {
  this.activeMessageIndex = this.liveMessageIndex;
  this.visibleChars = this.liveVisibleChars;
  this.messageHoldTicks = this.liveHoldTicks;
  this.progressDragRatio = 1;
};

PersoMinigame.prototype.getMessageTextDuration = function getMessageTextDuration(message) {
  return Math.max(1, (message && message.content ? message.content.length : 0)) * TYPEWRITER_INTERVAL_MS;
};

PersoMinigame.prototype.getMessageHoldDuration = function getMessageHoldDuration() {
  return this.getBetweenMessageTicks() * TYPEWRITER_INTERVAL_MS;
};

PersoMinigame.prototype.getMessageDuration = function getMessageDuration(message) {
  return this.getMessageTextDuration(message) + this.getMessageHoldDuration();
};

PersoMinigame.prototype.getTimelineDuration = function getTimelineDuration() {
  var total = 0;
  for (var i = 0; i < this.tableMessages.length; i += 1) {
    total += this.getMessageDuration(this.tableMessages[i]);
  }
  return total;
};

PersoMinigame.prototype.getTimelinePosition = function getTimelinePosition() {
  return this.getTimelinePositionAt(this.activeMessageIndex, this.visibleChars, this.messageHoldTicks);
};

PersoMinigame.prototype.getLiveTimelinePosition = function getLiveTimelinePosition() {
  return this.getTimelinePositionAt(this.liveMessageIndex, this.liveVisibleChars, this.liveHoldTicks);
};

PersoMinigame.prototype.getTimelinePositionAt = function getTimelinePositionAt(messageIndex, visibleChars, holdTicks) {
  var elapsed = 0;
  for (var i = 0; i < messageIndex; i += 1) {
    elapsed += this.getMessageDuration(this.tableMessages[i]);
  }

  var message = this.tableMessages[messageIndex] || { content: "" };
  var typedDuration = Math.min(
    this.getMessageTextDuration(message),
    Math.max(0, visibleChars) * TYPEWRITER_INTERVAL_MS
  );
  var holdDuration = visibleChars >= message.content.length
    ? Math.min(this.getMessageHoldDuration(), Math.max(0, holdTicks) * TYPEWRITER_INTERVAL_MS)
    : 0;

  return elapsed + typedDuration + holdDuration;
};

PersoMinigame.prototype.getPlaybackRatio = function getPlaybackRatio() {
  var livePosition = this.getLiveTimelinePosition();
  if (livePosition <= 0) return 1;
  return clamp(this.getTimelinePosition() / livePosition, 0, 1);
};

PersoMinigame.prototype.getProgressRatio = function getProgressRatio() {
  if (this.progressDragging) return this.progressDragRatio;
  if (this.status === "done") {
    return clamp(this.getTimelinePosition() / Math.max(1, this.getTimelineDuration()), 0, 1);
  }
  return this.isAtLiveEdge ? 1 : this.getPlaybackRatio();
};

PersoMinigame.prototype.seekProgress = function seekProgress(x) {
  var rect = this.rects.progress;
  if (!rect || !this.tableMessages.length) return;

  var ratio = clamp((x - rect.x) / rect.w, 0, 1);
  this.progressDragRatio = ratio;
  this.isAtLiveEdge = ratio >= 0.985;

  var livePosition = this.getLiveTimelinePosition();
  if (livePosition <= 0) {
    this.syncDisplayToLive();
    this.render();
    return;
  }

  var targetMs = this.isAtLiveEdge ? livePosition : ratio * livePosition;
  var elapsed = 0;
  var index = this.liveMessageIndex;
  var localMs = 0;

  for (var i = 0; i <= this.liveMessageIndex; i += 1) {
    var duration = this.getMessageDuration(this.tableMessages[i]);
    if (targetMs <= elapsed + duration || i === this.liveMessageIndex) {
      index = i;
      localMs = Math.max(0, targetMs - elapsed);
      break;
    }
    elapsed += duration;
  }

  var message = this.tableMessages[index] || { content: "" };
  var textDuration = this.getMessageTextDuration(message);
  var textLength = Math.max(1, message.content.length);

  this.activeMessageIndex = index;
  this.lastVoiceKey = "";
  this.voiceMessageKey = "";
  this.stopVoiceAudio();
  if (this.isAtLiveEdge) {
    this.syncDisplayToLive();
  } else if (localMs < textDuration) {
    this.visibleChars = Math.max(1, Math.ceil(localMs / TYPEWRITER_INTERVAL_MS));
    this.visibleChars = Math.min(textLength, this.visibleChars);
    this.messageHoldTicks = 0;
  } else {
    this.visibleChars = message.content.length;
    this.messageHoldTicks = Math.min(
      this.getBetweenMessageTicks(),
      Math.floor(Math.max(0, localMs - textDuration) / TYPEWRITER_INTERVAL_MS)
    );
  }

  if (!this.playbackPaused && this.playbackTimer === null) this.startPlaybackLoop();
  this.render();
};

PersoMinigame.prototype.handleRoundtableTap = function handleRoundtableTap(x, y) {
  var key;

  if (this.settingsOverlayVisible) {
    this.handleSettingsTap(x, y);
    return;
  }

  if (this.shareCardPreviewVisible) {
    if (this.hit(this.rects.shareCardConfirm, x, y)) {
      this.shareCardPreviewVisible = false;
      this.shareCard();
      return;
    }
    if (this.hit(this.rects.shareCardBack, x, y)) {
      this.shareCardPreviewVisible = false;
      this.shareOverlayVisible = true;
      this.shareCardNotice = "";
      this.render();
      return;
    }
    return;
  }

  if (this.shareOverlayVisible) {
    if (this.hit(this.rects.shareCard, x, y)) {
      this.shareOverlayVisible = false;
      this.shareCardPreviewVisible = true;
      this.shareCardNotice = "";
      this.render();
      return;
    }
    if (this.hit(this.rects.shareVideo, x, y)) {
      this.shareOverlayVisible = false;
      this.startShareVideo();
      return;
    }
    if (this.hit(this.rects.shareCancel, x, y)) {
      this.shareOverlayVisible = false;
      this.render();
      return;
    }
    return;
  }

  if (this.shareVideoState === "recording") return;
  if (this.shareVideoState === "preview") {
    this.handleShareVideoPreviewTap(x, y);
    return;
  }
  if (this.shareVideoState === "ready") {
    this.handleShareVideoResultTap(x, y);
    return;
  }

  if (this.sidebarPromptVisible) {
    if (this.hit(this.rects.sidebarPromptAdd, x, y)) {
      this.navigateToSidebar();
      return;
    }
    if (this.hit(this.rects.sidebarPromptLater, x, y)) {
      this.markSidebarPromptSeen();
      this.render();
      return;
    }
    return;
  }

  if (this.noteOverlayTarget) {
    if (this.hit(this.rects.noteCancel, x, y)) {
      this.cancelPrivateNote();
      if (this.tt.hideKeyboard) this.tt.hideKeyboard();
      return;
    }
    if (this.hit(this.rects.noteInput, x, y)) {
      this.focusNoteInput();
      return;
    }
    if (this.hit(this.rects.noteSubmit, x, y)) {
      if (this.noteDraftText.trim()) {
        this.queuePrivateNote(this.noteOverlayTarget, this.noteDraftText.trim());
        if (this.tt.hideKeyboard) this.tt.hideKeyboard();
      }
      return;
    }
    for (key in (this.rects.noteOptions || {})) {
      if (Object.prototype.hasOwnProperty.call(this.rects.noteOptions, key) && this.hit(this.rects.noteOptions[key], x, y)) {
        this.queuePrivateNote(this.noteOverlayTarget, key);
        return;
      }
    }
    return;
  }

  if (this.hit(this.rects.settings, x, y)) {
    this.openSettingsOverlay();
    return;
  }

  if (this.mode === "participant" && this.status !== "done") {
    if (this.hit(this.rects.participantSend, x, y)) {
      this.submitParticipantMessage();
      return;
    }
    if (this.hit(this.rects.participantInput, x, y)) {
      this.focusParticipantInput();
      return;
    }
  }

  for (key in (this.rects.atmospheres || {})) {
    if (Object.prototype.hasOwnProperty.call(this.rects.atmospheres, key) && this.hit(this.rects.atmospheres[key], x, y)) {
      this.applyAtmosphereChange(key);
      return;
    }
  }

  if (this.hit(this.rects.playToggle, x, y)) {
    if (this.status === "waiting") return;
    if (this.playbackPaused) {
      if (this.status === "done" && this.isDoneReplayAtEnd()) {
        this.resetDoneReplayToStart();
      }
      this.playbackPaused = false;
      this.setBgmDucked(false);
      this.resumeVoiceAudio();
      if (this.status === "done" && (this.liveMessageIndex < this.tableMessages.length - 1 || this.isFetchingContinuation)) {
        this.status = "generating";
      }
      this.startPlaybackLoop();
    } else {
      this.playbackPaused = true;
      this.setBgmDucked(true);
      this.stopPlaybackLoop();
      this.pauseVoiceAudio();
    }
    this.render();
    return;
  }

  if (this.status !== "done" && this.hit(this.rects.end, x, y)) {
    var visibleEnd = Math.min(this.activeMessageIndex + 1, this.tableMessages.length);
    if (visibleEnd <= 0 && this.tableMessages.length) visibleEnd = 1;
    this.tableMessages = this.tableMessages.slice(0, visibleEnd);
    this.messages = this.tableMessages;
    this.generationRequestId += 1;
    this.isFetchingContinuation = false;
    this.thinkingVisible = false;
    this.pendingPrivateNote = null;
    this.noteOverlayTarget = null;
    this.finishRoundtableExperience();
    this.stopPlaybackLoop();
    this.stopVoiceAudio();
    this.activeMessageIndex = Math.max(0, Math.min(this.activeMessageIndex, this.tableMessages.length - 1));
    this.liveMessageIndex = this.tableMessages.length - 1;
    this.liveVisibleChars = (this.tableMessages[this.liveMessageIndex] || { content: "" }).content.length;
    this.liveHoldTicks = this.getBetweenMessageTicks();
    this.visibleChars = (this.tableMessages[this.activeMessageIndex] || { content: "" }).content.length;
    this.messageHoldTicks = this.liveHoldTicks;
    this.isAtLiveEdge = true;
    this.progressDragRatio = 1;
    this.render();
    return;
  }

  if (this.mode !== "participant" && this.status !== "done") {
    for (key in (this.rects.notePersonas || {})) {
      if (Object.prototype.hasOwnProperty.call(this.rects.notePersonas, key) && this.hit(this.rects.notePersonas[key], x, y)) {
        this.openPrivateNote(key);
        return;
      }
    }
  }
};

PersoMinigame.prototype.readError = function readError(text, statusCode) {
  try {
    var parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch (error) {}
  return "请求失败（" + statusCode + "）";
};

PersoMinigame.prototype.render = function render() {
  var ctx = this.ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, this.width, this.height);
  this.rects = { personas: {}, topics: [] };

  this.drawBackground(ctx);

  if (this.page === "loading") {
    this.drawLoadingPage(ctx);
    if (this.settingsOverlayVisible) this.drawSettingsOverlay(ctx);
    return;
  }

  if (this.page === "roundtable") {
    if (this.shareVideoState === "recording") {
      this.drawShareVideoSavingPage(ctx);
      return;
    }
    if (this.shareVideoState === "preview") {
      this.drawShareVideoPreviewPage(ctx);
      return;
    }
    if (this.shareVideoState === "ready") {
      this.drawShareVideoResultPage(ctx);
      return;
    }
    this.drawRoundtablePage(ctx);
    if (this.sidebarPromptVisible) this.drawSidebarPrompt(ctx);
    if (this.shareOverlayVisible) this.drawShareOptions(ctx);
    if (this.shareCardPreviewVisible) this.drawShareCardPreview(ctx);
    if (this.settingsOverlayVisible) this.drawSettingsOverlay(ctx);
    return;
  }

  var footerH = this.footerHeight + (this.systemInfo.safeArea ? Math.max(0, this.height - this.systemInfo.safeArea.bottom) : 0);
  var viewportH = this.height - footerH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, this.width, viewportH);
  ctx.clip();
  ctx.translate(0, -this.scrollY);
  this.contentHeight = this.drawSelectionContent(ctx);
  ctx.restore();

  this.maxScrollY = Math.max(0, this.contentHeight - viewportH + 12);
  if (this.scrollY > this.maxScrollY) this.scrollY = this.maxScrollY;

  this.drawBottomBar(ctx, footerH);
  this.drawSelectionScrollbar(ctx, viewportH);
};

PersoMinigame.prototype.drawBackground = function drawBackground(ctx) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, this.width, this.height);

  if (this.images.bg && this.images.bg.width) {
    ctx.drawImage(this.images.bg, 0, 0, this.width, this.height);
  }

  var gradient = ctx.createLinearGradient(0, 0, 0, this.height);
  gradient.addColorStop(0, "rgba(0,0,0,0.45)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.75)");
  gradient.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, this.width, this.height);
};

PersoMinigame.prototype.drawLoadingPage = function drawLoadingPage(ctx) {
  this.drawTableHeader(ctx, false);

  var visiblePersonas = this.selected.slice(0, 4);
  var compact = visiblePersonas.length >= 3;
  var avatarSize = compact ? 82 : 110;
  var badgeH = compact ? 38 : 51;
  var badgeMaxW = compact ? 96 : 128;
  var cardW = Math.max(avatarSize, badgeMaxW);
  var gridCols = visiblePersonas.length >= 4 ? 2 : visiblePersonas.length;
  var gridRows = Math.ceil(visiblePersonas.length / gridCols);
  var gapX = visiblePersonas.length === 3 ? 8 : 32;
  var gapY = visiblePersonas.length >= 4 ? 16 : 32;
  var gridW = gridCols * cardW + (gridCols - 1) * gapX;
  var gridH = gridRows * (avatarSize + badgeH + 12) + (gridRows - 1) * gapY;
  var startX = (this.width - gridW) / 2;
  var startY = Math.max(92, (this.height - gridH - 170) / 2);

  for (var i = 0; i < visiblePersonas.length; i += 1) {
    var id = visiblePersonas[i];
    var col = i % gridCols;
    var row = Math.floor(i / gridCols);
    var cardX = startX + col * (cardW + gapX);
    var cardY = startY + row * (avatarSize + badgeH + 12 + gapY);
    var avatarX = cardX + (cardW - avatarSize) / 2;
    this.drawAvatarCircle(ctx, id, avatarX, cardY, avatarSize, false);
    this.drawPersonaBadge(ctx, id, cardX + cardW / 2, cardY + avatarSize + 12, badgeH, badgeMaxW);
  }

  var loadingImage = this.images["loading" + this.loadingDotFrame] || this.images.loading0;
  var loadingW = Math.min(LOADING_IMAGE_WIDTH, gridW);
  var loadingH = loadingW * 113 / 214;
  var loadingX = (this.width - loadingW) / 2;
  var loadingY = startY + gridH + 32;

  if (loadingImage && loadingImage.width) {
    ctx.drawImage(loadingImage, loadingX, loadingY, loadingW, loadingH);
  }

  var scale = loadingW / LOADING_IMAGE_WIDTH;
  ctx.fillStyle = "#B1FD00";
  ctx.fillRect(
    loadingX + LOADING_PROGRESS_FRAME.left * scale,
    loadingY + LOADING_PROGRESS_FRAME.top * scale,
    LOADING_PROGRESS_FRAME.width * scale * Math.min(100, this.loadingProgress) / 100,
    LOADING_PROGRESS_FRAME.height * scale
  );
};

PersoMinigame.prototype.drawRoundtablePage = function drawRoundtablePage(ctx) {
  this.drawTableHeader(ctx, false);
  this.drawRoundtableStage(ctx);
  this.drawRoundtableFooter(ctx);
};

PersoMinigame.prototype.drawTableHeader = function drawTableHeader(ctx, showShare) {
  var safeTop = this.systemInfo.safeArea ? Math.max(0, this.systemInfo.safeArea.top || 0) : 0;
  var statusTop = Math.max(58, safeTop > 0 ? safeTop : 44);
  var headerY = statusTop + 12;

  this.rects.back = { x: 18, y: headerY, w: 40, h: 40 };
  if (this.images.back && this.images.back.width) {
    ctx.drawImage(this.images.back, 18, headerY, 40, 40);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = this.pixelFont(28);
    ctx.textAlign = "center";
    ctx.fillText("<", 38, headerY + 30);
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(16);
  ctx.textAlign = "center";
  var topicLines = wrapText(ctx, this.currentTopic(), this.width - 130, 1);
  ctx.fillText(topicLines[0] || "", this.width / 2, headerY + 27);

  this.rects.share = { x: this.width - 58, y: headerY, w: 40, h: 40 };
  if (showShare && this.images.share && this.images.share.width) {
    ctx.drawImage(this.images.share, this.width - 58, headerY, 40, 40);
  }
};

PersoMinigame.prototype.drawRoundtableStage = function drawRoundtableStage(ctx) {
  var msg = this.tableMessages[this.activeMessageIndex] || this.tableMessages[this.tableMessages.length - 1];
  var speaker = msg ? msg.persona : this.selected[0];
  var visibleContent = msg ? msg.content.slice(0, this.visibleChars) : "";
  if (this.status === "done" && this.isAtLiveEdge && msg) visibleContent = msg.content;

  var footerReservation = this.status === "done" ? 80 : 90;
  var safeTop = this.systemInfo.safeArea ? Math.max(0, this.systemInfo.safeArea.top || 0) : 0;
  var stageTop = Math.max(58, safeTop > 0 ? safeTop : 44) + 76;
  var stageBottom = this.height - footerReservation;
  var speakerBadgeY = Math.max(stageTop + 6, stageTop + (stageBottom - stageTop - 470) / 2 + 18);
  var speakerCenterX = this.width / 2;

  this.drawPersonaBadge(ctx, speaker, speakerCenterX, speakerBadgeY, 51, 128);

  var spriteSize = 200;
  var spriteX = speakerCenterX - spriteSize / 2;
  var spriteY = speakerBadgeY + 52;
  this.drawPersonaSprite(ctx, speaker, spriteX, spriteY, spriteSize);

  if (visibleContent) {
    this.drawSpeechBubble(ctx, speaker, visibleContent, 24, spriteY + spriteSize - 56, this.width - 48);
  }

  var audience = [];
  for (var i = 0; i < this.selected.length; i += 1) {
    if (this.selected[i] !== speaker) audience.push(this.selected[i]);
  }
  var bubbleLines = visibleContent ? this.getSpeechBubbleLines(ctx, visibleContent, this.width - 48, 5).length : 0;
  var bubbleH = visibleContent ? Math.max(76, bubbleLines * SPEECH_BUBBLE_LINE_HEIGHT + 28) : 0;
  var audienceY = visibleContent
    ? spriteY + spriteSize - 56 + bubbleH + 10
    : spriteY + spriteSize + 10;
  var maxAudienceY = stageBottom - 112;
  this.drawAudienceRow(ctx, audience.slice(0, 4), Math.min(audienceY, maxAudienceY));

  if (this.error && this.status === "done") {
    ctx.fillStyle = "#FFC700";
    ctx.font = this.pixelFont(12);
    ctx.textAlign = "center";
    ctx.fillText(this.error, this.width / 2, stageBottom - 8);
  }
};

PersoMinigame.prototype.drawPersonaSprite = function drawPersonaSprite(ctx, id, x, y, size) {
  var image = id === "user" ? this.images.user : this.images[id];
  if (image && image.width) {
    ctx.drawImage(image, x, y, size, size);
    return;
  }

  ctx.fillStyle = "#222222";
  ctx.fillRect(x, y, size, size);
};

PersoMinigame.prototype.drawPersonaBadge = function drawPersonaBadge(ctx, id, centerX, y, h, maxW) {
  var image = id === "user" ? this.images.userBadge : this.images[id + "Badge"];
  if (image && image.width) {
    var w = Math.min(maxW, image.width / image.height * h);
    ctx.drawImage(image, centerX - w / 2, y, w, h);
    return;
  }

  ctx.fillStyle = "#000000";
  roundedRect(ctx, centerX - maxW / 2, y, maxW, h, 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(18, "700");
  ctx.textAlign = "center";
  ctx.fillText(id, centerX, y + h / 2 + 7);
};

PersoMinigame.prototype.drawSpeechBubble = function drawSpeechBubble(ctx, speaker, content, x, y, w) {
  var colors = speaker === "user" ? USER_BUBBLE_COLORS : this.getBubbleColors(speaker);
  var maxLines = 5;
  var lineH = SPEECH_BUBBLE_LINE_HEIGHT;
  var lines = this.getSpeechBubbleLines(ctx, content, w, maxLines);
  var h = Math.max(lineH * 2 + 28, lines.length * lineH + 28);

  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = colors.bubbleBg;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    x + SPEECH_BUBBLE_PADDING_X,
    y,
    this.getSpeechBubbleTextWidth(w),
    h
  );
  ctx.clip();
  ctx.fillStyle = colors.bubbleText;
  ctx.font = this.pixelFont(SPEECH_BUBBLE_TEXT_FONT_SIZE);
  ctx.textAlign = "left";
  for (var i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], x + SPEECH_BUBBLE_PADDING_X, y + 34 + i * lineH);
  }
  ctx.restore();
};

PersoMinigame.prototype.getBubbleColors = function getBubbleColors(id) {
  var group = PERSONA_GROUP[id];
  if (group === "NT") return { bubbleBg: "#8046F5", bubbleText: "#FFC700" };
  if (group === "NF") return { bubbleBg: "#B1FD00", bubbleText: "#5B5CF3" };
  if (group === "SJ") return { bubbleBg: "#A3F8FF", bubbleText: "#5B5CF3" };
  return { bubbleBg: "#FFDD00", bubbleText: "#8046F5" };
};

PersoMinigame.prototype.drawAudienceRow = function drawAudienceRow(ctx, audience, y) {
  if (!audience.length) return;
  var size = audience.length >= 4 ? 74 : 80;
  var labelH = audience.length >= 4 ? 33 : 36;
  var totalW = audience.length * size + (audience.length - 1) * 22;
  var x = (this.width - totalW) / 2;

  for (var i = 0; i < audience.length; i += 1) {
    var labelY = y + size * (1 - AVATAR_LABEL_COVER_RATIO);
    this.drawAvatarCircle(ctx, audience[i], x + i * (size + 22), y, size, false);
    ctx.fillStyle = "#000000";
    roundedRect(ctx, x + i * (size + 22), labelY, size, labelH, 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = this.pixelFont(audience.length >= 4 ? 18 : 20, "700");
    ctx.textAlign = "center";
    ctx.fillText(audience[i], x + i * (size + 22) + size / 2, labelY + labelH / 2 + (audience.length >= 4 ? 4 : 5));
  }
};

PersoMinigame.prototype.drawAvatarCircle = function drawAvatarCircle(ctx, id, x, y, size, overlay) {
  var group = PERSONA_GROUP[id];
  var color = GROUP_COLORS[group] ? GROUP_COLORS[group].avatarBg : "#FFC700";
  var image = this.images[id];

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  if (image && image.width) {
    var imgSize = size * 1.05;
    ctx.drawImage(image, x + (size - imgSize) / 2, y, imgSize, imgSize);
  }
  if (overlay) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
};

PersoMinigame.prototype.drawRoundtableFooter = function drawRoundtableFooter(ctx) {
  var h = this.status === "done" ? 80 : 90;
  var y = this.height - h;
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, y, this.width, h);
  ctx.strokeStyle = "#1F1F1F";
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(this.width, y);
  ctx.stroke();

  var trackX = 30;
  var trackY = y + 18;
  var trackW = this.width - 60;
  var progress = this.getProgressRatio();
  this.rects.progress = { x: trackX, y: trackY - 10, w: trackW, h: 40 };
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.fillRect(trackX, trackY, trackW, 20);
  ctx.strokeRect(trackX, trackY, trackW, 20);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(trackX + 5, trackY + 5, (trackW - 10) * progress, 10);
  ctx.fillRect(trackX + Math.max(0, (trackW - 14) * progress), trackY - 4, 14, 28);

  var buttonY = y + 50;
  if (this.status === "done") {
    this.drawFooterButton(ctx, this.getPlaybackToggleLabel(), (this.width - 63) / 2, buttonY, "playToggle");
  } else {
    this.drawFooterButton(ctx, this.getPlaybackToggleLabel(), 30, buttonY, "playToggle");
    this.drawFooterButton(ctx, "结束", this.width - 93, buttonY, "end");
  }
};

PersoMinigame.prototype.drawFooterButton = function drawFooterButton(ctx, label, x, y, key) {
  var w = 63;
  var h = 28;
  this.rects[key] = { x: x, y: y, w: w, h: h };
  if (this.images.button1 && this.images.button1.width) {
    ctx.drawImage(this.images.button1, x, y, w, h);
  } else {
    ctx.fillStyle = "#B1FD00";
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = "#000000";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 19);
};

PersoMinigame.prototype.drawSelectionContent = function drawSelectionContent(ctx) {
  var x = 30;
  var contentW = this.width - x * 2;
  var y = (this.tt && this.tt.isBrowserAdapter ? 24 : this.getTopReserved() + 22);

  y = this.drawHeader(ctx, x, y, contentW);
  y = this.drawPersonaSection(ctx, x, y + 20, contentW);
  y = this.drawTopicSection(ctx, x, y + 24, contentW);

  return y + 24;
};

PersoMinigame.prototype.drawLoadingPage = function drawLoadingPage(ctx) {
  var x = 20;
  var headerY = this.getTopReserved() + 12;
  this.drawTableHeader(ctx, headerY, false, false);

  var visible = this.selected.slice(0, 4);
  var compact = visible.length >= 3;
  var avatarSize = compact ? 82 : 110;
  var badgeH = compact ? 38 : 51;
  var badgeMaxW = compact ? 96 : 128;
  var cardW = Math.max(avatarSize, badgeMaxW);
  var gridTop = Math.max(96, this.height * 0.2) + LOADING_CONTENT_OFFSET_Y;
  var gridGapX = visible.length === 3 ? 10 : 34;
  var gridGapY = 8;
  var cols = visible.length >= 4 ? 2 : visible.length;
  if (cols <= 0) cols = 1;
  var totalW = cols * cardW + (cols - 1) * gridGapX;
  var startX = (this.width - totalW) / 2;
  var rows = visible.length >= 4 ? 2 : 1;
  var gridBottom = gridTop + (rows - 1) * (avatarSize + badgeH + 18 + gridGapY) + avatarSize + 12 + badgeH;

  for (var i = 0; i < visible.length; i += 1) {
    var id = visible[i];
    var col = visible.length >= 4 ? i % 2 : i;
    var row = visible.length >= 4 ? Math.floor(i / 2) : 0;
    var cardX = startX + col * (cardW + gridGapX);
    var cardY = gridTop + row * (avatarSize + badgeH + 18 + gridGapY);
    this.drawLoadingPersonaCard(ctx, id, cardX, cardY, cardW, avatarSize, badgeH, badgeMaxW);
  }

  var loadingImage = this.images["loading" + this.loadingDotFrame];
  var loadingW = Math.min(LOADING_IMAGE_WIDTH, totalW);
  var loadingH = loadingW * 113 / 214;
  var loadingX = (this.width - loadingW) / 2;
  var loadingY = gridBottom + 32;

  if (loadingImage && loadingImage.width) {
    ctx.drawImage(loadingImage, loadingX, loadingY, loadingW, loadingH);
  }

  var scale = loadingW / LOADING_IMAGE_WIDTH;
  ctx.fillStyle = "#B1FD00";
  ctx.fillRect(
    loadingX + LOADING_PROGRESS_FRAME.left * scale,
    loadingY + LOADING_PROGRESS_FRAME.top * scale,
    LOADING_PROGRESS_FRAME.width * scale * (this.loadingProgress / 100),
    LOADING_PROGRESS_FRAME.height * scale
  );
};

PersoMinigame.prototype.drawLoadingPersonaCard = function drawLoadingPersonaCard(ctx, id, x, y, cardW, avatarSize, badgeH, badgeMaxW) {
  var avatarX = x + (cardW - avatarSize) / 2;
  this.drawRoundAvatar(ctx, id, avatarX, y, avatarSize, false, null, null, false);
  var badge = this.images[id + "Badge"];
  if (badge && badge.width) {
    var bw = Math.min(badgeMaxW, badge.width / badge.height * badgeH);
    ctx.drawImage(badge, x + (cardW - bw) / 2, y + avatarSize + 12, bw, badgeH);
  }
};

PersoMinigame.prototype.drawRoundtablePage = function drawRoundtablePage(ctx) {
  this.drawTableHeader(ctx, this.getTopReserved() + 12, false);

  var bottomReservation = this.status === "done" ? 80 : (this.mode === "participant" ? PARTICIPANT_FOOTER_HEIGHT : 126);
  var stageTop = this.getTopReserved() + 76;
  var stageBottom = this.height - bottomReservation;
  var current = this.tableMessages[this.activeMessageIndex] || this.tableMessages[this.tableMessages.length - 1];
  var speaker = current ? current.persona : this.selected[0];
  var content = current ? current.content.slice(0, this.visibleChars) : "";
  var thinkingBubble = this.getThinkingBubbleState(current, speaker, content);
  if (thinkingBubble) {
    speaker = thinkingBubble.speaker;
    content = thinkingBubble.content;
  }
  if (!content && current && this.ttsPlaybackKey === this.getTtsMessageKey(current, this.activeMessageIndex)) {
    content = current.content.slice(0, 1);
  }
  if (this.status === "done" && this.isAtLiveEdge && current) content = current.content;

  this.rects.notePersonas = {};
  var speakerBottom = this.drawSpeakerCard(ctx, speaker, content, stageTop, stageBottom, !!thinkingBubble);
  this.drawAudienceRow(ctx, speaker, Math.min(speakerBottom + 10, stageBottom - 112));
  this.drawTtsStatus(ctx, stageBottom);
  if (!thinkingBubble) this.drawThinkingStatus(ctx, stageBottom);
  this.drawLiveControls(ctx, bottomReservation);
  if (this.noteOverlayTarget) this.drawNoteOverlay(ctx);
};

PersoMinigame.prototype.getThinkingText = function getThinkingText() {
  var dotCount = Math.floor(Date.now() / 360) % 3 + 1;
  return "思考中" + "...".slice(0, dotCount);
};

PersoMinigame.prototype.getPersonaAnimSeed = function getPersonaAnimSeed(persona) {
  var text = String(persona || "");
  var seed = 0;
  for (var i = 0; i < text.length; i += 1) seed += text.charCodeAt(i) * (i + 1);
  return seed;
};

PersoMinigame.prototype.getPersonaAnimOffset = function getPersonaAnimOffset(persona, state) {
  var seed = this.getPersonaAnimSeed(persona);
  var now = Date.now();
  if (state === "thinking") {
    var style = seed % 3;
    if (style === 0) {
      return { x: Math.round(Math.sin(now / 520 + seed) * 2), y: Math.round(Math.sin(now / 760 + seed) * 1) };
    }
    if (style === 1) {
      return { x: Math.round(Math.sin(now / 700 + seed) * 2), y: Math.round(Math.cos(now / 900 + seed) * 1) };
    }
    return { x: Math.round(Math.sin(now / 840 + seed) * 2), y: Math.round(Math.abs(Math.sin(now / 420 + seed)) * -1) };
  }
  if (state === "speaking") {
    var speakStyle = seed % 4;
    if (speakStyle === 0) {
      return { x: Math.round(Math.sin(now / 92 + seed) * 1), y: Math.round(Math.cos(now / 124 + seed) * 1) };
    }
    if (speakStyle === 1) {
      return { x: 0, y: Math.round(Math.sin(now / 150 + seed) * 2) };
    }
    if (speakStyle === 2) {
      return { x: Math.round(Math.sin(now / 180 + seed) * 2), y: Math.round(Math.cos(now / 260 + seed) * 1) };
    }
    return {
      x: Math.floor(now / 140 + seed) % 2 === 0 ? 1 : -1,
      y: Math.floor(now / 210 + seed) % 2 === 0 ? 0 : -1
    };
  }
  if (state === "idle") {
    return { x: 0, y: Math.round(Math.sin(now / 980 + seed) * 1) };
  }
  return { x: 0, y: 0 };
};

PersoMinigame.prototype.getNextPersonaAfter = function getNextPersonaAfter(speaker) {
  if (!this.selected.length) return speaker;
  var index = this.selected.indexOf(speaker);
  if (index < 0) return this.selected[0];
  return this.selected[(index + 1) % this.selected.length];
};

PersoMinigame.prototype.getThinkingBubbleState = function getThinkingBubbleState(current, speaker, content) {
  if (this.status === "done" || !this.isAtLiveEdge || this.noteOverlayTarget) return null;
  var text = this.getThinkingText();
  if (current && !content && this.ttsPendingKey === this.getTtsMessageKey(current, this.activeMessageIndex)) {
    return { speaker: speaker, content: text };
  }
  if (this.mode === "participant" && current && current.persona === "user" && this.liveVisibleChars < current.content.length) return null;
  if (
    current &&
    this.liveMessageIndex >= this.tableMessages.length - 1 &&
    this.isLiveMessageReadyToAdvance() &&
    (this.isFetchingContinuation || this.thinkingVisible)
  ) {
    return { speaker: this.thinkingPersona || this.getNextPersonaAfter(current.persona), content: text };
  }
  return null;
};

PersoMinigame.prototype.drawThinkingStatus = function drawThinkingStatus(ctx, stageBottom) {
  if (!this.thinkingVisible) return;
  if (this.mode === "participant") return;
  var text = "思考中";
  var w = 92;
  var h = 28;
  var x = (this.width - w) / 2;
  var y = Math.max(this.getTopReserved() + 88, stageBottom - 38);
  roundedRect(ctx, x, y, w, h, 2);
  ctx.fillStyle = "rgba(0,0,0,0.76)";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#B1FD00";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText(text, this.width / 2, y + 19);
};

PersoMinigame.prototype.drawNoteOverlay = function drawNoteOverlay(ctx) {
  var options = [
    { key: "让 TA 说话", label: "让 TA 说话" },
    { key: "别绕弯，说重点", label: "别绕弯，说重点" },
    { key: "讲真心话", label: "讲真心话" },
  ];
  var optionColors = ["#B1FD00", "#A3F8FF", "#FFC700", "#FF7A7A"];
  var panelW = this.width - 40;
  var panelH = 314;
  var x = 20;
  var y = this.height - panelH - 20;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, panelW, panelH, 18);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(14);
  ctx.textAlign = "left";
  ctx.fillText("给 " + this.noteOverlayTarget + " 递纸条", x + 18, y + 34);

  var inputX = x + 18;
  var inputY = y + 52;
  var inputW = panelW - 120;
  var inputH = 42;
  roundedRect(ctx, inputX, inputY, inputW, inputH, 12);
  ctx.fillStyle = "#202020";
  ctx.fill();
  ctx.strokeStyle = this.editingNoteText ? "#B1FD00" : "#454545";
  ctx.lineWidth = this.editingNoteText ? 2 : 1;
  ctx.stroke();

  ctx.fillStyle = this.noteDraftText ? "#FFFFFF" : "#777777";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "left";
  var inputLines = wrapText(ctx, this.noteDraftText || "自己写一句纸条", inputW - 24, 1);
  ctx.fillText(inputLines[0] || "", inputX + 12, inputY + 27);
  this.rects.noteInput = { x: inputX, y: inputY, w: inputW, h: inputH };

  var submitX = inputX + inputW + 10;
  var submitW = panelW - 36 - inputW - 10;
  roundedRect(ctx, submitX, inputY, submitW, inputH, 12);
  ctx.fillStyle = this.noteDraftText.trim() ? "#B1FD00" : "#343434";
  ctx.fill();
  ctx.fillStyle = this.noteDraftText.trim() ? "#111111" : "#777777";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText("递过去", submitX + submitW / 2, inputY + 27);
  this.rects.noteSubmit = { x: submitX, y: inputY, w: submitW, h: inputH };

  this.rects.noteOptions = {};
  for (var i = 0; i < options.length; i += 1) {
    var opt = options[i];
    var by = y + 112 + i * 42;
    roundedRect(ctx, x + 18, by, panelW - 36, 32, 12);
    ctx.fillStyle = optionColors[i] || "#B1FD00";
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.font = this.pixelFont(13);
    ctx.textAlign = "center";
    ctx.fillText(opt.label, this.width / 2, by + 21);
    this.rects.noteOptions[opt.key] = { x: x + 18, y: by, w: panelW - 36, h: 32 };
  }

  this.rects.noteCancel = { x: x + panelW - 80, y: y + 16, w: 58, h: 28 };
  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText("取消", x + panelW - 51, y + 35);
};

PersoMinigame.prototype.drawSidebarPrompt = function drawSidebarPrompt(ctx) {
  var w = Math.min(320, this.width - 48);
  var h = 174;
  var x = (this.width - w) / 2;
  var y = (this.height - h) / 2;
  var buttonY = y + h - 48;
  var gap = 10;
  var buttonW = (w - 36 - gap) / 2;
  var messageY = y + 68;

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#6A6A6A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(18);
  ctx.textAlign = "center";
  ctx.fillText("下次从侧边栏回来", this.width / 2, y + 38);

  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(13);
  var lines = wrapText(ctx, "把 Perso 添加到抖音侧边栏，下一次可以直接回到圆桌。", w - 42, 2);
  for (var i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], this.width / 2, y + 70 + i * 19);
  }

  roundedRect(ctx, x + 18, buttonY, buttonW, 30, 2);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.fillText("稍后", x + 18 + buttonW / 2, buttonY + 20);

  roundedRect(ctx, x + 18 + buttonW + gap, buttonY, buttonW, 30, 2);
  ctx.fillStyle = "#B1FD00";
  ctx.fill();
  ctx.strokeStyle = "#89B93B";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText("添加", x + 18 + buttonW + gap + buttonW / 2, buttonY + 20);

  this.rects.sidebarPromptLater = { x: x + 18, y: buttonY, w: buttonW, h: 30 };
  this.rects.sidebarPromptAdd = { x: x + 18 + buttonW + gap, y: buttonY, w: buttonW, h: 30 };
};

PersoMinigame.prototype.drawShareOptions = function drawShareOptions(ctx) {
  var w = Math.min(320, this.width - 48);
  var h = 218;
  var x = (this.width - w) / 2;
  var y = (this.height - h) / 2;
  var buttonY = y + 112;
  var gap = 10;
  var buttonW = (w - 36 - gap) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#6A6A6A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(18);
  ctx.textAlign = "center";
  ctx.fillText("分享这场圆桌", this.width / 2, y + 38);

  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(12);
  var messageY = y + 68;
  var lines = wrapText(ctx, "选择卡片快速分享，或预览一段对话回放视频。", w - 42, 2);
  for (var i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], this.width / 2, messageY + i * 18);
  }

  roundedRect(ctx, x + 18, buttonY, buttonW, 34, 2);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.fillText("卡片", x + 18 + buttonW / 2, buttonY + 22);

  roundedRect(ctx, x + 18 + buttonW + gap, buttonY, buttonW, 34, 2);
  ctx.fillStyle = "#B1FD00";
  ctx.fill();
  ctx.strokeStyle = "#89B93B";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText("视频", x + 18 + buttonW + gap + buttonW / 2, buttonY + 22);

  this.rects.shareCard = { x: x + 18, y: buttonY, w: buttonW, h: 34 };
  this.rects.shareVideo = { x: x + 18 + buttonW + gap, y: buttonY, w: buttonW, h: 34 };
  this.rects.shareCancel = { x: x + w - 86, y: y + h - 42, w: 64, h: 28 };

  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(13);
  ctx.fillText("取消", x + w - 54, y + h - 24);
};

PersoMinigame.prototype.pickShareHighlightMessage = function pickShareHighlightMessage(messages) {
  var labels = ["反驳", "打断", "追问", "共识"];
  var aiMessages = (messages || []).filter(function filterAi(message) {
    return message && message.persona !== "user";
  });
  for (var i = 0; i < labels.length; i += 1) {
    for (var j = 0; j < aiMessages.length; j += 1) {
      if (aiMessages[j].label === labels[i]) return aiMessages[j];
    }
  }
  return aiMessages[0] || null;
};

PersoMinigame.prototype.shortenShareTopic = function shortenShareTopic(topic) {
  var text = String(topic || "").trim();
  text = text.replace(/^(你们|我们|大家|咱们)/, "");
  text = text.replace(/^(喜不喜欢|觉不觉得|想不想|要不要|是不是|有没有|喜欢|觉得|认为|相信|想|要)/, "");
  text = text.replace(/(吗|呢|吧|啊|呀|嘛|么)?[，。？！,.?!\s]*$/g, "");
  text = text.trim();
  return text || String(topic || "").trim();
};

PersoMinigame.prototype.truncateShareText = function truncateShareText(content, max) {
  var cleaned = String(content || "").replace(/\s+/g, "").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, Math.max(0, max - 1)) + "…";
};

PersoMinigame.prototype.stripShareSummaryFiller = function stripShareSummaryFiller(content) {
  return String(content || "")
    .replace(/^(等一下|等等|先别急|你先别急|先停一下|我先打断一下|打断一下)[，,。！？；;]*/, "")
    .replace(/^(我觉得|我认为|其实|说真的|老实说|坦白讲|最近|这件事|这个问题)[，,。！？；;]*/, "")
    .replace(/^不是[，,。！？；;]+/, "")
    .replace(/^(你|他|她|我们|他们|这种|那个)/, "")
    .trim();
};

PersoMinigame.prototype.isWeakShareSummaryCandidate = function isWeakShareSummaryCandidate(content) {
  return content.length < 8 || /^(等一下|等等|先别急|你先别急|先停一下|不是|嗯|啊|呃)$/.test(content);
};

PersoMinigame.prototype.scoreShareSummaryCandidate = function scoreShareSummaryCandidate(content) {
  var score = Math.min(content.length, 28);
  if (/(核心|关键|重点|真正|本质|问题|因为|所以|需要|在意|自由|代价|逃避|选择)/.test(content)) score += 20;
  if (/(不是|而是|与其|不如)/.test(content)) score += 12;
  return score;
};

PersoMinigame.prototype.summarizeShareContent = function summarizeShareContent(content, max) {
  var cleaned = String(content || "")
    .replace(/\s+/g, "")
    .replace(/[“”"「」]/g, "")
    .replace(/^(我觉得|我认为|其实|说真的|老实说|坦白讲|最近|这件事|这个问题)/, "")
    .trim();
  var contrast = cleaned.match(/不是([^，。！？；;]{2,18})[，,]?而是([^。！？；;]{2,24})/);
  var preference = cleaned.match(/与其([^，。！？；;]{2,18})[，,]?不如([^。！？；;]{2,24})/);
  var focus = cleaned.match(/(?:核心|关键|重点|真正的问题)(?:是|在于)?([^。！？；;]{3,24})/);
  var candidates;
  var best;

  if (contrast) return this.truncateShareText("重点不是" + contrast[1] + "，而是" + contrast[2], max);
  if (preference) return this.truncateShareText("比起" + preference[1] + "，更在意" + preference[2], max);
  if (focus) return this.truncateShareText("核心是" + focus[1], max);

  candidates = cleaned
    .split(/[。！？；;]/)
    .map(this.stripShareSummaryFiller.bind(this))
    .filter(function filterCandidate(candidate) {
      return !this.isWeakShareSummaryCandidate(candidate);
    }, this);
  candidates.sort(function sortSummary(a, b) {
    return this.scoreShareSummaryCandidate(b) - this.scoreShareSummaryCandidate(a);
  }.bind(this));
  best = candidates[0] || this.stripShareSummaryFiller(cleaned);
  return this.truncateShareText(best, max);
};

PersoMinigame.prototype.getShareSummaryMax = function getShareSummaryMax(personaCount) {
  if (personaCount >= 4) return 24;
  if (personaCount === 3) return 34;
  return 42;
};

PersoMinigame.prototype.getShareSummaryText = function getShareSummaryText() {
  var slots = this.selected.slice(0, 4);
  var highlight = this.pickShareHighlightMessage(this.getVisibleShareMessages());
  if (!highlight) return "聊了\"" + this.shortenShareTopic(this.currentTopic()) + "\"。";
  return "聊了\"" + this.shortenShareTopic(this.currentTopic()) + "\"，" +
    highlight.persona + "的观点：" +
    this.summarizeShareContent(highlight.content, this.getShareSummaryMax(slots.length)) + "。";
};

PersoMinigame.prototype.getShareCardDateText = function getShareCardDateText() {
  var d = new Date();
  return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
};

PersoMinigame.prototype.drawShareCardPersonaTile = function drawShareCardPersonaTile(ctx, personaId, x, y, slot) {
  var group = PERSONA_GROUP[personaId];
  var color = GROUP_COLORS[group] ? GROUP_COLORS[group].avatarBg : "#FFC700";
  var circleSize = slot.circleSize || 80;
  var circleOffsetX = slot.circleOffsetX || 0;
  var circleOffsetY = slot.circleOffsetY || 0;
  var avatarScale = slot.avatarScale || 1.05;
  var avatarRotation = slot.avatarRotation || 0;
  var avatarOffsetX = slot.avatarOffsetX || 0;
  var avatarOffsetY = slot.avatarOffsetY || 0;
  var circleX = x + 8 + circleOffsetX;
  var circleY = y + circleOffsetY;
  var circleCenterX = circleX + circleSize / 2;
  var circleCenterY = circleY + circleSize / 2;
  var sprite = this.images[personaId];
  var badge = this.images[personaId + "Badge"];
  var badgeW = slot.badgeWidth;
  var badgeH = badge && badge.width ? badgeW * badge.height / badge.width : 26;
  var badgeX = x + slot.offsetX + circleSize / 2 + circleOffsetX;
  var badgeY = y + circleSize - 10 + slot.offsetY + circleOffsetY;
  var imgSize = circleSize * avatarScale;

  ctx.save();
  ctx.translate(circleCenterX, circleCenterY);
  if (avatarRotation) ctx.rotate(avatarRotation * Math.PI / 180);
  ctx.beginPath();
  ctx.arc(0, 0, circleSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  if (sprite && sprite.width) {
    ctx.drawImage(sprite, -imgSize / 2 + avatarOffsetX, -circleSize / 2 + avatarOffsetY, imgSize, imgSize);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(badgeX, badgeY);
  if (slot.rotation) ctx.rotate(slot.rotation * Math.PI / 180);
  if (badge && badge.width) {
    ctx.drawImage(badge, 0, 0, badgeW, badgeH);
  } else {
    roundedRect(ctx, 0, 0, badgeW, 24, 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = this.pixelFont(14);
    ctx.textAlign = "center";
    ctx.fillText(personaId, badgeW / 2, 17);
  }
  ctx.restore();
};

PersoMinigame.prototype.drawH5StyleShareCard = function drawH5StyleShareCard(ctx, x, y, scale) {
  var slots = this.selected.slice(0, 4);
  var title = this.mode === "participant" ? "我和MBTI像素小人开大会了！！！" : "我导演了一桌MBTI像素小人！！！";
  var summary = this.getShareSummaryText();
  var frameW = 360;
  var frameH = 480;
  var cardX = 33;
  var cardY = 44;
  var cardW = 294;
  var cardH = 393;
  var slotStyles = [
    { rotation: -34.5, offsetX: -35, offsetY: 5, badgeWidth: 100, circleSize: 90, circleOffsetX: -8, circleOffsetY: -4, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: -34.5 },
    { rotation: 0, offsetX: -34, offsetY: -14, badgeWidth: 70, circleSize: 64, circleOffsetX: 14, circleOffsetY: 6, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 },
    { rotation: 0, offsetX: -35, offsetY: -16, badgeWidth: 80, circleSize: 70, circleOffsetX: 8, circleOffsetY: 10, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 },
    { rotation: -20, offsetX: -38, offsetY: -4, badgeWidth: 94, circleSize: 80, circleOffsetX: 0, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 }
  ];
  var compactSlotStyles = [
    { rotation: -34.5, offsetX: -25, offsetY: 6, badgeWidth: 95, circleSize: 78, circleOffsetX: 2, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: -30 },
    { rotation: 0, offsetX: -25, offsetY: -14, badgeWidth: 66, circleSize: 62, circleOffsetX: 12, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 },
    { rotation: 0, offsetX: -27, offsetY: -14, badgeWidth: 70, circleSize: 64, circleOffsetX: 10, circleOffsetY: 6, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 },
    { rotation: -16, offsetX: -28, offsetY: -13, badgeWidth: 78, circleSize: 72, circleOffsetX: 2, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 }
  ];
  var compactSlotPositions = [
    { x: 34, y: 132 },
    { x: 172, y: 132 },
    { x: 34, y: 240 },
    { x: 172, y: 240 }
  ];
  var centerStyle = { rotation: 0, offsetX: -29, offsetY: -8, badgeWidth: 74, circleSize: 62, circleOffsetX: 14, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0 };
  var titleLines;
  var summaryLines;
  var summaryY = cardY + cardH - (slots.length >= 4 ? 40 : (slots.length === 3 ? 76 : 82));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#020202";
  ctx.fillRect(0, 0, frameW, frameH);

  ctx.fillStyle = "#5B5CF3";
  ctx.font = this.pixelFont(26);
  ctx.textAlign = "right";
  ctx.fillText(this.getShareCardDateText(), cardX + cardW, 30);

  roundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = "#2A2A2A";
  ctx.fill();

  ctx.fillStyle = "#5B5CF3";
  ctx.font = this.pixelFont(25);
  ctx.textAlign = "left";
  titleLines = wrapText(ctx, title, 220, 2);
  for (var i = 0; i < titleLines.length; i += 1) {
    ctx.fillText(titleLines[i], cardX + 22, cardY + 42 + i * 32);
  }

  if (slots.length === 2) {
    this.drawShareCardPersonaTile(ctx, slots[0], cardX + 38, cardY + 168, slotStyles[0]);
    this.drawShareCardPersonaTile(ctx, slots[1], cardX + 174, cardY + 168, slotStyles[1]);
  } else if (slots.length === 3) {
    this.drawShareCardPersonaTile(ctx, slots[0], cardX + 38, cardY + 124, slotStyles[0]);
    this.drawShareCardPersonaTile(ctx, slots[1], cardX + 174, cardY + 124, slotStyles[1]);
    this.drawShareCardPersonaTile(ctx, slots[2], cardX + 105, cardY + 250, centerStyle);
  } else {
    for (var j = 0; j < 4; j += 1) {
      if (!slots[j]) continue;
      this.drawShareCardPersonaTile(
        ctx,
        slots[j],
        cardX + compactSlotPositions[j].x,
        cardY + compactSlotPositions[j].y,
        compactSlotStyles[j]
      );
    }
  }

  ctx.fillStyle = "#5B5CF3";
  ctx.font = this.pixelFont(12);
  ctx.textAlign = "left";
  summaryLines = wrapText(ctx, summary, cardW - 44, slots.length >= 4 ? 2 : 5);
  for (var k = 0; k < summaryLines.length; k += 1) {
    ctx.fillText(summaryLines[k], cardX + 22, summaryY + k * 17);
  }

  ctx.restore();
};

PersoMinigame.prototype.drawShareCardPreview = function drawShareCardPreview(ctx) {
  var panelW = Math.min(380, this.width - 28);
  var maxPanelH = this.height - 54;
  var frameScale = Math.min((panelW - 36) / 360, (maxPanelH - 126) / 480);
  var frameW = 360 * frameScale;
  var frameH = 480 * frameScale;
  var panelH = Math.min(maxPanelH, 48 + frameH + 20 + 34 + 24);
  var x = (this.width - panelW) / 2;
  var y = (this.height - panelH) / 2;
  var frameX = x + (panelW - frameW) / 2;
  var frameY = y + 48;
  var buttonY = frameY + frameH + 20;
  var buttonW = (panelW - 46) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, panelW, panelH, 8);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#6A6A6A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(18);
  ctx.textAlign = "center";
  ctx.fillText("卡片预览", this.width / 2, y + 32);

  this.drawH5StyleShareCard(ctx, frameX, frameY, frameScale);

  if (this.shareCardNotice) {
    ctx.fillStyle = "#B1FD00";
    ctx.font = this.pixelFont(12);
    ctx.textAlign = "center";
    ctx.fillText(this.shareCardNotice, this.width / 2, buttonY - 7);
  }

  roundedRect(ctx, x + 18, buttonY, buttonW, 34, 2);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.fillText("返回", x + 18 + buttonW / 2, buttonY + 22);

  roundedRect(ctx, x + 28 + buttonW, buttonY, buttonW, 34, 2);
  ctx.fillStyle = "#B1FD00";
  ctx.fill();
  ctx.strokeStyle = "#89B93B";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText("分享卡片", x + 28 + buttonW + buttonW / 2, buttonY + 22);

  this.rects.shareCardBack = { x: x + 18, y: buttonY, w: buttonW, h: 34 };
  this.rects.shareCardConfirm = { x: x + 28 + buttonW, y: buttonY, w: buttonW, h: 34 };
};

PersoMinigame.prototype.drawSettingsOverlay = function drawSettingsOverlay(ctx) {
  var w = Math.min(292, this.width - 56);
  var showShare = this.status === "done";
  var h = showShare ? 302 : 250;
  var x = (this.width - w) / 2;
  var y = (this.height - h) / 2;
  var buttonX = x + 22;
  var buttonW = w - 44;
  var buttonH = 38;
  var firstY = y + 68;
  var gap = 14;

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#6A6A6A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(19);
  ctx.textAlign = "center";
  ctx.fillText("设置", this.width / 2, y + 38);

  this.drawSettingsButton(ctx, this.voiceEnabled ? "语音：开" : "语音：关", buttonX, firstY, buttonW, buttonH, false);
  this.drawSettingsButton(ctx, this.bgmEnabled ? "背景音：开" : "背景音：关", buttonX, firstY + buttonH + gap, buttonW, buttonH, false);
  this.drawSettingsButton(ctx, "退出", buttonX, firstY + (buttonH + gap) * 2, buttonW, buttonH, false);
  if (showShare) this.drawSettingsButton(ctx, "分享", buttonX, firstY + (buttonH + gap) * 3, buttonW, buttonH, true);

  this.rects.settingsPanel = { x: x, y: y, w: w, h: h };
  this.rects.settingsSound = { x: buttonX, y: firstY, w: buttonW, h: buttonH };
  this.rects.settingsBgm = { x: buttonX, y: firstY + buttonH + gap, w: buttonW, h: buttonH };
  this.rects.settingsExit = { x: buttonX, y: firstY + (buttonH + gap) * 2, w: buttonW, h: buttonH };
  if (showShare) this.rects.settingsShare = { x: buttonX, y: firstY + (buttonH + gap) * 3, w: buttonW, h: buttonH };
};

PersoMinigame.prototype.drawSettingsButton = function drawSettingsButton(ctx, label, x, y, w, h, primary) {
  roundedRect(ctx, x, y, w, h, 2);
  ctx.fillStyle = primary ? "#B1FD00" : "#111111";
  ctx.fill();
  ctx.strokeStyle = primary ? "#89B93B" : "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = primary ? "#000000" : "#FFFFFF";
  ctx.font = this.pixelFont(14);
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 24);
};

PersoMinigame.prototype.drawShareVideoSavingPage = function drawShareVideoSavingPage(ctx) {
  var w = Math.min(292, this.width - 56);
  var h = 100;
  var x = (this.width - w) / 2;
  var y = (this.height - h) / 2;
  var dotCount = Math.floor(Date.now() / 360) % 3 + 1;
  var text = "保存视频中" + "...".slice(0, dotCount);

  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, this.width, this.height);

  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#0A0A0A";
  ctx.fill();
  ctx.strokeStyle = "#6A6A6A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(20);
  ctx.textAlign = "center";
  ctx.fillText(text, this.width / 2, y + 56);
};

PersoMinigame.prototype.drawShareVideoFrameToContext = function drawShareVideoFrameToContext(ctx, elapsed) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, this.width, this.height);
  this.drawBackground(ctx);
  this.drawShareVideoSceneAt(ctx, elapsed);
};

PersoMinigame.prototype.drawShareVideoScene = function drawShareVideoScene(ctx) {
  var elapsed = Date.now() - this.shareVideoStartedAt;
  var messages = this.shareVideoMessages;

  this.drawShareVideoHeader(ctx);

  var cursor = 0;
  var message = null;
  var messageIndex = 0;
  var localMs = 0;
  for (var i = 0; i < messages.length; i += 1) {
    var duration = this.getShareMessageDuration(messages[i]);
    if (elapsed < cursor + duration || i === messages.length - 1) {
      message = messages[i];
      messageIndex = i;
      localMs = Math.max(0, elapsed - cursor);
      break;
    }
    cursor += duration;
  }

  if (message) this.drawShareVideoMessage(ctx, message, messageIndex, localMs);
};

PersoMinigame.prototype.drawShareVideoHeader = function drawShareVideoHeader(ctx) {
  var headerCenterY = this.getTopReserved() + 32;
  if (
    this.menuButtonRect &&
    typeof this.menuButtonRect.top === "number" &&
    typeof this.menuButtonRect.bottom === "number"
  ) {
    headerCenterY = (this.menuButtonRect.top + this.menuButtonRect.bottom) / 2;
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(16);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fitSingleLineText(ctx, this.currentTopic(), this.width - 64), this.width / 2, headerCenterY);
  ctx.textBaseline = "alphabetic";
};

PersoMinigame.prototype.drawShareVideoPlayButton = function drawShareVideoPlayButton(ctx, x, y, size, playing) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#B1FD00";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  if (playing) {
    var barW = size * 0.12;
    var barH = size * 0.34;
    roundedRect(ctx, x - barW * 1.6, y - barH / 2, barW, barH, 1);
    ctx.fill();
    roundedRect(ctx, x + barW * 0.6, y - barH / 2, barW, barH, 1);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.12, y - size * 0.18);
    ctx.lineTo(x - size * 0.12, y + size * 0.18);
    ctx.lineTo(x + size * 0.2, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

PersoMinigame.prototype.drawShareVideoPreviewPage = function drawShareVideoPreviewPage(ctx) {
  var safeBottom = this.systemInfo.safeArea && typeof this.systemInfo.safeArea.bottom === "number"
    ? this.systemInfo.safeArea.bottom
    : this.height;
  var bottomSafe = safeBottom > 0 && safeBottom <= this.height ? Math.max(0, this.height - safeBottom) : 0;
  var buttonH = 40;
  var buttonY = this.height - bottomSafe - 66;
  var gap = 10;
  var buttonW = (this.width - 48 - gap) / 2;
  var backButtonX = 24;
  var shareButtonX = 24 + buttonW + gap;
  var playSize = 58;
  var playX = this.width / 2;
  var playY = Math.max(this.getTopReserved() + 210, (this.height - 96) / 2);
  var elapsed = this.shareVideoPreviewPlaying
    ? Date.now() - this.shareVideoPreviewStartedAt
    : this.shareVideoPreviewElapsed;

  elapsed = clamp(elapsed, 0, Math.max(0, this.shareVideoDurationMs - 1));
  this.shareVideoPreviewElapsed = elapsed;
  if (this.shareVideoPreviewPlaying && elapsed >= this.shareVideoDurationMs - 1) {
    this.shareVideoPreviewPlaying = false;
    this.clearShareVideoTimers();
  }

  this.drawShareVideoSceneAt(ctx, elapsed);

  this.drawShareVideoPlayButton(ctx, playX, playY, playSize, this.shareVideoPreviewPlaying);

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, buttonY - 28, this.width, this.height - buttonY + 28);

  if (this.shareVideoError || this.shareVideoNotice) {
    ctx.fillStyle = this.shareVideoError ? "#FFC700" : "#B1FD00";
    ctx.font = this.pixelFont(12);
    ctx.textAlign = "center";
    ctx.fillText(fitSingleLineText(ctx, this.shareVideoError || this.shareVideoNotice, this.width - 36), this.width / 2, buttonY - 10);
  }

  roundedRect(ctx, backButtonX, buttonY, buttonW, buttonH, 4);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(14);
  ctx.textAlign = "center";
  ctx.fillText("返回选择", backButtonX + buttonW / 2, buttonY + 25);

  roundedRect(ctx, shareButtonX, buttonY, buttonW, buttonH, 4);
  ctx.fillStyle = "#B1FD00";
  ctx.fill();
  ctx.strokeStyle = "#89B93B";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.font = this.pixelFont(15);
  ctx.textAlign = "center";
  ctx.fillText(
    this.shareVideoShareInProgress ? "打开中" : this.shareVideoResultPath ? "保存/分享" : "分享视频",
    shareButtonX + buttonW / 2,
    buttonY + 25
  );

  this.rects.shareVideoPlay = { x: playX - playSize / 2, y: playY - playSize / 2, w: playSize, h: playSize };
  this.rects.shareVideoConfirm = { x: shareButtonX, y: buttonY, w: buttonW, h: buttonH };
  this.rects.shareVideoToSelection = { x: backButtonX, y: buttonY, w: buttonW, h: buttonH };
  this.rects.shareVideoBack = { x: 0, y: 0, w: 0, h: 0 };
};

PersoMinigame.prototype.drawShareVideoResultPage = function drawShareVideoResultPage(ctx) {
  var safeBottom = this.systemInfo.safeArea && typeof this.systemInfo.safeArea.bottom === "number"
    ? this.systemInfo.safeArea.bottom
    : this.height;
  var bottomSafe = safeBottom > 0 && safeBottom <= this.height ? Math.max(0, this.height - safeBottom) : 0;
  var buttonH = 40;
  var buttonY = this.height - bottomSafe - 64;
  var gap = 10;
  var buttonW = (this.width - 48 - gap) / 2;
  var previewElapsed = this.shareVideoDurationMs > 0 ? Math.min(this.shareVideoDurationMs - 1, 1800) : 0;
  var backY = this.getTopReserved() + 2;

  this.drawShareVideoHeader(ctx);

  roundedRect(ctx, 20, backY, 76, 30, 4);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(12);
  ctx.textAlign = "center";
  ctx.fillText("返回选择", 58, backY + 20);

  this.drawShareVideoSceneAt(ctx, previewElapsed);

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, buttonY - 18, this.width, this.height - buttonY + 18);

  roundedRect(ctx, 24, buttonY, buttonW, buttonH, 4);
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.strokeStyle = "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(14);
  ctx.textAlign = "center";
  ctx.fillText("保存视频", 24 + buttonW / 2, buttonY + 25);

  roundedRect(ctx, 24 + buttonW + gap, buttonY, buttonW, buttonH, 4);
  ctx.fillStyle = "#B1FD00";
  ctx.fill();
  ctx.strokeStyle = "#89B93B";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText("分享视频", 24 + buttonW + gap + buttonW / 2, buttonY + 25);

  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(12);
  if (this.error) ctx.fillText(this.error, this.width / 2, buttonY - 14);

  this.rects.shareVideoSave = { x: 24, y: buttonY, w: buttonW, h: buttonH };
  this.rects.shareVideoConfirm = { x: 24 + buttonW + gap, y: buttonY, w: buttonW, h: buttonH };
  this.rects.shareVideoToSelection = { x: 20, y: backY, w: 76, h: 30 };
  this.rects.shareVideoBack = { x: 0, y: 0, w: 0, h: 0 };
};

PersoMinigame.prototype.drawShareVideoSceneAt = function drawShareVideoSceneAt(ctx, elapsed) {
  var messages = this.shareVideoMessages;
  var cursor = 0;
  var message = null;
  var messageIndex = 0;
  var localMs = 0;

  for (var i = 0; i < messages.length; i += 1) {
    var duration = this.getShareMessageDuration(messages[i]);
    if (elapsed < cursor + duration || i === messages.length - 1) {
      message = messages[i];
      messageIndex = i;
      localMs = Math.max(0, elapsed - cursor);
      break;
    }
    cursor += duration;
  }

  if (message) this.drawShareVideoMessage(ctx, message, messageIndex, localMs, true);
};

PersoMinigame.prototype.drawShareVideoMessage = function drawShareVideoMessage(ctx, message, messageIndex, localMs, silent) {
  var persona = message.persona;
  var totalDuration = this.getShareMessageDuration(message);
  var textStartMs = 360;
  var textDuration = Math.max(1400, totalDuration - 980);
  var progress = clamp((localMs - textStartMs) / textDuration, 0, 1);
  var visibleChars = this.getWeightedSpeechCharIndex(message.content, progress);
  if (localMs > 120) visibleChars = Math.max(1, visibleChars);
  visibleChars = Math.min(message.content.length, visibleChars);
  var content = message.content.slice(0, visibleChars);
  var stageTop = this.getTopReserved() + 76;
  var stageBottom = this.height - 72;
  var speakerBottom;
  var voiceKey = messageIndex + ":" + persona + ":" + message.content;

  if (!silent && this.shareVideoVoiceKey !== voiceKey) {
    this.shareVideoVoiceKey = voiceKey;
    this.stopVoiceAudio();
    this.playMessageTtsIfNeeded(message, messageIndex);
  }

  this.rects.notePersonas = {};
  speakerBottom = this.drawSpeakerCard(ctx, persona, content, stageTop, stageBottom, false, true);
  this.drawAudienceRow(ctx, persona, Math.min(speakerBottom + 10, stageBottom - 112));
};

PersoMinigame.prototype.drawTtsStatus = function drawTtsStatus(ctx, y) {
  if (!this.voiceEnabled || !this.ttsError) return;

  ctx.fillStyle = "#FFC700";
  ctx.font = this.pixelFont(12);
  ctx.textAlign = "center";
  ctx.fillText(this.ttsError, this.width / 2, y - 10);
};

PersoMinigame.prototype.drawTableHeader = function drawTableHeader(ctx, y, showShare, showVoice) {
  var buttonSize = 40;
  var sidePadding = 20;
  var headerCenterY = y + buttonSize / 2;
  if (
    this.menuButtonRect &&
    typeof this.menuButtonRect.top === "number" &&
    typeof this.menuButtonRect.bottom === "number"
  ) {
    headerCenterY = (this.menuButtonRect.top + this.menuButtonRect.bottom) / 2;
  }
  var buttonY = Math.round(headerCenterY - buttonSize / 2);
  var settingsX = Math.max(sidePadding, this.width - sidePadding - buttonSize);
  this.rects.settings = { x: settingsX, y: buttonY, w: buttonSize, h: buttonSize };

  if (this.images.settings && this.images.settings.width) {
    ctx.drawImage(this.images.settings, settingsX + 8, buttonY + 8, buttonSize - 16, buttonSize - 16);
  } else {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(settingsX + 11, buttonY + 11, buttonSize - 22, buttonSize - 22);
    ctx.beginPath();
    ctx.moveTo(settingsX + 20, buttonY + 14);
    ctx.lineTo(settingsX + 20, buttonY + 26);
    ctx.moveTo(settingsX + 14, buttonY + 20);
    ctx.lineTo(settingsX + 26, buttonY + 20);
    ctx.stroke();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(16);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  var titleX = this.width / 2;
  var titleRight = settingsX - 12;
  var titleW = Math.max(40, Math.min(this.width - sidePadding * 2, (titleRight - titleX) * 2));
  ctx.fillText(fitSingleLineText(ctx, this.currentTopic(), titleW), titleX, headerCenterY);
  ctx.textBaseline = "alphabetic";

  var shareX = settingsX - buttonSize - 8;

  if (showShare) {
    shareX = Math.max(128, shareX);
    this.rects.share = { x: shareX, y: buttonY, w: buttonSize, h: buttonSize };
    if (this.images.share && this.images.share.width) {
      ctx.drawImage(this.images.share, shareX, buttonY, buttonSize, buttonSize);
    }
  }
};

PersoMinigame.prototype.drawNoteActionBadge = function drawNoteActionBadge(ctx, x, y, compact) {
  var icon = this.images.page;
  var iconSize = compact ? 22 : 24;
  if (icon && icon.width) {
    ctx.drawImage(icon, x, y, iconSize, iconSize);
  } else {
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, x, y, iconSize, iconSize, 2);
    ctx.fill();
  }
};

PersoMinigame.prototype.drawNoteActionButton = function drawNoteActionButton(ctx, x, y) {
  var icon = this.images.page;

  if (icon && icon.width) {
    ctx.drawImage(icon, x + 16, y + 17, 25, 25);
  } else {
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, x + 16, y + 17, 25, 25, 2);
    ctx.fill();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(15);
  ctx.textAlign = "left";
  ctx.fillText("递纸条", x + 48, y + 36);
};

PersoMinigame.prototype.drawSpeakerCard = function drawSpeakerCard(ctx, speaker, content, stageTop, stageBottom, isThinking, hideNoteAction) {
  var speakerSize = 200;
  var badgeW = 111;
  var badgeH = 51;
  var bubbleMinH = 76;
  var cardH = badgeH + speakerSize + bubbleMinH - 56;
  var y = stageTop + Math.max(18, (stageBottom - stageTop - cardH - 102) / 2);
  var centerX = this.width / 2;
  var badge = speaker === "user" ? this.images.userBadge : this.images[speaker + "Badge"];
  var animState = isThinking ? "thinking" : (content ? "speaking" : "idle");
  var animOffset = this.getPersonaAnimOffset(speaker, animState);

  if (badge && badge.width) {
    var realBadgeW = Math.min(badgeW, badge.width / badge.height * badgeH);
    ctx.drawImage(badge, centerX - realBadgeW / 2, y, realBadgeW, badgeH);
  } else {
    ctx.fillStyle = "#000000";
    ctx.fillRect(centerX - badgeW / 2, y, badgeW, 32);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = this.pixelFont(18);
    ctx.textAlign = "center";
    ctx.fillText(speaker, centerX, y + 22);
  }

  var sprite = speaker === "user" ? this.images.user : this.images[speaker];
  if (sprite && sprite.width) {
    ctx.drawImage(
      sprite,
      Math.round(centerX - speakerSize / 2 + animOffset.x),
      Math.round(y + badgeH + animOffset.y),
      speakerSize,
      speakerSize
    );
  }
  if (!hideNoteAction && this.mode !== "participant" && speaker !== "user") {
    var noteButtonX = Math.round(clamp(centerX + speakerSize / 2 - 14, 24, this.width - NOTE_ACTION_BUTTON_WIDTH - 24));
    var noteButtonY = Math.round(y + badgeH + 54);
    this.drawNoteActionButton(ctx, noteButtonX, noteButtonY);
    this.rects.notePersonas[speaker] = {
      x: noteButtonX,
      y: noteButtonY,
      w: NOTE_ACTION_BUTTON_WIDTH,
      h: NOTE_ACTION_BUTTON_HEIGHT
    };
  }

  this.drawSpeechBubble(ctx, speaker, content || "", 24, y + badgeH + speakerSize - 80, this.width - 48);
  return y + badgeH + speakerSize - 80 + this.getSpeechBubbleHeight(ctx, content || "", this.width - 48);
};

PersoMinigame.prototype.getSpeechBubbleHeight = function getSpeechBubbleHeight(ctx, content, w) {
  return Math.max(76, 28 + this.getSpeechBubbleLines(ctx, content, w, 5).length * SPEECH_BUBBLE_LINE_HEIGHT);
};

PersoMinigame.prototype.drawSpeechBubble = function drawSpeechBubble(ctx, speaker, content, x, y, w) {
  var colors = speaker === "user" ? USER_BUBBLE_COLORS : this.getBubbleColors(speaker);
  var lineHeight = SPEECH_BUBBLE_LINE_HEIGHT;
  var lines = this.getSpeechBubbleLines(ctx, content, w, 5);
  var h = this.getSpeechBubbleHeight(ctx, content, w);

  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = colors.bubbleBg;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    x + SPEECH_BUBBLE_PADDING_X,
    y,
    this.getSpeechBubbleTextWidth(w),
    h
  );
  ctx.clip();
  ctx.fillStyle = colors.bubbleText;
  ctx.font = this.pixelFont(SPEECH_BUBBLE_TEXT_FONT_SIZE);
  ctx.textAlign = "left";
  for (var i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], x + SPEECH_BUBBLE_PADDING_X, y + 28 + i * lineHeight);
  }
  ctx.restore();
};

PersoMinigame.prototype.getBubbleColors = function getBubbleColors(id) {
  var group = PERSONA_GROUP[id];
  if (group === "NT") return { bubbleBg: "#8046F5", bubbleText: "#FFC700" };
  if (group === "NF") return { bubbleBg: "#B1FD00", bubbleText: "#5B5CF3" };
  if (group === "SJ") return { bubbleBg: "#A3F8FF", bubbleText: "#5B5CF3" };
  return { bubbleBg: "#FFDD00", bubbleText: "#8046F5" };
};

PersoMinigame.prototype.drawAudienceRow = function drawAudienceRow(ctx, speaker, y) {
  var audience = this.selected.filter(function filterSpeaker(id) {
    return id !== speaker;
  }).slice(0, 4);
  var count = audience.length;
  if (count === 0) return;

  var size = count >= 4 ? 74 : 80;
  var labelH = count >= 4 ? 33 : 36;
  var gap = count === 1 ? 0 : (this.width - 60 - count * size) / (count - 1);
  var x = count === 1 ? (this.width - size) / 2 : 30;

  for (var i = 0; i < audience.length; i += 1) {
    var id = audience[i];
    var ax = x + i * (size + gap);
    var idleOffset = this.getPersonaAnimOffset(id, "idle");
    var drawX = ax + idleOffset.x;
    var drawY = y + idleOffset.y;
    this.drawRoundAvatar(ctx, id, drawX, drawY, size, false, labelH, count >= 4 ? 18 : 20);
    if (this.mode !== "participant") {
      var labelY = drawY + size * (1 - AVATAR_LABEL_COVER_RATIO);
      this.drawNoteActionBadge(ctx, drawX + size - 18, labelY + labelH - 20, true);
      this.rects.notePersonas[id] = { x: drawX, y: drawY, w: size, h: size + labelH };
    }
  }
};

PersoMinigame.prototype.drawRoundAvatar = function drawRoundAvatar(ctx, id, x, y, size, overlay, labelHeight, labelFontSize, showLabel) {
  var group = PERSONA_GROUP[id];
  var color = GROUP_COLORS[group] ? GROUP_COLORS[group].avatarBg : "#FFC700";
  var image = this.images[id];
  var labelH = labelHeight || Math.round(size * AVATAR_LABEL_COVER_RATIO);
  var labelY = y + size * (1 - AVATAR_LABEL_COVER_RATIO);
  var fontSize = labelFontSize || 16;
  var shouldShowLabel = showLabel !== false;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  if (image && image.width) {
    var imgSize = size * 1.05;
    ctx.drawImage(image, x + (size - imgSize) / 2, y, imgSize, imgSize);
  }
  if (overlay) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  if (!shouldShowLabel) return;

  ctx.fillStyle = "#000000";
  roundedRect(ctx, x, labelY, size, labelH, 2);
  ctx.fill();
  ctx.fillStyle = overlay ? "#777777" : "#FFFFFF";
  ctx.font = this.pixelFont(fontSize, "700");
  ctx.textAlign = "center";
  ctx.fillText(id, x + size / 2, labelY + labelH / 2 + fontSize / 3 - 2);
};

PersoMinigame.prototype.drawLiveControls = function drawLiveControls(ctx, bottomReservation) {
  var y = this.height - bottomReservation;
  var h = bottomReservation;
  var hasAtmosphere = this.mode !== "participant" && this.status !== "done";
  var hasParticipantInput = this.mode === "participant" && this.status !== "done";
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, y, this.width, h);
  ctx.strokeStyle = "#1F1F1F";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(this.width, y);
  ctx.stroke();

  if (hasAtmosphere) this.drawAtmosphereControls(ctx, y + 10);
  if (hasParticipantInput) this.drawParticipantInput(ctx, y + 12);

  var controlsOffsetY = hasParticipantInput ? 54 : 0;
  var hasEndButton = this.status !== "done";
  var progressX = 30;
  var progressY = y + controlsOffsetY + (hasAtmosphere ? 62 : 18);
  var progressW = this.width - 30 - 30 - (hasEndButton ? 140 : 70);
  var ratio = this.getProgressRatio();
  this.rects.progress = { x: progressX, y: progressY - 10, w: progressW, h: 40 };

  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.fillRect(progressX, progressY, progressW, 20);
  ctx.strokeRect(progressX, progressY, progressW, 20);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(progressX + 5, progressY + 5, (progressW - 10) * ratio, 10);
  ctx.fillRect(progressX + Math.max(0, (progressW - 14) * ratio), progressY - 4, 14, 28);

  var btnY = y + controlsOffsetY + (hasAtmosphere ? 58 : 14);
  var playLabel = this.getPlaybackToggleLabel();
  this.drawSmallPixelButton(ctx, playLabel, this.width - 30 - (hasEndButton ? 132 : 63), btnY, 63, 28, "playToggle");
  if (hasEndButton) this.drawSmallPixelButton(ctx, "结束", this.width - 30 - 63, btnY, 63, 28, "end");
};

PersoMinigame.prototype.drawParticipantInput = function drawParticipantInput(ctx, y) {
  var x = 24;
  var h = 38;
  var gap = 8;
  var sendW = 58;
  var inputW = this.width - x * 2 - sendW - gap;
  var sendX = x + inputW + gap;
  var text = this.participantDraftText || "";
  var active = !!text.trim();

  roundedRect(ctx, x, y, inputW, h, 8);
  ctx.fillStyle = "#171717";
  ctx.fill();
  ctx.strokeStyle = this.editingParticipantText ? "#B1FD00" : "#454545";
  ctx.lineWidth = this.editingParticipantText ? 2 : 1;
  ctx.stroke();

  ctx.fillStyle = text ? "#FFFFFF" : "#777777";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(fitSingleLineText(ctx, text || "你也说一句", inputW - 24), x + 12, y + 24);

  roundedRect(ctx, sendX, y, sendW, h, 8);
  ctx.fillStyle = active ? "#B1FD00" : "#343434";
  ctx.fill();
  ctx.strokeStyle = active ? "#89B93B" : "#454545";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = active ? "#000000" : "#777777";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText("发送", sendX + sendW / 2, y + 24);

  this.rects.participantInput = { x: x, y: y, w: inputW, h: h };
  this.rects.participantSend = { x: sendX, y: y, w: sendW, h: h };
};

PersoMinigame.prototype.drawAtmosphereControls = function drawAtmosphereControls(ctx, y) {
  var options = [
    { value: "sharp", label: "毒舌" },
    { value: "plain", label: "说人话" },
    { value: "sincere", label: "真诚" },
    { value: "assertive", label: "强势" }
  ];
  var x = 30;
  var gap = 8;
  var w = Math.floor((this.width - 60 - gap * 3) / 4);
  var h = 28;
  this.rects.atmospheres = {};

  for (var i = 0; i < options.length; i += 1) {
    var item = options[i];
    var bx = x + i * (w + gap);
    var active = this.atmosphereSelected && this.atmosphere === item.value;
    roundedRect(ctx, bx, y, w, h, 12);
    ctx.fillStyle = active ? "#B1FD00" : "#111111";
    ctx.fill();
    ctx.strokeStyle = active ? "#89B93B" : "#454545";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = active ? "#000000" : "#FFFFFF";
    ctx.font = this.pixelFont(12);
    ctx.textAlign = "center";
    ctx.fillText(item.label, bx + w / 2, y + 19);
    this.rects.atmospheres[item.value] = { x: bx, y: y, w: w, h: h };
  }
};

PersoMinigame.prototype.drawSmallPixelButton = function drawSmallPixelButton(ctx, label, x, y, w, h, key) {
  if (this.images.button && this.images.button.width) {
    ctx.drawImage(this.images.button, x, y, w, h);
  } else {
    ctx.fillStyle = "#101010";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#8A8A8A";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 19);
  this.rects[key] = { x: x, y: y, w: w, h: h };
};

PersoMinigame.prototype.drawHeader = function drawHeader(ctx, x, y, contentW) {
  var title = this.images.title;
  var titleH = 48;
  var titleW = 138;
  var logoY = y + SELECTION_LOGO_OFFSET_Y;

  if (title && title.width) {
    titleW = title.width / title.height * titleH;
    ctx.drawImage(title, x, logoY, titleW, titleH);
  } else {
    ctx.fillStyle = "#B1FD00";
    ctx.font = this.pixelFont(36, "700");
    ctx.textAlign = "left";
    ctx.fillText("Perso", x, logoY + 38);
  }

  ctx.fillStyle = "#D3D1D1";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "left";
  // ctx.fillText("听听不同MBTI人格的声音～", x + titleW + 20, y + titleH - 5);

  return logoY + titleH;
};

PersoMinigame.prototype.drawPersonaSection = function drawPersonaSection(ctx, x, y, contentW) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "left";
  ctx.fillText("选择2-4个人格", x, y + 13);

  var avatarSize = Math.min(64, Math.floor((contentW - 30) / 4));
  var gapX = (contentW - avatarSize * 4) / 3;
  var rowGap = 0;
  var itemH = avatarSize + Math.round(avatarSize * AVATAR_LABEL_COVER_RATIO);
  var gridTop = y + 32;

  for (var i = 0; i < config.PERSONA_IDS.length; i += 1) {
    var id = config.PERSONA_IDS[i];
    var col = i % 4;
    var row = Math.floor(i / 4);
    var ax = x + col * (avatarSize + gapX);
    var ay = gridTop + row * (itemH + rowGap);
    this.drawAvatar(ctx, id, ax, ay, avatarSize, this.selected.indexOf(id) < 0);
    this.rects.personas[id] = { x: ax, y: ay - this.scrollY, w: avatarSize, h: itemH + 4 };
  }

  var labelH = Math.round(avatarSize * AVATAR_LABEL_COVER_RATIO);
  var lastRowY = gridTop + 3 * (itemH + rowGap);
  var gridVisualBottom = lastRowY + avatarSize * (1 - AVATAR_LABEL_COVER_RATIO) + SELECTION_AVATAR_LABEL_OFFSET_Y + labelH;
  var warningY = gridVisualBottom + (this.error ? 10 : 2);
  this.drawWarning(ctx, x + 10, warningY);

  var modeY = gridVisualBottom + (this.error ? 44 : 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "left";
  ctx.fillText("选择模式", x, modeY + 18);
  this.drawModeButton(ctx, "participant", "参与", x + 78, modeY, 62, 28);
  this.drawModeButton(ctx, "fun", "趣玩", x + 140, modeY, 62, 28);

  return modeY + 28;
};

PersoMinigame.prototype.drawAvatar = function drawAvatar(ctx, id, x, y, size, overlay) {
  var group = PERSONA_GROUP[id];
  var color = GROUP_COLORS[group] ? GROUP_COLORS[group].avatarBg : "#FFC700";
  var image = this.images[id];
  var labelH = Math.round(size * AVATAR_LABEL_COVER_RATIO);
  var labelY = y + size * (1 - AVATAR_LABEL_COVER_RATIO) + SELECTION_AVATAR_LABEL_OFFSET_Y;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();

  if (image && image.width) {
    var imgSize = size * 1.05;
    ctx.drawImage(image, x + (size - imgSize) / 2, y, imgSize, imgSize);
  }

  if (overlay) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  ctx.fillStyle = "#000000";
  roundedRect(ctx, x, labelY, size, labelH, 2);
  ctx.fill();

  ctx.fillStyle = overlay ? "#777777" : "#FFFFFF";
  ctx.font = this.pixelFont(16);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(id, x + size / 2, labelY + labelH / 2 + SELECTION_AVATAR_LABEL_TEXT_OFFSET_Y);
  ctx.textBaseline = "alphabetic";
};

PersoMinigame.prototype.drawWarning = function drawWarning(ctx, x, y) {
  var hasError = !!this.error;
  var iconW = 5;
  if (this.images.warning && this.images.warning.width) {
    var iconH = WARNING_ICON_HEIGHT;
    iconW = this.images.warning.width / this.images.warning.height * iconH;
    ctx.globalAlpha = hasError ? 1 : 0;
    ctx.drawImage(this.images.warning, x, y + 1, iconW, iconH);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = "#FFC700";
  ctx.globalAlpha = hasError ? 1 : 0;
  ctx.font = this.pixelFont(12);
  ctx.textAlign = "left";
  ctx.fillText(this.error || "请选择2-4个人格", x + iconW + 8, y + 13);
  ctx.globalAlpha = 1;
};

PersoMinigame.prototype.drawModeButton = function drawModeButton(ctx, value, label, x, y, w, h) {
  var active = this.mode === value;
  ctx.fillStyle = active ? "#B1FD00" : "#111111";
  ctx.strokeStyle = active ? "#89B93B" : "#454545";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  if (active) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 1, y + 1, w - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, h - 2);
  }

  ctx.fillStyle = active ? "#000000" : "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 19);

  if (value === "participant") this.rects.modeParticipant = { x: x, y: y - this.scrollY, w: w, h: h };
  else this.rects.modeSpectator = { x: x, y: y - this.scrollY, w: w, h: h };
};

PersoMinigame.prototype.drawTopicSection = function drawTopicSection(ctx, x, y, contentW) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "left";
  ctx.fillText("输入一个话题", x, y + 13);

  var topicY = y + 32;
  for (var i = 0; i < PRESET_TOPICS.length; i += 1) {
    var topic = PRESET_TOPICS[i];
    var active = !this.customTopic.trim() && this.selectedTopic === topic;
    var lines = wrapText(ctx, topic, contentW - 32, 2);
    var pillH = Math.max(42, 24 + lines.length * 17);

    roundedRect(ctx, x, topicY, contentW, pillH, 15);
    ctx.fillStyle = active ? "#B1FD00" : "#000000";
    ctx.fill();
    if (!active) {
      ctx.strokeStyle = "#454545";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = active ? "#5B5CF3" : "#FFFFFF";
    ctx.font = this.pixelFont(13);
    ctx.textAlign = "left";
    for (var j = 0; j < lines.length; j += 1) {
      ctx.fillText(lines[j], x + 16, topicY + 26 + j * 17);
    }

    this.rects.topics[i] = { x: x, y: topicY - this.scrollY, w: contentW, h: pillH };
    topicY += pillH + 16;
  }

  this.drawCustomTopic(ctx, x, topicY + 4, contentW);
  return topicY + 58;
};

PersoMinigame.prototype.drawCustomTopic = function drawCustomTopic(ctx, x, y, w) {
  var gradient = ctx.createLinearGradient(x, y, x + w, y);
  gradient.addColorStop(0, "#515050");
  gradient.addColorStop(1, "#202020");

  roundedRect(ctx, x, y, w, 44, 22);
  ctx.fillStyle = gradient;
  ctx.fill();
  if (this.editingCustomTopic) {
    ctx.strokeStyle = "#B1FD00";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  var cursorVisible = this.editingCustomTopic && Math.floor(Date.now() / 520) % 2 === 0;
  var displayText = this.customTopic || (this.editingCustomTopic ? "直接输入，Enter 完成" : "自由输入");
  if (this.customTopic && cursorVisible) displayText += "|";
  ctx.fillStyle = this.customTopic ? "#F5F5F5" : this.editingCustomTopic ? "#B1FD00" : "#7A7A7A";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(fitSingleLineText(ctx, displayText, w - 32), x + 16, y + 28);

  this.rects.customTopic = { x: x, y: y - this.scrollY, w: w, h: 44 };
};

PersoMinigame.prototype.drawBottomBar = function drawBottomBar(ctx, footerH) {
  var y = this.height - footerH;
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, y, this.width, footerH);
  ctx.strokeStyle = "#1F1F1F";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(this.width, y);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = this.pixelFont(12);
  ctx.textAlign = "left";
  var selectedText = this.selected.length > 0 ? this.selected.join(" / ") : "未选择人格";
  var selectedLines = wrapText(ctx, selectedText, this.width - 126, 1);
  ctx.fillText(selectedLines[0] || "", 30, y + 38);

  var buttonW = 63;
  var buttonH = 28;
  var buttonX = this.width - 30 - buttonW;
  var buttonY = y + 18;
  var disabled = this.status === "loading" || this.selected.length < 2;
  this.rects.start = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };

  ctx.globalAlpha = disabled ? 0.4 : 1;
  if (this.images.button1 && this.images.button1.width) {
    ctx.drawImage(this.images.button1, buttonX, buttonY, buttonW, buttonH);
  } else {
    ctx.fillStyle = "#B1FD00";
    ctx.fillRect(buttonX, buttonY, buttonW, buttonH);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#000000";
  ctx.font = this.pixelFont(13);
  ctx.textAlign = "center";
  ctx.fillText(this.status === "loading" ? "..." : "开始", buttonX + buttonW / 2, buttonY + 19);
};

PersoMinigame.prototype.drawSelectionScrollbar = function drawSelectionScrollbar(ctx, viewportH) {
  if (this.maxScrollY <= 0) return;

  var topReserved = this.getTopReserved();
  var trackH = Math.max(80, viewportH - topReserved - 20);
  var trackY = topReserved + 10;
  var trackX = this.width - 8;
  var thumbH = Math.max(34, trackH * (viewportH / Math.max(viewportH, this.contentHeight)));
  var thumbY = trackY + (trackH - thumbH) * (this.scrollY / this.maxScrollY);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundedRect(ctx, trackX, trackY, 3, trackH, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  roundedRect(ctx, trackX - 1, thumbY, 5, thumbH, 3);
  ctx.fill();
};

new PersoMinigame();
