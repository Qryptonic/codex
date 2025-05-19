/**
 * Offload Worker Module
 * Handles resource-intensive operations in a separate thread
 * to keep the main UI responsive
 */

// Set up worker context
self.addEventListener('message', handleMessage);

// Operations counter for task tracking
let operationCounter = 0;

/**
 * Handles messages from the main thread
 * @param {MessageEvent} e - The message event
 */
function handleMessage(e) {
  const { operation, data, id = ++operationCounter } = e.data || {};
  
  // Handle initialization ping
  if (operation === "ping") {
    self.postMessage({
      status: 'ready',
      id
    });
    return;
  }
  
  if (!operation) {
    self.postMessage({ 
      error: 'Invalid operation request',
      id 
    });
    return;
  }
  
  try {
    // Route to appropriate handler based on operation type
    switch (operation) {
      case 'fingerprint':
        handleFingerprinting(data, id);
        break;
      case 'dataProcessing':
        handleDataProcessing(data, id);
        break;
      case 'benchmark':
        handleBenchmark(data, id);
        break;
      case 'imageAnalysis':
        handleImageAnalysis(data, id);
        break;
      case 'networkAnalysis':
        handleNetworkAnalysis(data, id);
        break;
      default:
        // Support for legacy task names
        handleLegacyTasks(operation, data, id);
    }
  } catch (error) {
    self.postMessage({
      error: error.message,
      operation,
      id
    });
  }
}

/**
 * Handle legacy task names for backward compatibility
 */
function handleLegacyTasks(task, params, id) {
  switch(task) {
    case 'computeHeavyTask':
      computeHeavyTask(params, id);
      break;
    case 'analyzeFingerprints':
      analyzeFingerprints(params, id);
      break;
    case 'benchmarkPerformance':
      benchmarkPerformance(params?.iterations, id);
      break;
    default:
      self.postMessage({ 
        error: `Unknown operation: ${task}`,
        id
      });
  }
}

/**
 * Handle fingerprinting operations
 * @param {Object} data - The fingerprint data to process
 * @param {string} id - The operation ID for response tracking
 */
function handleFingerprinting(data, id) {
  if (!data) {
    self.postMessage({
      error: 'No fingerprint data provided',
      id
    });
    return;
  }
  
  // Process canvas fingerprint
  if (data.canvasImageData) {
    const canvasHash = generateCanvasHash(data.canvasImageData);
    
    self.postMessage({
      type: 'fingerprintResult',
      result: {
        canvasHash,
        entropy: calculateEntropy(data.canvasImageData),
        uniquenessScore: estimateUniqueness(canvasHash)
      },
      id
    });
  }
  
  // Process WebGL fingerprint
  if (data.webglData) {
    const webglHash = generateWebGLHash(data.webglData);
    
    self.postMessage({
      type: 'fingerprintResult',
      result: {
        webglHash,
        extensions: analyzeExtensions(data.webglData.extensions),
        parameterEntropy: calculateParameterEntropy(data.webglData.parameters)
      },
      id
    });
  }
  
  // Process audio fingerprint
  if (data.audioData) {
    const audioFeatures = extractAudioFeatures(data.audioData);
    
    self.postMessage({
      type: 'fingerprintResult',
      result: {
        audioHash: hashAudioFeatures(audioFeatures),
        audioFeatures
      },
      id
    });
  }
}

/**
 * Handle data processing operations
 * @param {Object} data - The data to process
 * @param {string} id - The operation ID for response tracking
 */
function handleDataProcessing(data, id) {
  if (!data) {
    self.postMessage({
      error: 'No data provided for processing',
      id
    });
    return;
  }
  
  self.postMessage({ status: 'Processing data', id });
  
  // Deep analysis of collected data
  const processedData = {
    summary: generateDataSummary(data),
    patterns: detectDataPatterns(data),
    risks: assessPrivacyRisks(data),
    metrics: calculateMetrics(data)
  };
  
  self.postMessage({
    type: 'dataProcessingResult',
    result: processedData,
    id
  });
}

/**
 * Handle benchmark operations
 * @param {Object} data - The benchmark parameters
 * @param {string} id - The operation ID for response tracking
 */
function handleBenchmark(data, id) {
  const { iterations = 1000000, testType = 'composite' } = data || {};
  
  self.postMessage({ status: 'Running benchmark', id });
  
  // Run appropriate benchmark
  let result;
  
  switch (testType) {
    case 'cpu':
      result = runCPUBenchmark(iterations);
      break;
    case 'memory':
      result = runMemoryBenchmark(data?.size || 1000000);
      break;
    case 'hash':
      result = runHashingBenchmark(iterations / 10);
      break;
    default:
      result = runCompositeBenchmark(iterations);
  }
  
  self.postMessage({
    type: 'benchmarkResult',
    result,
    id
  });
}

/**
 * Handle image analysis operations
 * @param {Object} data - The image data to analyze
 * @param {string} id - The operation ID for response tracking
 */
