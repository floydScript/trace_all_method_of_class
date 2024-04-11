/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */

/**
 * ColorLibrary - 颜色库
 * 用于修改输出文本的字体颜色和背景色。
 *
 * @namespace
 */
const ColorLibrary = {
    // 字体前景颜色表
    FontcolorMap: {
        black: '\u001b[30m',
        red: '\u001b[31m',
        green: '\u001b[32m',
        yellow: '\u001b[33m',
        blue: '\u001b[34m',
        magenta: '\u001b[35m',
        cyan: '\u001b[36m',
        white: '\u001b[37m',
        brightBlack: '\u001b[90m',
        brightRed: '\u001b[91m',
        brightGreen: '\u001b[92m',
        brightYellow: '\u001b[93m',
        brightBlue: '\u001b[94m',
        brightMagenta: '\u001b[95m',
        brightCyan: '\u001b[96m',
        brightWhite: '\u001b[97m',
    },

    // 字体背景颜色表
    BgcolorMap: {
        bgBlack: '\u001b[40m',
        bgRed: '\u001b[41m',
        bgGreen: '\u001b[42m',
        bgYellow: '\u001b[43m',
        bgBlue: '\u001b[44m',
        bgMagenta: '\u001b[45m',
        bgCyan: '\u001b[46m',
        bgWhite: '\u001b[47m',
        bgBrightBlack: '\u001b[100m',
        bgBrightRed: '\u001b[101m',
        bgBrightGreen: '\u001b[102m',
        bgBrightYellow: '\u001b[103m',
        bgBrightBlue: '\u001b[104m',
        bgBrightMagenta: '\u001b[105m',
        bgBrightCyan: '\u001b[106m',
        bgBrightWhite: '\u001b[107m'
    },

    /**
     * 修改文本颜色和背景色并返回新的文本。
     *
     * @param {string} text - 要修改颜色的文本。
     * @param {string} color - 字体颜色。默认为 'white'。
     * @param {string} backgroundColor - 背景颜色。默认为 'bgBlack'。
     * @returns {string} - 修改后的文本。
     */
    coloredText: function(text, color = 'white', backgroundColor = 'bgBlack') {
        const resetCode = '\u001b[0m';
        const colorCode = this.FontcolorMap[color] || '';
        const bgColorCode = this.BgcolorMap[backgroundColor] || '';
        return `${bgColorCode}${colorCode}${text}${resetCode}`;
    }
};

var TAG = "frida_hook";


function setTag(tag) {
    TAG = tag;
}


function log(text) {
    
    console.log(ColorLibrary.coloredText(">>>" + text, 'brightYellow', 'bgBlack'))
    var Log = Java.use("android.util.Log");
    Log.w(TAG, text);
}

function logw(text) {
    
    console.log(ColorLibrary.coloredText(">>>" + text, 'brightMagenta', 'bgBlack'))
    var Log = Java.use("android.util.Log");
    Log.w(TAG, text);
}

function logStrace() {
    var Log = Java.use("android.util.Log");
    var text = Log.getStackTraceString(Java.use("java.lang.Throwable").$new());
    console.log(ColorLibrary.coloredText(">>>" + text, 'brightRed', 'bgBlack'))
    Log.w(TAG, text);
}

function getTid() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getId();
}

function getTName() {
    var Thread = Java.use("java.lang.Thread")
    return Thread.currentThread().getName();
}

