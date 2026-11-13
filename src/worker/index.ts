import { relojDelSistema } from "./reloj";
import { crearWorker } from "./worker";

export default crearWorker({ reloj: relojDelSistema });
