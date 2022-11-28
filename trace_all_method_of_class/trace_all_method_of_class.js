/**
 * 
 * frida -U -f com.google.android.youtube -l trace_all_method_of_class.js
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
                    var retval = this[methodName].apply(this, arguments);
                    log(tName + " " + clsname + "." + methodName + "(" + args + ") = " + retval);
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
        // traceClass("_1952");
        traceMethod("android.os.storage.StorageManager", "getStorageVolume");
        traceClass("com.android.providers.media.MediaProvider");
    });
}