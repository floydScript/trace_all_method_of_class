// frida -U -f com.google.android.youtube -l ../js/s1.js

console.log("Script loaded successfully ");
Java.perform(function x() {
    console.log("Inside java perform function");
    //定位类
    var my_class = Java.use("android.app.Activity");
    console.log("Java.Use.Successfully! "+ my_class);//定位类成功！
    //在这里更改类的方法的实现（implementation）
    // my_class.broadcastStickyIntent.overload("").implementation = function(intent, appOp, userId){
    //     //打印替换前的参数
    //     console.log( "original call: broadcastStickyIntent("+ appOp + ", " + userId + ")");
    //     //把参数替换成2和5，依旧调用原函数
    //     var ret_value = this.broadcastStickyIntent(intent, appOp, userId);
    //     return ret_value;
    // }

    my_class["startActivityForResult"].overload("android.content.Intent", "int").implementation = function(intent, options){
        //打印替换前的参数
        console.log( "original call: startActivity");
        //把参数替换成2和5，依旧调用原函数   
        this.startActivityForResult(intent, options);
    }

    // my_class.startActivityForResult.overload("android.content.Intent", "int").implementation = function(context, intent, options){
    //     //打印替换前的参数
    //     console.log( "original call: startActivity");
    //     //把参数替换成2和5，依旧调用原函数   
    //     // this.startActivity(context, intent, options);
    // }
});