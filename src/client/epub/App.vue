<script setup lang="tsx">
import { ref, computed, watch, shallowRef, onMounted, onBeforeMount, nextTick } from "vue";
import {
  NConfigProvider,
  darkTheme,
  NSpin,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NButton,
  NIcon,
  NDrawer,
  NDrawerContent,
  MenuOption,
  NMenu,
} from "naive-ui";
import { useVscode } from "./useVscode";
import { Menu as MenuIcon } from "@vicons/ionicons5";
import { Book, NavItem, Rendition } from "epubjs";
import ePub from "epubjs";
// @ts-ignore
// import InlineView from "epubjs/lib/managers/views/inline.js";
const { config, ready, uri } = useVscode();

const readonly = ref(config.value.mode === "read");

// 主题配置
const theme = computed(() =>
  config.value.theme === "dark" ? darkTheme : null
);
const tocActive = ref(true);
// class CustomView extends InlineView {
//   constructor(...args: any[]) {
//     super(...args);
//     // @ts-ignore
//     this._width = this.settings.width;
//     // @ts-ignore
//     this.width = function () {
//       // @ts-ignore
//       return this._width;
//     }.bind(this);
//   }
// }

const book = shallowRef<Book | undefined>();
const renderer = shallowRef<Rendition | undefined>();
const rendered = ref(false);
const defaultStyle = document.getElementById("_defaultStyles")
  ?.innerHTML as string;
const htmlStyle = document.querySelector("html")?.getAttribute("style") || "";

const toc = shallowRef<MenuOption[]>([]);
const currentSection = ref("")
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
  style.innerHTML =
    defaultStyle +
    `
    html{
      font-family: v-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    p {
      letter-spacing: 1px;
      line-height: 1.5;
    }
    html body svg{
      /* width: unset !important; */
      max-width:unset !important;
      height:unset;
      max-height:unset !important;
    }
    html body img{
      /* width: unset !important; */
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
};
const navTransform = (toc: NavItem[]): MenuOption[] => {
  return toc.map((item) => ({
    label: ()=><span id={`ID-${item.href}`}>{item.label}</span>,
    key: item.href,
    children: item.subitems&&item.subitems.length ? navTransform(item.subitems) : undefined,
  }));
};

const removeWatch = watch(
  uri,
  async (n, o) => {
    if (!n) return;
    // @ts-ignore
    book.value = ePub(n, { encoding: "binary" }) as Book;
    const r = book.value?.renderTo("Book", {
      flow: "paginated",
    });
    if (r) {
      renderer.value = r;
      const start = window.localStorage.getItem(`history://${uri}`);
      r.hooks.render.register(mountScroll);
      await renderer.value.display(start || undefined);

      renderer.value.on("locationChanged", (e: any) => {
        // console.log(e)
        currentSection.value=e.href
        window.localStorage.setItem(`history://${uri}`, e.start);
      });

      toc.value = navTransform(book.value.navigation.toc)

      rendered.value = true;
      removeWatch();
    }
  },
  {
    immediate: true,
  }
);
const showTOC = async () => {
  const t =  document.querySelector(".n-drawer")?.classList
  //@ts-ignore
  if(![...t].includes("show")){
    t?.add("show")
  }
  tocActive.value = true;
  await document.querySelector(`#ID-${currentSection.value}`)?.scrollIntoView()
};

const nav =  (href: string) => {
  renderer.value?.display(href);
  tocActive.value = false;
  // @ts-ignore
};


onMounted(async () => {
  ready.value = true;
  await nextTick();
  tocActive.value = false;
  
});
</script>
<template>
  <n-config-provider :theme="theme" style="height: 100%">
    <n-spin :show="!rendered" style="height: 100%">
      <n-layout style="height: 100pvh">
        <n-layout-header
          style="
            height: 40px;
            padding-left: 15px;
            display: flex;
            align-items: center;
          "
        >
          <n-button text style="font-size: 24px" @click="showTOC">
            <n-icon>
              <menu-icon />
            </n-icon>
          </n-button>
        </n-layout-header>
        <n-layout-content>
          <div id="Book" @wheel="onScroll"></div>
        </n-layout-content>
      </n-layout>
    </n-spin>
    <n-drawer v-model:show="tocActive" :width="502" placement="left" display-directive="show"  ref="drawer">
      <n-drawer-content title="目录">
        <n-menu :options="toc" @update:value="nav" :value="currentSection"></n-menu>
      </n-drawer-content>
    </n-drawer>
  </n-config-provider>
</template>
<style>
.epub-container {
  height: calc(100vh - 40px);
}
.show.n-drawer{
  opacity: 1;
}
.n-drawer{
  opacity: 0;
}
</style>