function handleImageAnalysis(data, id) {
  if (!data || !data.imageData) {
    self.postMessage({
      error: 'No image data provided',
      id
    });
    return;
  }
  
  const { imageData, width, height, analysisType = 'full' } = data;
  
  self.postMessage({ status: 'Analyzing image', id });
  
  // Process image data
  let result;
  
  switch (analysisType) {
    case 'histogram':
      result = generateHistogram(imageData, width, height);
      break;
    case 'renderingDifferences':
      result = detectRenderingDifferences(imageData, width, height);
      break;
    case 'accelerationProfile':
      result = analyzeAccelerationProfile(imageData, width, height);
      break;
    default:
      result = fullImageAnalysis(imageData, width, height);
  }
  
  self.postMessage({
    type: 'imageAnalysisResult',
    result,
    id
  });
}

/**
 * Handle network analysis operations
 * @param {Object} data - The network data to analyze
 * @param {string} id - The operation ID for response tracking
 */
function handleNetworkAnalysis(data, id) {
  if (!data) {
    self.postMessage({
      error: 'No network data provided',
      id
    });
    return;
  }
  
  const { timings, resources, connection } = data;
  
  self.postMessage({ status: 'Analyzing network', id });
  
  // Process network data
  const analysisResult = {
    performanceScore: calculateNetworkPerformance(timings),
    bottlenecks: identifyBottlenecks(timings, resources),
    connectionProfile: analyzeConnection(connection),
    securityRisks: assessNetworkSecurity(resources)
  };
  
  self.postMessage({
    type: 'networkAnalysisResult',
    result: analysisResult,
    id
  });
}

// ===== Legacy Function Support =====

/**
 * Example of a computationally intensive task that's better run in a worker
 * @param {Object} params - Task parameters
 * @param {string} id - Operation ID
 */
function computeHeavyTask(params, id) {
  const { size = 1000000, complexity = 100 } = params || {};
  
  self.postMessage({ status: 'Computing heavy task with size: ' + size, id });
  
  // Simulate heavy computation
  const startTime = performance.now();
  let result = 0;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < complexity; j++) {
      result += Math.sqrt(i * j) * Math.sin(i) / (1 + Math.cos(j));
    }
    
    // Send progress updates occasionally
    if (i % 100000 === 0) {
      self.postMessage({
        type: 'progress',
        progress: Math.round((i / size) * 100),
        currentValue: result,
        id
      });
    }
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  self.postMessage({
    type: 'result',
    task: 'computeHeavyTask',
    result: result,
    duration: duration,
    size: size,
    complexity: complexity,
    id
  });
}

/**
 * Analyzes multiple fingerprints to calculate entropy and uniqueness
 * @param {Object} fingerprints - Object containing various fingerprints
 * @param {string} id - Operation ID
 */
function analyzeFingerprints(fingerprints, id) {
  if (!fingerprints) {
    self.postMessage({
      error: 'No fingerprints provided',
      id
    });
    return;
  }
  
  self.postMessage({ status: 'Analyzing fingerprints', id });
  
  const startTime = performance.now();
  
  // Extract available fingerprints
  const availableTypes = Object.keys(fingerprints).filter(key => 
    fingerprints[key] && fingerprints[key] !== 'N/A'
  );
  
  if (availableTypes.length === 0) {
    self.postMessage({ 
      type: 'result',
      task: 'analyzeFingerprints',
      error: 'No valid fingerprints to analyze',
      id
    });
    return;
  }
  
  // Function to generate all possible combinations of fingerprint types
  function generateCombinations(items) {
    const result = [];
    
    // Generate combinations of lengths 1 to n
    for (let len = 1; len <= items.length; len++) {
      // Helper function to generate combinations of specific length
      function combine(start, current) {
        if (current.length === len) {
          result.push([...current]);
          return;
        }
        
        for (let i = start; i < items.length; i++) {
          current.push(items[i]);
          combine(i + 1, current);
          current.pop();
        }
      }
      
      combine(0, []);
    }
    
    return result;
  }
  
  // Generate all combinations of fingerprint types
  const combinations = generateCombinations(availableTypes);
  
  // Calculate entropy for each combination
  const entropyAnalysis = combinations.map(combo => {
    // Create combined fingerprint
    const combinedValue = combo.map(type => fingerprints[type]).join('');
    
    // Calculate estimated entropy (in bits)
    // This is a simplified model assuming complete randomness
    const uniqueChars = new Set(combinedValue).size;
    const totalChars = combinedValue.length;
    
    // Shannon entropy estimate: log2(uniqueChars^totalChars)
    // For simplification, we'll use: totalChars * log2(uniqueChars)
    const entropy = totalChars * Math.log2(Math.max(uniqueChars, 2));
    
    // Calculate theoretical uniqueness among browser population
    // 2^entropy = number of possible combinations
    // This is a vast simplification for demonstration
    const possibleCombinations = Math.pow(2, Math.min(entropy, 1024)); // Cap to avoid Infinity
    
    // Probability of collision (simplified)
    // For small probabilities, this is roughly 1/possibleCombinations
    const collisionProbability = 1 / possibleCombinations;
    
    // Uniqueness percentile (1 - probability of collision) * 100
    const uniqueness = (1 - collisionProbability) * 100;
    
    return {
      types: combo,
      entropy: entropy,
      uniqueness: uniqueness > 99.99 ? 99.99 : uniqueness, // Cap at 99.99%
      possibleCombinations: possibleCombinations
    };
  });
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Send the analysis results back to the main thread
  self.postMessage({
    type: 'result',
    task: 'analyzeFingerprints',
    analysis: entropyAnalysis,
    duration: duration,
    id
  });
}

