import { TxOut, TxOutRef, UTxO } from "@harmoniclabs/cardano-ledger-ts";
import { CborArray, CborBytes, CborUInt } from "@harmoniclabs/cbor";
import { lexCompare } from "@harmoniclabs/uint8array-utils";
import { logger } from "../utils/Logger.js";
export async function queryAddrsUtxos(client, addrs) {
    const query = new CborArray([
        new CborUInt(0),
        new CborArray([
            new CborUInt(0),
            new CborArray([
                new CborUInt(6),
                new CborArray([
                    new CborUInt(6),
                    new CborArray(addrs
                        .map(addr => addr.toBuffer())
                        .sort(lexCompare)
                        .map(b => new CborBytes(b)))
                ])
            ])
        ])
    ]);
    const { result: cborResult } = await client.query(query, 30_000);
    const map = cborResult?.array[0]?.map;
    if (!map)
        return [];
    const result = map.map(({ k, v }) => new UTxO({
        utxoRef: TxOutRef.fromCborObj(k),
        resolved: TxOut.fromCborObj(v)
    }));
    logger.debug("queried utxos", result.length);
    return result;
}
//# sourceMappingURL=queryAddrsUtxos.js.map