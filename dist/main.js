import { WebSocketServer, WebSocket } from 'ws';
import { ChainSyncClient, LocalStateQueryClient, Multiplexer } from "@harmoniclabs/ouroboros-miniprotocols-ts";
import { Cbor, CborArray, CborBytes, CborTag, LazyCborArray } from "@harmoniclabs/cbor";
import { toHex } from "@harmoniclabs/uint8array-utils";
import { connect } from "net";
import { syncAndAcquire } from './funcs/syncAndAcquire.js';
// import { logger } from "./utils/Logger.js";
// Configuration
const IPC_PATH = process.platform === 'win32' ? '\\\\.\\pipe\\myapp' : '/home/bakon/cardano/node/socket/node.socket';
const WEBSOCKET_PORT = 8080;
// Create WebSocket server
const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
// Track connected WebSocket clients
const clients = new Set();
// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);
    // Handle WebSocket client disconnection
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clients.delete(ws);
    });
    // Handle WebSocket errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});
// Handle server errors
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});
// Log when WebSocket server is running
wss.on('listening', () => {
    console.log(`WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`);
});
const connectToNode = async () => {
    // Create IPC socket client
    const mplexer = new Multiplexer({
        connect: () => connect({ path: IPC_PATH }),
        protocolType: "node-to-client"
    });
    // Handle IPC socket errors
    mplexer.on("error", err => {
        console.log("mplexer error: ", err);
        process.exit(1);
    });
    // Handle incoming data from IPC socket
    /*
    mplexer.on('data', (data: Buffer) => {
    const message = data.toString();
    console.log('Received from IPC:', message);

    // Relay data to all connected WebSocket clients
    clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        }
    });
    });
    */
    const chainSyncClient = new ChainSyncClient(mplexer);
    const lsqClient = new LocalStateQueryClient(mplexer);
    chainSyncClient.on("error", err => {
        console.log("chainSyncClient error: ", err);
        process.exit(1);
    });
    lsqClient.on("error", err => {
        console.log("lsqClient error: ", err);
        process.exit(1);
    });
    let tip = await syncAndAcquire(chainSyncClient, lsqClient, 1);
    chainSyncClient.on("rollForward", rollForward => {
        const blockData = rollForward.toCborBytes ?
            rollForwardBytesToBlockData(rollForward.toCborBytes(), rollForward.data) :
            Cbor.encode(rollForward.data).toBuffer();
        tip = rollForward.tip.point;
        // console.log("blockData:", blockData);
        // Relay data to all connected WebSocket clients
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(tip));
            }
        });
    });
    chainSyncClient.on("rollBackwards", rollBack => {
        if (!rollBack.point.blockHeader)
            return;
        tip = rollBack.tip.point;
        const hashStr = toHex(rollBack.point.blockHeader.hash);
        console.log("rollBack", hashStr);
    });
    while (true) {
        void await chainSyncClient.requestNext();
    }
};
function rollForwardBytesToBlockData(bytes, defaultCborObj) {
    let cbor;
    try {
        cbor = Cbor.parse(bytes);
    }
    catch {
        return Cbor.encode(defaultCborObj).toBuffer();
    }
    if (!(cbor instanceof CborArray &&
        cbor.array[1] instanceof CborTag &&
        cbor.array[1].data instanceof CborBytes)) {
        return Cbor.encode(defaultCborObj).toBuffer();
    }
    cbor = Cbor.parseLazy(cbor.array[1].data.buffer);
    if (!(cbor instanceof LazyCborArray)) {
        return Cbor.encode(defaultCborObj).toBuffer();
    }
    return cbor.array[1];
}
connectToNode();
//# sourceMappingURL=main.js.map