function funcHandler(methodName, retval) {
    if (methodName == "queryIntentActivities") {
        var ParceledListSlice = Java.use("android.content.pm.ParceledListSlice");
        var list = ParceledListSlice["getList"].apply(retval);

        log("queryIntentActivities list : " + list);

        var ListClass = Java.use("java.util.ArrayList");
        var iterator = ListClass["iterator"].apply(list);

        log("queryIntentActivities size : " + ListClass["size"].apply(list));

        var iteratorClass = Java.use("java.util.Iterator");
        // var hasNext = iteratorClass["hasNext"].apply(iterator);

        while (iteratorClass["hasNext"].apply(iterator)) {
            var noti = iteratorClass["next"].apply(iterator);
            log("IntentActivities = " + noti);
        }
        log("queryIntentActivities return : " + list + " hasNext : " + iteratorClass["hasNext"].apply(iterator));

        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
    } else if (methodName == "getRunningAppProcesses") {
        var ListClass = Java.use("java.util.ArrayList");
        var iterator = ListClass["iterator"].apply(retval);

        log("getRunningAppProcesses size : " + ListClass["size"].apply(retval));

        var iteratorClass = Java.use("java.util.Iterator");
        // var hasNext = iteratorClass["hasNext"].apply(iterator);

        while (iteratorClass["hasNext"].apply(iterator)) {
            var procs = iteratorClass["next"].apply(iterator);
            var procsClass = Java.use("android.app.ActivityManager$RunningAppProcessInfo");
            log("procs = " + procs + " processName = " + procsClass.processName);
        }
        log("getRunningAppProcesses return : " + list + " hasNext : " + iteratorClass["hasNext"].apply(iterator));

    } else if (methodName == "getServices") {
        // var ServiceInfoClass = Java.use("android.app.ActivityManager$RunningServiceInfo");

        var ListClass = Java.use("java.util.ArrayList");
        var iterator = ListClass["iterator"].apply(retval);

        log("getServices size : " + ListClass["size"].apply(retval));

        var iteratorClass = Java.use("java.util.Iterator");
        // var hasNext = iteratorClass["hasNext"].apply(iterator);

        while (iteratorClass["hasNext"].apply(iterator)) {
            var itService = iteratorClass["next"].apply(iterator);
            var ComponentNameClass = Java.use("android.content.ComponentName");
            var RunningServiceInfoClass = Java.use("android.app.ActivityManager$RunningServiceInfo");
            
            // log("service: "+ ComponentNameClass["getClassName"].apply(itService.service));
            log("service: "+ itService);
            var itService2 = Java.cast(itService, RunningServiceInfoClass);
            log("service: service = "+ itService2.service);
            log("service: service = "+ itService2.service[0]);
            log("service: service2 = "+ itService2["h"]);
            // var serviceCmp = Java.cast(itService2["h"], ComponentNameClass);
            // log("service: service3 = "+ serviceCmp);
            // log("service: class.service = "+ RunningServiceInfoClass.service.apply[itService.service]);
        }
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
        // log("getServices return : " + list + " hasNext : " + iteratorClass["hasNext"].apply(iterator));
    } else if (methodName == "getEnabledAccessibilityServiceList") {
        var ListClass = Java.use("java.util.ArrayList");
        log("getEnabledAccessibilityServiceList size : " + ListClass["size"].apply(retval));
    }
}


function funcHandler2(methodName, retval) {
    if (methodName == "isLoggable") {
        return true;
    }
    return retval;
}


// 遍历classloader,寻找目标类hook
function replaceClassLoder(className){
    log("ClassLoader Replacing.");

    Java.enumerateClassLoaders({
        "onMatch": function(loader) {
            log("enumerateClassLoaders : " + loader);
            var origLoader = Java.classFactory.loader;
            try {
                // if(loader.findClass(className)) {
                Java.classFactory.loader = loader
                Java.classFactory.use(className);
            } catch (error) {
                log("moe_not_find_class");
                log(error);
                Java.classFactory.loader = origLoader;
            }
        },
        "onComplete": function() {
            log("ClassLoader Replace done.!");
        }
    });
}

function traceClass(clsname, enableLogStraceStack = false) {
    var target;
    try {
        target = Java.use(clsname);
    } catch (e1) {
        replaceClassLoder(clsname);
        try {
            target = Java.classFactory.use(clsname);
        } catch (e2) {
            log(e2)
        }
    }
    traceClassCommon(target, enableLogStraceStack)
}

// 递归hook父类
function traceClassForeachParent(clsname, enableLogStraceStack = false) {
    var target;
    try {
        target = Java.use(clsname);
    } catch (e1) {
        replaceClassLoder(clsname);
        try {
            target = Java.classFactory.use(clsname);
        } catch (e2) {
            log("traceClassForeachParent e2 : " + e2)
        }
    }
    try {
        var i = 0;
        while (target !== undefined) {
            if (i > 3) {
                break;
            }
            // if (target.$className == "android.app.Activity") {
            //     // until hook android.app.Activity
            //     break;
            // }
            traceClassCommon(target, enableLogStraceStack);
            target = target.$super;
            i++;
        }
    } catch (e3) {
        log("traceClassForeachParent e3 : " + e3)
    }
    
}


