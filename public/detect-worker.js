// YOLOv8 推理 Worker（onnxruntime-web）
// 通过 CDN 加载 ort，避免 webpack 打包问题

importScripts('/ort.min.js')

const MODEL_URL = '/yolov8n.onnx'
const INPUT_SIZE = 640
const CONF_THRESHOLD = 0.35
const IOU_THRESHOLD = 0.45

// COCO 80 类标签
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
  'refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush'
]

let session = null

async function loadModel() {
  ort.env.wasm.wasmPaths = '/'
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  })
}

// imageData → Float32 NCHW tensor [1,3,640,640]，归一化到 [0,1]
function preprocess(imageData) {
  const { data, width, height } = imageData
  const tensor = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE)
  const area = INPUT_SIZE * INPUT_SIZE
  for (let i = 0; i < area; i++) {
    tensor[i]          = data[i * 4]     / 255  // R
    tensor[i + area]   = data[i * 4 + 1] / 255  // G
    tensor[i + area*2] = data[i * 4 + 2] / 255  // B
  }
  return new ort.Tensor('float32', tensor, [1, 3, INPUT_SIZE, INPUT_SIZE])
}

// YOLOv8 输出 [1, 84, 8400] → 解码为 [{class, score, bbox:[x,y,w,h]}]
// bbox 坐标已映射回原始视频分辨率
function postprocess(output, videoW, videoH) {
  const data = output.data          // Float32Array
  const numAnchors = output.dims[2] // 8400
  const scaleX = videoW / INPUT_SIZE
  const scaleY = videoH / INPUT_SIZE

  const boxes = []
  for (let i = 0; i < numAnchors; i++) {
    // cx, cy, w, h
    const cx = data[0 * numAnchors + i]
    const cy = data[1 * numAnchors + i]
    const bw = data[2 * numAnchors + i]
    const bh = data[3 * numAnchors + i]

    // 找最大类别分数
    let maxScore = 0, classId = 0
    for (let c = 0; c < 80; c++) {
      const s = data[(4 + c) * numAnchors + i]
      if (s > maxScore) { maxScore = s; classId = c }
    }

    if (maxScore < CONF_THRESHOLD) continue

    // 转为左上角坐标，映射到视频分辨率
    const x = (cx - bw / 2) * scaleX
    const y = (cy - bh / 2) * scaleY
    const w = bw * scaleX
    const h = bh * scaleY

    boxes.push({ class: COCO_CLASSES[classId], score: maxScore, bbox: [x, y, w, h], classId })
  }

  return nms(boxes)
}

function iou(a, b) {
  const [ax, ay, aw, ah] = a.bbox
  const [bx, by, bw, bh] = b.bbox
  const ix = Math.max(0, Math.min(ax+aw, bx+bw) - Math.max(ax, bx))
  const iy = Math.max(0, Math.min(ay+ah, by+bh) - Math.max(ay, by))
  const inter = ix * iy
  return inter / (aw*ah + bw*bh - inter + 1e-6)
}

function nms(boxes) {
  boxes.sort((a, b) => b.score - a.score)
  const keep = []
  const suppressed = new Uint8Array(boxes.length)
  for (let i = 0; i < boxes.length; i++) {
    if (suppressed[i]) continue
    keep.push(boxes[i])
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].classId === boxes[j].classId && iou(boxes[i], boxes[j]) > IOU_THRESHOLD) {
        suppressed[j] = 1
      }
    }
  }
  return keep
}

// ─── 消息处理 ───────────────────────────────────────────────
self.onmessage = async (e) => {
  const { type, imageData, videoW, videoH } = e.data

  if (type === 'init') {
    try {
      await loadModel()
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message })
    }
    return
  }

  if (type === 'detect' && session) {
    try {
      const inputTensor = preprocess(imageData)
      const feeds = { [session.inputNames[0]]: inputTensor }
      const results = await session.run(feeds)
      const output = results[session.outputNames[0]]
      const detections = postprocess(output, videoW, videoH)
      self.postMessage({ type: 'result', detections })
    } catch (err) {
      self.postMessage({ type: 'result', detections: [] })
    }
  }
}
