# 智能头盔雷达感知 — 模拟场景方案文档

> 文件路径：`src/components/zntk/radarDisplay.vue`
> 核心架构：场景状态机 + 预警系统，独立于真实雷达数据运行。

---

## 整体架构

### 场景管理器设计原则

- 每个场景有独立的 `_initScenarioN()` / `_destroyScenarioN()` / `_tickScenarioN(delta, t)` 三件套方法
- 所有场景共用同一套扫描波颜色机制（`_scanWaves`）和底栏预警 UI
- 主角骑手模型不移动，通过驱动车道线 `_laneLines` 滚动模拟骑手前进感
- 预警颜色三级：`safe`（蓝）→ `caution`（橙）→ `danger`（红）

### 统一预警 UI 层（四级状态机）

| 状态 | 扫描波颜色 | 底栏消息 | 视觉反馈 |
|------|-----------|---------|---------|
| `SAFE` | 蓝色 `#3b82f6` | "周边安全" | 正常脉冲 |
| `CAUTION` | 橙色 `#f97316` | 方向 + 距离提示 | 橙色 pill 闪烁 |
| `WARNING` | 红色 `#ef4444` | "减速注意" | 红色 pill 高频闪 + 屏幕边框 |
| `BRAKE` | 高频红色 | "⚠ 紧急制动" | 全屏红框 + 骑手停止 + Sprite 弹出 |

---

## 场景一：并行变道预警

### 场景描述

右侧车道有车辆与主角并排行驶，随后突然切入主角车道，触发紧急制动。

### 时间轴（16s 循环）

```
Phase0 [0~5s]   并行追上
                并行车从后方 z=-10 追至与主角齐平（z=0）
                主角加速到巡航速度 5m/s
                HUD: "周边安全"，扫描波蓝色

Phase1 [5~8s]   并排同行
                并行车保持 x=2.0（右车道），与主角并排
                HUD: "右侧有车辆并行，保持距离"，橙色预警

Phase2 [8~10s]  紧急变道
                并行车 x: 2.0 → -1.5（smoothstep 缓动，2s 内切入）
                车身绕 Y 轴偏转 ±25° 表现侧滑
                dangerOverlay 地面红色高亮淡入
                制动警告 Sprite 淡入，扫描波变红

Phase3 [10~13s] 完全制动停止
                主角减速至 0，全屏红框，Sprite "⚠ 紧急制动"
                并行车以 1.5 倍速继续前驶离开

Phase4 [13~16s] 复位
                dangerOverlay / brakeSprite 淡出
                车辆归位，车道线恢复，下次循环准备
```

### 预警触发条件

```
横向距离判断：|riderX - carX| < 2.5 && |riderZ - carZ| < 3  →  触发预警
Phase2 开始即强制进入 DANGER 状态
```

### 三维实体

| 实体 | 实现 |
|------|------|
| 并行车 | `car2.glb` Group，初始 `position(2.0, 0, -10)`，`rotation.y=0` |
| 车底光晕 | `CircleGeometry(1.3, 48)`，红色，随预警等级闪烁 |
| 危险区地面高亮 | `PlaneGeometry(4, 6)`，红色透明平面，`position(-0.5, 0.008, 3)` |
| 制动 Sprite | Canvas 绘制"⚠ 紧急制动"，`scale(5, 1.25, 1)` |

### data() 新增字段

```js
sc1Active: false,       // 是否运行
sc1Phase: 0,            // 当前阶段 0~4
sc1PhaseLabel: '',      // 阶段文字
sc1RiderSpeed: 0,       // 主角当前速度
sc1Warning: 'safe',     // 'safe' | 'caution' | 'danger'
sc1WarnMsg: '',         // 预警提示文字
sc1CarDist: 0,          // 与并行车距离
```

---

## 场景二：路口相汇预警

### 场景描述

主角在行驶至路口时，有横向来车从左侧高速驶来，基于 TTC（碰撞时间）触发预警并刹停在停止线前。

