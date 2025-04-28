import { useEffect, useState } from "react";
import { Buffer } from "buffer";

export const usePythPriceFeed = (account: string, heliusKey: string) => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://devnet.helius-rpc.com/?api-key=1d4eba50-6775-455d-84a7-72675bb4995f`
    );

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "accountSubscribe",
          params: [account, { commitment: "confirmed", encoding: "base64" }],
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const base64 = data?.params?.result?.value?.data?.[0];
      if (!base64) return;

      const buffer = Buffer.from(base64, "base64");
      const exponent = buffer.readInt32LE(20);
      const mantissa = buffer.readBigInt64LE(208);
      const livePrice = Number(mantissa) * Math.pow(10, exponent);

      setPrice(parseFloat(livePrice.toFixed(6)));
    };

    return () => ws.close();
  }, [account]);

  return price;
};
