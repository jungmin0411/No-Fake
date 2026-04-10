import { Buffer } from "buffer";
import * as process from "process";

if (typeof window !== "undefined") {
  window.global = window;
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;

  if (!window.process.env) window.process.env = {};
  if (!window.process.nextTick) {
    window.process.nextTick = function nextTick(fn) {
      setTimeout(fn, 0);
    };
  }

  // Webpack fallback에서 vm은 비활성화되어 있으므로 브라우저용 stub만 둡니다.
  window.vm = window.vm || {};
}