/**
 * Runs a JavaScript performance benchmark
 * @param {number} iterations - Number of iterations to run
 * @param {string} id - Operation ID
 */
function benchmarkPerformance(iterations = 1000000, id) {
  self.postMessage({ status: 'Running performance benchmark', id });
  
  const startTime = performance.now();
  let result = 0;
  
  // Run a computationally intensive calculation
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.cos(i) / (1 + Math.sin(i));
    
    // Send progress updates occasionally
    if (i % 100000 === 0) {
      self.postMessage({
        type: 'progress',
        progress: Math.round((i / iterations) * 100),
        id
      });
    }
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Calculate operations per millisecond
  const opsPerMs = iterations / duration;
  
  // Higher score is better
  const score = Math.round(opsPerMs * 100);
  
  // Send benchmark results
  self.postMessage({
    type: 'result',
    task: 'benchmarkPerformance',
    result: result,
    duration: duration,
    iterations: iterations,
    opsPerMs: opsPerMs,
    score: score,
    id
  });
}

// ===== Utility Functions =====

/**
 * Generate a hash from canvas image data
 * @param {Uint8ClampedArray} imageData - The canvas image data
 * @returns {string} The generated hash
 */
function generateCanvasHash(imageData) {
  // Simple hash function for demo
  let hash = 0;
  
  for (let i = 0; i < imageData.length; i += 4) {
    // Only use a subset of pixels for efficiency
    if (i % 40 === 0) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      
      hash = ((hash << 5) - hash) + r;
      hash = ((hash << 5) - hash) + g;
      hash = ((hash << 5) - hash) + b;
      hash = ((hash << 5) - hash) + a;
      hash = hash & hash; // Convert to 32bit integer
    }
  }
  
  return (hash >>> 0).toString(16);
}

/**
 * Calculate entropy from image data
 * @param {Uint8ClampedArray} imageData - The canvas image data
 * @returns {number} The calculated entropy
 */
