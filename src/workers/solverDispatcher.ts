import { SolverParams, SolverYieldEvent } from '../types/solver.ts';

export class SolverDispatcher {
  private worker: Worker | null = null;
  private onYieldCallback: ((event: SolverYieldEvent) => void) | null = null;

  public start(params: SolverParams, onYield: (event: SolverYieldEvent) => void) {
    this.terminate();

    this.onYieldCallback = onYield;
    this.worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (e: MessageEvent<SolverYieldEvent>) => {
      if (this.onYieldCallback) {
        this.onYieldCallback(e.data);
      }
      if (e.data.done) {
        this.terminate();
      }
    };

    this.worker.onerror = (error) => {
      console.error('Solver worker error:', error);
      this.terminate();
    };

    this.worker.postMessage(params);
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.onYieldCallback = null;
  }
}