function traceClassCommon(target, enableLogStraceStack = false) {
    try {
        var clsname = target.$className;

        traceConstructorCommon(target, enableLogStraceStack);
        log("clsname: " + clsname + " target: " + target.class);
        var methods = target.class.getDeclaredMethods();
        log("methods : " + methods);
        methods.forEach(function (method) {
            var methodName = method.getName();
            if (typeof(target[methodName]) == 'undefined') {
                log("moe_err : methodName " + methodName + " is undefined")
                return;
            }
            // if (methodName != 'scheduleTransaction') {
            //     return;
            // }
            traceMethodCommon(target, methodName, enableLogStraceStack);
        });
    } catch (e) {
        log("'" + clsname + "' hook fail: " + e)
    }
}

function traceConstructorCommon(target, enableLogStraceStack = false) {
    try {
        var clsname = target.$className;

        var overloads = target.$init.overloads;
        overloads.forEach(function (overload) {
            var proto = "(";
            overload.argumentTypes.forEach(function (type) {
                proto += type.className + ", ";
            });
            if (proto.length > 1) {
                proto = proto.substr(0, proto.length - 2);
            }
            proto += ")";
            log("hooking: " + clsname + proto);
            overload.implementation = function () {
                var tid = getTid();
                var tName = getTName();
                var args = args2Str(arguments, overload.argumentTypes);
                var start = (new Date()).valueOf();
                var this_name = this + ""
                log(tName + " " + clsname + "(" + args + ") beforeInvoke");

                

                if (enableLogStraceStack) {
                    logStrace();
                }
                this.$init.apply(this, arguments);

                if (clsname == "com.android.server.wm.ActivityRecord") {
                    log("moe_ar : new ActivityRecord -> this = " + this)
                }
                log(tName + " " + clsname + "(" + args + ") afterInvoke" ); // + " cost " + ((new Date()).valueOf() - start) + " ms"
            }
        });
    } catch (e) {
        log("traceConstructorCommon failed : " + e);
    }
}

function args2Str(args, argTypes) {
    var argsStr = "";
    for (var j = 0; j < args.length; j++) {
        // TODO 
        if (argTypes[j].className == "[B") {
            var typedArray = Java.array("byte", args[j]);
            var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
            argsStr += "byteArr[" + hexStringArray.join('') + "], ";
        } else if (args[j] == "[object Object]") {
            argsStr += JSON.stringify(args[j]) + ", "
        } else {
            argsStr += args[j] + ", "
            // argsStr += JSON.stringify(args[j]) + ", "
        }
    }
    if (argsStr.length > 2) {
        argsStr = argsStr.substr(0, argsStr.length - 2);
    }
    return argsStr;
}

