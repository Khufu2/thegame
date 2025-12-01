import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TRONGRID_API_URL = "https://api.trongrid.io";

interface VerifyRequest {
  payment_id: string;
  transaction_hash: string;
}

async function verifyTronTransaction(txHash: string): Promise<{
  verified: boolean;
  amount?: number;
  to?: string;
  from?: string;
  timestamp?: number;
}> {
  try {
    // Query TronGrid API for transaction
    const response = await fetch(`${TRONGRID_API_URL}/v1/transactions/${txHash}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TronGrid API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.data || data.data.length === 0) {
      return { verified: false };
    }

    const tx = data.data[0];
    
    // Check if transaction is confirmed
    if (tx.ret !== "SUCCESS") {
      return { verified: false };
    }

    // Extract contract info (for USDT-TRC20)
    const contract = tx.contractResult?.[0]?.contract;
    if (contract && contract.type === "TriggerSmartContract") {
      // Parse USDT transfer
      const parameter = contract.parameter?.value;
      if (parameter) {
        // Decode amount (USDT has 6 decimals)
        const amountHex = parameter.data?.substring(72, 136);
        if (amountHex) {
          const amount = parseInt(amountHex, 16) / 1000000; // USDT has 6 decimals
          return {
            verified: true,
            amount: amount,
            to: parameter.contract_address,
            from: tx.raw_data?.contract?.[0]?.parameter?.value?.owner_address,
            timestamp: tx.block_timestamp,
          };
        }
      }
    }

    // For TRX transfers (not USDT)
    if (tx.raw_data?.contract?.[0]?.type === "TransferContract") {
      const contract = tx.raw_data.contract[0].parameter.value;
      return {
        verified: true,
        amount: contract.amount / 1000000, // TRX has 6 decimals
        to: contract.to_address,
        from: contract.owner_address,
        timestamp: tx.block_timestamp,
      };
    }

    return { verified: false };
  } catch (error) {
    console.error("Error verifying Tron transaction:", error);
    return { verified: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body: VerifyRequest = await req.json();
    const { payment_id, transaction_hash } = body;

    if (!payment_id || !transaction_hash) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: payment_id, transaction_hash" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`🔍 Verifying Tron transaction: ${transaction_hash}`);
    const verification = await verifyTronTransaction(transaction_hash);

    if (verification.verified) {
      console.log(`✅ Transaction verified: ${verification.amount} TRX/USDT`);
    } else {
      console.log(`❌ Transaction not verified or not found`);
    }

    return new Response(
      JSON.stringify({
        verified: verification.verified,
        payment_id: payment_id,
        transaction_hash: transaction_hash,
        amount: verification.amount,
        transaction_timestamp: verification.timestamp,
        verified_at: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in verify-tron-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