function calculateEntropy(imageData) {
  // Count frequency of each byte value
  const frequencies = new Array(256).fill(0);
  
  for (let i = 0; i < imageData.length; i++) {
    frequencies[imageData[i]]++;
  }
  
  // Calculate entropy using Shannon's formula
  let entropy = 0;
  const totalBytes = imageData.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / totalBytes;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

/**
 * Estimate uniqueness score based on canvas hash
 * @param {string} hash - The canvas hash
 * @returns {number} Uniqueness score 0-100
 */
function estimateUniqueness(hash) {
  // This would normally involve comparison to a database
  // For demo purposes, we're using hash characteristics
  
  // Calculate hash entropy as a proxy for uniqueness
  const hashEntropy = calculateStringEntropy(hash);
  
  // Scale to 0-100 range
  return Math.min(100, Math.round(hashEntropy * 10));
}

/**
 * Calculate entropy of a string
 * @param {string} str - The string to analyze
 * @returns {number} The calculated entropy
 */
function calculateStringEntropy(str) {
  const frequencies = {};
  
  // Count character frequencies
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  // Calculate entropy
  let entropy = 0;
  const totalChars = str.length;
  
  Object.values(frequencies).forEach(count => {
    const probability = count / totalChars;
    entropy -= probability * Math.log2(probability);
  });
  
  return entropy;
}

/**
 * Generate a hash from WebGL data
 * @param {Object} webglData - WebGL information
 * @returns {string} The generated hash
 */
function generateWebGLHash(webglData) {
  const { renderer, vendor, parameters, extensions } = webglData;
  
  // Combine all data into a string
  const combinedData = [
    renderer || '',
    vendor || '',
    ...Object.entries(parameters || {}).map(([k, v]) => `${k}:${v}`),
    ...(extensions || [])
  ].join('|');
  
  // Create hash
  let hash = 0;
  
  for (let i = 0; i < combinedData.length; i++) {
    hash = ((hash << 5) - hash) + combinedData.charCodeAt(i);
    hash = hash & hash;
  }
  
  return (hash >>> 0).toString(16);
}

/**
 * Analyze WebGL extensions for entropy and uniqueness
 * @param {Array} extensions - List of WebGL extensions
 * @returns {Object} Analysis results
 */
function analyzeExtensions(extensions) {
  if (!extensions || !extensions.length) {
    return { count: 0, entropy: 0, rarityScore: 0 };
  }
  
  // Count extensions
  const count = extensions.length;
  
  // Calculate entropy based on extension presence
  const entropy = Math.log2(Math.pow(2, count));
  
  // Calculate rarity score (made up for demo)
  // In a real implementation, this would compare against a known database
  let rarityScore = 0;
  const rareExtensions = [
    'WEBGL_compression_texture_pvrtc',
    'WEBKIT_WEBGL_depth_texture',
    'WEBGL_compressed_texture_atc',
    'WEBGL_compressed_texture_etc1'
  ];
  
  rareExtensions.forEach(ext => {
    if (extensions.includes(ext)) {
      rarityScore += 25;
    }
  });
  
  return {
    count,
    entropy: Math.min(10, entropy),
    rarityScore: Math.min(100, rarityScore)
  };
}

/**
 * Calculate entropy of WebGL parameters
 * @param {Object} parameters - WebGL parameters
 * @returns {number} Entropy score
 */
function calculateParameterEntropy(parameters) {
  if (!parameters || typeof parameters !== 'object') {
    return 0;
  }
  
  // Convert parameters to array of strings
  const paramStrings = Object.entries(parameters).map(([k, v]) => `${k}:${v}`);
  
  // Calculate entropy using string entropy
  const combinedParams = paramStrings.join('|');
  return calculateStringEntropy(combinedParams);
}

/**
 * Extract features from audio data
 * @param {Array} audioData - Audio processing data
 * @returns {Object} Extracted features
 */
function extractAudioFeatures(audioData) {
  if (!audioData || !audioData.length) {
    return { signalSum: 0, zeroCrossings: 0, peaks: 0 };
  }
  
  let signalSum = 0;
  let zeroCrossings = 0;
  let peaks = 0;
  let previousSample = 0;
  
  // Extract simple audio features
  for (let i = 0; i < audioData.length; i++) {
    const sample = audioData[i];
    
    // Accumulate absolute values
    signalSum += Math.abs(sample);
    
    // Count zero crossings
    if ((previousSample > 0 && sample <= 0) || (previousSample < 0 && sample >= 0)) {
      zeroCrossings++;
    }
    
    // Count peaks (local maxima/minima)
    if (i > 0 && i < audioData.length - 1) {
      if ((sample > audioData[i-1] && sample > audioData[i+1]) || 
          (sample < audioData[i-1] && sample < audioData[i+1])) {
        peaks++;
      }
    }
    
    previousSample = sample;
  }
  
  return {
    signalSum,
    zeroCrossings,
    peaks,
    mean: signalSum / audioData.length,
    length: audioData.length
  };
}

/**
 * Hash audio features into a compact representation
 * @param {Object} features - Audio features
 * @returns {string} Hash string
 */
function hashAudioFeatures(features) {
  const featureString = `${features.signalSum}-${features.zeroCrossings}-${features.peaks}-${features.mean}`;
  
  // Simple hash
  let hash = 0;
  
  for (let i = 0; i < featureString.length; i++) {
    hash = ((hash << 5) - hash) + featureString.charCodeAt(i);
    hash = hash & hash;
  }
  
  return (hash >>> 0).toString(16);
}

/**
 * Generate a summary of collected data
 * @param {Object} data - The collected data
 * @returns {Object} Summary information
 */
function generateDataSummary(data) {
  const summary = {
    dataPoints: 0,
    categories: {},
    dateGenerated: new Date().toISOString()
  };
  
  // Count data points and categorize
  Object.entries(data).forEach(([category, values]) => {
    if (typeof values === 'object' && values !== null) {
      const categoryCount = Object.keys(values).length;
      summary.categories[category] = categoryCount;
      summary.dataPoints += categoryCount;
    }
  });
  
  return summary;
}

/**
 * Detect patterns in collected data
 * @param {Object} data - The collected data
 * @returns {Array} Detected patterns
 */
function detectDataPatterns(data) {
  const patterns = [];
  
  // This would be a more sophisticated analysis in production
  // For demo, just detect a few simple patterns
  
  // Check for geolocation data
  if (data.geolocation && data.geolocation.latitude && data.geolocation.longitude) {
    patterns.push({
      type: 'location',
      description: 'User location data available',
      severity: 'high'
    });
  }
  
  // Check for device motion usage
  if (data.hardware && data.hardware.motion) {
    patterns.push({
      type: 'motion',
      description: 'Device motion tracking enabled',
      severity: 'medium'
    });
  }
  
  // Check for extensive canvas fingerprinting
  if (data.fingerprints && data.fingerprints.canvas) {
    patterns.push({
      type: 'fingerprinting',
      description: 'Canvas fingerprinting detected',
      severity: 'high'
    });
  }
  
  return patterns;
}

/**
 * Assess privacy risks in collected data
 * @param {Object} data - The collected data
 * @returns {Object} Risk assessment
 */
function assessPrivacyRisks(data) {
  const risks = {
    identifiability: 0,
    trackingPotential: 0,
    sensitiveData: 0,
    crossSiteLinking: 0
  };
  
  // Assess identifiability risk
  if (data.fingerprints) {
    // Canvas and WebGL fingerprinting significantly increase identifiability
    if (data.fingerprints.canvas) risks.identifiability += 30;
    if (data.fingerprints.webgl) risks.identifiability += 25;
    if (data.fingerprints.audio) risks.identifiability += 20;
  }
  
  // Assess tracking potential
  if (data.hardware) {
    if (data.hardware.gpu) risks.trackingPotential += 15;
    if (data.hardware.battery) risks.trackingPotential += 10;
    if (data.hardware.memory) risks.trackingPotential += 10;
  }
  
  // Check for sensitive data
  if (data.geolocation) {
    risks.sensitiveData += 40;
    risks.identifiability += 25;
  }
  
  if (data.mediaDevices) {
    risks.sensitiveData += 30;
  }
  
  // Cap risks at 100
  Object.keys(risks).forEach(key => {
    risks[key] = Math.min(100, risks[key]);
  });
  
  return risks;
}

/**
 * Calculate metrics from collected data
 * @param {Object} data - The collected data
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(data) {
  return {
    dataCollectionDepth: calculateDataDepth(data),
    uniquenessScore: calculateUniquenessScore(data),
    temporalStability: estimateTemporalStability(data)
  };
}

/**
 * Calculate data collection depth
 * @param {Object} data - The collected data
 * @returns {number} Depth score (0-100)
 */
function calculateDataDepth(data) {
  // Count the levels of nested data and breadth of collection
  let pointCount = 0;
  let maxDepth = 0;
  
  function traverseDepth(obj, depth = 1) {
    if (typeof obj !== 'object' || obj === null) return depth;
    
    pointCount++;
    
    let deepestSubtree = depth;
    Object.values(obj).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        const subtreeDepth = traverseDepth(value, depth + 1);
        deepestSubtree = Math.max(deepestSubtree, subtreeDepth);
      } else {
        pointCount++;
      }
    });
    
    return deepestSubtree;
  }
  
  maxDepth = traverseDepth(data);
  
  // Calculate depth score based on points and max depth
  const depthScore = Math.log2(pointCount) * 10 + maxDepth * 5;
  
  // Normalize to 0-100
  return Math.min(100, Math.max(0, depthScore));
}