function traceMethodCommon(target, methodName, enableLogStraceStack = false) {
    // try {
        var clsname = target.$className;

        var overloads = target[methodName].overloads;
        overloads.forEach(function (overload) {
            var proto = "(";
            overload.argumentTypes.forEach(function (type) {
                proto += type.className + ", ";
            });
            if (proto.length > 1) {
                proto = proto.substr(0, proto.length - 2);
            }
            proto += ")";
            log("hooking: "+ overload.returnType.className + " " + clsname + "." + methodName + proto);
            overload.implementation = function () {
                var args = "";
                try {
                    var tName = getTName();
                    args = args2Str(arguments, overload.argumentTypes);
    
    
                    log(tName + " " + clsname +"." + methodName + "(" + args + ") beforeInvoke");
                    
                    if ((clsname +"." + methodName) == "dvdg.A") {
                        var typedArray = Java.array("byte", arguments[0]);
                        var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                        log("moe_lll : dvdg.A(arg1:" + hexStringArray.join(''));
                    }
                    
    
                    if ((clsname +"." + methodName) == "com.android.server.wm.ActivityStarter.startActivityMayWait") {
                        var IntentClass = Java.use("android.content.Intent");
                        var intentValue = Java.cast(arguments[5], IntentClass);
                        var booleanres = intentValue.hasFileDescriptors();
                        
                        log("intentValue.hasFileDescriptors = " + booleanres);
                    }
    
                    if ((clsname +"." + methodName) == "com.android.server.wm.ActivityTaskManagerService.startActivityAsUser") {
                        var IntentClass = Java.use("android.content.Intent");
                        var intentValue = Java.cast(arguments[2], IntentClass);
                        var booleanres = intentValue.hasFileDescriptors();
                        
                        log("intentValue.hasFileDescriptors = " + booleanres);
                    }

                    
                    if ((clsname +"." + methodName) == "com.android.server.speech.SpeechRecognitionManagerServiceImpl.createService") {
                        log("intentValue.hasFileDescriptors = " + booleanres);
                    }
                } catch (e) {
                    log("traceMethodCommon failed : " + e);
                }
                
                var retval = this[methodName].apply(this, arguments);

                try {
                    // if ((clsname +"." + methodName) == "com.android.server.wm.ActivityStarter.recycleTask") {
                    //     log("moe_print : mAddingToTask = " + this.mAddingToTask.value + " mMovedToFront = " + this.mMovedToFront.value);
                    // }
                    
                    // if ((clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.destroyImmediately"
                    //     || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.scheduleTopResumedActivityChanged"
                    //     // || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.forTokenLocked"
                    //     || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.setProcess"
                    //     || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.finishIfPossible"
                    //     || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.cleanUp") {
                    //     log("moe_ar : ActivityRecord this = " + this + " intent = " + this.intent.value);
                    // }


                    // if (clsname == "com.android.server.wm.ActivityRecord") {
                    //     catObject(this);
                    //     log("moe_gm : " + methodName + "ActivityRecord this = " + this);
                    // }

                    // try {
                    //     if((clsname +"." + methodName) == "android.app.IActivityManager$Stub.onTransact"
                    //         && arguments[0] == 33) {

                    //         var Parcel = Java.use("android.os.Parcel");
                    //         log("moe_parcel : typeof" + typeof(arguments[1]));
                    //         var parcelObj = Java.cast(arguments[1], Parcel);
                    //         var parcel_bytearr = Parcel.marshall.apply(parcelObj);

                    //         var parcel_bytearrArray = Java.array("byte", parcel_bytearr);
                    //         var hexStringArray = Array.from(parcel_bytearrArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                    //         var parcelbytearrStr = "byteArr[" + hexStringArray.join('') + "]";
                    //         log("moe_parcel : result = " + parcelbytearrStr);
                    //     }
                    // } catch (e4) {
                    //     log("parcel : traceMethodCommon failed : " + e4);
                    // }

                    var retvalStr = "undefined";

                    if (retval != undefined) {
                        if (overload.returnType.className == "[B") {
                            var typedArray = Java.array("byte", retval);
                            var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                            retvalStr = "byteArr[" + hexStringArray.join('') + "]";
                        } else {
                            retvalStr = JSON.stringify(retval);
                            // catObject(retval);
                            // retvalStr = "catObject"
                        }
                    }

                    funcHandler(methodName, retval);
                    // if (this_name.includes("FreAuthActivity"))
                    if (enableLogStraceStack) {
                        logStrace();
                    }
                    log(tName + " " + clsname +"." + methodName + "(" + args + ") = " + retvalStr + " afterInvoke" ); // + " cost " + ((new Date()).valueOf() - start) + " ms"
                } catch (e2) {
                    log("traceMethodCommon failed : " + e2);
                }
                return retval;
            }
        });
    // } catch (e) {
    //     log("traceMethodCommon failed : " + e);
    // }

}

function catObject(obj, callback=null) {
    try {
        if (obj == null) {
            logw("Unable cat object null");
            return;
        }

        let clazz = obj.getClass();


        logw(``);
        logw(` >>>>>>>>>>>>>>>> ${clazz.getName()} >>>>>>>>>>>>>>>> `);
        clazz.getDeclaredFields().forEach(field => {
            field.setAccessible(true);

            let fieldClass = field.getClass();
            let fieldName = field.getName();
            let fieldObject = field.get(obj);

            var Modifier = Java.use("java.lang.reflect.Modifier");
            if (!Modifier.isFinal(field.getModifiers())) {
                logw(`${fieldName} = ${fieldObject}`);
            }
            
            if (callback != null) {
                callback(fieldClass, fieldName, fieldObject);
            } else {
                // log(`${fieldName} = ${fieldObject}`);
            }
        });
        logw(` <<<<<<<<<<<<<<< ${clazz.getName()} <<<<<<<<<<<<<<< `);
        logw(``);
    } catch (e) {
        logw("catObject failed : " + e);
    }
}

