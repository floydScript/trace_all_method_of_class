/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */
function log(text) {
    console.log(">>>" + text)
    var Log = Java.use("android.util.Log");
    Log.w(" 10260", text);
}

function logStrace() {
    var Log = Java.use("android.util.Log");
    var text = Log.getStackTraceString(Java.use("java.lang.Throwable").$new());
    console.log(text);
    Log.w(" 10260", text);
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
                if (clsname == "zjg"
                    ) {
                    log("moe_lll : arguments[1] = " + JSON.stringify(arguments[1]))
                    logStrace();
                }
                if (clsname == "yoo"
                    ) {
                    // log("moe_lll : arguments[5] = " + JSON.stringify(arguments[5]))
                    logStrace();
                }
                if (clsname == "bumz"
                    ) {
                    log("moe_lll : arguments[5] = " + JSON.stringify(arguments[5]))
                    logStrace();
                }

                if (enableLogStraceStack) {
                    logStrace();
                }
                this.$init.apply(this, arguments);
                if (clsname == "c0j") {
                    if (this.c.value == "继续使用 Google") {
                        log("this.c.value = " + this.c.value);
                        logStrace();
                    }
                    
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
            // argsStr += args[j] + ", "
            argsStr += JSON.stringify(args[j]) + ", "
        }
    }
    if (argsStr.length > 2) {
        argsStr = argsStr.substr(0, argsStr.length - 2);
    }
    return argsStr;
}