/**
 * Calculate uniqueness score of the profile
 * @param {Object} data - The collected data
 * @returns {number} Uniqueness score (0-100)
 */
function calculateUniquenessScore(data) {
  let score = 0;
  
  // Fingerprinting adds significant uniqueness
  if (data.fingerprints) {
    if (data.fingerprints.canvas) score += 25;
    if (data.fingerprints.webgl) score += 25;
    if (data.fingerprints.audio) score += 15;
  }
  
  // Hardware details add uniqueness
  if (data.hardware) {
    if (data.hardware.gpu) score += 15;
    if (data.hardware.cores) score += 5;
    if (data.hardware.memory) score += 5;
    if (data.hardware.screen) score += 10;
  }
  
  // Browser details add some uniqueness
  if (data.browser) {
    score += 10;
  }
  
  // Cap at 100
  return Math.min(100, score);
}

/**
 * Estimate temporal stability of the fingerprint
 * @param {Object} data - The collected data
 * @returns {number} Stability score (0-100)
 */
function estimateTemporalStability(data) {
  // This is an estimate of how likely the fingerprint is to remain
  // consistent across sessions
  
  let stabilityScore = 50; // Start with neutral score
  
  // Hardware fingerprints tend to be stable
  if (data.hardware && data.hardware.gpu) stabilityScore += 15;
  
  // Canvas fingerprinting is relatively stable
  if (data.fingerprints && data.fingerprints.canvas) stabilityScore += 20;
  
  // WebGL fingerprinting is also stable
  if (data.fingerprints && data.fingerprints.webgl) stabilityScore += 15;
  
  // Cap at 100
  return Math.min(100, stabilityScore);
}

/**
 * Run CPU benchmark
 * @param {number} iterations - Number of iterations
 * @returns {Object} Benchmark results
 */
function runCPUBenchmark(iterations) {
  const startTime = self.performance ? performance.now() : Date.now();
  
  // CPU-intensive operation
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i) / (1 + Math.cos(i));
  }
  
  const endTime = self.performance ? performance.now() : Date.now();
  const duration = endTime - startTime;
  
  // Calculate operations per millisecond
  const opsPerMs = iterations / duration;
  
  // Higher score is better
  const score = Math.round(opsPerMs * 100);
  
  return {
    score,
    duration,
    iterations,
    opsPerMs
  };
}

/**
 * Run memory benchmark
 * @param {number} size - Size of arrays to create
 * @returns {Object} Benchmark results
 */
function runMemoryBenchmark(size) {
  const startTime = self.performance ? performance.now() : Date.now();
  
  // Create and fill arrays
  const arrays = [];
  const iterations = 5; // Lower for stability
  
  for (let i = 0; i < iterations; i++) {
    const array = new Float64Array(size);
    
    // Fill with data
    for (let j = 0; j < size; j++) {
      array[j] = j * Math.sin(j);
    }
    
    arrays.push(array);
  }
  
  // Read data back
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < size; j += 100) {
      sum += arrays[i][j];
    }
  }
  
  const endTime = self.performance ? performance.now() : Date.now();
  const duration = endTime - startTime;
  
  // Clean up
  arrays.length = 0;
  
  return {
    bytesProcessed: size * 8 * iterations,
    duration,
    allocations: iterations,
    throughputMBs: (size * 8 * iterations) / (duration * 1000)
  };
}

/**
 * Run hashing benchmark
 * @param {number} iterations - Number of hashes to compute
 * @returns {Object} Benchmark results
 */
