#!/usr/bin/env python3

import serial
import time
import json
import sys
import os
import datetime
from threading import Thread, Event

# Flask & SocketIO
from flask import Flask
from flask_socketio import SocketIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'common'))

from parseFrame import parseStandardFrame
from tlv_defines import *

UART_MAGIC_WORD = bytearray(b'\x02\x01\x04\x03\x06\x05\x08\x07')

# Flask app 和 SocketIO 初始化
app = Flask(__name__)
# 允许所有来源跨域（开发用，上线建议改为具体域名如 "http://localhost:5173" 或你的Vue部署地址）
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

class RadarDataSender:
    def __init__(self, cli_port='/dev/ttyUSB0', data_port='/dev/ttyUSB1'):
        self.cli_port = cli_port
        self.data_port = data_port
        self.running = False
        self.cli_com = None
        self.data_com = None
        self.frame_count = 0
        self.start_time = None
        self.stop_event = Event()

    def connect_ports(self):
        try:
            self.cli_com = serial.Serial(self.cli_port, 115200,
                                         parity=serial.PARITY_NONE,
                                         stopbits=serial.STOPBITS_ONE,
                                         timeout=0.6)
            self.cli_com.reset_output_buffer()

            self.data_com = serial.Serial(self.data_port, 921600,
                                          parity=serial.PARITY_NONE,
                                          stopbits=serial.STOPBITS_ONE,
                                          timeout=0.6)
            self.data_com.reset_output_buffer()

            return True
        except Exception as e:
            print(f"串口连接失败: {e}")
            return False

    def read_and_parse_frame(self):
        try:
            index = 0
            magic_byte = self.data_com.read(1)
            frame_data = bytearray(b'')

            while not self.stop_event.is_set():
                if len(magic_byte) < 1:
                    return None

                if magic_byte[0] == UART_MAGIC_WORD[index]:
                    index += 1
                    frame_data.append(magic_byte[0])
                    if index == 8:
                        break
                    magic_byte = self.data_com.read(1)
                else:
                    index = 0
                    frame_data = bytearray(b'')
                    magic_byte = self.data_com.read(1)

            if self.stop_event.is_set():
                return None

            version_bytes = self.data_com.read(4)
            frame_data += version_bytes

            length_bytes = self.data_com.read(4)
            frame_data += length_bytes
            frame_length = int.from_bytes(length_bytes, byteorder='little')

            frame_length -= 16
            frame_data += self.data_com.read(frame_length)

            output_dict = parseStandardFrame(frame_data)

            if output_dict.get('error') == 0:
                self.frame_count += 1
                if self.start_time is None:
                    self.start_time = datetime.datetime.now()

                elapsed = (datetime.datetime.now() - self.start_time).total_seconds()
                fps = self.frame_count / elapsed if elapsed > 0 else 0

                output_dict['frame_number'] = self.frame_count
                output_dict['timestamp'] = datetime.datetime.now().isoformat()
                output_dict['fps'] = round(fps, 2)

                return output_dict
            else:
                return None

        except Exception as e:
            print(f"读取/解析帧出错: {e}")
            return None

    def send_config(self, config_file):
        try:
            with open(config_file, 'r') as f:
                cfg = f.readlines()

            cfg = [line.strip() for line in cfg if line.strip() and not line.startswith('%')]

            for line in cfg:
                if not self.running:
                    return False
                self.cli_com.write((line + '\n').encode())
                time.sleep(0.05)  # 稍微放慢，避免发送过快
                ack = self.cli_com.readline().decode().strip()
                if not ack:
                    print("CLI 无响应")
                    return False

            return True
        except Exception as e:
            print(f"发送配置失败: {e}")
            return False

    def data_collection_loop(self):
        while self.running and not self.stop_event.is_set():
            data = self.read_and_parse_frame()
            if data:
                # ndarray 字段转字符串，保持与前端解析格式兼容
                for key in ('pointCloud', 'trackData', 'trackIndexes'):
                    if key in data and hasattr(data[key], 'tolist'):
                        data[key] = str(data[key])
                socketio.emit('radar_update', data)
            time.sleep(0.01)

    def start(self, config_file=None):
        if not self.connect_ports():
            return False

        if config_file and not self.send_config(config_file):
            print("配置发送失败")
            return False

        self.running = True
        print("雷达数据采集已启动... (通过 Socket.IO 推送至前端)")

        # 启动采集线程
        collector_thread = Thread(target=self.data_collection_loop, daemon=True)
        collector_thread.start()

        return True

    def stop(self):
        self.running = False
        self.stop_event.set()
        if self.cli_com and not self.cli_com.is_open == False:
            self.cli_com.close()
        if self.data_com and not self.data_com.is_open == False:
            self.data_com.close()
        print("串口已关闭")


