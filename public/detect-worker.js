// YOLOv8 推理 Worker：所有 ONNX 计算在此线程，不阻塞主线程 UI

importScripts('/models/ort.min.js')

const COCO_CLASSES = [
  'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat',
  'traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat',
  'dog','horse','sheep','cow','elephant','bear','zebra','giraffe','backpack',
  'umbrella','handbag','tie','suitcase','frisbee','skis','snowboard','sports ball',
  'kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket',
  'bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple',
  'sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair',
  'couch','potted plant','bed','dining table','toilet','tv','laptop','mouse',
  'remote','keyboard','cell phone','microwave','oven','toaster','sink',
  'refrigerator','book','clock','vase','scissors','teddy bear','hair drier',
  'toothbrush'
]

let session = null

async function init() {
  ort.env.wasm.wasmPaths = '/models/'
  ort.env.wasm.numThreads = (navigator.hardwareConcurrency || 4)
  session = await ort.InferenceSession.create('/models/yolov8n.onnx', {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all'
  })
  postMessage({ type: 'ready' })
}

function iou(a, b) {
  const ax2 = a[0]+a[2], ay2 = a[1]+a[3]
  const bx2 = b[0]+b[2], by2 = b[1]+b[3]
  const ix1 = Math.max(a[0],b[0]), iy1 = Math.max(a[1],b[1])
  const ix2 = Math.min(ax2,bx2),   iy2 = Math.min(ay2,by2)
  const inter = Math.max(0,ix2-ix1)*Math.max(0,iy2-iy1)
  return inter / (a[2]*a[3]+b[2]*b[3]-inter+1e-6)
}

async function detect(imageData, videoW, videoH) {
  const size = 640
  // 预处理：RGBA → RGB Float32 channel-first
  const { data } = imageData
  const n = size * size
  const float32 = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    float32[i]         = data[i*4]   / 255
    float32[n+i]       = data[i*4+1] / 255
    float32[2*n+i]     = data[i*4+2] / 255
  }
  const tensor = new ort.Tensor('float32', float32, [1, 3, size, size])
  const feeds = { [session.inputNames[0]]: tensor }
  const results = await session.run(feeds)
  const output = results[session.outputNames[0]]

  // 后处理
  const d = output.data
  const numBoxes = output.dims[2]
  const confThresh = 0.35
  const raw = []
  for (let i = 0; i < numBoxes; i++) {
    let maxScore = 0, maxCls = 0
    for (let c = 0; c < 80; c++) {
      const s = d[(4+c)*numBoxes+i]
      if (s > maxScore) { maxScore = s; maxCls = c }
    }
    if (maxScore < confThresh) continue
    const cx = d[0*numBoxes+i], cy = d[1*numBoxes+i]
    const bw = d[2*numBoxes+i], bh = d[3*numBoxes+i]
    const sx = videoW/size, sy = videoH/size
    raw.push({
      class: COCO_CLASSES[maxCls],
      score: maxScore,
      bbox: [(cx-bw/2)*sx, (cy-bh/2)*sy, bw*sx, bh*sy]
    })
  }
  raw.sort((a,b) => b.score - a.score)
  const keep = [], suppressed = new Set()
  for (let i = 0; i < raw.length; i++) {
    if (suppressed.has(i)) continue
    keep.push(raw[i])
    for (let j = i+1; j < raw.length; j++) {
      if (iou(raw[i].bbox, raw[j].bbox) > 0.45) suppressed.add(j)
    }
  }
  return keep
}

onmessage = async (e) => {
  const { type, imageData, videoW, videoH } = e.data
  if (type === 'init') {
    await init()
  } else if (type === 'detect' && session) {
    try {
      const detections = await detect(imageData, videoW, videoH)
      postMessage({ type: 'result', detections })
    } catch(err) {
      postMessage({ type: 'result', detections: [] })
    }
  }
}
