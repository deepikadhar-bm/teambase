import { Runtime } from "./runtimeStore";

//GLOBAL SHORTCUT → $("KEY")
(global as any).$ = (key: string) => Runtime.get(key);