function traceConstructor(clsname, enableLogStraceStack = false) {
    try {
        var target;
        try {
            target = Java.use(clsname);
        } catch (e1) {
            replaceClassLoder(clsname);
            try {
                target = Java.classFactory.use(clsname);
            } catch (e2) {
                log(e2)
            }
        }
        traceConstructorCommon(target, enableLogStraceStack);
    } catch (e) {
        log("'" + clsname + "' hook fail: " + e)
    }
}

function traceMethod(clsname, methodName, enableLogStraceStack = false) {
    try {
        var target;
        try {
            target = Java.use(clsname);
        } catch (e1) {
            replaceClassLoder(clsname);
            try {
                target = Java.classFactory.use(clsname);
            } catch (e2) {
                log(e2)
            }
        }
        traceMethodCommon(target, methodName, enableLogStraceStack);
    } catch (e) {
        log("'" + clsname + "' hook fail: " + e)
    }
}


function printClassLoder(){
    log("printClassLoder.");

    Java.enumerateClassLoaders({
        "onMatch": function(loader) {
            log("printClassLoder : " + loader);
        },
        "onComplete": function() {
            log("ClassLoader onComplete!");
        }
    });
}



function traceConstructorTmp(clsName){
        // 获取目标类的 Java 类型
    var target;
    try {
        target = Java.use(clsName);
    } catch (e1) {
        replaceClassLoder(clsName);
        try {
            target = Java.classFactory.use(clsName);
        } catch (e2) {
            log(e2)
        }
    }

    // Hook aum 构造函数
    // target.$init.overloads().implementation = function (arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    //     log("traceConstructorTmp Constructor called with arguments: " + arg1 + ", " + arg2);
    //     // 调用原始的构造函数
    //     var args = "";
    //     for (var j = 0; j < arguments.length; j++) {
    //         args += arguments[j] + ", "
    //     }
    //     this.$init(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
    //     log(clsName + "(" + args + ")");
    // };

    // Hook yom 构造函数
    target.$init.implementation = function (arg1) {
        // var byte_arr = Java.cast(arg1, "byte[]")

        var typedArray = Java.array("byte", arg1);
        var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
        log("moe_lll : yom(" + hexStringArray.join(' ') + ")");// 输出转换后的 16 进制字符串
        logStrace();
        // 调用原始的构造函数
        var args = "";
        for (var j = 0; j < arguments.length; j++) {
            args += arguments[j] + ", "
        }
        this.$init(arg1);
        log(clsName + "(" + args + ")");
    };
}



