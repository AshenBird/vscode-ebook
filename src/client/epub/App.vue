<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  shallowRef,
} from "vue";
import { NConfigProvider, darkTheme, NSpin } from "naive-ui";
import { useVscode } from "./useVscode";
import { Book, Rendition } from "epubjs";
import ePub from "epubjs";
// @ts-ignore
import InlineView from "epubjs/src/managers/views/inline";
const { config, ready, uri } = useVscode();


ready.value = true;

const readonly = ref(config.value.mode === "read");

// 主题配置
const theme = computed(() =>
  config.value.theme === "dark" ? darkTheme : null
);

class CustomView extends InlineView {
  constructor(...args: any[]) {
    super(...args);
    // @ts-ignore
    this._width = this.settings.width;
    // @ts-ignore
    this.width = function () {
      // @ts-ignore
      return this._width;
    }.bind(this);
  }
}

const book = shallowRef<Book | undefined>();
const renderer = shallowRef<Rendition | undefined>();
const rendered = ref(false);
const defaultStyle = document.getElementById("_defaultStyles")
  ?.innerHTML as string;
const htmlStyle = document.querySelector("html")?.getAttribute("style") || "";

const onScroll = (e: WheelEvent) => {
  if (!rendered.value) return;
  if (e.deltaY > 0) {
    // 下一页
    renderer.value?.next(); //.then(mountScroll);
    return;
  }
  // 上一页
  renderer.value?.prev(); //.then(mountScroll);
};

const mountScroll = () => {
  const target = window.frames[0]?.document;
  target?.addEventListener("wheel", onScroll as EventListener);

  (target.querySelector("html") as HTMLHtmlElement).setAttribute(
    "style",
    htmlStyle
  );
  const style = document.createElement("style");
  style.innerHTML = defaultStyle
  + `
    html{
      font-family: v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    p {
      letter-spacing: 1px;
      line-height: 1.5;
    }
    html body svg{
      width:unset;
      max-width:unset !important;
      height:unset;
      max-height:unset !important;
    }
    html body img{
      width: unset !important;
      max-width: 100% !important;
      max-height: 100% !important;
    }
    tr{
      background-color: transparent !important;
    }
    td{
      border: var(--vscode-foreground) solid 1px !important;
    }
  `;
  target.head.appendChild(style);

  console.log(renderer.value?.adjustImages)
};
const removeWatch = watch(uri, async (n, o) => {
  if(!n)return;
  // @ts-ignore
  book.value = ePub(n, { encoding: "binary" }) as Book;
  const r = book.value?.renderTo("Book", {
    flow: "paginated",
  });
  if (r) {
    renderer.value = r;
    r.hooks.render.register(mountScroll);
    await renderer.value.display();
    rendered.value = true;
    
    removeWatch();
  }
},{
  immediate:true
});
</script>
<template>
  <div>
    <n-config-provider :theme="theme">
      <n-spin :show="!rendered">
        <div id="Book" style="height: 100vh" @wheel="onScroll"></div>
      </n-spin>
    </n-config-provider>
  </div>
</template>
<style lang="scss">



</style>
