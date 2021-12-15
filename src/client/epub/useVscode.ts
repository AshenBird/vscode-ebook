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
  const uri = ref("");
  provide("create", create);
  provide("content", content);
  provide("ready", ready);
  provide("config", config);
  // @ts-ignore
  if (acquireVsCodeApi) {

    const restartEditor = () => {
    };

    // @ts-ignore
    const vscode = acquireVsCodeApi();
    const state = vscode.getState();
    if (state?.uri) {
      uri.value = state.uri;
    }
    watch(ready, (n,o) => {
      if (!n) { return; }
      vscode.postMessage({
        type: "ready",
      });
    });
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.type) {
        case "change": {
          uri.value = message.uri;
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
    ready,
    config,
    uri
  };
};