if (Java.available) {
    Java.perform(function () {
        setTag("frida_hook");

        // system_server
        // traceMethod("android.app.IApplicationThread$Stub$Proxy", "scheduleTransaction", true);
        // traceMethod("com.android.server.wm.ActivityStackSupervisor", "startSpecificActivity");
        // traceMethod("com.android.server.wm.ActivityTaskSupervisor", "scheduleIdle", true);
        // traceMethod("com.android.server.wm.ActivityTaskSupervisor", "scheduleIdleTimeout", true);
        
        // traceMethod("com.android.server.wm.Task", "resumeTopActivityInnerLocked");
        // traceMethod("com.android.server.wm.Task", "topRunningActivity");
        // let Task = Java.use("com.android.server.wm.Task");
        // Task["topRunningActivity"].overload('boolean').implementation = function (focusableOnly) {
        //     console.log('topRunningActivity is called' + ', ' + 'focusableOnly: ' + focusableOnly);
        //     let ret = this.topRunningActivity(focusableOnly);
        //     catObject(ret)
        //     console.log('topRunningActivity ret value is ' + ret);
        //     return ret;
        // };

        // let ActivityRecord = Java.use("com.android.server.wm.ActivityRecord");
        // ActivityRecord["addResultLocked"].overload('com.android.server.wm.ActivityRecord', 'java.lang.String', 'int', 'int', 'android.content.Intent').implementation = function (from, resultWho, requestCode, resultCode, resultData) {
        //     console.log('addResultLocked is called' + ', ' + 'resultData: ' + resultData);
        //     let ret = this.addResultLocked(from, resultWho, requestCode, resultCode, resultData);
        //     console.log('addResultLocked ret value is ' + ret);
        //     return ret;
        // };
        
        // traceClass("com.android.server.wm.ActivityStack");

        // traceMethod("com.android.server.wm.ActivityRecord", "relaunchActivityLocked");
        // traceMethod("com.android.server.wm.ActivityRecord", "scheduleTopResumedActivityChanged");
        // traceMethod("com.android.server.wm.ActivityRecord", "scheduleConfigurationChanged");

        // traceMethod("com.android.server.wm.ActivityRecord", "finishActivityResults");
        // traceMethod("com.android.server.wm.ActivityRecord", "addResultLocked", true);
        traceMethod("com.android.server.wm.ActivityRecord", "sendResult", true);

        // traceConstructor("android.app.ResultInfo", true)

        // traceMethod("android.app.servertransaction.ClientTransaction", "addCallback", true);

        // traceMethod("com.android.server.wm.Task", "getTopNonFinishingActivity", true);
        // traceMethod("android.app.ActivityThread$ApplicationThread", "scheduleTransaction", true);
        // traceClass("com.android.server.wm.ActivityRecord");
        // traceClass("com.android.server.am.ActivityManagerService");

        // traceMethod("android.content.pm.IPackageManager$Stub$Proxy", "getInstallSourceInfo");



        // traceClass("android.app.IApplicationThread$Stub$Proxy");
        // traceMethod("com.android.server.wm.ActivityServiceConnectionsHolder", "disconnectActivityFromServices", true);
        // traceMethod("com.android.server.wm.ActivityStarter", "recycleTask");
        // traceMethod("com.android.server.wm.ActivityStarter", "setTargetRootTaskIfNeeded");
        // traceMethod("com.android.server.wm.ActivityStarter", "isAllowedToStart");
        // traceMethod("com.android.server.wm.ActivityTaskManagerService", "startActivity");

        // traceMethod("com.android.server.wm.ActivityStarter", "resumeTargetStackIfNeeded");
        // traceMethod("com.android.server.wm.ActivityStarter", "computeTargetTask");
        traceMethod("com.android.server.wm.ActivityStarter", "computeSourceRootTask");
        traceMethod("com.android.server.wm.ActivityStarter", "reset");
        // traceMethod("com.android.server.wm.ActivityStarter", "isLaunchModeOneOf", true);
        traceMethod("com.android.server.wm.ActivityStarter", "computeLaunchingTaskFlags");
        traceMethod("com.android.server.wm.ActivityStarter", "setInitialState");
        traceMethod("com.android.server.wm.ActivityStarter", "startActivityInner");
        // traceMethod("com.android.server.wm.RootWindowContainer", "findTask");
        // traceMethod("com.android.server.wm.RootWindowContainer", "findActivity");


        // traceMethod("com.android.server.pm.PackageManagerService", "resolveService");
        // traceMethod("com.android.server.pm.PackageManagerService", "collectSharedLibraryInfos", true);
        
        // traceMethod("com.android.server.am.ActiveServices", "retrieveServiceLocked");



        // traceClass("android.content.pm.split.SplitAssetDependencyLoader");
        
        



        // traceMethod("com.android.server.am.ActiveServices", "publishServiceLocked", true);
        // traceMethod("com.android.server.am.ActivityManagerService", "publishService");

        // traceMethod("android.app.IActivityManager$Stub", "onTransact");
        // traceMethod("android.app.IActivityManager$Stub", "publishService");


        // traceMethod("com.android.server.wm.ActivityRecord", "finishIfPossible");
        // traceMethod("com.android.server.wm.ActivityStackSupervisor", "removeTask", true);

        // traceConstructor("com.android.server.wm.ActivityRecord", true);
        // traceMethod("com.android.server.wm.ActivityStarter", "startActivityMayWait");
        // traceMethod("com.android.server.wm.ActivityTaskManagerService", "startActivityAsUser");





        // traceMethod("com.android.server.wm.PinnedStackController", "registerPinnedStackListener", true);
        // traceMethod("com.android.server.wm.PinnedStackController", "setActions", true);

        // traceMethod("com.android.systemui.pip.phone.PipMediaController", "setActiveMediaController", true);
        // traceMethod("android.media.session.MediaController$Callback", "onPlaybackStateChanged", true);


        // traceMethod("android.app.ActivityManager", "checkComponentPermission", true);
        // traceMethod("com.android.server.am.ActivityManagerService", "checkComponentPermission");


        // traceConstructor("android.content.pm.ProcessInfo", true);

        // traceMethod("com.android.server.speech.SpeechRecognitionManagerServiceImpl", "createService", true);




        // traceMethod("com.android.server.am.PendingIntentController", "makeIntentSenderCanceled", true);



        
    });
}