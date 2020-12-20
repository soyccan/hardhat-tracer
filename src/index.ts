import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { printLogs } from "./logs";
import {
  HardhatRuntimeEnvironment,
  JsonRpcRequest,
  JsonRpcResponse,
} from "hardhat/types";
import "./type-extensions";

task(TASK_TEST, "Runs mocha tests")
  .addFlag("trace", "trace logs and calls in transactions")
  .setAction(async (args, hre, runSuper) => {
    if (args.trace) addTracerToHre(hre);
    return runSuper(args);
  });

function addTracerToHre(hre: HardhatRuntimeEnvironment) {
  const originalSend = hre.network.provider.send;
  async function newSend(method: string, params?: any[]): Promise<any> {
    const result = await originalSend(method, params);
    if (method === "eth_sendTransaction") {
      // TODO: Check if result is a valid bytes32 string
      await printLogs(result, hre.network.provider, hre.artifacts);
    }
    return result;
  }
  hre.network.provider.send = newSend;

  const originalSendAsync = hre.network.provider.sendAsync;
  function newSendAsync(
    payload: JsonRpcRequest,
    callback: (error: any, response: JsonRpcResponse) => void
  ): void {
    console.log("payload", payload);

    return originalSendAsync(payload, callback);
  }
  hre.network.provider.sendAsync = newSendAsync;
  hre.is_hardhat_tracer_active = true;
}
