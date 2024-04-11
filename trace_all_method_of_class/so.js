function LogPrint(log) {
    var theDate = new Date();
    var hour = theDate.getHours();
    var minute = theDate.getMinutes();
    var second = theDate.getSeconds();
    var mSecond = theDate.getMilliseconds();

    hour < 10 ? hour = "0" + hour : hour;
    minute < 10 ? minute = "0" + minute : minute;
    second < 10 ? second = "0" + second : second;
    mSecond < 10 ? mSecond = "00" + mSecond : mSecond < 100 ? mSecond = "0" + mSecond : mSecond;

    var time = hour + ":" + minute + ":" + second + ":" + mSecond;
    var threadid = Process.getCurrentThreadId();
    console.log("[" + time + "]" + "->threadid:" + threadid + "--" + log);
}

//用于打印当前C函数的调用堆栈的函数
function printNativeStack(context,name){
    //Thread.backtrace返回值是包含调用栈信息的对象数组,而DebugSymbol.fromAddress将解析他们,每一条后面+\n
   var trace=Thread.backtrace(context,Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n");
  
     LogPrint("------start-------"+name+"--------");
     LogPrint(trace);
     LogPrint("------end-------"+name+"--------");
}
function GetphoneType(){
    var i =0;
   
        var Context = Java.use('android.content.Context');
        var cgtn = Java.use('cgtn');
        var Base64 = Java.use('android.util.Base64');
        var File = Java.use('java.io.File');
        var FileOutputStream = Java.use('java.io.FileOutputStream');
        var OutputStreamWriter = Java.use('java.io.OutputStreamWriter');
    
        cgtn.c.implementation = function (context0, cbgo0) {
            console.log(`cepc.c is called: context0=${context0}, cbgo0=${cbgo0}`);
            
            var result= this["c"] (context0, cbgo0);

            
            let parcel = Java.use("android.os.Parcel").obtain();
            result.writeToParcel(parcel, 0);
            let base64string = Base64.encodeToString(parcel.marshall(), Base64.DEFAULT.value);
            console.log("序列化后的数据：" + base64string);
    
            try {
                var appDir = context0.getFilesDir().getAbsolutePath();
                var filePath = appDir + "/com.google.android.apps.classroom"+i+".json";
                LogPrint("文件路径=>"+filePath);
                let file = File.$new(filePath);                  
                if (!file.exists()) {
                    file.createNewFile();  // 如果文件不存在，就创建它
                }
                let fos = FileOutputStream.$new(file, false);  // false表示不追加，直接覆盖
                let writer = OutputStreamWriter.$new(fos);
    
                writer.write(base64string, 0, base64string.length);
                writer.flush();
                writer.close();
                fos.close();
    
                console.log("Data written to file: " + filePath);
            } catch (e) {
                console.log("Error writing to file: " + e.toString());
            }
            i=i+1;
            return result;
        };
 

}
function hookso(){
    Java.perform(function () {
        // 获取模块基地址
        var baseAddress_libquick = Module.findBaseAddress('libquick.so');
        var baseAddress_libc = Module.findBaseAddress('libc.so');
    
        var sub_7B388_address = baseAddress_libquick.add(0x7B388);
        var vsnprintf_address = baseAddress_libc.add(0x126080);
    
        // hook sub_7B388函数
        Interceptor.attach(sub_7B388_address, {
            onEnter: function (args) {
                //打个日志表示我来过
               // console.log("sub_7B388 called!");
    
              
    
                // 在sub_7B388中hook vsnprintf函数
                Interceptor.attach(vsnprintf_address, {
                    onEnter: function(args) {
                        console.log("vsnprintf called from sub_7B388!");
                        console.log("s pointer:", args[0]);
                        console.log("maxlen:", args[1].toInt32());
                        console.log("format:", Memory.readUtf8String(args[2]));
                       
                    },
                    onLeave: function (retval) {
                        // 在vsnprintf执行完后，取消对其的hook，这样只会hook由sub_7B388触发的vsnprintf调用
                        //this.detach();
                    }
                });
            }
        });
    });
}



function hookso2(){
    var baseAddress_libquick = Module.findBaseAddress('libquick.so');
    var sub_7B388_address = baseAddress_libquick.add(0x7B388);

    // 获取目标函数的地址
    var targetFunctionAddress = baseAddress_libquick.add(0x672F8);
    console.log('[+] Target function address: ' + targetFunctionAddress);

    // 目标函数
    Interceptor.attach(targetFunctionAddress, {
        onEnter: function(args) {
            // args[0] 是 a1, args[1] 是 a2, 等等
            console.log('[+] Intercepted call to sub_672F8');
            console.log('    a1:', args[0].toInt64());
            console.log('    a2:', args[1].toInt64());
            console.log('    a3:', args[2].toInt64());
            console.log('    a4:', args[3].toInt64());
        },
        onLeave: function(retval) {
            console.log('[+] Returning from sub_672F8 with value:', retval.toInt64());
        }
    });


    Interceptor.attach(sub_7B388_address, {
        onEnter: function (args) {
            console.log("sub_7B388 called!");

            // 打印前两个参数值
            console.log("a1:", args[0]);   // 第一个参数，__int64类型
            console.log("a2:", args[1].toInt32());   // 第二个参数，unsigned int类型

            // // 检查指针a3是否有效
            // if (!args[2].isNull()) {
            //     try {
            //        // console.log("a3:", Memory.readUtf8String(args[2])); // 第三个参数，const char*类型
            //        console.log("a3:",args[2].readCString()); // 第三个参数，const char*类型  
            //     } catch (e) {
            //         console.log("a3: Error reading memory:", e);
            //     }
            // } else {
            //     console.log("a3: null pointer");
            // }
            if (!args[2].isNull()) {
                try {
                    console.log(hexdump(args[2], { 50: 50 }));
                } catch (e) {
                    console.log("Error reading memory:", e);
                }
            } else {
                console.log("Address is null or invalid");
            }
         
            var lowPart = Memory.readS64(args[3]).toString();
            var highPart = Memory.readS64(args[3].add(8)).toString();
            console.log("a4 (low part):", lowPart);
            console.log("a4 (high part):", highPart);
            printNativeStack();
        }
    });

}

// function hookso3(){
//         // 获取目标模块和函数地址
//         var moduleBase = Module.findBaseAddress('libquick.so');
//         var targetAddress = moduleBase.add(0x7B388); // 偏移地址

//         // 用Interceptor拦截地址
//         Interceptor.replace(targetAddress, new NativeCallback(function (a1, a2, a3, a4) {
//             // 
//             console.log("sub_7B388 intercepted!");
//             console.log("a1:", a1);
//             console.log("a2:", a2);
//             console.log("a3:", Memory.readUtf8String(a3));


//             // 不调用原始函数，但返回一个固定的值
//             return 130;
//         }, 'int64', ['int64', 'uint', 'pointer', 'pointer']));
// }

function hookso4(){
    var libquick = Module.load("libquick.so");

    // 获取 LEPUS_ThrowTypeError 函数的地址
    var LEPUS_ThrowTypeError_address = libquick.findExportByName("LEPUS_ThrowTypeError");
    
    if (!LEPUS_ThrowTypeError_address) {
        console.log("[-] Cannot find LEPUS_ThrowTypeError");
        return;
    }
    
    console.log("[+] Found LEPUS_ThrowTypeError at: " + LEPUS_ThrowTypeError_address);

    // Hook LEPUS_ThrowTypeError 函数
    Interceptor.attach(LEPUS_ThrowTypeError_address, {
        onEnter: function(args) {
            
            console.log("[*] LEPUS_ThrowTypeError called!");
        },
        onLeave: function(retval) {
            // 这里修改 retval，
          
          //  retval.replace(0);
        }
    });
}
function main(){
   
    Java.perform(function () {
        Java.use('java.lang.Runtime').loadLibrary0.overload('java.lang.Class', 'java.lang.String').implementation = function (arg0,arg1) {
            console.log("Runtime.loadLibrary0->", arg1);
            var result = this.loadLibrary0(arg0,arg1);
            if (arg1.indexOf('quick') != -1) {
                //hookso2();
                hookso4();
            }
            return result;

        } 


    });

}

setImmediate(main);