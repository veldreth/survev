import { type Packet, PacketRecorder } from "../../shared/utils/packetRecorder";
import type { GameWebSocket } from "./game";

export class PlayerSocket implements GameWebSocket {
    readonly binaryType = "arraybuffer";

    onclose: GameWebSocket["onclose"] = null;
    onerror: GameWebSocket["onerror"] = null;
    onmessage: GameWebSocket["onmessage"] = null;
    onopen: GameWebSocket["onopen"] = null;

    readonly readyState = 0;

    close(_code?: number, _reason?: string) {}
    send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
}

export class PacketPlayer {
    recorder: PacketRecorder;
    packets: Packet[];

    socket = new PlayerSocket();

    private currentPacketIdx = 0;
    private sentFirstMsg = false;
    private stopped = false;

    constructor(buff: ArrayBuffer) {
        this.recorder = PacketRecorder.fromBuffer(buff);

        const data = this.recorder.readEverything();

        this.packets = data.packets;
    }

    sendNextPacket() {
        if (this.stopped) return;

        if (!this.sentFirstMsg) {
            this.sentFirstMsg = true;
            this.socket.onopen?.(new Event("open"));
        }

        const packet = this.currentPacket;

        const event = new MessageEvent("message", {
            data: packet.data,
        });

        this.socket.onmessage?.(event);

        this.currentPacketIdx++;

        if (this.currentPacket) {
            setTimeout(this.sendNextPacket.bind(this), this.currentPacket.delay);
        }
    }

    get currentPacket() {
        return this.packets[this.currentPacketIdx] || null;
    }

    stop() {
        this.stopped = true;
    }
}
