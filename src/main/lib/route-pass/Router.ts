import type { APIFunction, Packet } from '../../../@types';
import { BrowserWindow, ipcMain } from 'electron';
import { TokenNamespace } from '../tungsten/token';
import { assertNever } from '../tungsten/assertNever';
import { cratePacket } from './Packet';
import { RequestAPI } from '../../../RequestAPI';
import { ListenAPI } from '../../../ListenAPI';



type Pending = {
  resolve: (value: any) => void,
  reject: (reason?: any) => void,
  packet: Packet<any>
}

const tokens = new TokenNamespace();
const pending: Pending[] = [];
ipcMain.on("communication/main", (_evt, packet: Packet<any>) => {
  for (let i = 0; i < pending.length; i++) {
    if (pending[i].packet.token !== packet.token) {
      continue;
    }

    switch (packet.type) {
      case "DATA": {
        pending[i].resolve(packet.data);
        break;
      }
      case "ERROR": {
        pending[i].reject(packet.reason);
        break;
      }
      default: assertNever(packet.type);
    }
  }
});



export class Router {
  static respond<E extends keyof RequestAPI>(event: E, fn: APIFunction<RequestAPI[E]>): void {
    ipcMain.handle(event, fn as any);
  }

  static dispatch<E extends keyof ListenAPI>(window: BrowserWindow, channel: E, ...data: Parameters<ListenAPI[E]>): Promise<any> {
    const packet = cratePacket(channel, tokens.create(), data);

    const promise = new Promise((resolve, reject) => {
      pending.push({
        packet,
        reject,
        resolve
      });
    });

    if (window.isVisible()) {
      window.webContents.send("communication/renderer", packet);
    } else {
      window.on("ready-to-show", () => window.webContents.send("communication/renderer", packet));
    }

    return promise;
  }
}
