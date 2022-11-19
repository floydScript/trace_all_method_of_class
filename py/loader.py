import time
import frida
import sys

# 连接安卓机上的frida-server
device = frida.get_usb_device()
# 启动`demo02`这个app
pid = device.spawn(["com.google.android.youtube"])
device.resume(pid)
time.sleep(1)
session = device.attach(pid)
# 加载s1.js脚本
with open("../js/s1.js") as f:
    # strs =  f.read();
    script = session.create_script(f.read())
    # print(">>>"+strs);
script.load()

# 脚本会持续运行等待输入
# raw_input()
# sys.stdin.read()