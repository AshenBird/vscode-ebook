<script setup lang="ts">
import { ref, provide, computed, watchEffect, watch, onMounted } from "vue";
import { NConfigProvider, darkTheme } from "naive-ui";
import { useVscode } from "./useVscode";
// @ts-ignore
import epub from "epubjs/dist/epub";
import { Book } from "epubjs";
const { config, ready, content,uri } = useVscode();

const readonly = ref(config.value.mode === "read");

// 主题配置
const theme = computed(() =>
  config.value.theme === "dark" ? darkTheme : null
);

const save = () => {};

let book = ref<Book | undefined>();
watch(content, async (n, o) => {
  // console.log(n)
  // const zip = await JSZip.loadAsync(n.data,{})
  
  // zip.forEach((p,item)=>{
  //   console.log(p)
  // })
  // book.value = new epub.Book();
  // book.value?.open(n.data,"binary")
  // book.value?.renderTo("Book", { flow: "scrolled-doc" });
  // console.log("aaaa")
});

watch(uri, (n, o) => {
  book.value = epub(n, {encoding:"binary"});
  
  const m = book.value?.renderTo("Book", { flow: "scrolled-doc" });
  console.log(m)
  // console.log(m?.views())
  // book.value?.
  // console.log("aaa")
});

onMounted(() => {
  ready.value = true;
});

// // 注入
// provide("readonly", readonly);
</script>
<template>
  <n-config-provider :theme="theme" @keyup.ctrl.s="save">
    <div id="Book" style="height:100vh"></div>
  </n-config-provider>
</template>
