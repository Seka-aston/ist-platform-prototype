import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../views/LandingPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "landing",
      component: LandingPage,
    },
    {
      path: "/principal",
      name: "principal",
      component: () => import("../views/PrincipalView.vue"),
    },
    {
      path: "/teacher",
      name: "teacher",
      component: () => import("../views/TeacherView.vue"),
    },
    {
      path: "/student",
      name: "student",
      component: () => import("../views/StudentView.vue"),
    },
  ],
});

export default router;