function runHashingBenchmark(iterations) {
  const startTime = self.performance ? performance.now() : Date.now();
  
  const testStrings = [
    'The quick brown fox jumps over the lazy dog',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet',
    'The five boxing wizards jump quickly'
  ];
  
  let lastHash = '';
  
  for (let i = 0; i < iterations; i++) {
    const stringIndex = i % testStrings.length;
    const input = testStrings[stringIndex] + i + lastHash;
    lastHash = simpleHash(input);
  }
  
  const endTime = self.performance ? performance.now() : Date.now();
  const duration = endTime - startTime;
  
  return {
    hashesPerSecond: Math.round(iterations / (duration / 1000)),
    duration,
    iterations
  };
}

/**
 * Simple string hashing function
 * @param {string} str - String to hash
 * @returns {string} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return (hash >>> 0).toString(16);
}

/**
 * Run composite benchmark (CPU, memory, and hashing)
 * @param {number} iterations - Base number of iterations
 * @returns {Object} Benchmark results
 */
function runCompositeBenchmark(iterations) {
  // Scale iterations for different components
  const cpuIterations = iterations;
  const memorySize = Math.min(1000000, iterations / 10);
  const hashIterations = iterations / 100;
  
  // Run individual benchmarks
  const cpuResult = runCPUBenchmark(cpuIterations);
  const memoryResult = runMemoryBenchmark(memorySize);
  const hashResult = runHashingBenchmark(hashIterations);
  
  // Calculate composite score
  const cpuScore = cpuResult.score;
  const memoryScore = memoryResult.throughputMBs * 10;
  const hashScore = hashResult.hashesPerSecond / 1000;
  
  const compositeScore = Math.round((cpuScore * 0.5) + (memoryScore * 0.3) + (hashScore * 0.2));
  
  return {
    compositeScore,
    cpu: cpuResult,
    memory: memoryResult,
    hashing: hashResult
  };
}

/**
 * Generate histogram from image data
 * @param {Uint8ClampedArray} imageData - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Histogram data
 */
function generateHistogram(imageData, width, height) {
  // Safety check
  if (!imageData || !width || !height) {
    return { red: [], green: [], blue: [], pixelCount: 0 };
  }
  
  const redHistogram = new Array(256).fill(0);
  const greenHistogram = new Array(256).fill(0);
  const blueHistogram = new Array(256).fill(0);
  
  for (let i = 0; i < imageData.length; i += 4) {
    if (i + 2 < imageData.length) {
      redHistogram[imageData[i]]++;
      greenHistogram[imageData[i + 1]]++;
      blueHistogram[imageData[i + 2]]++;
    }
  }
  
  return {
    red: redHistogram,
    green: greenHistogram,
    blue: blueHistogram,
    pixelCount: (width * height)
  };
}

/**
 * Detect rendering differences across browsers
 * @param {Uint8ClampedArray} imageData - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Analysis results
 */
function detectRenderingDifferences(imageData, width, height) {
  // Safety check
  if (!imageData || !width || !height) {
    return {
      nonTransparentPixelRatio: 0,
      averageColor: [0, 0, 0],
      analysisTime: new Date().toISOString()
    };
  }
  
  // Calculate total non-transparent pixels
  let nonTransparentPixels = 0;
  let redSum = 0, greenSum = 0, blueSum = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < imageData.length; i += 4) {
    if (i + 3 < imageData.length) {
      if (imageData[i + 3] > 0) {
        nonTransparentPixels++;
        redSum += imageData[i];
        greenSum += imageData[i + 1];
        blueSum += imageData[i + 2];
      }
    }
  }
  
  const avgRed = nonTransparentPixels > 0 ? redSum / nonTransparentPixels : 0;
  const avgGreen = nonTransparentPixels > 0 ? greenSum / nonTransparentPixels : 0;
  const avgBlue = nonTransparentPixels > 0 ? blueSum / nonTransparentPixels : 0;
  
  return {
    nonTransparentPixelRatio: nonTransparentPixels / pixelCount,
    averageColor: [avgRed, avgGreen, avgBlue],
    analysisTime: new Date().toISOString()
  };
}

/**
 * Analyze GPU acceleration profile from image data
 * @param {Uint8ClampedArray} imageData - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Analysis results
 */
