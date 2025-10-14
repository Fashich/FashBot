declare global {
  interface Window {
    puter?: any;
  }
}

const DEFAULT_PUTER_SRC = "https://js.puter.com/v2/";

export async function loadPuter(src?: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.puter) return;

  const scriptSrc =
    src ?? (import.meta.env?.VITE_PUTER_JS_URL as string) ?? DEFAULT_PUTER_SRC;

  return new Promise((resolve, reject) => {
    // If the script is already present in DOM, wait for it
    const existing = Array.from(document.getElementsByTagName("script")).find(
      (s) => s.src === scriptSrc,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      // if already loaded and puter present
      if ((window as any).puter) return resolve();
      return;
    }

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.onload = () => {
      // some CDNs attach to window.puter asynchronously; poll briefly
      const maxMs = 3000;
      const interval = 100;
      let waited = 0;
      const id = setInterval(() => {
        if ((window as any).puter) {
          clearInterval(id);
          resolve();
        }
        waited += interval;
        if (waited >= maxMs) {
          clearInterval(id);
          // resolve anyway; consumer can check window.puter
          resolve();
        }
      }, interval);
    };
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export async function puterChat(
  prompt: string,
  opts?: { model?: string; [k: string]: any },
): Promise<any> {
  await loadPuter();
  if (!window.puter || !window.puter.ai || !window.puter.ai.chat)
    throw new Error("Puter library not available");

  // The puter.ai.chat API typically returns a promise
  return window.puter.ai.chat(prompt, opts || {});
}

export default {
  loadPuter,
  puterChat,
};