### 时间轴（18s 循环）

```
Phase0 [0~6s]   双方接近路口
                主角匀速前进（5m/s），路口位于 z=15
                横穿车从 x=-20 沿 X 轴向右行驶（速度 6m/s）
                HUD: "前方路口，注意横向来车"，蓝色扫描波

Phase1 [6~8s]   TTC < 3s 触发预警
                双方同时接近路口，TTC 计算持续更新
                TTC < 3s → CAUTION，TTC < 1.5s → DANGER
                主角开始减速

Phase2 [8~10s]  主角刹停在停止线前（z≈12）
                横穿车通过路口（x: -20 → +20）
                全屏红框，Sprite "⚠ 路口来车！"

Phase3 [10~14s] 横穿车通过，主角恢复行驶
                危险解除，主角继续前进通过路口

Phase4 [14~18s] 复位循环
```

### TTC 计算逻辑

```
distToIntersection_rider = |riderZ - 15|
distToIntersection_car   = |carX - 0|
TTC_rider = distToIntersection_rider / riderSpeed
TTC_car   = distToIntersection_car / carSpeed

TTC = min(TTC_rider, TTC_car)
TTC < 3s  → CAUTION（橙色）
TTC < 1.5s → DANGER（红色）+ 紧急制动
```

### 场景基础设施（路口）

在 `initThree()` 末尾新增路口铺装：

```
十字路口平面：  PlaneGeometry(8, 8)，深灰，position(0, 0, 15)
停止线（南向）：PlaneGeometry(8, 0.25)，白色，position(0, 0.004, 12)
斑马线：        8条 PlaneGeometry(0.6, 4)，白色，间距 0.8m，横跨路口北侧
横向道路：      PlaneGeometry(40, 6)，深灰，position(0, 0, 15)，rotation.y=π/2
```

### 三维实体

| 实体 | 实现 |
|------|------|
| 横穿车 | `car2.glb` Group，`rotation.y=π/2`（朝 +x 行驶），初始 `position(-20, 0, 15)` |
| 路口危险区高亮 | `PlaneGeometry(8, 8)`，红色透明，`position(0, 0.008, 15)` |
| 制动 Sprite | "⚠ 路口来车！" |

### data() 新增字段

```js
sc2Active: false,
sc2Phase: 0,
sc2PhaseLabel: '',
sc2RiderSpeed: 0,
sc2Warning: 'safe',
sc2WarnMsg: '',
sc2TTC: 99,
```

---

## 场景三：斑马线行人预警

### 场景描述

主角行驶至斑马线区域，有行人从右侧横穿，进入主角行驶路径，触发行人预警并停车礼让。

### 时间轴（14s 循环）

```
Phase0 [0~4s]   主角前进，行人从右侧出现
                行人从 x=+4 开始横穿（沿 -x 方向行走）
                行人动画：rig_people.glb walk 动画播放
                HUD: "前方斑马线"，蓝色扫描波

Phase1 [4~6s]   行人进入主角车道
                行人 x 进入 [-1, +1] 范围
                触发 CAUTION → WARNING
                HUD: "行人横穿！请减速"，橙色波纹（区别于车辆红色）

Phase2 [6~8s]   主角刹停在斑马线前（z≈5）
                行人继续穿越，动画继续
                全屏橙色边框（区别于车辆场景的红色）
                Sprite "⚠ 行人优先！停车礼让"

Phase3 [8~11s]  行人离开（x < -3），主角等待
                "行人通过中，请耐心等待"

Phase4 [11~14s] 行人离开，主角恢复行驶，复位循环
```

### 预警触发条件（区分车辆与行人）

```
检测区：riderZ < personZ < riderZ+8  &&  |personX| < 2
触发 CAUTION：行人进入检测区
触发 WARNING：|personX| < 1（进入主车道）
预警颜色：橙色 #f97316（行人）vs 红色 #ef4444（车辆），视觉区分
```

