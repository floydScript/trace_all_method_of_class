'''
/**
 * VS code Ctrl+Alt +- :Go Forward Go Back
 * VS code 自动排版： Ctrl+K 紧接着Ctrl+F
 *
 */
'''
 
import frida
 
import sys
 
import time
 
 
 
#Hook 进程名称 Frida-ps -U查看 "com.example.testfrida" "system_server"
 
url_example = "com.example.testfrida"
 
url_system = "system_server"
 
 
 
#Frida 具体实现JS "./common_function.js" "./recents.js"
 
JS_common = "./common_function.js"
 
JS_recents = "./recents.js"
 
 
 
 
 
def read_js(file):
 
    with open(file, encoding='UTF-8') as fp:
 
        return fp.read()
 
 
 
def on_message(message, data):
 
    if message["type"] == "send":
 
        print("[+] {}".format(message["payload"]))
 
    else:
 
        print("[-] {}".format(message))
 
 
 
#选择hook方式: 运行时hook False,spawn hook True
 
def get_session(isSpawn, url):
 
    #开始 hook
 
    remote_device = frida.get_usb_device()
 
    print(remote_device)
 
    #session = remote_device.attach("system_server")
 
    #session = remote_device.attach("com.example.testfrida")
 
 
 
    # spawn hook
 
    '''
    device = frida.get_usb_device()
    print(device)
    pid = device.spawn(["com.example.testfrida"])
    device.resume(pid)
    time.sleep(1) #Without it Java.perform silently fails
    session = device.attach(pid)
    '''
 
    # spawn hook 调试APP时使用
 
    if isSpawn == True:
 
            pid = remote_device.spawn([url])
 
            remote_device.resume(pid)
 
            time.sleep(1) #Without it Java.perform silently fails
 
            session = remote_device.attach(pid)
 
    else:#运行时hook
 
        session = remote_device.attach(url)
 
    return session
 
'''
js - Hook 解释文件js，打桩进入目标类&目标方法
isSpawn - Hook选择，是否启动该进程
url - 宿主机器的进程名称
'''
 
def run(js, isSpawn, url):
 
    src = read_js(js)
 
    script = get_session(isSpawn,url).create_script(src)
 
    script.on("message", on_message)
 
    script.load()
 
 
 
#此处添加需要hook的进程和解释器（js文件），可添加多个
 
#run("./common_function.js",True,url_example)
 
run(JS_recents,False,url_system)
 
sys.stdin.read()
 