import { provide, Ref, ref, watch } from "vue";
export const useVscode = () => {
  const create = ref(()=>{}) as Ref<()=>void>;
  const content = ref<Uint8Array>(new Uint8Array());
  const ready = ref(false);
  const config = ref({
    theme: "dark",
    uri: "",
    eol: "LF",
    mode: "edit"
  });
  const vscodeSave = ref(()=>{});
  const uri = ref("");
  provide("create", create);
  provide("content", content);
  provide("ready", ready);
  provide("config", config);
  provide("vscodeSave", vscodeSave);
  // @ts-ignore
  if (acquireVsCodeApi) {

    const restartEditor = () => {
    };

    const updateEditor = (v: Uint8Array) => {
      content.value = v;
    };

    // @ts-ignore
    const vscode = acquireVsCodeApi();
    const state = vscode.getState();
    const serverLock = ref(false);
    if (state?.text) {
      content.value = state.text;
    }
    watch(content, (n,o) => {
      if (serverLock.value) {
        serverLock.value = false;
        return;
      }
      vscode.setState({ n });
      vscode.postMessage({
        type: "change",
        content: n,
      });
    });
    watch(ready, (n,o) => {
      if (!n) { return; }
      vscode.postMessage({
        type: "ready",
      });
    });
    vscodeSave.value =()=>{
      vscode.postMessage({
        type: "save",
      });
    };
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.type) {
        case "change": {
          const content = message.raw;
          uri.value = message.uri;
          // if (text === content.value) { return; }
          serverLock.value = true;
          updateEditor(content);
          return;
        }
        case "restart": {
          restartEditor();
          return;
        }
        case "config": {
          config.value = message.content;
          return;
        }
      }
    });
  }
  return {
    create,
    content,
    ready,
    config,
    vscodeSave,
    uri
  };
};