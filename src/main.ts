import CommonUI from "@ist-group/commonui-components-vue";
import { Chart, registerables } from "chart.js";
import { createApp } from "vue";
import App from "./App.vue";
import "./app.css";
import router from "./router";

Chart.register(...registerables);

const app = createApp(App);
app.use(CommonUI);
app.use(router);
app.mount("#app");
