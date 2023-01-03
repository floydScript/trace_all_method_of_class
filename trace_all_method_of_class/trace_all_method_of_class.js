/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
 * frida -U -p $(adb shell ps -ef|grep line | awk '{print $2}') -l trace_all_method_of_class.js
 */
function log(text) {
    console.log(">>>" + text)
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

        log("getAppActiveNotifications list : " + list);

        var ListClass = Java.use("java.util.ArrayList");
        var iterator = ListClass["iterator"].apply(list);

        log("getAppActiveNotifications size : " + ListClass["size"].apply(list));

        var iteratorClass = Java.use("java.util.Iterator");
        // var hasNext = iteratorClass["hasNext"].apply(iterator);

        while (iteratorClass["hasNext"].apply(iterator)) {
            var noti = iteratorClass["next"].apply(iterator);
            log("not = " + noti);
        }
        log("getAppActiveNotifications return : " + list + " hasNext : " + iteratorClass["hasNext"].apply(iterator));
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

    }
}

function traceClass(clsname) {
    try {
        var target = Java.use(clsname);
        log("clsname" + clsname + " target: " + target.class);
        var methods = target.class.getDeclaredMethods();
        log("methods : " + methods);
        methods.forEach(function (method) {
            var methodName = method.getName();
            if (typeof(target[methodName]) == 'undefined') {
                log("moe_err : methodName " + methodName + " is undefined")
                return;
            }
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
                log("hooking: " + clsname + "." + methodName + proto);
                overload.implementation = function () {
                    var args = [];
                    var tid = getTid();
                    var tName = getTName();
                    for (var j = 0; j < arguments.length; j++) {
                        args[j] = arguments[j] + ""
                    }
                    var start = (new Date()).valueOf();
                    log(tName + " " + clsname + "." + methodName + "(" + args + ") beforeInvoke");
                    var retval = this[methodName].apply(this, arguments);
                    log(tName + " " + clsname + "." + methodName + "(" + args + ") = " + retval + " afterInvoke cost " + ((new Date()).valueOf() - start) + " ms");
                    funcHandler(methodName, retval);
                    return retval;
                }
            });
        });
    } catch (e) {
        log("'" + clsname + "' hook fail: " + e)
    }
}

function traceMethod(clsname, methodName) {
    try {
        var target = Java.use(clsname);
        log("clsname" + clsname + " target: " + target.class);
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
            log("hooking: " + clsname + "." + methodName + proto);
            overload.implementation = function () {
                var args = [];
                var tid = getTid();
                var tName = getTName();
                for (var j = 0; j < arguments.length; j++) {
                    args[j] = arguments[j] + ""
                }
                var retval = this[methodName].apply(this, arguments);
                log(tName + " " + clsname + "." + methodName + "(" + args + ") = " + retval);
                return retval;
            }
        });
    } catch (e) {
        log("'" + clsname + "' hook fail: " + e)
    }
}

if (Java.available) {
    Java.perform(function () {
        // base
        traceClass("android.app.IActivityManager$Stub$Proxy");
        traceClass("android.app.IActivityTaskManager$Stub$Proxy");
        traceClass("android.content.pm.IPackageManager$Stub$Proxy");
        traceClass("android.view.IWindowSession$Stub$Proxy");
        traceClass("android.net.IConnectivityManager$Stub$Proxy");
        traceClass("com.android.internal.telephony.ITelephony$Stub$Proxy");
        traceClass("android.accounts.IAccountManager$Stub$Proxy");
        traceClass("android.content.ContentProvider");
        traceClass("android.app.admin.IDevicePolicyManager$Stub$Proxy");
        traceClass("android.app.IActivityClientController$Stub$Proxy");
        traceClass("android.app.INotificationManager$Stub$Proxy");
        traceClass("android.app.job.IJobScheduler$Stub$Proxy");
        traceClass("android.media.IAudioService$Stub$Proxy");
        traceClass("com.android.internal.telephony.ISub$Stub$Proxy");
        traceClass("android.content.ContentProviderProxy");
        traceClass("android.content.ContentProvider$Transport");
        traceClass("com.android.internal.view.IInputMethodManager$Stub$Proxy");
        traceClass("android.view.accessibility.IAccessibilityManager$Stub$Proxy");
        traceClass("android.content.ContentResolver");
        traceClass("android.os.storage.IStorageManager$Stub$Proxy");
        // traceMethod("android.os.storage.StorageManager", "getStorageVolume");
        traceClass("com.android.providers.media.MediaProvider");
        // traceClass("com.google.android.apps.photos.localmedia.ui.LocalPhotosActivity");
        traceClass("android.hardware.display.IDisplayManager$Stub$Proxy");
        traceClass("android.app.Instrumentation")
        traceClass("com.android.server.content.SyncManager");
        traceClass("android.os.IUserManager$Stub$Proxy");
        // traceClass("android.app.ActivityThread");
        traceClass("com.google.android.apps.docs.editors.homescreen.HomescreenActivity");

        // line notification
        // traceClass("android.app.LoadedApk");
        // traceClass("android.app.ContextImpl");
        // traceClass("com.vlite.sdk.logger.AppLogger");
        // traceClass("com.vlite.sdk.reflect.MethodDef");


        // messenger
        traceClass("com.facebook.push.fcm.FcmListenerService");
        traceClass("com.google.firebase.iid.FirebaseInstanceIdReceiver");
        traceClass("com.google.firebase.messaging.FirebaseMessagingService");

        // teams
        traceClass("com.microsoft.skype.teams.views.activities.InCallShareContentActivity");

    });
}