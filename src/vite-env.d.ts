/// <reference types="vite/client" />

declare module "moment/dist/locale/ru.js" {
  import moment from "moment";
  export = moment;
}

declare module "moment/dist/moment" {
  import moment from "moment";
  export = moment;
}
