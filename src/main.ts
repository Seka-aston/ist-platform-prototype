import CommonUI from "@ist/commonui-components";
import { createApp } from "vue";
import App from "./App.vue";
import "./app.css";
import router from "./router";

const app = createApp(App);
app.use(CommonUI);
app.use(router);
app.mount("#app");