function analyzeAccelerationProfile(imageData, width, height) {
  // Safety check
  if (!imageData || !width || !height || width < 3 || height < 3) {
    return {
      edgeCount: 0,
      averageEdgeStrength: 0,
      edgeRatio: 0,
      processingTime: new Date().toISOString()
    };
  }
  
  // Create an array for the edge detection result
  const edges = new Uint8ClampedArray(width * height);
  
  // Simple edge detection (Sobel-like)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Safety check
      if (idx + 6 >= imageData.length) continue;
      
      // Get current pixel
      const r = imageData[idx];
      const g = imageData[idx + 1];
      const b = imageData[idx + 2];
      
      // Get pixel to the right
      const rightIdx = (y * width + (x + 1)) * 4;
      if (rightIdx + 2 >= imageData.length) continue;
      
      const rRight = imageData[rightIdx];
      const gRight = imageData[rightIdx + 1];
      const bRight = imageData[rightIdx + 2];
      
      // Get pixel below
      const belowIdx = ((y + 1) * width + x) * 4;
      if (belowIdx + 2 >= imageData.length) continue;
      
      const rBelow = imageData[belowIdx];
      const gBelow = imageData[belowIdx + 1];
      const bBelow = imageData[belowIdx + 2];
      
      // Calculate gradient
      const dx = Math.abs(r - rRight) + Math.abs(g - gRight) + Math.abs(b - bRight);
      const dy = Math.abs(r - rBelow) + Math.abs(g - gBelow) + Math.abs(b - bBelow);
      
      // Calculate gradient magnitude
      const gradient = Math.min(255, Math.sqrt(dx * dx + dy * dy));
      
      // Store in edges array
      const edgeIdx = y * width + x;
      if (edgeIdx < edges.length) {
        edges[edgeIdx] = gradient;
      }
    }
  }
  
  // Calculate edge metrics
  let edgeSum = 0;
  let edgeCount = 0;
  
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 30) { // Threshold
      edgeSum += edges[i];
      edgeCount++;
    }
  }
  
  return {
    edgeCount,
    averageEdgeStrength: edgeCount > 0 ? edgeSum / edgeCount : 0,
    edgeRatio: edgeCount / (width * height),
    processingTime: new Date().toISOString()
  };
}

/**
 * Perform full image analysis
 * @param {Uint8ClampedArray} imageData - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Analysis results
 */