### 三维实体

| 实体 | 实现 |
|------|------|
| 行人模型 | `rig_people.glb` + walk 动画，`scale(1.5)`，初始 `position(4, 0, 7)` |
| 行人朝向 | `rotation.y = π/2`（朝 -x 方向行走，面朝骑手） |
| 行人地面光圈 | `RingGeometry`，橙色，跟随行人 Group |
| 斑马线预警高亮 | `PlaneGeometry(8, 4)`，橙色透明，`position(0, 0.008, 7)` |
| 制动 Sprite | "⚠ 行人优先！停车礼让" |

### data() 新增字段

```js
sc3Active: false,
sc3Phase: 0,
sc3PhaseLabel: '',
sc3RiderSpeed: 0,
sc3Warning: 'safe',
sc3WarnMsg: '',
sc3PersonX: 4,
```

---

## 场景四：车门突开预警（Door Zone Warning）

### 场景描述

路边停靠的轿车突然开启车门，门区进入主角行驶路径，主角需提前感知 TTC 并制动避让。

### 时间轴（18s 循环）

```
Phase0 [0~4s]   巡航行驶
                主角速度 5m/s，路边有一辆停靠静止轿车
                停靠车位于 x=-2.5, z=8（左侧路边，侧向停靠）
                HUD: "周边安全"，扫描波蓝色

Phase1 [4~6s]   车门缓慢开启
                车门绕 doorPivot 旋转：0° → 75°（smoothstep 缓动）
                门端 X 坐标进入 |x| < 2 范围 → 触发 CAUTION
                HUD: "左侧停靠车辆，注意开门风险"
                扫描波变橙，doorOverlay 地面高亮淡入

Phase2 [6~7.5s] 车门全开 + TTC < 2s → 紧急制动
                主角减速至 0，全屏红框
                Sprite "⚠ 注意开门！"淡入
                扫描波高频红色，门区地面红色闪烁

Phase3 [7.5~11s] 主角停止，等待
                骑手速度=0，门保持 75° 开启状态
                HUD: "停车避让，等待车门关闭"

Phase4 [11~14s] 车门关闭
                车门旋转：75° → 0°（smoothstep 缓动）
                危险解除，主角恢复行驶
                HUD: "危险解除，恢复行驶"

Phase5 [14~18s] 复位循环
```

### TTC 计算逻辑

```
doorPivotX = -2.5,  doorPivotZ = 7.4
doorLen    = 1.2    （车门长度，m）
doorAngle  = 当前开门角度（0°~75°，弧度）

doorTipX = doorPivotX + doorLen * sin(doorAngle)
doorTipZ = doorPivotZ - doorLen * cos(doorAngle)

distToDoor = sqrt(doorTipX² + (doorTipZ - riderZ)²)
TTC = distToDoor / riderSpeed

TTC < 4s  → CAUTION（橙色）
TTC < 2s  → DANGER（红色）+ 紧急制动
```

### 三维实体

| 实体 | 实现 | 说明 |
|------|------|------|
| 停靠轿车体 | `car2.glb` Group，`position(-2.5, 0, 8)`，`rotation.y = π/2` | 侧向停靠，车头朝 -z |
| 车门 pivot | `THREE.Group`，挂在 parkedCarGroup 子节点，`position(-2.5, 0, 7.4)` | 门轴位于车身左前侧 |
| 车门几何体 | `BoxGeometry(0.08, 0.95, 1.2)`，橙黄色 `#f97316`，挂在 doorPivot 子节点 | 绕 doorPivot Y 轴旋转 |
| 门区地面高亮 | `PlaneGeometry(2.5, 1.5)`，橙→红渐变透明平面 | 门打开时淡入 |
| 门扫描扇形 | 复用 `_updateSectors()` 思路，单独橙色扇形覆盖门区 | 覆盖 doorTip 到 rider 连线 |
| 制动 Sprite | Canvas 绘制"⚠ 注意开门！"，橙红底色 | 与场景一样式一致 |

