// js/modules/worker-helper.js - Helper for using Web Workers

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.workerHelper = window.modules.workerHelper || {};

/**
 * A wrapper for managing web workers with a promise-based interface
 */
class WorkerHelper {
    /**
     * Creates a new worker helper
     * @param {string} workerPath - Path to the worker script
     */
    constructor(workerPath) {
        this.workerPath = workerPath;
        this.worker = null;
        this.taskId = 0;
        this.opId = 0;
        this.taskCallbacks = new Map();
        this.progressCallbacks = new Map();
        this.isReady = false;
        this.readyPromise = null;
        this.initialized = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    /**
     * Initializes the worker and returns a promise that resolves when ready
     * @returns {Promise} A promise that resolves when the worker is ready
     */
    init() {
        if (this.initialized) {
            return this.readyPromise;
        }
        
        this.initialized = true;
        
        this.readyPromise = new Promise((resolve, reject) => {
            try {
                // Some browsers don't support module type workers
                try {
                    this.worker = new Worker(this.workerPath, { type: 'module' });
                } catch (moduleError) {
                    console.warn('Module workers not supported, trying classic worker:', moduleError);
                    this.worker = new Worker(this.workerPath);
                }
                
                this.worker.onmessage = (e) => {
                    const data = e.data;
                    
                    // Handle worker initialization message
                    if (data && (data.status === 'Offload worker initialized and ready for tasks' || 
                               data.status === 'ready')) {
                        this.isReady = true;
                        this.reconnectAttempts = 0;
                        resolve(true);
                        return;
                    }
                    
                    // Handle task-specific messages with taskId (legacy format)
                    if (data && data.taskId && this.taskCallbacks.has(data.taskId)) {
                        const { resolve, reject } = this.taskCallbacks.get(data.taskId);
                        
                        if (data.error) {
                            reject(new Error(data.error));
                            this.taskCallbacks.delete(data.taskId);
                            this.progressCallbacks.delete(data.taskId);
                        } else if (data.type === 'result') {
                            resolve(data);
                            this.taskCallbacks.delete(data.taskId);
                            this.progressCallbacks.delete(data.taskId);
                        } else if (data.type === 'progress' && this.progressCallbacks.has(data.taskId)) {
                            try {
                                const progressCb = this.progressCallbacks.get(data.taskId);
                                if (typeof progressCb === 'function') {
                                    progressCb(data.progress, data);
                                }
                            } catch (progressError) {
                                console.error('Error in progress callback:', progressError);
                            }
                        }
                    }
                    
                    // Handle new operation format with id
                    if (data && data.id && this.taskCallbacks.has(data.id)) {
                        const { resolve, reject } = this.taskCallbacks.get(data.id);
                        
                        if (data.error) {
                            reject(new Error(data.error));
                            this.taskCallbacks.delete(data.id);
                            this.progressCallbacks.delete(data.id);
                        } else if (data.result !== undefined) {
                            resolve(data.result);
                            this.taskCallbacks.delete(data.id);
                            this.progressCallbacks.delete(data.id);
                        } else if (data.progress !== undefined && this.progressCallbacks.has(data.id)) {
                            try {
                                const progressCb = this.progressCallbacks.get(data.id);
                                if (typeof progressCb === 'function') {
                                    progressCb(data.progress, data);
                                }
                            } catch (progressError) {
                                console.error('Error in progress callback:', progressError);
                            }
                        }
                    }
                    
                    // Handle error messages
                    if (data && data.error) {
                        console.error('Worker error:', data.error);
                    }
                };
                
                // Handle worker errors
                this.worker.onerror = (err) => {
                    console.error('Worker error:', err);
                    this.isReady = false;
                    
                    // Attempt to reconnect if under max attempts
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.warn(`Worker error occurred. Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                        
                        // Store current callbacks
                        const currentTaskCallbacks = new Map(this.taskCallbacks);
                        const currentProgressCallbacks = new Map(this.progressCallbacks);
                        
                        // Re-initialize worker
                        this.terminate();
                        this.initialized = false;
                        this.init().then(() => {
                            // Restore callbacks for pending tasks
                            this.taskCallbacks = currentTaskCallbacks;
                            this.progressCallbacks = currentProgressCallbacks;
                        }).catch((reinitError) => {
                            console.error('Worker reconnection failed:', reinitError);
                            // Reject all pending tasks if reconnection failed
                            currentTaskCallbacks.forEach(({ reject: taskReject }) => {
                                taskReject(new Error('Worker reconnection failed'));
                            });
                        });
                    } else {
                        // Exceeded max reconnect attempts
                        this.initialized = false;
                        reject(err || new Error('Worker error occurred'));
                        
                        // Clean up any pending tasks
                        this.taskCallbacks.forEach(({ reject: taskReject }) => {
                            taskReject(new Error('Worker terminated due to error'));
                        });
                        this.taskCallbacks.clear();
                        this.progressCallbacks.clear();
                    }
                };
                
                // Set a timeout for worker initialization
                setTimeout(() => {
                    if (!this.isReady) {
                        console.warn('Worker initialization timing out - sending initialization prompt');
                        // Try to prompt the worker to respond by sending a ping message
                        try {
                            this.worker.postMessage({ operation: "ping" });
                        } catch (e) {
                            console.error('Failed to ping worker:', e);
                        }
                        
                        // Extended timeout
                        setTimeout(() => {
                            if (!this.isReady) {
                                reject(new Error('Worker initialization timed out'));
                            }
                        }, 5000);
                    }
                }, 5000);
            } catch (error) {
                reject(error);
            }
        });
        
        return this.readyPromise;
    }
    
    /**
     * Executes a task in the worker
     * @param {string} taskName - The name of the task to run
     * @param {Object} params - Parameters to pass to the task
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise} A promise that resolves with the task result
     */
    executeTask(taskName, params = {}, progressCallback = null) {
        if (!this.initialized) {
            this.init();
        }
        
        return this.readyPromise.then(() => {
            return new Promise((resolve, reject) => {
                const taskId = ++this.taskId;
                
                // Store callbacks for this task
                this.taskCallbacks.set(taskId, { resolve, reject });
                
                if (progressCallback) {
                    this.progressCallbacks.set(taskId, progressCallback);
                }
                
                // Send the task to the worker
                this.worker.postMessage({
                    taskId,
                    task: taskName,
                    ...params
                });
                
                // Set a timeout for task execution
                setTimeout(() => {
                    if (this.taskCallbacks.has(taskId)) {
                        reject(new Error(`Task ${taskName} timed out`));
                        this.taskCallbacks.delete(taskId);
                        this.progressCallbacks.delete(taskId);
                    }
                }, 60000); // 1 minute timeout
            });
        });
    }
    
    /**
     * Executes an operation in the worker using the new API format
     * @param {string} operation - The operation type to execute
     * @param {Object} data - Data to pass to the operation
     * @param {Function} progressCallback - Optional callback for progress updates
     * @param {number} timeout - Optional timeout in milliseconds (default: 60000)
     * @returns {Promise} A promise that resolves with the operation result
     */
    execute(operation, data = {}, progressCallback = null, timeout = 60000) {
        if (!this.initialized) {
            this.init();
        }
        
        return this.readyPromise.then(() => {
            return new Promise((resolve, reject) => {
                const id = ++this.opId;
                
                // Store callbacks for this operation
                this.taskCallbacks.set(id, { resolve, reject });
                
                if (progressCallback) {
                    this.progressCallbacks.set(id, progressCallback);
                }
                
                // Send the operation to the worker
                this.worker.postMessage({
                    operation,
                    data,
                    id
                });
                
                // Set a timeout for operation execution
                setTimeout(() => {
                    if (this.taskCallbacks.has(id)) {
                        reject(new Error(`Operation ${operation} timed out after ${timeout}ms`));
                        this.taskCallbacks.delete(id);
                        this.progressCallbacks.delete(id);
                    }
                }, timeout);
            });
        });
    }
    
    /**
     * Terminates the worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
            this.initialized = false;
            this.taskCallbacks.clear();
            this.progressCallbacks.clear();
        }
    }
}

/**
 * Singleton instance for managing workers
 */
class WorkerManager {
    constructor() {
        this.worker = null;
    }
    
    /**
     * Gets the worker helper instance
     * @returns {WorkerHelper} The worker helper instance
     */
    getWorker() {
        if (!this.worker) {
            // Check if Web Workers are supported
            if (typeof Worker === 'undefined') {
                console.warn('Web Workers are not supported in this browser');
                return {
                    init: () => Promise.reject(new Error('Web Workers not supported')),
                    executeTask: () => Promise.reject(new Error('Web Workers not supported')),
                    execute: () => Promise.reject(new Error('Web Workers not supported')),
                    terminate: () => {}
                };
            }
            
            try {
                this.worker = new WorkerHelper('/js/modules/offload-worker.js');
                this.worker.init().catch(err => {
                    console.error('Failed to initialize worker:', err);
                });
            } catch (error) {
                console.error('Failed to create worker helper:', error);
                return {
                    init: () => Promise.reject(error),
                    executeTask: () => Promise.reject(error),
                    execute: () => Promise.reject(error),
                    terminate: () => {}
                };
            }
        }
        return this.worker;
    }
    
    /**
     * Executes a task or operation in the worker
     * @param {string} operation - The operation or task to execute
     * @param {Object} data - Data for the operation
     * @param {Function} progressCallback - Optional callback for progress updates
     * @param {number} timeout - Optional timeout in milliseconds
     * @returns {Promise} A promise that resolves with the result
     */
    execute(operation, data = {}, progressCallback = null, timeout = 60000) {
        const worker = this.getWorker();
        return worker.execute(operation, data, progressCallback, timeout);
    }
    
    /**
     * Legacy method for executing tasks
     * @param {string} taskName - The name of the task to run
     * @param {Object} params - Parameters to pass to the task
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise} A promise that resolves with the task result
     */
    executeTask(taskName, params = {}, progressCallback = null) {
        const worker = this.getWorker();
        return worker.executeTask(taskName, params, progressCallback);
    }
    
    /**
     * Terminates the worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

/**
 * Singleton instance of the worker manager
 */
const workerManager = new WorkerManager();

/**
 * Gets the worker helper instance (for backward compatibility)
 * @returns {WorkerHelper} The worker helper instance
 */
function getWorkerHelper() {
    return workerManager.getWorker();
}

// Modern API - Use these functions for new code

/**
 * Analyzes fingerprints in a worker
 * @param {Object} fingerprints - Object containing various fingerprints
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the analysis results
 */
function analyzeFingerprints(fingerprints, progressCallback) {
    return workerManager.execute('fingerprint', { fingerprints }, progressCallback);
}

/**
 * Processes collected data in a worker
 * @param {Object} data - The data to process
 * @param {Object} options - Processing options
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the processing results
 */
function processData(data, options = {}, progressCallback) {
    return workerManager.execute('dataProcessing', { data, options }, progressCallback);
}

/**
 * Analyzes network information in a worker
 * @param {Object} networkData - Network data to analyze
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the analysis results
 */
function analyzeNetwork(networkData, progressCallback) {
    return workerManager.execute('networkAnalysis', { networkData }, progressCallback);
}

/**
 * Runs a performance benchmark in a worker
 * @param {string} benchmarkType - Type of benchmark to run (cpu, memory, hash, etc.)
 * @param {Object} options - Benchmark options including iterations
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the benchmark results
 */
function runBenchmark(benchmarkType = 'cpu', options = {}, progressCallback) {
    return workerManager.execute('benchmark', { type: benchmarkType, options }, progressCallback);
}

/**
 * Analyzes an image in a worker
 * @param {ImageData|Uint8Array} imageData - The image data to analyze
 * @param {Object} options - Analysis options
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the analysis results
 */
function analyzeImage(imageData, options = {}, progressCallback) {
    return workerManager.execute('imageAnalysis', { imageData, options }, progressCallback);
}

/**
 * Calculates entropy of data in a worker
 * @param {Uint8Array|string} data - The data to analyze
 * @param {Object} options - Options for entropy calculation
 * @returns {Promise} A promise that resolves with the entropy results
 */
function calculateEntropy(data, options = {}) {
    return workerManager.execute('entropy', { data, options });
}

// Legacy API - For backward compatibility

/**
 * Executes a computation-heavy task in a worker (legacy)
 * @param {Object} params - Task parameters
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the task result
 */
function executeHeavyTask(params, progressCallback) {
    return workerManager.executeTask('computeHeavyTask', { params }, progressCallback);
}

/**
 * Legacy function for analyzing fingerprints
 * @param {Object} fingerprints - Object containing various fingerprints
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the analysis results
 */
function legacyAnalyzeFingerprints(fingerprints, progressCallback) {
    return workerManager.executeTask('analyzeFingerprints', { fingerprints }, progressCallback);
}

/**
 * Legacy function for running benchmarks
 * @param {number} iterations - Number of iterations to run
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise} A promise that resolves with the benchmark results
 */
function benchmarkPerformance(iterations, progressCallback) {
    return workerManager.executeTask('benchmarkPerformance', { iterations }, progressCallback);
}

// Make all functions available through the modules namespace
window.modules.workerHelper = {
    WorkerHelper,
    WorkerManager,
    getWorkerHelper,
    // Modern API
    analyzeFingerprints,
    processData,
    analyzeNetwork,
    runBenchmark,
    analyzeImage,
    calculateEntropy,
    // Legacy API
    executeHeavyTask,
    legacyAnalyzeFingerprints,
    benchmarkPerformance
};

// Also expose directly on window for backward compatibility
window.WorkerHelper = WorkerHelper;
window.getWorkerHelper = getWorkerHelper;
window.executeHeavyTask = executeHeavyTask;
window.analyzeFingerprints = analyzeFingerprints; // Use modern implementation
window.benchmarkPerformance = benchmarkPerformance;