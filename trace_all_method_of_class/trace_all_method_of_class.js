/**
 * 
 * frida -U -f com.google.android.youtube -l js/s3.js
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

function printFileList(file_list) {
    
}

function traceClass(clsname) {
    try {
        var target = Java.use(clsname);
        log("clsname" + clsname + " target: " + target.class);
        var methods = target.class.getDeclaredMethods();
        log("methods : " + methods);
        methods.forEach(function (method) {
            var methodName = method.getName();
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
                    if (methodName == "openTypedAssetFile") {
                        printFileList(retval)
                    }
                    log(tName + " " + clsname + "." + methodName + "(" + args + ") = " + retval);
                    return retval;
                }
            });
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
        // traceClass("");
        // traceClass("");
        // traceClass("");
        // traceClass("");
    });
}