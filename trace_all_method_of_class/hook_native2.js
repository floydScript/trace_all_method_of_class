/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */
function log(text) {
    console.log(getTid() + ">>>" + text)
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
    // var Thread = Java.use("java.lang.Thread")
    // return Thread.currentThread().getId();
    return Process.getCurrentThreadId();
}

function getTName() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getName();
}


function hookso(){
    Java.perform(function () {
        // 获取模块基地址
        var baseAddress_libc = Module.findBaseAddress('libc.so');
    
        // var sub_7B388_address = baseAddress_libquick.add(0x7B388);
        // var sub_65A38_address = baseAddress_libquick.add(0x65A38);
        // var sub_651AC_address = baseAddress_libquick.add(0x651AC);
        var __system_property_find_address = baseAddress_libc.add(0x60ed4);
        Interceptor.attach(__system_property_find_address, {
            onEnter: function (args) {
                //打个日志表示我来过
                console.log("__system_property_find_address called!");
                log('__system_property_find_address    a0:' + Memory.readUtf8String(args[0]));
                log(Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("  ")); // .join("\n")
            },
            onLeave: function (retval) {
                // 
                log("LEPUS_DefineProperty    ret:" + retval);
                // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
            }
            
        });


        // var libc = Module.load("libc.so");
        // var __system_property_find = libc.findExportByName("__system_property_find");
        // if (!__system_property_find) {
        //     log("cannot find __system_property_find")
        // } else {
        //     // log(Thread.backtrace(context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n"));
        //     log("__system_property_find_addr " + __system_property_find)
        //     Interceptor.attach(__system_property_find, {
        //         onEnter: function (args) {
        //             //打个日志表示我来过
        //             console.log("__system_property_find called!");
        //             log('__system_property_find    a0:' + Memory.readUtf8String(args[0]));
        //             log(Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("  ")); // .join("\n")
        //         },
        //         onLeave: function (retval) {
        //             // 
        //             log("__system_property_find    ret:" + retval);
        //             // log("    ret:" + hexdump(retval, { offset:0, length: 128 }));
        //         }
                
        //     });
        // }
        
    
    });
}


function main(){

    hookso();
}

setImmediate(main);