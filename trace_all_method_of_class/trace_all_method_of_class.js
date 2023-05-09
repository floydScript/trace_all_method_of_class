/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */
function log(text) {
    console.log(">>>" + text)
    var Log = Java.use("android.util.Log");
    Log.w("frida_hook", text);
}

function logStrace() {
    var Log = Java.use("android.util.Log");
    var text = Log.getStackTraceString(Java.use("java.lang.Throwable").$new());
    console.log(text);
    Log.w("frida_hook", text);
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
        } else {
            argsStr += args[j] + ", "
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
                // for (var j = 0; j < arguments.length; j++) {
                //     // TODO 
                //     if (byteIndexArr.indexOf(j) != -1) {
                //         var typedArray = Java.array("byte", arguments[j]);
                //         var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                //         args += "byteArr[" + hexStringArray.join('') + "], ";
                //     } else {
                //         args += arguments[j] + ", "
                //     }
                // }
                // if (args.length > 2) {
                //     args = args.substr(0, args.length - 2);
                // }

                var start = (new Date()).valueOf();
                var this_name = this + ""


                log(tName + " " + clsname +"." + methodName + "(" + args + ") beforeInvoke");
                
                if ((clsname +"." + methodName) == "dvdg.A") {
                    var typedArray = Java.array("byte", arguments[0]);
                    var hexStringArray = Array.from(typedArray).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2));
                    log("moe_lll : dvdg.A(arg1:" + hexStringArray.join(''));
                }

                var retval = this[methodName].apply(this, arguments);
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

function traceConstructor(clsname, methodName) {
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
        traceConstructorCommon(target);
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
        // printClassLoder()
        // base
        // baseTrace();

        // twitter
        // traceClassForeachParent("com.twitter.app.main.MainActivity");
        // traceClass("android.app.Activity");
        // traceClassForeachParent("com.vlite.unittest.activities.ContactsActivity");

        // download provider
        // traceClass("com.android.providers.downloads.DownloadProvider");
        // traceClass("com.android.providers.downloads.DownloadNotifier");
        // traceClass("com.android.providers.downloads.Helpers");
        // traceClass("com.microsoft.skype.teams.views.activities.FreAuthActivity");

        traceClass("android.app.IActivityManager$Stub$Proxy");
        traceClass("android.app.IActivityTaskManager$Stub$Proxy");
        traceClass("android.app.IActivityClientController$Stub$Proxy");
        // traceClass("android.content.ContentProviderProxy");
        // traceClass("android.app.WindowConfiguration");
        // traceClass("android.app.Instrumentation")
        // traceClass("com.android.server.wm.ClientLifecycleManager");
        // traceClass("android.app.ClientTransactionHandler");
        // traceClass("com.android.server.wm.ActivityStack");
        // traceClass("android.app.ActivityThread");
        // traceClass("android.app.IApplicationThread$Stub$Proxy");


        // traceClass("com.zipow.videobox.broadcast.ZmConfBroadCastReceiver");

        
        // traceMethod("com.zipow.videobox.conference.module.f", "s");
        // traceMethod("com.zipow.videobox.conference.model.data.i", "a");
        // traceMethod("com.zipow.videobox.conference.jni.ZmConfDefaultCallback", "onConfStatusChanged2");
        // traceClass("us.zoom.uicommon.activity.ZMActivity");
        // traceMethod("com.zipow.videobox.broadcast.ZmConfBroadCastReceiver", "e");
        // traceMethod("android.app.Activity", "finishActivity");
        // traceMethod("android.app.Activity", "finish");
        // traceClass("com.zipow.videobox.conference.ui.ZmConfPipActivity");

        // traceClass("com.zipow.videobox.conference.ui.ZmFoldableConfActivity");
        // traceClass("com.zipow.videobox.SimpleActivity");

        // traceMethod("com.zipow.cmmlib.CmmTimer", "callNativeTimerProc");
        // traceMethod("com.zipow.cmmlib.CmmTimer", "setTimer");
        // traceClass("android.view.accessibility.IAccessibilityManager$Stub$Proxy");


        // traceMethod("com.android.server.wm.ActivityTaskManagerService", "startActivity");
        // traceMethod("com.android.server.am.ActivityManagerService", "startActivity");
        // traceClass("com.google.android.gms.auth.GetToken");

        // traceMethod("org.chromium.net.urlconnection.CronetHttpURLConnection", "getResponseCode");
        // traceMethod("java.net.HttpURLConnection", "getResponseCode");
        // traceMethod("avtl", "onResponseStarted");

        // traceClass("android.media.MediaHTTPConnection");

        // traceClass("android.content.pm.PackageParser");
        // traceClass("android.content.pm.PackageParser$PackageLite");

        // traceClass("com.whatsapp.backup.google.GoogleBackupService");


        // traceClass("com.android.settings.thememanager.ringtone.LocalRingtoneManagerActivity");
        // traceClass("com.whatsapp.settings.SettingsNotifications");
        // traceClass("com.vlite.sdk.proxy.IntentChooserActivity");

        // traceClass("java.lang.Throwable");


        // traceClass("atsd");
        // traceClass("tim");
        // traceMethod("abgx", "d");
        // traceMethod("vwu", "run");
        // traceClass("ypn"); // print Pinging ... 


        // traceMethod("abdj", "a");


        // traceMethod("org.apache.http.protocol.HttpService", "handleRequest");
        // traceClass("org.apache.http.protocol.HttpService");
        // traceClass("org.chromium.net.HttpUtil");
        // traceClass("org.apache.http.impl.DefaultHttpServerConnection");
        // traceClass("org.apache.http.HttpServerConnection");

        var enableLogStraceStack = true;
        // traceMethod("aaki", "c", enableLogStraceStack);
        // traceMethod("aaki", "a");

        // traceMethod("javax.crypto.Cipher", "doFinal", enableLogStraceStack);
        // traceMethod("javax.crypto.Cipher", "updateAAD");
     


    });
}