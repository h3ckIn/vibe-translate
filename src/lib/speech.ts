// Web Speech API wrapper for live subtitle mode.
// Falls back gracefully when the browser does not support speech recognition.

export interface SubtitleEvent {
  text: string;
  isFinal: boolean;
  lang: string;
  ts: number;
}

export interface SubtitleController {
  start: (lang: string, onEvent: (e: SubtitleEvent) => void, onError: (msg: string) => void) => void;
  stop: () => void;
  supported: boolean;
}

export function createSubtitleController(): SubtitleController {
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  let recognition: any = null;

  return {
    supported: !!SR,
    start(lang, onEvent, onError) {
      if (!SR) {
        onError('当前浏览器不支持 Web Speech API（推荐使用 Chrome / Edge）');
        return;
      }
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          /* noop */
        }
      }
      recognition = new SR();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          onEvent({ text: r[0].transcript, isFinal: r.isFinal, lang, ts: Date.now() });
        }
      };
      recognition.onerror = (e: any) => {
        const err = e.error || e.message;
        let msg = `语音识别错误: ${err}`;
        if (err === 'not-allowed') {
          msg = '⚠️ 麦克风权限被拒绝。请检查浏览器设置：\n1. 点击地址栏左侧的「🔒」图标\n2. 在「麦克风」选项中选择「允许」\n3. 刷新页面后重新尝试';
        } else if (err === 'no-speech') {
          msg = '未检测到语音，请确保麦克风正常工作并靠近说话。';
        } else if (err === 'network') {
          msg = '网络错误：语音识别需要联网，请检查网络连接。';
        } else if (err === 'service-not-allowed') {
          msg = '浏览器不支持语音识别（推荐使用 Chrome 或 Edge）。';
        }
        onError(msg);
      };
      recognition.onend = () => {
        // auto-restart for continuous mode
        try {
          recognition.start();
        } catch {
          /* ignore */
        }
      };
      try {
        recognition.start();
      } catch (e) {
        onError(`无法启动语音识别: ${(e as Error).message}`);
      }
    },
    stop() {
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch {
          /* noop */
        }
        recognition = null;
      }
    },
  };
}
