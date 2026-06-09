(function createBrowserTtAdapter(global) {
  var nativeTt = global.tt || {};
  var canvas = document.getElementById("game");
  var textInput = document.getElementById("text-input");
  var keyboardInputHandlers = [];
  var keyboardConfirmHandlers = [];
  var keyboardCompleteHandlers = [];
  var keyboardBlurHandlers = [];
  var touchStartHandlers = [];
  var touchMoveHandlers = [];
  var touchEndHandlers = [];
  var wheelHandlers = [];
  var keyboardState = {
    value: "",
    maxLength: 300,
    active: false
  };

  function emit(list, event) {
    for (var i = 0; i < list.length; i += 1) list[i](event);
  }

  function normalizeTouchEvent(event) {
    return event;
  }

  function getSystemInfoSync() {
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(320, Math.round(rect.width || window.innerWidth || 375));
    var height = Math.max(568, Math.round(rect.height || window.innerHeight || 667));
    return {
      platform: /android/i.test(navigator.userAgent)
        ? "android"
        : /iphone|ipad|ios/i.test(navigator.userAgent)
          ? "ios"
          : "devtools",
      pixelRatio: window.devicePixelRatio || 1,
      windowWidth: width,
      windowHeight: height,
      screenWidth: width,
      screenHeight: height,
      safeArea: {
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        width: width,
        height: height
      }
    };
  }

  function createImage() {
    return new Image();
  }

  function loadFont(path) {
    if (!document.fonts || !path) return "";
    try {
      var font = new FontFace("VonwaonBitmap", "url(" + path + ")");
      font.load().then(function onFontLoad(loaded) {
        document.fonts.add(loaded);
      }).catch(function noop() {});
    } catch (error) {}
    return "VonwaonBitmap";
  }

  function request(options) {
    var method = options.method || "GET";
    fetch(options.url, {
      method: method,
      headers: options.header || options.headers || {},
      body: method.toUpperCase() === "GET" ? undefined : JSON.stringify(options.data || {})
    }).then(function onResponse(response) {
      return response.text().then(function onText(text) {
        if (options.success) {
          options.success({
            statusCode: response.status,
            data: text
          });
        }
      });
    }).catch(function onError(error) {
      if (options.fail) options.fail({ errMsg: error && error.message ? error.message : "request fail" });
    });
  }

  function downloadFile(options) {
    fetch(options.url).then(function onResponse(response) {
      if (!response.ok) throw new Error("downloadFile status " + response.status);
      return response.blob().then(function onBlob(blob) {
        var url = URL.createObjectURL(blob);
        if (options.success) {
          options.success({
            statusCode: response.status,
            tempFilePath: url,
            filePath: url
          });
        }
      });
    }).catch(function onError(error) {
      if (options.fail) options.fail({ errMsg: error && error.message ? error.message : "downloadFile fail" });
    });
  }

  function createWebAudioInnerContext(AudioContextCtor) {
    var context = new AudioContextCtor();
    var source = null;
    var gain = context.createGain();
    var src = "";
    var startedAt = 0;
    var offset = 0;
    var duration = 0;
    var loop = false;
    var destroyed = false;
    var canplayHandlers = [];
    var playHandlers = [];
    var endedHandlers = [];
    var errorHandlers = [];
    gain.connect(context.destination);

    function emitHandlers(list, event) {
      for (var i = 0; i < list.length; i += 1) list[i](event || {});
    }

    function stopSource(resetOffset) {
      if (source) {
        try {
          source.stop(0);
        } catch (error) {}
        try {
          source.disconnect();
        } catch (error) {}
        source = null;
      }
      if (resetOffset) offset = 0;
      startedAt = 0;
    }

    function decodeAudioData(bytes) {
      return new Promise(function decode(resolve, reject) {
        try {
          var result = context.decodeAudioData(
            bytes.slice(0),
            function onSuccess(buffer) {
              resolve(buffer);
            },
            function onFail(error) {
              reject(error || new Error("decodeAudioData failed"));
            }
          );
          if (result && typeof result.then === "function") result.then(resolve).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    }

    return {
      autoplay: false,
      obeyMuteSwitch: false,
      get loop() {
        return loop;
      },
      set loop(value) {
        loop = !!value;
        if (source) source.loop = loop;
      },
      get volume() {
        return gain.gain.value;
      },
      set volume(value) {
        gain.gain.value = typeof value === "number" ? value : 1;
      },
      get src() {
        return src;
      },
      set src(value) {
        if (src !== (value || "")) {
          stopSource(true);
          duration = 0;
        }
        src = value || "";
      },
      get duration() {
        return duration || 0;
      },
      get currentTime() {
        if (source && startedAt) return Math.max(0, context.currentTime - startedAt);
        return offset;
      },
      set currentTime(value) {
        offset = Math.max(0, Number(value) || 0);
      },
      play: function play() {
        var self = this;
        if (destroyed || !src) return Promise.reject(new Error("missing audio src"));
        if (context.state === "suspended" && context.resume) {
          try {
            context.resume();
          } catch (error) {}
        }
        return fetch(src, { mode: "cors", cache: "no-store" })
          .then(function onResponse(response) {
            if (!response.ok) throw new Error("audio fetch " + response.status);
            return response.arrayBuffer();
          })
          .then(decodeAudioData)
          .then(function onDecoded(buffer) {
            stopSource(false);
            source = context.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            duration = buffer.duration || 0;
            if (offset >= duration) offset = 0;
            source.connect(gain);
            source.onended = function onEnded() {
              if (source && !loop) {
                offset = 0;
                startedAt = 0;
                source = null;
                emitHandlers(endedHandlers);
              }
            };
            startedAt = context.currentTime - offset;
            source.start(0, offset);
            emitHandlers(canplayHandlers);
            emitHandlers(playHandlers);
            return self;
          })
          .catch(function onAudioError(error) {
            emitHandlers(errorHandlers, {
              errMsg: error && error.message ? "webaudio error: " + error.message : "webaudio error"
            });
            throw error;
          });
      },
      pause: function pause() {
        if (source && startedAt) offset = Math.max(0, context.currentTime - startedAt);
        stopSource(false);
      },
      stop: function stop() {
        stopSource(true);
      },
      seek: function seek(value) {
        offset = Math.max(0, Number(value) || 0);
      },
      destroy: function destroy() {
        destroyed = true;
        stopSource(true);
        try {
          gain.disconnect();
        } catch (error) {}
      },
      onCanplay: function onCanplay(fn) {
        canplayHandlers.push(fn);
      },
      onPlay: function onPlay(fn) {
        playHandlers.push(fn);
      },
      onEnded: function onEnded(fn) {
        endedHandlers.push(fn);
      },
      onError: function onError(fn) {
        errorHandlers.push(fn);
      }
    };
  }

  function createInnerAudioContext() {
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) return createWebAudioInnerContext(AudioContextCtor);

    var audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    var api = {
      loop: false,
      autoplay: false,
      volume: 1,
      get src() {
        return audio.src;
      },
      set src(value) {
        audio.src = value || "";
      },
      get duration() {
        return audio.duration || 0;
      },
      get currentTime() {
        return audio.currentTime || 0;
      },
      set currentTime(value) {
        try {
          audio.currentTime = Number(value) || 0;
        } catch (error) {}
      },
      play: function play() {
        audio.loop = !!api.loop;
        audio.volume = typeof api.volume === "number" ? api.volume : 1;
        return audio.play();
      },
      pause: function pause() {
        audio.pause();
      },
      stop: function stop() {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch (error) {}
      },
      seek: function seek(value) {
        try {
          audio.currentTime = Number(value) || 0;
        } catch (error) {}
      },
      destroy: function destroy() {
        audio.pause();
        audio.src = "";
      },
      onCanplay: function onCanplay(fn) {
        audio.addEventListener("canplay", fn);
      },
      onPlay: function onPlay(fn) {
        audio.addEventListener("play", fn);
      },
      onEnded: function onEnded(fn) {
        audio.addEventListener("ended", fn);
      },
      onError: function onError(fn) {
        audio.addEventListener("error", function handleError() {
          var mediaError = audio.error;
          var code = mediaError && mediaError.code ? mediaError.code : "unknown";
          var message = mediaError && mediaError.message ? mediaError.message : "";
          fn({ errMsg: "audio error " + code + (message ? ": " + message : "") });
        });
      }
    };
    return api;
  }

  function unlockAudio() {
    var silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";
    try {
      var audio = new Audio(silentWav);
      audio.muted = true;
      audio.volume = 0;
      var result = audio.play();
      if (result && result.catch) result.catch(function noop() {});
    } catch (error) {}

    try {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        var context = new AudioContextCtor();
        if (context.resume) context.resume().catch(function noop() {});
      }
    } catch (error) {}
  }

  function showKeyboard(options) {
    keyboardState.value = String((options && options.defaultValue) || "");
    keyboardState.maxLength = Number(options && options.maxLength) || 300;
    keyboardState.active = true;
    textInput.maxLength = keyboardState.maxLength;
    textInput.value = keyboardState.value;
    textInput.classList.add("active");
    setTimeout(function focusInput() {
      textInput.focus();
      textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }, 0);
    if (options && options.success) options.success();
  }

  function hideKeyboard() {
    if (!keyboardState.active) return;
    keyboardState.active = false;
    textInput.classList.remove("active");
    textInput.blur();
  }

  textInput.addEventListener("input", function onInput() {
    keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
    emit(keyboardInputHandlers, { value: keyboardState.value });
  });

  textInput.addEventListener("keydown", function onKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
      emit(keyboardConfirmHandlers, { value: keyboardState.value });
      emit(keyboardCompleteHandlers, { value: keyboardState.value });
      hideKeyboard();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      hideKeyboard();
      emit(keyboardBlurHandlers, { value: keyboardState.value });
    }
  });

  textInput.addEventListener("blur", function onBlur() {
    if (!keyboardState.active) return;
    keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
    emit(keyboardBlurHandlers, { value: keyboardState.value });
    keyboardState.active = false;
    textInput.classList.remove("active");
  });

  canvas.addEventListener("wheel", function onWheel(event) {
    emit(wheelHandlers, event);
  }, { passive: false });

  global.tt = {
    createCanvas: function createCanvas() {
      return canvas;
    },
    isBrowserAdapter: true,
    createImage: createImage,
    getSystemInfoSync: getSystemInfoSync,
    getMenuButtonBoundingClientRect: function getMenuButtonBoundingClientRect() {
      return { top: 14, bottom: 46, left: getSystemInfoSync().windowWidth - 96, right: getSystemInfoSync().windowWidth - 16 };
    },
    loadFont: loadFont,
    request: request,
    downloadFile: downloadFile,
    createInnerAudioContext: createInnerAudioContext,
    unlockAudio: unlockAudio,
    showKeyboard: showKeyboard,
    hideKeyboard: hideKeyboard,
    onKeyboardInput: function onKeyboardInput(fn) {
      keyboardInputHandlers.push(fn);
    },
    onKeyboardConfirm: function onKeyboardConfirm(fn) {
      keyboardConfirmHandlers.push(fn);
    },
    onKeyboardComplete: function onKeyboardComplete(fn) {
      keyboardCompleteHandlers.push(fn);
    },
    onKeyboardBlur: function onKeyboardBlur(fn) {
      keyboardBlurHandlers.push(fn);
    },
    onTouchStart: function onTouchStart(fn) {
      touchStartHandlers.push(fn);
    },
    onTouchMove: function onTouchMove(fn) {
      touchMoveHandlers.push(fn);
    },
    onTouchEnd: function onTouchEnd(fn) {
      touchEndHandlers.push(fn);
    },
    onWheel: function onWheel(fn) {
      wheelHandlers.push(fn);
    },
    onMouseWheel: function onMouseWheel(fn) {
      wheelHandlers.push(fn);
    },
    getStorageSync: function getStorageSync(key) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        return "";
      }
    },
    setStorageSync: function setStorageSync(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch (error) {}
    },
    getGameRecorderManager: nativeTt.getGameRecorderManager
      ? nativeTt.getGameRecorderManager.bind(nativeTt)
      : null,
    shareAppMessage: nativeTt.shareAppMessage
      ? nativeTt.shareAppMessage.bind(nativeTt)
      : null,
    saveVideoToPhotosAlbum: nativeTt.saveVideoToPhotosAlbum
      ? nativeTt.saveVideoToPhotosAlbum.bind(nativeTt)
      : null,
    navigateToScene: nativeTt.navigateToScene
      ? nativeTt.navigateToScene.bind(nativeTt)
      : null
  };
})(window);