# Flask 路由（可选：提供一个简单的健康检查页面）
@app.route('/')
def index():
    return "Radar Socket.IO Server Running"


def run_socketio():
    # 建议端口改成 5001 或其他，避免与其它服务冲突
    socketio.run(app, host='0.0.0.0', port=5010, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)


import math
import random
import numpy as np

def mock_data_loop():
    """串口不可用时推送模拟数据，用于前端调试"""
    frame_count = 0
    start_time = datetime.datetime.now()
    t = 0.0
    print(">>> 使用模拟数据模式 (no serial) <<<")
    while True:
        t += 0.05
        frame_count += 1
        elapsed = (datetime.datetime.now() - start_time).total_seconds()
        fps = frame_count / elapsed if elapsed > 0 else 20.0

        # 模拟 3 个移动目标
        tracks = []
        for i, (base_x, base_y, speed) in enumerate([
            (1.5, 4.0, 0.3),
            (-1.0, 2.5, 0.5),
            (0.3, 6.0, 0.1),
        ]):
            tid = i * 2 + 7
            x = base_x + math.sin(t + i) * 0.4
            y = base_y + math.cos(t * 0.7 + i) * 0.3
            z = -0.05 + random.uniform(-0.02, 0.02)
            vx = math.cos(t + i) * speed
            vy = -math.sin(t * 0.7 + i) * speed * 0.5
            vz = 0.0
            ax, ay, az = 0.0, 0.0, 0.0
            state = 6
            confidence = 0.9 + random.uniform(-0.05, 0.05)
            # bbox 占位 4 列
            tracks.append([tid, x, y, z, vx, vy, vz, ax, ay, az, state, confidence, 1.0, 1.0, 0.5, 0.5])

        # 模拟点云（每个 track 周围几个散点）
        points = []
        for row in tracks:
            for _ in range(3):
                points.append([
                    row[1] + random.uniform(-0.1, 0.1),
                    row[2] + random.uniform(-0.1, 0.1),
                    row[3] + random.uniform(-0.02, 0.02),
                    row[4] + random.uniform(-0.05, 0.05),
                    random.randint(10, 30),
                    random.randint(60, 80),
                    255,
                ])

        data = {
            'error': 0,
            'frameNum': frame_count,
            'pointCloud': str(np.array(points, dtype=float)),
            'numDetectedPoints': len(points),
            'numDetectedTracks': len(tracks),
            'trackData': str(np.array(tracks, dtype=float)),
            'trackIndexes': str(np.array([float(tracks[0][0])] * len(points))),
            'frame_number': frame_count,
            'timestamp': datetime.datetime.now().isoformat(),
            'fps': round(fps, 2),
        }
        socketio.emit('radar_update', data)
        time.sleep(0.05)   # ~20 FPS


def main():
    print("雷达数据推送服务 (Flask + Socket.IO)")
    print("=" * 50)

    cli_port = '/dev/ttyUSB0'
    data_port = '/dev/ttyUSB1'

    use_mock = '--mock' in sys.argv

    config_file = None
    if '--config' in sys.argv:
        try:
            config_file = sys.argv[sys.argv.index('--config') + 1]
        except IndexError:
            config_file = None

    # 启动 Flask-SocketIO 服务
    flask_thread = Thread(target=run_socketio, daemon=True)
    flask_thread.start()
    time.sleep(1.5)

    if use_mock:
        # 强制模拟模式
        mock_thread = Thread(target=mock_data_loop, daemon=True)
        mock_thread.start()
    else:
        sender = RadarDataSender(cli_port, data_port)
        if not sender.start(config_file):
            print("串口启动失败，自动切换到模拟数据模式")
            mock_thread = Thread(target=mock_data_loop, daemon=True)
            mock_thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n正在关闭...")


if __name__ == '__main__':
    main()