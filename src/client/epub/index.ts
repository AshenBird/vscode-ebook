import { createApp } from "vue";
import App from "./App.vue";
import "./assets/style/index.scss";
// @ts-ignore

const el = document.getElementById("app") as HTMLElement;


createApp(App).mount(el);