function traceMethodCommon(target, methodName, enableLogStraceStack = false) {
    try {
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
                var tid = getTid();
                var tName = getTName();
                var args = args2Str(arguments, overload.argumentTypes);

                var start = (new Date()).valueOf();
                var this_name = this + ""


                log(tName + " " + clsname +"." + methodName + "(" + args + ") beforeInvoke");
                
                if ((clsname +"." + methodName) == "dvdg.A") {
                    var typedArray = Java.array("byte", arguments[0]);
                    var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                    log("moe_lll : dvdg.A(arg1:" + hexStringArray.join(''));
                }

                var retval = this[methodName].apply(this, arguments);
                if ((clsname +"." + methodName) == "android.content.pm.IPackageManager$Stub$Proxy.getInstallerPackageName") {
                    retval = "com.android.vending";
                }
                if ((clsname +"." + methodName) == "com.bpi.ng.mobilebanking.util.RootChecker.isDeviceRooted") {
                    retval = null;
                }
                if ((clsname +"." + methodName) == "com.rsa.mobilesdk.sdk.RootDetect.checkMagiskFileExist"
                    || (clsname +"." + methodName) == "com.rsa.mobilesdk.sdk.RootDetect.checkForRWPaths") {
                    retval = false;
                }

                if ((clsname +"." + methodName) == "us.zoom.libtools.helper.l$b.onActivityCreated"
                    || (clsname +"." + methodName) == "us.zoom.libtools.helper.l$b.onActivityDestroyed") {
                    try {
                        var LinkedLists = Java.use("java.util.LinkedList");
                        log("moe_print : this.d.value = " + this.d);
                        log("moe_print : this.d.value = " + this.d.value);
                        LinkedLists.toArray();
                        var bv = Java.cast(this.d.value, LinkedLists);
                        log("moe_print : bv.toArray() = " + bv.toArray());
                        // var arr = LinkedList["toArray"].overload().apply(this.b);
                        var sizes = LinkedLists["size"].apply(bv);
                        // // log("moe_print : LinkedList : " + JSON.stringify(arr));
                        log("moe_print : LinkedList : size : " + sizes);
                    } catch (e2) {
                        log("moe_print failed : " + e2);
                    }
                }

                // if ((clsname +"." + methodName) == "com.android.server.wm.ActivityStarter.recycleTask") {
                //     log("moe_print : mAddingToTask = " + this.mAddingToTask.value + " mMovedToFront = " + this.mMovedToFront.value);
                // }
                
                if ((clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.destroyImmediately"
                    || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.removeFromHistory"
                    || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.attachedToProcess"
                    || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.setProcess"
                    || (clsname +"." + methodName) == "com.android.server.wm.ActivityRecord.cleanUp") {
                    log("moe_ar : ActivityRecord this = " + this + " app = " + this.app.value);
                }

                try {

                
                if((clsname +"." + methodName) == "android.app.IActivityManager$Stub.onTransact"
                && arguments[0] == 33
                ) {

                    var Parcel = Java.use("android.os.Parcel");
                    log("moe_parcel : typeof" + typeof(arguments[1]));
                    var parcelObj = Java.cast(arguments[1], Parcel);
                    var parcel_bytearr = Parcel.marshall.apply(parcelObj);

                    var parcel_bytearrArray = Java.array("byte", parcel_bytearr);
                    var hexStringArray = Array.from(parcel_bytearrArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                    var parcelbytearrStr = "byteArr[" + hexStringArray.join('') + "]";
                    log("moe_parcel : result = " + parcelbytearrStr);

                    
                }

            } catch (e4) {
                log("parcel : traceMethodCommon failed : " + e4);
            }

                var retvalStr = "undefined";

                if (retval != undefined) {
                    if (overload.returnType.className == "[B") {
                        var typedArray = Java.array("byte", retval);
                        var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                        retvalStr = "byteArr[" + hexStringArray.join('') + "]";
                    } else {
                        retvalStr = JSON.stringify(retval);
                    }
                }

                
                

                funcHandler(methodName, retval);
                // if (this_name.includes("FreAuthActivity"))
                if (enableLogStraceStack) {
                    logStrace();
                }
                log(tName + " " + clsname +"." + methodName + "(" + args + ") = " + retvalStr + " afterInvoke" ); // + " cost " + ((new Date()).valueOf() - start) + " ms"
                return retval;
            }
        });
    } catch (e) {
        log("traceMethodCommon failed : " + e);
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


function baseTrace() {
    traceClass("android.app.IActivityManager$Stub$Proxy");
    traceClass("android.app.IActivityTaskManager$Stub$Proxy");
    traceClass("android.app.IActivityClientController$Stub$Proxy");
    traceClass("android.content.pm.IPackageManager$Stub$Proxy");
    traceClass("android.view.IWindowSession$Stub$Proxy");
    traceClass("android.net.IConnectivityManager$Stub$Proxy");
    traceClass("com.android.internal.telephony.ITelephony$Stub$Proxy");
    traceClass("android.accounts.IAccountManager$Stub$Proxy");
    // traceClass("android.content.ContentProvider");
    traceClass("android.app.admin.IDevicePolicyManager$Stub$Proxy");
    traceClass("android.app.INotificationManager$Stub$Proxy");
    traceClass("android.app.job.IJobScheduler$Stub$Proxy");
    traceClass("android.media.IAudioService$Stub$Proxy");
    traceClass("com.android.internal.telephony.ISub$Stub$Proxy");
    traceClass("android.content.ContentProviderProxy");
    traceClass("android.content.ContentProvider$Transport");
    traceClass("com.android.internal.view.IInputMethodManager$Stub$Proxy");
    traceClass("android.view.accessibility.IAccessibilityManager$Stub$Proxy");
    // traceClass("android.content.ContentResolver");
    traceClass("android.os.storage.IStorageManager$Stub$Proxy");
    // traceMethod("android.os.storage.StorageManager", "getStorageVolume");
    traceClass("com.android.providers.media.MediaProvider");
    // traceClass("com.google.android.apps.photos.localmedia.ui.LocalPhotosActivity");
    traceClass("android.hardware.display.IDisplayManager$Stub$Proxy");
    // traceClass("android.app.Instrumentation")
    traceClass("com.android.server.content.SyncManager");
    traceClass("android.os.IUserManager$Stub$Proxy");
    traceClass("android.content.IContentService$Stub$Proxy");
    // traceClass("android.app.ActivityThread");
           // traceMethod("android.util.Log")
        // traceClass("android.app.Activity");

}

function contactTrace() {
    traceClass("com.android.providers.contacts.ContactsProvider2");
    traceClass("com.android.providers.contacts.AbstractContactsProvider");
    traceClass("com.android.contacts.activities.DialtactsActivity");
    traceClass("com.android.contacts.activities.ContactDetailActivity");
    traceClass("com.android.contacts.activities.ContactInfoFragment");
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

        // system_server
        traceMethod("android.app.IApplicationThread$Stub$Proxy", "scheduleTransaction", true);
        traceMethod("com.android.server.wm.ActivityStackSupervisor", "startSpecificActivity");
        traceMethod("com.android.server.wm.ActivityStack", "resumeTopActivityInnerLocked");

        traceMethod("com.android.server.wm.ActivityRecord", "setProcess");
        traceMethod("com.android.server.wm.ActivityRecord", "attachedToProcess");
        traceMethod("com.android.server.wm.ActivityRecord", "hasProcess");

        traceMethod("com.android.server.wm.ActivityRecord", "destroyImmediately");
        traceMethod("com.android.server.wm.ActivityRecord", "removeFromHistory");
        traceMethod("com.android.server.wm.ActivityRecord", "cleanUp");



        // traceClass("android.app.IApplicationThread$Stub$Proxy");
        // traceMethod("com.android.server.wm.ActivityServiceConnectionsHolder", "disconnectActivityFromServices", true);
        // traceMethod("com.android.server.wm.ActivityStarter", "recycleTask");
        // traceMethod("com.android.server.wm.ActivityStarter", "deliverToCurrentTopIfNeeded");
        // traceMethod("com.android.server.wm.ActivityStarter", "startActivityInner");

        // traceMethod("com.android.server.wm.ActivityStarter", "resumeTargetStackIfNeeded");
        // traceMethod("com.android.server.wm.ActivityStarter", "complyActivityFlags");
        // traceMethod("com.android.server.wm.ActivityStarter", "setTargetStackIfNeeded");



        // traceMethod("com.android.server.am.ActiveServices", "publishServiceLocked", true);
        // traceMethod("com.android.server.am.ActivityManagerService", "publishService");

        // traceMethod("android.app.IActivityManager$Stub", "onTransact");
        // traceMethod("android.app.IActivityManager$Stub", "publishService");




        
    });
}