### 与其他场景的关键差异

| 差异点 | 场景一（并行变道） | 场景四（车门突开） |
|--------|-----------------|-----------------|
| 威胁来源 | 动态行驶车辆 | 静止车辆的动态门 |
| 检测对象 | 整车 Group 位置 | 门端坐标（动态计算） |
| 预警颜色 | 纯红 | 橙红渐变（门区特有） |
| TTC 计算 | 相对速度法 | 门端距离 / 主角速度 |
| 停车后行为 | 立即可恢复 | 等待门关闭后才恢复 |
| 停靠车朝向 | 无（行驶中） | `rotation.y = π/2`（侧停） |

### data() 新增字段

```js
sc4Active: false,
sc4Phase: 0,
sc4PhaseLabel: '',
sc4RiderSpeed: 0,
sc4Warning: 'safe',
sc4WarnMsg: '',
sc4DoorAngle: 0,        // 当前车门开启角度（弧度）
sc4DoorDist: 0,         // 门端到主角距离
sc4TTC: 99,             // 碰撞时间
```

---

## 代码改动总览

### 新增/修改位置对照表

| 位置 | 场景一 | 场景二 | 场景三 | 场景四 |
|------|--------|--------|--------|--------|
| `data()` | `sc1*` 字段 ✅ 已有 | `sc2*` 字段 | `sc3*` 字段 | `sc4*` 字段 |
| `created()` | `_sc1: null` ✅ 已有 | `_sc2: null` | `_sc3: null` | `_sc4: null` |
| `initThree()` | 已有并行车实体 ✅ | 新增路口、横向道路 | 新增斑马线 | 停靠车模型 |
| `renderLoop()` | `_tickScenario1` ✅ 已有 | `_tickScenario2` | `_tickScenario3` | `_tickScenario4` |
| 新增方法 | 全部 ✅ 已有 | `startScenario2` 等 4 个 | `startScenario3` 等 4 个 | `startScenario4` 等 4 个 |
| 模板底栏按钮 | ✅ 已有 | 新增 | 新增 | 新增 |
| HUD 浮层 | ✅ 已有 | 新增（复用 sc1-hud 样式） | 新增 | 新增 |

### 场景互斥控制

各场景按钮点击时先停止其他所有激活场景，保证同时只有一个场景运行：

```js
startScenario2() {
  if (this.sc1Active) this.stopScenario1()
  if (this.sc3Active) this.stopScenario3()
  if (this.sc4Active) this.stopScenario4()
  // ...
}
```

### 路口基础设施共享

场景二、三均依赖路口场景元素（十字路面、停止线、斑马线），建议在 `initThree()` 末尾统一初始化，不依赖场景是否激活：

```js
_initIntersection() {
  // 十字路口平面
  // 停止线
  // 斑马线（8条白色矩形）
  // 横向道路
  // 路口车道线
}
```

---

## 预警视觉风格规范

| 场景 | 主色调 | Sprite 文字 | 扫描波颜色 |
|------|-------|------------|-----------|
| 场景一：并行变道 | 红色 `#ef4444` | ⚠ 紧急制动 | 蓝→橙→红 |
| 场景二：路口相汇 | 红色 `#ef4444` | ⚠ 路口来车！ | 蓝→橙→红 |
| 场景三：斑马线行人 | 橙色 `#f97316` | ⚠ 行人优先！停车礼让 | 蓝→橙（不变红） |
| 场景四：车门突开 | 橙红 `#f97316`→`#ef4444` | ⚠ 注意开门！ | 蓝→橙→红 |

> 行人场景（场景三）特意使用橙色而非红色，视觉上与车辆威胁区分，符合交通语义（行人优先≠紧急危险）。

---

*文档生成日期：2026-04-11*
*对应源文件：`src/components/zntk/radarDisplay.vue`*
