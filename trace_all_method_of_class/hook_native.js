/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */
function log(text) {
    console.log(">>>" + text)
    var Log = Java.use("android.util.Log");
    Log.w(" 10685", text);
}

function logStrace() {
    var Log = Java.use("android.util.Log");
    var text = Log.getStackTraceString(Java.use("java.lang.Throwable").$new());
    console.log(text);
    Log.w(" 10685", text);
}

function getTid() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getId();
}

function getTName() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getName();
}


function hookso(){
    Java.perform(function () {
        // 获取模块基地址
        var baseAddress_libquick = Module.findBaseAddress('libquick.so');
        var baseAddress_libc = Module.findBaseAddress('libc.so');
    
        var sub_7B388_address = baseAddress_libquick.add(0x7B388);
        var sub_65A38_address = baseAddress_libquick.add(0x65A38);
        var sub_651AC_address = baseAddress_libquick.add(0x651AC);
        var vsnprintf_address = baseAddress_libc.add(0xac1f0);


        // var libc = Module.load("libc.so");
        // var openat = libc.findExportByName("open");
        // if (!openat) {
        //     log("cannot find openat@@LIBC")
        // } else {
        //     Interceptor.attach(openat, {
        //         onEnter: function (args) {
        //             //打个日志表示我来过
        //             console.log("openat called!");
        //             log('openat    a2:' + Memory.readUtf8String(args[0]));
        //         },
        //         onLeave: function (retval) {
        //             // 
        //             log("openat    ret:" + retval);
        //             // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
        //         }
                
        //     });
        // }

        
    
        // hook sub_7B388函数
        Interceptor.attach(sub_7B388_address, {
            onEnter: function (args) {
                //打个日志表示我来过
                console.log("sub_7B388 called!");
                log("sub_7B388 called!");
                log('    a1:' + args[0]);
                log('    a2:' + args[1].toInt32());
                if (!args[2].isNull()) {
                    try {
                        // console.log(hexdump(args[2], { 0x100: 0x100 }));
                        log("    a3:" + Memory.readUtf8String(args[2]));
                    } catch (e) {
                        console.log("Error reading memory:", e);
                    }
                } else {
                    console.log("Address is null or invalid");
                }
                log("    a4: "+ args[3] + " \n" + hexdump(args[3], { offset:0, length: 128 }));
                var lowPart = Memory.readU64(args[3]);
                var highPart = Memory.readU64(args[3].add(8));
                var v6 = ptr(Memory.readU64(args[3].add(16)));
                log("a4 (low part):" + lowPart.toString(16));
                log("a4 (high part):" + highPart.toString(16));
                log(Thread.backtrace(this.context, Backtracer.FUZZY).map(DebugSymbol.fromAddress).join("; ")); // .join("\n")
                // log("    lowPart:" + Memory.readUtf8String(ptr(lowPart)));
                // log("v6 :" + v6);
                // log("    v6: "+ v6 + " \n" + hexdump(v6, { offset:0, length: 128 }));
                
                // // log("    a4:" + hexdump(ptr(lowPart), { offset:0, length: 128 }));

                // var v6_p1 = ptr(Memory.readU64(v6));
                // log("    v6_p1: "+ v6_p1 + " \n" + hexdump(v6_p1, { offset:0, length: 128 }));
    
              
    
                // 在sub_7B388中hook vsnprintf函数
                // Interceptor.attach(vsnprintf_address, {
                //     onEnter: function(args) {/home/eason/sad/frida/trace_all_method_of_class/hook_native.js:88)
                //         // console.log("vsnprintf called from sub_7B388!");
                //         // console.log("s pointer:", args[0]);
                //         // console.log("maxlen:", args[1].toInt32());
                //         // console.log("format:", Memory.readUtf8String(args[2]));
                       
                //     },
                //     onLeave: function (retval) {
                //         // console.log("s pointer:", Memory.readUtf8String(args[0]));
                //         // 在vsnprintf执行完后，取消对其的hook，这样只会hook由sub_7B388触发的vsnprintf调用
                //         // this.detach();
                //     }
                // });
            },
            onLeave: function (retval) {
                // 
                log("    ret:" + retval);
                // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
            }
            
        });
        
        // hook sub_65A38 函数 LEPUS_DefineProperty
        Interceptor.attach(sub_65A38_address, {
            onEnter: function (args) {
                //打个日志表示我来过
                console.log("LEPUS_DefineProperty called!");
                log('LEPUS_DefineProperty    a2:' + args[1].toString(16));
            },
            onLeave: function (retval) {
                // 
                log("LEPUS_DefineProperty    ret:" + retval);
                // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
            }
            
        });

        // hook sub_ 651AC 函数
        Interceptor.attach(sub_651AC_address, {
            onEnter: function (args) {
                //打个日志表示我来过
                console.log("sub_651AC called!");
                log('sub_651AC    a3:' + args[2].toString(16));
            },
            onLeave: function (retval) {
                // 
                log("sub_651AC    ret:" + retval);
                // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
            }
            
        });
    });
}


function main(){

    Java.perform(function () {
        Java.use('java.lang.Runtime').loadLibrary0.overload('java.lang.Class', 'java.lang.String').implementation = function (arg0,arg1) {
            console.log("Runtime.loadLibrary0->", arg1);
            var result = this.loadLibrary0(arg0,arg1);
            if (arg1.indexOf('quick') != -1) {
                //hookso2();
                hookso();
            }
            return result;

        } 


    });
    // hookso();
}

setImmediate(main);