function fullImageAnalysis(imageData, width, height) {
  // Safety check
  if (!imageData || !width || !height) {
    return {
      error: "Invalid image data",
      timestamp: new Date().toISOString()
    };
  }
  
  // Run multiple analyses
  const histogram = generateHistogram(imageData, width, height);
  const renderingDiffs = detectRenderingDifferences(imageData, width, height);
  const accelerationProfile = analyzeAccelerationProfile(imageData, width, height);
  
  // Calculate uniqueness score
  const uniquenessScore = calculateImageUniquenessScore(
    histogram, 
    renderingDiffs.averageColor,
    accelerationProfile.edgeRatio
  );
  
  return {
    histogram,
    rendering: renderingDiffs,
    acceleration: accelerationProfile,
    uniquenessScore,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate image uniqueness score
 * @param {Object} histogram - Color histogram
 * @param {Array} avgColor - Average color values
 * @param {number} edgeRatio - Edge pixel ratio
 * @returns {number} Uniqueness score 0-100
 */
function calculateImageUniquenessScore(histogram, avgColor, edgeRatio) {
  // Safety check
  if (!histogram || !histogram.pixelCount || !avgColor) {
    return 0;
  }
  
  // Calculate color distribution entropy
  let redEntropy = 0;
  let greenEntropy = 0;
  let blueEntropy = 0;
  
  const pixelCount = histogram.pixelCount;
  
  // Calculate entropy for each color channel
  for (let i = 0; i < 256; i++) {
    if (histogram.red[i] > 0) {
      const prob = histogram.red[i] / pixelCount;
      redEntropy -= prob * Math.log2(prob);
    }
    
    if (histogram.green[i] > 0) {
      const prob = histogram.green[i] / pixelCount;
      greenEntropy -= prob * Math.log2(prob);
    }
    
    if (histogram.blue[i] > 0) {
      const prob = histogram.blue[i] / pixelCount;
      blueEntropy -= prob * Math.log2(prob);
    }
  }
  
  // Normalize entropy to 0-10 scale
  const maxEntropy = 8; // Maximum possible entropy for color distribution
  const normalizedEntropy = ((redEntropy + greenEntropy + blueEntropy) / 3) / maxEntropy * 10;
  
  // Combine with edge ratio (0-1) and average color
  const colorVariance = (
    Math.abs(avgColor[0] - 128) + 
    Math.abs(avgColor[1] - 128) + 
    Math.abs(avgColor[2] - 128)
  ) / 384; // Normalize to 0-1
  
  // Calculate final score
  const score = (
    normalizedEntropy * 5 + // 0-50 points from entropy
    edgeRatio * 30 +        // 0-30 points from edge detection
    colorVariance * 20       // 0-20 points from color variance
  );
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate network performance score
 * @param {Object} timings - Performance timings
 * @returns {number} Performance score 0-100
 */
function calculateNetworkPerformance(timings) {
  if (!timings) return 0;
  
  // Calculate key metrics
  const dnsTime = (timings.domainLookupEnd || 0) - (timings.domainLookupStart || 0);
  const connectionTime = (timings.connectEnd || 0) - (timings.connectStart || 0);
  const ttfb = (timings.responseStart || 0) - (timings.requestStart || 0);
  const downloadTime = (timings.responseEnd || 0) - (timings.responseStart || 0);
  const domTime = (timings.domComplete || 0) - (timings.domLoading || 0);
  
  // Assign scores for each metric (higher is better)
  let dnsScore = 100 - Math.min(100, dnsTime);
  let connectionScore = 100 - Math.min(100, connectionTime / 2);
  let ttfbScore = 100 - Math.min(100, ttfb / 5);
  let downloadScore = 100 - Math.min(100, downloadTime / 10);
  let domScore = 100 - Math.min(100, domTime / 20);
  
  // Handle negative values (can happen with bad timings)
  dnsScore = Math.max(0, dnsScore);
  connectionScore = Math.max(0, connectionScore);
  ttfbScore = Math.max(0, ttfbScore);
  downloadScore = Math.max(0, downloadScore);
  domScore = Math.max(0, domScore);
  
  // Weight the scores
  const finalScore = (
    dnsScore * 0.1 +
    connectionScore * 0.1 +
    ttfbScore * 0.3 +
    downloadScore * 0.2 +
    domScore * 0.3
  );
  
  return Math.round(finalScore);
}

/**
 * Identify network bottlenecks
 * @param {Object} timings - Performance timings
 * @param {Array} resources - Resource timing entries
 * @returns {Array} Bottleneck analysis
 */
function identifyBottlenecks(timings, resources) {
  const bottlenecks = [];
  
  if (!timings) return bottlenecks;
  
  // Check DNS time
  const dnsTime = (timings.domainLookupEnd || 0) - (timings.domainLookupStart || 0);
  if (dnsTime > 100) {
    bottlenecks.push({
      type: 'dns',
      duration: dnsTime,
      severity: dnsTime > 300 ? 'high' : 'medium',
      description: 'DNS resolution time is high'
    });
  }
  
  // Check Time to First Byte
  const ttfb = (timings.responseStart || 0) - (timings.requestStart || 0);
  if (ttfb > 300) {
    bottlenecks.push({
      type: 'ttfb',
      duration: ttfb,
      severity: ttfb > 1000 ? 'high' : 'medium',
      description: 'Server response time (TTFB) is high'
    });
  }
  
  // Check DOM processing time
  const domTime = (timings.domComplete || 0) - (timings.domLoading || 0);
  if (domTime > 500) {
    bottlenecks.push({
      type: 'dom',
      duration: domTime,
      severity: domTime > 2000 ? 'high' : 'medium',
      description: 'DOM processing time is high'
    });
  }
  
  // Check for resource bottlenecks if available
  if (resources && resources.length) {
    let slowResources = 0;
    let totalResourceTime = 0;
    
    resources.forEach(resource => {
      const duration = resource.duration || 0;
      totalResourceTime += duration;
      
      if (duration > 500) {
        slowResources++;
      }
    });
    
    if (slowResources > 2) {
      bottlenecks.push({
        type: 'resources',
        count: slowResources,
        severity: slowResources > 5 ? 'high' : 'medium',
        description: `${slowResources} resources are loading slowly`
      });
    }
  }
  
  return bottlenecks;
}

/**
 * Analyze network connection quality
 * @param {Object} connection - Network connection information
 * @returns {Object} Connection analysis
 */
function analyzeConnection(connection) {
  if (!connection) {
    return {
      type: 'unknown',
      quality: 'unknown',
      reliability: 'unknown'
    };
  }
  
  // Determine connection quality
  let quality = 'unknown';
  let reliability = 'unknown';
  
  if (connection.downlink) {
    if (connection.downlink < 1) {
      quality = 'poor';
    } else if (connection.downlink < 5) {
      quality = 'fair';
    } else if (connection.downlink < 15) {
      quality = 'good';
    } else {
      quality = 'excellent';
    }
  }
  
  if (connection.rtt) {
    if (connection.rtt > 500) {
      reliability = 'poor';
    } else if (connection.rtt > 200) {
      reliability = 'fair';
    } else if (connection.rtt > 50) {
      reliability = 'good';
    } else {
      reliability = 'excellent';
    }
  }
  
  return {
    type: connection.effectiveType || connection.type || 'unknown',
    quality,
    reliability,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  };
}

/**
 * Assess network security risks
 * @param {Array} resources - Resource timing entries
 * @returns {Array} Security risk analysis
 */
function assessNetworkSecurity(resources) {
  const securityRisks = [];
  
  if (!resources || !resources.length) {
    return securityRisks;
  }
  
  // Count insecure resources
  let insecureCount = 0;
  let mixedContentCount = 0;
  
  resources.forEach(resource => {
    if (resource.name && resource.name.startsWith('http:')) {
      insecureCount++;
      
      if (self.location && self.location.protocol === 'https:') {
        mixedContentCount++;
      }
    }
  });
  
  // Report insecure resources
  if (insecureCount > 0) {
    securityRisks.push({
      type: 'insecure-resources',
      count: insecureCount,
      severity: insecureCount > 5 ? 'high' : 'medium',
      description: `${insecureCount} resources are loaded over insecure HTTP`
    });
  }
  
  // Report mixed content
  if (mixedContentCount > 0) {
    securityRisks.push({
      type: 'mixed-content',
      count: mixedContentCount,
      severity: 'high',
      description: `${mixedContentCount} resources are loaded as mixed content`
    });
  }
  
  return securityRisks;
}

// Notify that worker is ready
self.postMessage({
  status: 'ready',
  type: 'workerReady',
  capabilities: [
    'fingerprint',
    'dataProcessing',
    'benchmark',
    'imageAnalysis',
    'networkAnalysis'
  ]
});