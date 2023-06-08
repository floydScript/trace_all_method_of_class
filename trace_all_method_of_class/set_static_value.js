
if (Java.available) {
    Java.perform(function () {

        var ActivityTaskManagerDebugConfig = Java.use("com.android.server.wm.ActivityTaskManagerDebugConfig");

        ActivityTaskManagerDebugConfig.DEBUG_ALL.value = true;
        ActivityTaskManagerDebugConfig.DEBUG_SWITCH.value = true;
        
    });
}